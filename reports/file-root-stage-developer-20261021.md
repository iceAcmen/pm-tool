# 文件根与暂存取消开发验证

> 2026-10-21，trae，Main开发记录，不是独立PASS。最小授权与计划见`docs/plans/2026-10-21-files-atomic-closure.md`及父持续执行记录。

修`core/file-assets.ts`：根、根内现存祖先、最终节点拒symlink，保穿越校验；仅ENOENT视不存在，权限异常不吞。目录创建后再次校验目标路径。macOS `/tmp`父别名按实际根比较，合法临时根仍读写/去重。未更改上传类型/大小/魔数合同。

修`client/shared/task-draft-materials.tsx`：mount代际及当前上传controller校验，卸载abort后迟到201仅DELETE未交付stage，不publish或setState；旧finally不清新请求，成功消费资产卸载仍跳过取消。原guard限制重复选择在途文件，失败可重选。领域`tasks.ts/file-asset-store.ts/task-materials.ts`由另开发独占，当前尚未收束。

扩原file-assets测试、新`task-draft-materials-stage.test.tsx`真实组件+生产stage handler+JSONStorage/DomainFacility；只替代传输延迟/失败，不自建业务模型。运行macOS、Node22.23.3、Vitest2.1.9、React18.3.1，自有`/private/tmp/pmtool-file-main-tests-20261021`链接已安装隔离deps，`--no-cache`，不build主树lib/install/动正式。

| 轮次 | 实际exit / 结果 |
| --- | --- |
| 根旧source+新增test | exit1，2红/11绿；祖先穿出与root symlink均错误成功 |
| 暂存组件初设施 | exit1，fixture新项目漏必需日期及清理数组未初始化，不算产品红 |
| 组件修设施/旧source | exit1，2红/2绿；卸载晚201仍publish，新组件被旧upload多发草稿 |
| 两文件修后 | exit0，17/17作者绿；真实stage取消/late201回收/主save后不DELETE、重开与network失败重试/根合法读取去重 |

专项真实命令（cwd自有隔离包）：

```sh
/Users/bytedance/.nvm/versions/node/v22.23.3/bin/node node_modules/vitest/vitest.mjs run src/core/file-assets.test.ts src/client/shared/task-draft-materials-stage.test.tsx --maxWorkers=1 --minWorkers=1 --no-cache
```

各stdout及实际spawn exitJSON归档`all-pending-evidence-20261021/A6/files-main`，设施失败原件保留。独立专家将另冻新字节复验，当前未整包build/全集/实际下发/真实上传GUI，未提交/推送。

边界：祖先检查与写前复核不承诺抵御恶意本机进程在检查后替换目录的所有TOCTOU攻击，未增加平台专用openat系统调用。真实browser StrictMode双effect仍须当前GUI/DOM工具补，renderer不当双effect实证。

21:37补充：配置根上层的symlink在根已存在/尚不存在两支需同样拒绝。新增真实临时根test先红（exit1），再补root祖先逐段校验；仅允许Darwin的固定`/tmp`/`/var`/`/etc`父别名且realpath精确匹配`/private`对应路径，根自身与任意用户别名仍拒绝。同测试修后14根+4组件共18/18，exit0；原17绿保留，r2新原证与指纹另存，专家按新hash复验。
