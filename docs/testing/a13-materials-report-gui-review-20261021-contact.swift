import Foundation
import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let base = root.appendingPathComponent("reports/all-pending-evidence-20261021/A11/materials")
let output = root.appendingPathComponent("docs/testing/a13-materials-report-gui-review-20261021-selftmp/contact")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

func sheet(_ files: [(String, URL)], _ name: String, _ columns: Int, _ cellW: Int, _ cellH: Int) throws {
    let rows = (files.count + columns - 1) / columns
    let width = columns * cellW, height = rows * cellH
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)!
    NSColor.white.setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    for (index, item) in files.enumerated() {
        guard let image = NSImage(contentsOf: item.1) else { fatalError("cannot decode \(item.1)") }
        let x = CGFloat(index % columns * cellW)
        let y = CGFloat(height - (index / columns + 1) * cellH)
        let scale = min(CGFloat(cellW) / image.size.width, CGFloat(cellH - 28) / image.size.height)
        let w = image.size.width * scale, h = image.size.height * scale
        image.draw(in: NSRect(x: x + (CGFloat(cellW) - w) / 2, y: y + 28, width: w, height: h),
            from: .zero, operation: .copy, fraction: 1)
        item.0.draw(at: NSPoint(x: x + 4, y: y + 5), withAttributes: [
            .font: NSFont.monospacedSystemFont(ofSize: 16, weight: .regular),
            .foregroundColor: NSColor.black
        ])
    }
    NSGraphicsContext.restoreGraphicsState()
    let file = output.appendingPathComponent(name + ".png")
    if FileManager.default.fileExists(atPath: file.path) { fatalError("retain existing \(name)") }
    try rep.representation(using: .png, properties: [:])!.write(to: file)
}

for branch in ["progress-journey", "fixed-report", "report-freeze-reentry"] {
    let directory = base.appendingPathComponent("\(branch)/frames")
    let object = try JSONSerialization.jsonObject(with: Data(contentsOf: directory.appendingPathComponent("frames.json"))) as! [String: Any]
    let frames = object["frames"] as! [[String: Any]]
    for offset in stride(from: 0, to: frames.count, by: 16) {
        let files = frames[offset..<min(offset + 16, frames.count)].map { frame -> (String, URL) in
            let name = frame["file"] as! String
            return ("\(branch)/\(name)", directory.appendingPathComponent(name))
        }
        try sheet(files, "\(branch)-frames-\(offset / 16)", 4, 720, 480)
    }
    let states = try FileManager.default.contentsOfDirectory(atPath: base.appendingPathComponent(branch).path)
        .filter { $0.hasSuffix(".png") }.sorted()
    for offset in stride(from: 0, to: states.count, by: 3) {
        let files = states[offset..<min(offset + 3, states.count)].map {
            ("\(branch)/\($0)", base.appendingPathComponent("\(branch)/\($0)"))
        }
        try sheet(files, "\(branch)-states-\(offset / 3)", 3, 960, 640)
    }
    print("\(branch): \(frames.count) original frames and \(states.count) original states")
}
print("Local image decoding only; no browser, desktop interactions, service or product build.")
