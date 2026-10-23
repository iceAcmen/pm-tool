import Foundation
import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let base = root.appendingPathComponent("reports/all-pending-evidence-20261021/A10/meeting")
let output = root.appendingPathComponent("docs/testing/a10-meeting-gui-independent-review-20261021-selftmp/contact")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
for branch in ["actions-r1", "actions-r2", "clear-cancel"] {
    let directory = base.appendingPathComponent("\(branch)/frames")
    let object = try JSONSerialization.jsonObject(with: Data(contentsOf: directory.appendingPathComponent("frames.json"))) as! [String: Any]
    let frames = object["frames"] as! [[String: Any]]
    for offset in stride(from: 0, to: frames.count, by: 9) {
        let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 2160, pixelsHigh: 1440,
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)!
        NSColor.white.setFill()
        NSRect(x: 0, y: 0, width: 2160, height: 1440).fill()
        for index in offset..<min(offset + 9, frames.count) {
            let file = frames[index]["file"] as! String
            let image = NSImage(contentsOf: directory.appendingPathComponent(file))!
            let x = CGFloat((index - offset) % 3 * 720)
            let y = CGFloat(1440 - ((index - offset) / 3 + 1) * 480)
            image.draw(in: NSRect(x: x, y: y + 30, width: 720, height: 450),
                from: .zero, operation: .copy, fraction: 1)
            "\(branch)/\(file)".draw(at: NSPoint(x: x + 5, y: y + 5), withAttributes: [
                .font: NSFont.monospacedSystemFont(ofSize: 16, weight: .regular),
                .foregroundColor: NSColor.black
            ])
        }
        NSGraphicsContext.restoreGraphicsState()
        try rep.representation(using: .png, properties: [:])!.write(
            to: output.appendingPathComponent("\(branch)-\(offset / 9).png"))
    }
    print("\(branch): \(frames.count) archived frames")
}
