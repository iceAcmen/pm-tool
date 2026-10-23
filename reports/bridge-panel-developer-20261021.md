# 跨旅程回告与真实面板开发验证

> Main开发记录，不是独立PASS。父持续授权与停止条件见`all-pending-acceptance-execution-20261021.md`。2026-10-21，trae。

按专家`docs/testing/reopen-handshake-diagnosis-20261021.md` §5先红后修，仅修改`src/client/launch-handshake.ts`、`panel.tsx`、原bridge测试、新`panel-launch-handshake.test.tsx`和`vitest.config.ts`。均相对`packages/dsh-pm-tool`。配置增加`.test.tsx`纳入全集，避免新真实组件测试只在专项执行。

桥接成功/在途按端口+nonce归属；旧成功核对当前参数后才清hash。同token请求合并，跨token不合并，失败允许下一次成功刷新再试。状态仅面板内存，不输出凭据，不更改receiver、Origin、TTL、credentials/body合同。

PmPanel的真实mount effect监听hashchange，已成功snapshot才处理新合法hash；读取开始撤下ready门，失败保hash，后续成功重试处理当前句柄。卸载清listener并增加挂载代际，迟到snapshot不回告或更新已卸载面板。index不变，不用全局注册代替mount。

运行环境macOS、Node22.23.3、Vitest2.1.9、React/test-renderer18.3.1。主树node_modules没有renderer入口，首次执行23桥接项四红、面板加载失败，保存原日志；用自有tmp复制源码并链接已安装隔离树依赖，不install/build或修改主树lib。

| 轮次 | 实际命令/退出 | 范围与结果 |
| --- | --- | --- |
| 首轮主树 | `node node_modules/vitest/vitest.mjs run src/client/launch-handshake.test.ts src/client/panel-launch-handshake.test.tsx --maxWorkers=1 --minWorkers=1` | 四个bridge红，面板设施依赖未加载，不能算面板产品断言 |
| 修前完整自有tmp | 相同命令；冻结`/private/tmp/pmtool-handshake-red-frozen-20261021`，spawn实际exit1 | bridge23项四红；真实PmPanel5项四红，20绿；源码与原专家bridge/panel指纹一致 |
| 修后自有tmp | 相同命令；`/private/tmp/pmtool-handshake-tests-20261021`，spawn实际exit0 | 28/28作者绿，包含R05..08、并发/失败/业务hash及真实mount/snapshot/hashchange/卸载/复挂 |

红冻结在修复后另核原隔离树未修改源，并用完全相同新测试重跑，仍exit1；不是拿早期缺依赖日志补造红结果。原28项红/绿stdout及spawn退出JSON在`all-pending-evidence-20261021/A6/bridge`归档。`react-test-renderer`执行生产PmPanel、传输和window替身只用于控制就绪/事件，不mock面板或握手业务。

下一步独立专家源码/AUTO复验；Main等待两组并行产品修复后统一精确同步与唯一隔离build，重新认领新产物/运行/真实Finder新旅程。旧3205/3212仍加载旧bundle，不将本轮作者28绿当真实GUI通过。全量回归、剩余矩阵和提交尚未执行，任务未完成。
