# 发布脚本 external 脏工作区校验

- 在 `data/skill-packs/publish-article/scripts/publish-article-from-url.mjs` 中新增 `ensureCleanExternalWorkspace(projectRoot)`
- external 模式下在 `syncExternalMain(projectRoot)` 前先执行 `git status --short` 校验
- 当 external 工作区存在未提交改动时，提前失败并提示先处理改动后再发布
- current 模式行为保持不变
