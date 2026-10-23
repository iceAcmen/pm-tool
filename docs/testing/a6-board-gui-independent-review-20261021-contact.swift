import Foundation
import AppKit

let base = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let output = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
let frameDirectory = CommandLine.arguments.count > 3 ? CommandLine.arguments[3] : "frames"
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let object = try JSONSerialization.jsonObject(with: Data(contentsOf: base.appendingPathComponent("\(frameDirectory)/frames.json"))) as! [String: Any]
let frames = object["frames"] as! [[String: Any]]
let start = (frames[0]["metadata"] as! [String: Any])["timestamp"] as! Double
for offset in stride(from: 0, to: frames.count, by: 20) {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1440, pixelsHigh: 1240,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    let context = NSGraphicsContext(bitmapImageRep: rep)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    NSColor.white.setFill()
    NSRect(x: 0, y: 0, width: 1440, height: 1240).fill()
    for index in offset..<min(offset + 20, frames.count) {
        let frame = frames[index]
        let file = frame["file"] as! String
        let image = NSImage(contentsOf: base.appendingPathComponent("\(frameDirectory)/\(file)"))!
        let column = (index - offset) % 4
        let row = (index - offset) / 4
        let x = CGFloat(column * 360)
        let y = CGFloat(1240 - (row + 1) * 248)
        image.draw(in: NSRect(x: x, y: y + 23, width: 360, height: 225),
            from: .zero, operation: .copy, fraction: 1)
        let time = ((frame["metadata"] as! [String: Any])["timestamp"] as! Double) - start
        let label = "\(file) +\(String(format: "%.3f", time))s"
        label.draw(at: NSPoint(x: x + 5, y: y + 3), withAttributes: [
            .font: NSFont.monospacedSystemFont(ofSize: 13, weight: .regular),
            .foregroundColor: NSColor.black
        ])
    }
    NSGraphicsContext.restoreGraphicsState()
    let target = output.appendingPathComponent(String(format: "sheet-%03d.png", offset / 20))
    guard !FileManager.default.fileExists(atPath: target.path) else {
        throw NSError(domain: "NoOverwrite", code: 1)
    }
    try rep.representation(using: .png, properties: [:])!.write(to: target)
}
let result: [String: Any] = [
    "rawFrames": frames.count, "sheets": (frames.count + 19) / 20,
    "method": "Contact sheets preserve full frame; scaled for review only, not execution evidence."
]
try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
    .write(to: output.appendingPathComponent("contact-review.json"))
print("frames=\(frames.count) sheets=\((frames.count + 19) / 20)")
