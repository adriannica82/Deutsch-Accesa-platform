import Foundation
import CryptoKit

/// Actualizare automată a interfeței și a întrebărilor, fără `.ipa` nou (IOS-2.9).
///
/// Aplicația pornește cu copia lui `deutsch.html` din pachet (`public/`). La pornire, pe fundal, citește `version.json`
/// de pe server; dacă are o versiune mai nouă și aplicația nativă o poate rula (`minNative`), descarcă `deutsch.html`,
/// îi verifică mărimea și suma de control și o păstrează într-un director propriu. De la pornirea următoare aplicația
/// încarcă acea copie. Dacă ceva nu merge (descărcare întreruptă, fișier alterat, pagină care nu pornește), se folosește
/// din nou copia din pachet. Un `.ipa` nou cu versiune web mai nouă înlocuiește singur copia descărcată.
struct LiveManifest: Codable {
    let version: Int
    let sha256: String
    let size: Int
    let minNative: Int
}

enum LiveUpdate {
    private static let fm = FileManager.default

    /// Directorul în care se păstrează versiunile descărcate (în afara copiilor de siguranță iCloud).
    static let root: URL = {
        let lib = fm.urls(for: .libraryDirectory, in: .userDomainMask)[0]
        return lib.appendingPathComponent("NoCloud", isDirectory: true).appendingPathComponent("deutsch_live", isDirectory: true)
    }()

    /// Adresa serverului. În construcțiile de depanare poate fi înlocuită cu argumentul de lansare `-LiveUpdateURL <adresă>`
    /// (de exemplu `file:///tmp/live`, pentru teste fără rețea).
    static var baseURL: URL? {
        #if DEBUG
        if let o = UserDefaults.standard.string(forKey: "LiveUpdateURL"), let u = URL(string: o) { return u }
        #endif
        if let s = Bundle.main.object(forInfoDictionaryKey: "DeutschLiveUpdateURL") as? String { return URL(string: s) }
        return nil
    }

    static var nativeBuild: Int {
        Int(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "") ?? 1
    }

    static var bundledDir: URL? { Bundle.main.url(forResource: "public", withExtension: nil) }

    private static func manifest(in dir: URL) -> LiveManifest? {
        guard let d = try? Data(contentsOf: dir.appendingPathComponent("version.json")) else { return nil }
        return try? JSONDecoder().decode(LiveManifest.self, from: d)
    }

    static var bundledVersion: Int { bundledDir.flatMap(manifest(in:))?.version ?? 0 }

    /// Versiunea web care rulează acum (setată la pornire).
    static private(set) var runningVersion = 0
    static var runningLive: Bool { runningVersion > bundledVersion }

