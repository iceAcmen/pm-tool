import Foundation
import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let base = root.appendingPathComponent("reports/all-pending-evidence-20261021/A11/meeting")
let output = root.appendingPathComponent("docs/testing/a11-meeting-layout-gui-review-20261021-selftmp/contact")
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

func sheet(_ files: [(String, URL)], _ name: String, _ columns: Int, _ cellW: Int, _ cellH: Int) throws {
    let rows = (files.count + columns - 1) / columns
    let w = columns * cellW, h = rows * cellH
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)!
    NSColor.white.setFill()
    NSRect(x: 0, y: 0, width: w, height: h).fill()
    for (i, item) in files.enumerated() {
        let image = NSImage(contentsOf: item.1)!
        let x = CGFloat(i % columns * cellW), y = CGFloat(h - (i / columns + 1) * cellH)
        let scale = min(CGFloat(cellW) / image.size.width, CGFloat(cellH - 28) / image.size.height)
        let iw = image.size.width * scale, ih = image.size.height * scale
        image.draw(in: NSRect(x: x + (CGFloat(cellW) - iw) / 2, y: y + 28, width: iw, height: ih),
            from: .zero, operation: .copy, fraction: 1)
        item.0.draw(at: NSPoint(x: x + 4, y: y + 5), withAttributes: [
            .font: NSFont.monospacedSystemFont(ofSize: 17, weight: .regular),
            .foregroundColor: NSColor.black
        ])
    }
    NSGraphicsContext.restoreGraphicsState()
    let file = output.appendingPathComponent(name + ".png")
    if FileManager.default.fileExists(atPath: file.path) { fatalError("retain existing contact \(name)") }
    try rep.representation(using: .png, properties: [:])!.write(to: file)
}

for branch in ["actions", "network-newcancel", "widths100-r3"] {
    let directory = base.appendingPathComponent("\(branch)/frames")
    let object = try JSONSerialization.jsonObject(with: Data(contentsOf: directory.appendingPathComponent("frames.json"))) as! [String: Any]
    let frames = object["frames"] as! [[String: Any]]
    for offset in stride(from: 0, to: frames.count, by: 20) {
        let files = frames[offset..<min(offset + 20, frames.count)].map { frame -> (String, URL) in
            let name = frame["file"] as! String
            return ("\(branch)/\(name)", directory.appendingPathComponent(name))
        }
        try sheet(files, "\(branch)-frames-\(offset / 20)", 5, 600, 420)
    }
    print("\(branch): \(frames.count) original frames indexed")
}
let actionNames = ["zero-row", "one-row-draft", "one-row-saved", "two-row-draft",
    "two-row-reopened", "two-cleared-draft", "cleared-reopened", "cancel-draft", "cancelled"]
for offset in stride(from: 0, to: actionNames.count, by: 3) {
    let files = actionNames[offset..<min(offset + 3, actionNames.count)].map {
        ("actions/\($0)", base.appendingPathComponent("actions/\($0).png"))
    }
    try sheet(files, "actions-states-\(offset / 3)", 3, 960, 650)
}
for theme in ["light", "dark"] {
    for state in ["first", "last-select", "cancelled"] {
        let files = [1440, 1024, 768, 390].map {
            ("\(theme)-\($0)-\(state)", base.appendingPathComponent("widths100-r3/\(theme)-\($0)-\(state).png"))
        }
        try sheet(files, "r3-\(theme)-\(state)", 4, 720, 930)
    }
}
print("Only local image decoding/indexing; no GUI, browser, service or build.")
