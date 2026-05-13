# 发布文章技能可拷贝技能包设计

## 概述

本次设计目标是把现有“发布文章”能力整理成一个可以直接复制到其他设备或分享给他人使用的技能包。该技能包不做编译、不做自动安装、不做压缩产物提交，而是以一个静态目录的形式存在，包含 skill 入口、副本脚本、安装说明和 `package.json` 片段。

技能包放置路径固定为：

```text
data/skill-packs/publish-article/
```

该目录的定位是“可拷贝、可压缩、可分享”的分发副本，而不是项目中的主运行入口。

## 目标与非目标

### 目标
- 提供一个静态可拷贝的技能包目录。
- 技能包中包含最小可运行所需文件。
- 提供面向开发者/团队成员的安装与使用说明。
- 提供一个可以直接合并进目标项目 `package.json` 的 script 片段。
- 保持技能包内容与当前项目内已生效的 skill/script 逻辑一致。

### 非目标
- 不实现自动安装脚本。
- 不实现自动打 zip 包。
- 不把 zip 压缩包作为仓库产物存入项目。
- 不把技能包目录作为项目运行的唯一真实来源。
- 不引入新的执行逻辑或改变现有发布脚本功能。

## 目标目录结构

建议技能包目录结构如下：

```text
data/skill-packs/publish-article/
  README.md
  package.json.snippet
  data/
    skills/
      publish-article-from-url.md
  scripts/
    publish-article-from-url.mjs
```

## 文件职责

### `README.md`
面向“其他开发者/团队成员”的主说明文档，负责说明：
- 技能包用途
- 适用项目范围
- 环境要求
- 安装步骤
- 使用示例
- 自动分类与标签规则
- `external` 模式限制
- 常见问题

### `package.json.snippet`
用于提供最小必要的 `package.json` 修改片段，建议内容为：

```json
{
  "scripts": {
    "publish-article": "node scripts/publish-article-from-url.mjs"
  }
}
```

### `data/skills/publish-article-from-url.md`
技能包中的 skill 副本，用于让目标项目在 Claude Code 中识别并使用“发布文章”技能。

### `scripts/publish-article-from-url.mjs`
技能包中的执行脚本副本，用于在目标项目中实际完成发文流程。

## 适用范围

该技能包应明确声明只适用于：
- Fuwari 项目
- 存在 `src/content/posts/` 目录
- 存在 `pnpm new-post`
- 允许在 `package.json` 中新增脚本

不应在 README 中暗示它可直接用于任意博客或任意 Node 项目。

## 环境要求

README 中应明确要求：
- Node `v24.9.0`
- pnpm `9.14.4`
- npm `11.6.0`

因为当前脚本对这些版本做了硬性校验。

## README 章节设计

建议 `README.md` 至少包含以下章节：

1. 简介
2. 适用项目
3. 环境要求
4. 安装步骤
5. 使用方式
6. 自动元数据说明
7. `external` 模式说明
8. 常见问题

### 安装步骤应覆盖
- 复制 `data/skills/publish-article-from-url.md` 到目标项目的 `data/skills/`
- 复制 `scripts/publish-article-from-url.mjs` 到目标项目的 `scripts/`
- 将 `package.json.snippet` 中的 script 合并进目标项目 `package.json`
- 执行 `pnpm install`
- 确认目标项目满足 Fuwari 结构前提

### 使用方式应覆盖
至少提供以下示例：

```bash
pnpm publish-article "https://example.com/article" --target current
pnpm publish-article "https://example.com/article" --title "自定义标题"
pnpm publish-article "https://example.com/article" --target external
```

### 自动元数据说明应覆盖
README 中应明确说明：
- 发布时会自动生成 `category`
- 分类优先从固定分类池中匹配
- 若没有合适分类，会回退生成短分类
- 发布时会自动生成 2~3 个 `tags`
- 这些元数据会写入 frontmatter

### `external` 模式说明应覆盖
- 默认目标仓库：`git@github.com:LnameBF/Lewis.github.io.git`
- 需要当前设备具备对应 git 权限
- 使用固定工作目录
- 若目标项目不是可用 Fuwari 项目，脚本会尝试初始化

## 文件来源策略

本次设计采用“副本分发”策略：
- 当前项目中的 `data/skills/publish-article-from-url.md` 和 `scripts/publish-article-from-url.mjs` 仍然是主版本
- 技能包目录中的同名文件只是分发副本

即：
- 项目主入口不变
- 技能包目录只负责打包、复制和分享

## 同步策略

由于技能包采用副本模式，需要在 README 或维护说明中明确：
- 当主文件 `data/skills/publish-article-from-url.md` 或 `scripts/publish-article-from-url.mjs` 更新后
- 需要同步更新 `data/skill-packs/publish-article/` 中对应副本

首版不实现自动同步脚本。

## 分享方式

本次设计不在仓库中直接存放 zip 包。

推荐分享方式：
- 直接压缩整个 `data/skill-packs/publish-article/` 目录后发送给其他设备或他人
- 接收方解压后，按 `README.md` 中的安装步骤复制到目标项目

README 中可以简短说明这一点，但不需要提供自动压缩命令。

## 约束与取舍

这次实现只做：
- 静态技能包目录
- README
- `package.json` 片段
- skill 副本
- script 副本

这次不做：
- 自动安装脚本
- 自动压缩脚本
- 自动同步脚本
- 独立发布仓库结构

这样可以保持技能包足够轻量，满足你跨设备和分享给他人的需求，同时不引入额外维护复杂度。