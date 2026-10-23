# 启动器选择框箭头最小修复

依据 `docs/testing/a10-finder-reopen-gui-independent-review-20261021.md` §5 A10-FG-V01（P2，不豁免）；沿父持续验收修复授权。

只改 `launcher/src/control-html.mjs` 的浏览器选择框实际SVG尺寸/不伸缩，以及同域控件测试；不改nonce/状态机/TTL/首投/open/reopen。建议实际SVG局部18px方形，使用已有颜色。Main先以真实控制DOM计算trigger/svg bbox保红，修后同DOM验证初态/Chrome菜单/焦点/同步，再唯一新环境控制页1440/390采图；专家审证，旧A10FAIL保留。

范围外：不统一全部SVG、不改主PM布局，不用新图倒签旧N1/N2下发。最终Launcher全集/专项及整插件回归，统一普通commit，不push/tag/正式切换。环境macOS、Node22、pnpm11.28.5。
