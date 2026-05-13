# 发布文章技能包

## 简介
这个技能包用于把文章链接抓取为 Markdown，并在 Fuwari 项目中自动创建文章，同时自动补齐 `category` 和 `tags`。

## 适用项目
仅适用于 Fuwari 项目，且目标项目需要具备：
- `src/content/posts/`
- `pnpm new-post`
- 可修改 `package.json`

## 环境要求
- Node `v24.9.0`
- pnpm `9.14.4`
- npm `11.6.0`

## 安装步骤
1. 复制 `data/skills/publish-article-from-url.md` 到目标项目的 `data/skills/`
2. 复制 `scripts/publish-article-from-url.mjs` 到目标项目的 `scripts/`
3. 将 `package.json.snippet` 中的 script 合并进目标项目 `package.json`
4. 执行 `pnpm install`
5. 确认目标项目满足 Fuwari 结构前提

## 使用方式
```bash
pnpm publish-article "https://example.com/article" --target current
pnpm publish-article "https://example.com/article" --title "自定义标题"
pnpm publish-article "https://example.com/article" --target external
```

## 自动元数据说明
- 自动生成 `category`
- 分类优先从固定分类池中匹配
- 没有合适分类时会回退短分类
- 自动生成 2~3 个 `tags`
- 这些元数据会写入 frontmatter

## external 模式说明
- 默认目标仓库：`git@github.com:LnameBF/Lewis.github.io.git`
- 需要当前设备具备对应 git 权限
- 使用固定工作目录
- 若目标项目不是可用 Fuwari 项目，脚本会尝试初始化
- `external` 模式会在发文前自动执行 `git pull origin main`
- 发文成功后会自动执行 commit 和 `git push origin main`
- 如果 pull 失败，会直接中止，不创建文章
- 如果 commit 或 push 失败，会保留本地成果供人工处理

## 常见问题
### 为什么会提示版本不匹配？
因为脚本会严格校验 Node / pnpm / npm 版本。

### 为什么只能用于 Fuwari？
因为依赖 `pnpm new-post` 和 `src/content/posts/` 目录结构。

### 为什么 external 模式失败？
通常是 git 权限不足、clone 失败，或目标仓库不是可用的 Fuwari 项目。

## 分享方式
可以直接压缩整个 `data/skill-packs/publish-article/` 目录后发送给其他设备或其他人使用。

## 同步说明
当主文件 `data/skills/publish-article-from-url.md` 或 `scripts/publish-article-from-url.mjs` 更新后，需要同步更新本技能包中的对应副本。
