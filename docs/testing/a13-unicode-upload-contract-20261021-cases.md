# A13 中文文件名最小先行用例

> 给限定 dev 写先红测试、Main 后续采证和独立专家复验使用；从属 [plan](a13-unicode-upload-contract-20261021-plan.md)，不扩原 RA-F01/03/04。以下修后用例当前均 NOT_RUN，已执行白盒仅见 red。

## 固定种子与判定

- 正常文件为 A11 `QA 文件 原件.md`，22 字节，sha256 `87ef7d4f570468db73bd600a35b913cba4f82d5101a4e559536ecab8cf472d1a`；同字节副本 `QA 文件 同字节.md`。不得自造替代内容冒充原件。
- AUTO 使用已可用运行环境与自有临时根，零网络。客户端调用真实 `stageAsset`，截断 fetch 后先执行原生 `new Headers(init.headers)`、`new Request(absoluteTestURL, init)`，才允许返回测试 Response。不能返回 Response 跳过构造。
- 服务端用真实 `buildAssetRoutes().upload`；协议解析可 fake req/res、计数 attach 调用，但生产 stage/存储/安全不变量必须另用合法隔离 root 与真实 domain 回读。不可用适配器替身宣称整项集成通过。
- 协议无效应 `400 invalid_request`，成功/失败安全头不变；认证失败仍 401/403，gate 异常仍 503。底层类型错误的现有 route 映射可为 400 `rejected`，不得机械把 FileAssetRejectedError.status 当 HTTP 415/422。
- 每次写入口交 data/files/staging 的前后 manifest、原始状态/载荷、响应。协议无效不得读取 body 或调用 stage/attach；有效 header 后的安全拒绝不得新增最终资产/DB/stage。

## AUTO 最小矩阵

`M` 表示 `x-pm-file-name-encoding: uri-component`；`E(s)=encodeURIComponent(s)`。一次解码 oracle 为 decode 后再纯 basename/control sanitize，legacy 仍旧逻辑。

