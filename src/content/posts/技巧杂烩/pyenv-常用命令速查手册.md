---
title: pyenv 常用命令速查手册
published: 2026-07-17
description: '整理 pyenv 在日常开发中最常用的命令，涵盖 Python 版本安装、global/local/shell 切换、版本优先级机制、pyenv-virtualenv 虚拟环境管理以及 shim 原理与常见问题'
image: ''
tags: [python, pyenv, virtualenv, 版本管理]
category: '技巧杂烩'
draft: false
lang: ''
---

## 前言

**pyenv** 是一款让你在单台机器上轻松安装、切换多个独立 Python 版本的工具。它通过 **shim（垫片）** 机制拦截 `python`、`pip` 等命令，根据当前目录或环境变量决定实际调用哪个版本，从而做到：

- 不依赖系统自带的 Python，避免污染系统环境；
- 为不同项目锁定不同 Python 版本（通过 `.python-version` 文件）；
- 全局、项目、终端会话三级版本切换互不干扰。

> 💡 **Windows 用户注意**：pyenv 本身只支持类 Unix 系统。在 Windows 上请使用社区移植版 [pyenv-win](https://github.com/pyenv-win/pyenv-win)，命令基本兼容。

本文按使用频率整理 pyenv 的常用命令，方便日常速查。

---

## 一、安装与初始化

### 1. 安装 pyenv

macOS（Homebrew）：

```bash
brew update
brew install pyenv
```

Linux / WSL（一键脚本）：

```bash
curl https://pyenv.run | bash
```

### 2. 配置 Shell

将以下内容追加到你的 shell 配置文件（`~/.bashrc`、`~/.zshrc` 等），让 shim 生效：

```bash
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

如果你还使用虚拟环境插件 `pyenv-virtualenv`，再加一行：

```bash
eval "$(pyenv virtualenv-init -)"
```

修改后执行 `exec "$SHELL"` 重启终端或 `source ~/.zshrc` 使配置生效。

---

## 二、安装 Python 版本

### 列出可安装的版本

```bash
# 列出所有可用版本（非常多）
pyenv install --list

# 配合 grep 过滤，例如查看 3.12 系列
pyenv install --list | grep  3.12
```

### 安装指定版本

```bash
pyenv install 3.12.7
pyenv install 3.11.10 3.10.15   # 可同时安装多个
```

> ⚠️ 安装前确保系统已安装编译依赖（如 `build-essential`、`libssl-dev`、`zlib1g-dev`、`libffi-dev` 等），否则编译会失败。macOS 新版本通常需要 `brew install openssl readline sqlite3 xz zlib tcl-tk`。

### 查看最新稳定版本（pyenv ≥ 2.3.0）

```bash
pyenv latest                # 输出最新稳定版，如 3.12.7
pyenv latest 3.12           # 查看 3.12 系列最新版
pyenv install "$(pyenv latest 3.12)"   # 一行安装最新 3.12
```

---

## 三、切换 Python 版本

pyenv 提供三个层级的版本切换，**优先级从高到低**为：

```
shell（当前终端会话） > local（当前目录） > global（全局默认）
```

| 命令 | 作用 | 持久化位置 |
| --- | --- | --- |
| `pyenv global <版本>` | 设置全局默认版本 | `$(pyenv root)/version` |
| `pyenv local <版本>` | 设置当前目录版本，并写入 `.python-version` | 项目根目录 `.python-version` |
| `pyenv shell <版本>` | 设置当前 shell 会话版本 | 环境变量 `PYENV_VERSION` |

```bash
# 设置全局默认
pyenv global 3.12.7

# 进入某项目目录，锁定为 3.10
cd ~/projects/legacy-app
pyenv local 3.10.15
# 会生成 .python-version 文件，团队共享即可统一版本

# 临时在当前终端切换到 3.11 做测试，不影响其他窗口
pyenv shell 3.11.10
```

查看当前生效的版本：

```bash
pyenv version      # 当前实际使用的版本及其来源
pyenv global       # 查看全局版本
```

取消设置：

```bash
pyenv local --unset
pyenv shell --unset
```

---

## 四、管理已安装版本

```bash
# 查看本机已安装的所有版本（带 * 号的是当前生效版本）
pyenv versions

# 卸载某个版本
pyenv uninstall 3.9.18

# 卸载时不再二次确认
pyenv uninstall -f 3.9.18
```

---

## 五、虚拟环境管理（pyenv-virtualenv）

`pyenv` 本身只管 Python 解释器，创建隔离虚拟环境需要插件 [pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv)。

```bash
# 安装插件
brew install pyenv-virtualenv          # macOS
git clone https://github.com/pyenv/pyenv-virtualenv.git $(pyenv root)/plugins/pyenv-virtualenv   # 其他平台
```

常用命令：

```bash
# 基于指定 Python 版本创建虚拟环境
pyenv virtualenv 3.12.7 myenv-312

# 查看所有虚拟环境
pyenv virtualenvs

# 手动激活 / 退出
pyenv activate myenv-312
pyenv deactivate

# 删除虚拟环境
pyenv virtualenv-delete myenv-312
# 或
pyenv uninstall myenv-312
```

**配合自动激活**：在配置了 `eval "$(pyenv virtualenv-init -)"` 后，进入含有 `.python-version`（内容为虚拟环境名）的目录会自动激活，离开自动退出：

```bash
cd ~/projects/demo
pyenv local myenv-312     # 写入 .python-version，之后 cd 进来自动激活
```

---

## 六、Shim 机制与其他实用命令

pyenv 在 `$(pyenv root)/shims` 目录下为每个命令（`python`、`pip`、`pytest`…）放置一个垫片脚本。当你执行 `python` 时，实际运行的是 shim，由它再去查表决定调用哪个真实解释器。**因此 `$(pyenv root)/shims` 必须位于 `PATH` 最前面。**

```bash
# 查看某个命令实际指向的解释器路径
pyenv which python
pyenv which pip

# 查看哪些版本提供了某个命令
pyenv whence pip

# 刷新 shim（安装了带可执行文件的包后使用，新版本大多自动 rehash）
pyenv rehash

# 查看 pyenv 根目录
pyenv root

# 列出所有子命令
pyenv commands
```

借助 `pyenv update` 插件可以一键升级 pyenv 和所有插件：

```bash
git clone https://github.com/pyenv/pyenv-update.git $(pyenv root)/plugins/pyenv-update
pyenv update
```

---

## 七、常见问题与技巧

**1. 切换版本后 `python -V` 没变化？**

多半是 `PATH` 顺序不对，或漏配了 `eval "$(pyenv init -)"`。用 `pyenv which python` 排查实际调用的解释器路径。

**2. 项目想固定 Python 版本，方便团队协作？**

在项目根目录执行 `pyenv local <版本>`，提交生成的 `.python-version` 文件即可。

**3. 安装解释器编译失败？**

绝大多数是缺少编译依赖。Ubuntu/Debian 可参考官方 [Common build problems](https://github.com/pyenv/pyenv/wiki/common-build-problems) 安装对应开发库。

**4. 临时指定版本运行（不切换）**

pyenv 的 shim 支持通过环境变量一次性指定：

```bash
PYENV_VERSION=3.11.10 python script.py
```

---

## 八、速查表

| 场景 | 命令 |
| --- | --- |
| 查看可装版本 | `pyenv install --list` |
| 安装版本 | `pyenv install 3.12.7` |
| 查看已装版本 | `pyenv versions` |
| 查看当前版本 | `pyenv version` |
| 设置全局版本 | `pyenv global 3.12.7` |
| 设置项目版本 | `pyenv local 3.10.15` |
| 设置会话版本 | `pyenv shell 3.11.10` |
| 卸载版本 | `pyenv uninstall 3.9.18` |
| 创建虚拟环境 | `pyenv virtualenv 3.12.7 myenv` |
| 激活虚拟环境 | `pyenv activate myenv` |
| 命令实际路径 | `pyenv which python` |
| 刷新垫片 | `pyenv rehash` |

掌握以上命令，基本可以覆盖日常 Python 多版本管理的所有需求。
