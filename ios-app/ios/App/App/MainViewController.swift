import UIKit
import WebKit
import Capacitor

/// Capacitor afișează dialogurile JavaScript (alert / confirm) cu butoanele „Ok” și „Cancel”, scrise în cod.
/// Platforma are alert și confirm în română, deci aici butoanele sunt „OK” și „Anulează”; restul comportamentului
/// (inclusiv prompt, folosit intern de Capacitor) rămâne al Capacitor, prin redirecționare.
final class DialogForwarder: NSObject, WKUIDelegate {
    private weak var original: WKUIDelegate?
    private weak var presenter: UIViewController?

    init(original: WKUIDelegate?, presenter: UIViewController) {
        self.original = original
        self.presenter = presenter
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        original
    }

    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || (original?.responds(to: aSelector) ?? false)
    }

    private func present(_ alert: UIAlertController) -> Bool {
        guard var top = presenter else { return false }
        while let next = top.presentedViewController, !next.isBeingDismissed { top = next }
        top.present(alert, animated: true)
        return true
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        if !present(alert) { completionHandler() }
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Anulează", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        if !present(alert) { completionHandler(false) }
    }
}

class MainViewController: CAPBridgeViewController {
    private var dialogForwarder: DialogForwarder?
    private var startedUpdateCheck = false

    /// Folosește versiunea web descărcată (LiveUpdate), dacă există una validă; altfel copia din pachet.
    override func instanceDescriptor() -> InstanceDescriptor {
        let descriptor = super.instanceDescriptor()
        if let dir = LiveUpdate.activeDirectory() {
            descriptor.appLocation = dir
        }
        return descriptor
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        dialogForwarder = DialogForwarder(original: webView?.uiDelegate, presenter: self)
        webView?.uiDelegate = dialogForwarder
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        guard !startedUpdateCheck else { return }
        startedUpdateCheck = true
        if LiveUpdate.runningLive { scheduleHealthCheck() }
        Task { await LiveUpdate.checkForUpdate() }
    }

    /// După 12 secunde, o versiune descărcată care nu a setat `window.__deutschReady` este respinsă și se revine la copia din pachet.
    private func scheduleHealthCheck() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 12) { [weak self] in
            guard let self = self, let webView = self.webView else { return }
            webView.evaluateJavaScript("window.__deutschReady === true") { result, _ in
                if (result as? Bool) == true { return }
                NSLog("[LiveUpdate] versiunea %d nu a pornit; se revine la copia din pachet", LiveUpdate.runningVersion)
                LiveUpdate.rejectRunningVersion()
                if let path = LiveUpdate.bundledDir?.path { self.setServerBasePath(path: path) }
            }
        }
    }
}