    static func sha256(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Versiuni respinse

    private static var badFile: URL { root.appendingPathComponent("bad") }

    static var badVersion: Int {
        Int((try? String(contentsOf: badFile, encoding: .utf8))?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "") ?? 0
    }

    private static func markBad(_ version: Int) {
        try? fm.createDirectory(at: root, withIntermediateDirectories: true)
        try? String(max(version, badVersion)).write(to: badFile, atomically: true, encoding: .utf8)
    }

    // MARK: - Versiunea activă la pornire

    /// Directorul cu versiunea descărcată, dacă există una validă și mai nouă decât copia din pachet; altfel `nil`.
    /// Șterge versiunile vechi sau stricate.
    static func activeDirectory() -> URL? {
        defer { cleanup() }
        let current = root.appendingPathComponent("current")
        guard let name = (try? String(contentsOf: current, encoding: .utf8))?.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty,
              !name.contains("/") else {
            runningVersion = bundledVersion
            return nil
        }
        let dir = root.appendingPathComponent(name, isDirectory: true)
        guard let m = manifest(in: dir), m.version > bundledVersion, m.version > badVersion, m.minNative <= nativeBuild,
              let html = try? Data(contentsOf: dir.appendingPathComponent("index.html")),
              html.count == m.size, sha256(html) == m.sha256 else {
            try? fm.removeItem(at: current)
            runningVersion = bundledVersion
            return nil
        }
        runningVersion = m.version
        return dir
    }

    /// Șterge directoarele temporare și versiunile care nu mai sunt „current”.
    private static func cleanup() {
        guard let items = try? fm.contentsOfDirectory(atPath: root.path) else { return }
        let keep = (try? String(contentsOf: root.appendingPathComponent("current"), encoding: .utf8))?.trimmingCharacters(in: .whitespacesAndNewlines)
        for item in items where item.hasPrefix("tmp-") || (item.hasPrefix("v") && item != keep) {
            try? fm.removeItem(at: root.appendingPathComponent(item))
        }
    }

    // MARK: - Verificare și descărcare

    /// Verifică versiunea de pe server și, dacă e mai nouă, o descarcă și o instalează pentru următoarea pornire.
    static func checkForUpdate() async {
        guard let base = baseURL else { return }
        do {
            let (raw, resp) = try await URLSession.shared.data(for: request(base.appendingPathComponent("version.json"), timeout: 10))
            guard ok(resp), let m = try? JSONDecoder().decode(LiveManifest.self, from: raw) else { return }
            guard m.version > runningVersion, m.version > badVersion, m.minNative <= nativeBuild else { return }
            if pendingVersion() == m.version { return }
            let (html, resp2) = try await URLSession.shared.data(for: request(base.appendingPathComponent("deutsch.html"), timeout: 60))
            guard ok(resp2), html.count == m.size, sha256(html) == m.sha256 else {
                NSLog("[LiveUpdate] descărcare respinsă (mărime sau sumă de control)")
                return
            }
            try install(html: html, manifestData: raw, version: m.version)
            NSLog("[LiveUpdate] versiunea %d descărcată; se folosește de la pornirea următoare", m.version)
        } catch {
            NSLog("[LiveUpdate] verificare eșuată: %@", String(describing: error))
        }
    }

    private static func request(_ url: URL, timeout: TimeInterval) -> URLRequest {
        URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: timeout)
    }

    private static func ok(_ resp: URLResponse) -> Bool {
        guard let http = resp as? HTTPURLResponse else { return true } // file:// în teste
        return http.statusCode == 200
    }

    private static func pendingVersion() -> Int? {
        guard let name = (try? String(contentsOf: root.appendingPathComponent("current"), encoding: .utf8))?.trimmingCharacters(in: .whitespacesAndNewlines),
              name.hasPrefix("v") else { return nil }
        return Int(name.dropFirst())
    }

    private static func install(html: Data, manifestData: Data, version: Int) throws {
        guard let bundled = bundledDir else { return }
        try fm.createDirectory(at: root, withIntermediateDirectories: true)
        let tmp = root.appendingPathComponent("tmp-\(version)", isDirectory: true)
        try? fm.removeItem(at: tmp)
        try fm.copyItem(at: bundled, to: tmp) // păstrează restul fișierelor din pachet (cordova.js etc.)
        try html.write(to: tmp.appendingPathComponent("index.html"), options: .atomic)
        try manifestData.write(to: tmp.appendingPathComponent("version.json"), options: .atomic)
        let final = root.appendingPathComponent("v\(version)", isDirectory: true)
        try? fm.removeItem(at: final)
        try fm.moveItem(at: tmp, to: final)
        try "v\(version)".write(to: root.appendingPathComponent("current"), atomically: true, encoding: .utf8)
    }

    // MARK: - Revenire la copia din pachet

    /// O versiune descărcată care nu pornește (nu setează `window.__deutschReady`) este respinsă definitiv.
    static func rejectRunningVersion() {
        markBad(runningVersion)
        try? fm.removeItem(at: root.appendingPathComponent("current"))
        runningVersion = bundledVersion
    }
}
