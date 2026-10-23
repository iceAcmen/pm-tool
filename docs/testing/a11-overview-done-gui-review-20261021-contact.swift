import Foundation
import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let base = root.appendingPathComponent("reports/all-pending-evidence-20261021/A11/objective")
let output = root.appendingPathComponent("docs/testing/a11-overview-done-gui-review-20261021-selftmp/contact")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
for branch in ["manual-r2", "checklist-r2"] {
    let directory = base.appendingPathComponent("\(branch)/frames")
    let object = try JSONSerialization.jsonObject(with: Data(contentsOf: directory.appendingPathComponent("frames.json"))) as! [String: Any]
    let frames = object["frames"] as! [[String: Any]]
    for offset in stride(from: 0, to: frames.count, by: 16) {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1920, pixelsHigh: 1320,
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)!
        NSColor.white.setFill()
        NSRect(x: 0, y: 0, width: 1920, height: 1320).fill()
        for index in offset..<min(offset + 16, frames.count) {
            let file = frames[index]["file"] as! String
            let image = NSImage(contentsOf: directory.appendingPathComponent(file))!
            let x = CGFloat((index - offset) % 4 * 480)
            let y = CGFloat(1320 - ((index - offset) / 4 + 1) * 330)
            image.draw(in: NSRect(x: x, y: y + 30, width: 480, height: 300),
                from: .zero, operation: .copy, fraction: 1)
            "\(branch)/\(file)".draw(at: NSPoint(x: x + 5, y: y + 5), withAttributes: [
                .font: NSFont.monospacedSystemFont(ofSize: 14, weight: .regular),
                .foregroundColor: NSColor.black
            ])
        }
        NSGraphicsContext.restoreGraphicsState()
        let target = output.appendingPathComponent("\(branch)-\(offset / 16).png")
        if FileManager.default.fileExists(atPath: target.path) {
            fatalError("Refuse overwrite: \(target.path)")
        }
        try rep.representation(using: .png, properties: [:])!.write(to: target)
    }
    print("\(branch): \(frames.count) originals, derived contact pages only")
}
