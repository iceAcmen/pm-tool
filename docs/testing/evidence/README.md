# Main GUI 证据目录（QA 只读判证，不自行采证）

- 每条首轮用例（见测试计划 §2.D）证据落：`docs/testing/evidence/<YYYY-MM-DD>/<用例ID>/`。
- 每条必须含：实际 route/view 串、隔离输入原值、预期存储落点、读回值、console 完整日志、运行版本 manifest（HEAD SHA + package.json version + 页脚/`--version` 显示值三元组）。
- fixture 仅隔离测试项目（`QA-隔离-<日期>`），验完即删；200%/drag 本轮 NOT_RUN，禁止截图替代真实交互。
- QA 据证据独立判 PASS/FAIL，不沿用作者或 Main 自报。