| ID | 输入 / 操作 | 必须断言 |
| --- | --- | --- |
| A13-C01 | 真实 stageAsset 原件名，经原生 Headers/Request | 所有头为可传 ASCII，`name=E(原件名)`、M；POST/同源/no-store/无 taskId、原 Blob/signal/mediaType 不变；不是把中文丢掉 |
| A13-C02 | 名 `100% + #?.md`、`literal%2Fname.md`、普通 `qa-note.md`、中文含空格 | 编码整串；decode 一次还原原名，`+` 不变空格，`%` 不丢；ASCII 也标记，fileName 响应映射仍 Unicode，不再 decode 响应 |
| A13-C03 | 空名、缺名；既有 abort/network/http/parse/expired、cancel | 既有默认/异常语义不变，空名不发 malformed 编码信封；取消 stage 幂等，不引入主成功后 DELETE |
| A13-S01 | 无 taskId，M + E(原件名)，原件 bytes | 真实 201 的 Unicode fileName/22/sha 正确，opaque stageId；未新增 task/file_assets；stage 可取消，最终文件不提前出现 |
| A13-S02 | 有合法 taskId/同项目，M + E(原件名) | 走既有 attach；真实资产/attachment 同项目，Unicode 名/hash 不变；有 projectHeader 错项目仍 403、零挂接 |
| A13-S03 | 无 M：`qa-note.md`、`QA file original.md`、`E(中文.md)`、`plus+name.md`、`100%.md` | 旧 ASCII/plain、旧 URI 编码请求结果保持；legacy 非法百分号原容错不扩大到新标记；不能把旧 `+` 变空格 |
| A13-S04 | M + `bad%.md`、`bad%2.md`、`bad%GG.md`、`%E4%B8.md`、`%FF.md`、`%ED%A0%80.md` | malformed-percent/非法 UTF-8 400 invalid_request，无原字符串 fallback、无 201/attach，body未收集、DB/字节零写 |
| A13-S05 | 未知/空 M；M + 缺名/空名；marker/name 为数组或重复头合并异常 | 400 invalid_request，不偷走 legacy 分支；测试适配器明确原头形态，不能 headerValue 返回 undefined 后静默 fallback |
| A13-S06 | M + E(`literal%2Fname.md`)、E(`literal%5Cname.md`)、E(`literal%2E.md`) | 输出仍含字面 `%2F`/`%5C`/`%2E`，不变路径/扩展，不二次 decode。对实际 upload 捕获/存储结果断言，不仅 spy 次数 |
| A13-S07 | M + E(`../../目录/原件.md`)、E(`C:\目录\原件.md`)、E(`原件\r\nX-Inject: 1.md`)、E(`\0原件.md`) | 解码后 basename + 清控制字符，无 `/`、`\`、CR/LF/NUL；仍走白名单；存储只能内容寻址合法 root，响应无 header 注入 |
| A13-S08 | M + E(`../../evil.svg`)、E(`evil.html`)、E(`evil.exe`)、E(`foo%2Esvg`) | 活动类型/未知扩展仍拒绝；不递归解码放行，不把 basename 安全等同允许类型 |
| A13-G01 | 原件名 E/M 配空 bytes、10MiB、10MiB+1；声明 Content-Length 超限及未声明流式超限 | 空/超限原错误；合法安全文本边界按原守卫，预检和流式均不放宽；拒绝 DB/字节零写。不要只测头而漏 body 上限 |
| A13-G02 | 中文 E/M 配 `.png` 假 magic、`.md` 错 MIME、非法UTF8/NUL/活动脚本文本；正常各既有白名单 | 原扩展/MIME/magic/文本安全仍执行且同级；不禁全部正常文件来凑负例绿，短 magic 不称完整图片解码 |
| A13-G03 | 中文 E/M 真实 stage/attach：无配置 root、root/祖先/最终节点 symlink、共享同 hash | 原 fail-closed/根隔离仍成立，不删除共享资产；可据准确源 diff 继承未变安全底座 AUTO，但新增 header 接缝须重测 |
| A13-G04 | M 中文名，无 auth/401/403/gate throw；download 未绑定/错项目 | auth 仍先行 fail-closed；匿名不泄字节/内部路径。fake gate 只签 adapter AUTO，不签宿主真认证 |

## Main 后续 GUI 采证

不由本子任务执行，不新增全页面矩阵；沿原旅程既定 fixture、宽深/开关及动作，当前均 NOT_RUN：

| ID / 原门 | 起点、步骤与明确结束点 | 原证 / 判定 |
| --- | --- | --- |
| A13-GUI01 / RA-F01、F02、J03 | 新候选实际装载；F0draft，原生 chooser 选原件→看到真 stage→取消/离开/卸载→重进 | 原生选中/open 与 POST/201、Unicode文件行、stageId/22/hash；取消阶段回收、DB/final零写。不能以“未上传成功所以无残留”称取消 PASS |
| A13-GUI02 / RA-F01、J03 | fresh draft 原生选原件及同字节副本→合法基础字段/原资料/进展→一次主保存→重开 | 主保存完整信封、稳定 IDs/去重、stage 被消费；卸载不 DELETE 已 finalize，旧材料/history不丢；记录任务/project/manifest，不仅文件行截图 |
| A13-GUI03 / RA-F04 | 上步真实资产→授权下载原件→核实际文件名/22/hash；合法无认证浏览器同资源请求 | 中文/空格名及原字节一致，RFC5987/nosniff/no-store；401/403不泄。不得保存 cookie/token。旧预置中文资产下载不能替代新上传→下载链 |

## 回件与失效

dev 只交四文件 source diff/sha、同用例修前红/修后结果及根 manifest。Main 新 builder/产物/实例另认领；独立专家逐 AUTO/GUI 审签。任何相关新写入须重新核指纹及受影响结果；不能用历史 F03/F01/总 verify 数把 A13-U01 转绿。
