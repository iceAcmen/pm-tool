# 中文文件名上传收口

Main 原生选择实际 `QA 文件 原件.md`（22字节）后，生产 fetch 报 `String contains non ISO-8859-1 code point`，请求尚未发送。原件见 A11/materials/native-files/chooser-selected.png、unicode-upload-failure、before-open/failure-boundary。属于已承诺真实中文文件名/文件暂存旅程的缺陷，不扩文件类型/格式。

限定 `client/shared/stage-client.ts`、`core/http/asset-route.ts` 及同域测试，使用明确 ASCII 可传递编码协议传文件名，服务端受控解码后走原 sanitizeFileName/类型与路径守卫；保持现有 ASCII 请求兼容，不用双解码、不放宽 symlink/大小/MIME/同项目校验，不改业务schema/文件字节/认证。先专家核确证与最小红例，再限定开发、独立复验；Main 新构建/原生 chooser/暂存取消及保存下载接续。

Main 唯一 builder/GUI，开发与验收分离，普通commit等全门闭合，无push/tag/正式切换。macOS + nvmNode22 + pnpm11.28.5。
