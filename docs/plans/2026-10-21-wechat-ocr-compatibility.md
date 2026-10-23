# 微信本地 OCR 兼容修复计划

**Goal:** 在已授权的 Mac 只读试点内，修复微信 4.1.15 没有聊天控件导致采集失败的问题，核验四个白名单群的实际采集结果。

**Architecture:** 保留原辅助功能读取器，新增独立本机 Vision 读取方式。优先点击可见完整群名，否则在已核焦点的搜索框粘贴群名，以包含弹层的屏幕区域截图核对唯一“群聊”候选，再点击并核对完整窗口标题。只保存白名单群的消息区域；当前只采可见窗口，保留正文、姓名、引用、时间上下文和未解析区域来源，不声称完整历史或准确消息日期。

**Tech Stack:** macOS 15.6.1、微信 4.1.15、Python 3.12.15、PyObjC、Apple Vision、Pillow、标准库。

## 授权与范围

负责人已批准部署试点、继续真实采集，最新提供四群并要求修复 `-25211`。系统权限已修复并经 Terminal 复验；本计划延续同一试点的兼容缺陷修复，不重复请求实施授权。使用 brainstorming 核对需求及替代路线，使用 writing-plans 保留文件级计划。现有控件读取失败，单独截图样本已经成功，因此继续本地 OCR 方案。

不修改 pm-tool 产品、上游、正式服务或在途 testing 文件。不发送消息，不读微信数据库，不调用云模型；群消息只保存在 Git 忽略的 `data/wechat-pilot/`。本批不 commit/push；不将开发自验扩大为独立 PASS。

## 1. 实际侧栏与切群探针

- 临时脚本 `/private/tmp/wechat_vision_probe.py`、`wechat_sidebar_scan.py`。
- 核对本机窗口 ID、位置与大小；实际截图确认侧栏为窗口内 x=60–338，标题位于消息区顶部。
- 有界滚动侧栏，只对完整群名唯一匹配执行点击，随后 fresh OCR 核标题；名称相近或被截断则拒绝入库。
- 持续验证前台和窗口几何，异常立即停止。只有截图所见的稳定布局用于坐标操作。
- 实测纠正：单窗口截图不含搜索结果弹层，区域截图可以看见；原 36 页侧栏探针遗漏折叠置顶聊天。部署版采用本地精确搜索，不继续长侧栏盲扫。
- 搜索仅在绿色焦点框核对后派发 Cmd+A/Cmd+V；匹配本地“群聊”或实测出现的“最常使用”候选，点击而非回车。候选必须唯一，切入后完整标题和群人数后缀必须一致；不点击网络搜索或同名个人会话。输入框 OCR 作为辅助证据，不替代候选和标题核验。新截图确认结果就绪后恢复原剪贴板；用户在此期间改过剪贴板则不覆盖其新内容。

## 2. 本机兼容读取器

- 新建 `~/.local/share/wechat-project-pilot/app/ocr_reader.py`。
- 截图临时文件私有；仅白名单群的标题/消息区域裁图持久化。侧栏其他群预览不进入原始批次或报告。
- 识别消息气泡与邻近姓名/时间分隔。顶部或底部截断、无法可靠归类的文本保留在未解析证据；不补造正文或姓名。
- 本机截图布局与主题先锁定实际校准条件，条件不符时拒绝；这不是适用于所有微信版本的通用读取器。
- 每群记录 source、截图路径、OCR 行/置信度、可见窗口范围及未解析项。
- 引用需识别左侧竖线；图片中文字不能按位置猜成引用。`visible-ocr-1` 原始批次保留，修正后的 `visible-ocr-2` 同群批次替代其草稿解释；不同读取版本不共用去重窗口。
- CLI 实测 AppKit activate 返回 true 不代表窗口已置前，使用 LaunchServices `open -b` 后实读前台。失焦仍停止，恢复应用仅在当前仍属本采集窗口时执行。
- 实测纠正：NSWorkspace 前台缓存依赖事件循环，CLI 只 sleep 会把已切入微信误报成旧 TRAE；刷新 NSRunLoop 后前台身份立即更新。导航截图分区标记避免重复识别标题；搜索框的绿色边框/光标从辅助 OCR 中去掉。每群操作前点击校准的空白标题区域收起旧搜索弹层，所有截图均含当前可见弹层，避免点击被遮挡的侧栏。

## 3. 接入与开发验证

- 修改本机 `app/pilot.py`，读取方式由配置选择；原辅助功能路径保留。
- 来源不得被 ingest 覆盖为辅助功能。报告附 OCR 置信度、截图、引用上下文及采集覆盖。
- `watch` 对未经实测的实验 OCR 明确拒绝，保持定时关闭，避免把界面抽样当完整增量流。
- 临时目录验证：全角人数后缀、同名/截断拒绝、群标题不符、边缘气泡排除、重复正文位置保留、来源、置信度、私有权限、配置/定时拒绝和报告不伪造时间。

```bash
# 运行环境：本机 macOS；不需要 Node 或 PM 产品 build
"/Users/bytedance/.local/share/wechat-project-pilot/venv/bin/python" \
  -I "/private/tmp/wechat-ocr-local-check.py"

"/Users/bytedance/.local/share/wechat-project-pilot/venv/bin/python" \
  "/Users/bytedance/.local/share/wechat-project-pilot/app/pilot.py" doctor

"/Users/bytedance/.local/share/wechat-project-pilot/venv/bin/python" \
  "/Users/bytedance/.local/share/wechat-project-pilot/app/pilot.py" collect
```

## 4. 真实四群与交接

- 每个群逐项记录：标题校验、原始截图、消息数、未解析/截断与失败原因。
- 最终采集批次保存 `pilot.py` 和 `ocr_reader.py` SHA-256，绑定实际代码；前面试探与拒绝日志保留，不能将一次 4/4 扩大为无人值守完整率。
- 两轮窗口对照检查重复处理；不因全文相同丢弃同轮内重复消息。
- 实测结果与本机源码包放 `reports/wechat-pilot-20261021/`；消息不入源码包。
- 同步 changelog/progress/handoff/onboarding 与已存在 ISS-038/KB-042。
- 未核验的完整历史、跨重启增量完整率、无人值守仍明确待验；后续独立专家按源码指纹与原始证据审证。
