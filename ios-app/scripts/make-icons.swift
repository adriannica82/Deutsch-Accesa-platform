// Generează pictograma aplicației (1024×1024, fără transparență) și imaginea ecranului de pornire (2732×2732).
// Rulare: cd ios-app && swiftc -O scripts/make-icons.swift -o /tmp/mkicons && /tmp/mkicons
// (cu „swift scripts/make-icons.swift” interpretorul se oprește la rulare în Xcode 27.2)
import AppKit

let ink = NSColor(srgbRed: 0x17 / 255, green: 0x31 / 255, blue: 0x39 / 255, alpha: 1)
let paper = NSColor(srgbRed: 0xf5 / 255, green: 0xf4 / 255, blue: 0xee / 255, alpha: 1)
let lime = NSColor(srgbRed: 0xd9 / 255, green: 0xed / 255, blue: 0xb5 / 255, alpha: 1)

func render(_ side: Int, to path: String, _ draw: (CGFloat) -> Void) {
    // 32 de biți cu canalul alfa ignorat (noneSkipLast): PNG-ul rezultat este RGB, fără transparență, cum cere App Store pentru pictogramă
    let cs = CGColorSpace(name: CGColorSpace.sRGB)!
    let ctx = CGContext(data: nil, width: side, height: side, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
    draw(CGFloat(side))
    NSGraphicsContext.restoreGraphicsState()
    let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, "public.png" as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
    precondition(CGImageDestinationFinalize(dest), "nu s-a putut scrie \(path)")
}

// Litera D cu bară lime dedesubt, într-un pătrat de latură `s` cu originea în (x, y)
func mark(x: CGFloat, y: CGFloat, s: CGFloat) {
    let font = NSFont.systemFont(ofSize: s * 0.74, weight: .heavy)
    let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: paper]
    let str = NSAttributedString(string: "D", attributes: attrs)
    let size = str.size()
    str.draw(at: NSPoint(x: x + (s - size.width) / 2, y: y + s * 0.2 + (s * 0.8 - size.height) / 2 - s * 0.02))
    lime.setFill()
    let bar = NSRect(x: x + s * 0.3, y: y + s * 0.17, width: s * 0.4, height: s * 0.05)
    NSBezierPath(roundedRect: bar, xRadius: s * 0.025, yRadius: s * 0.025).fill()
}

let assets = "ios/App/App/Assets.xcassets/"

render(1024, to: assets + "AppIcon.appiconset/AppIcon-512@2x.png") { s in
    ink.setFill()
    NSRect(x: 0, y: 0, width: s, height: s).fill()
    mark(x: 0, y: 0, s: s)
}

for name in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"] {
    render(2732, to: assets + "Splash.imageset/" + name) { s in
        paper.setFill()
        NSRect(x: 0, y: 0, width: s, height: s).fill()
        let side: CGFloat = 520
        let x = (s - side) / 2, y = (s - side) / 2
        ink.setFill()
        NSBezierPath(roundedRect: NSRect(x: x, y: y, width: side, height: side), xRadius: side * 0.22, yRadius: side * 0.22).fill()
        mark(x: x, y: y, s: side)
    }
}
print("pictogramă și ecran de pornire generate")
