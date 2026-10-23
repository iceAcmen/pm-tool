# 暂存符号链接边界收口

依据独立 `docs/testing/a13-unicode-upload-independent-retest-20261021-selftmp/report.md` A13-G03-STAGE-SYMLINK 三个原生产 route/真字节红例，属于同一已承诺文件根防链接缺口；修前同例也红不豁免。

限定 `core/file-staging.ts` 和同域测试，复用现有 `file-root` 的祖先/根/子路径安全检查；在创建staging、写入及后续读/消费/取消边界拒绝symlink穿越，不写入链接目标，不删除共享或外部资产。保正常暂存/TTL/opaqueID/单次消费/故障回收与Unicode编码、download、业务schema、原最大大小/MIME守卫。不改全局系统或正式文件根。

先按原G03三红与直挂四绿保存作者红例，限定修复后独立复验并受影响stage生命周期回归；Main唯一新构建、原生chooser→取消/保存→下载字节。剩余门未闭不普通commit，无push/发布。
