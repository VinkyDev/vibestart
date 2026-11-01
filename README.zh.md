<div align="center">

# VibeStart

**Compose. Verify. Ship.**

自由组合全栈 TypeScript 技术栈，得到一个前沿、经过全量验证、专为 AI 编码智能体打造的项目，内置端到端类型安全、lint 与测试。

[![npm](https://img.shields.io/npm/v/vibestart-cli?label=npm&color=cb3837)](https://www.npmjs.com/package/vibestart-cli)
[![CI](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml/badge.svg)](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[**网页工作台**](https://vibestart.net/studio) · [**文档**](https://vibestart.net/zh/docs) · [**Effect 模式**](https://vibestart.net/zh/docs/stack/effect) · [**Agent Skill**](skills/vibestart/SKILL.md) · [English](README.md) · **简体中文**

https://github.com/user-attachments/assets/6adc6f20-99ef-452f-83a7-7d0b69251906

</div>

## 快速开始

### 1. 交互式 CLI 或网页工作台

在[网页工作台](https://vibestart.net/studio)中可视化选择每一层技术并复制生成的命令，或者直接在终端按提示交互创建：

```sh
npx vibestart-cli my-app
```

### 2. 一行命令创建常用预设

传入参数即可跳过提问，一行命令生成完整且经过验证的工程：

```sh
# 推荐全栈单页应用（React + Hono + oRPC + SQLite + Better Auth）
npx vibestart-cli my-app --framework spa --backend hono --api orpc --database sqlite --auth better-auth

# 服务端渲染 Web 应用（Next.js 或 TanStack Start + PostgreSQL + Better Auth）
npx vibestart-cli my-app --framework next --backend self --api orpc --database postgres --auth better-auth

# Effect 模式全栈应用（React SPA + Effect HTTP/RPC/Atom + SQLite + Better Auth）
npx vibestart-cli my-app --mode effect --database sqlite --auth better-auth

# Effect 模式跨端全家桶（Web + Electron 桌面端 + Expo 移动端 + Docker）
npx vibestart-cli my-app --mode effect --database sqlite --auth better-auth --desktop electron --mobile expo --deployment docker
```

### 3. 交给 AI 编程智能体

将下面的命令和你的需求一起粘贴给 Claude Code、Codex、Cursor 等编码智能体：

```sh
npx skills add VinkyDev/vibestart --skill vibestart
```

智能体会安装 [vibestart skill](skills/vibestart/SKILL.md)，自动探测当前版本的可用选型（`--list --json`）、组合技术栈并创建项目；后续也可以让它添加能力或升级模板。详见 [Agent Skills 指南](apps/web/content/docs/cli/skill.zh.mdx)。

### 4. 开发、验证与持续演进

每个生成的项目都使用统一工具链 [Vite+](https://viteplus.dev)（`vp`），并内置创建后的维护命令：

```sh
cd my-app
vp run db:migrate                # 执行数据库迁移（使用 Drizzle 或 Prisma 时）
vp run dev                       # 启动 Web、服务端及桌面端开发环境
vp run ready                     # 依次执行格式化、lint、类型检查、knip、单元/集成/E2E 测试与生产构建

# 后续演进与模板维护（三方合并，保留业务代码）
npx vibestart-cli doctor         # 检查项目健康度与模板更新状态
npx vibestart-cli add docker     # 向已有项目按需添加 Docker、Void、Knip 或 Ultracite
npx vibestart-cli upgrade --dry-run
```

## 两种技术栈模式：Standard vs. Effect

VibeStart 提供两种独立模式。交互式 CLI 首先询问模式，[网页工作台](https://vibestart.net/studio)也提供一致的模式切换与对比说明：

|                  | **Standard 模式**（默认）                                                    | **Effect 模式**（`--mode effect`）                                                                |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **适用场景**     | 绝大多数项目：通用 TypeScript 写法，可选技术栈范围最广                       | 复杂后端服务链路：通过类型系统严格约束错误处理、服务依赖注入（`Layer`）与资源生命周期（`Scope`）  |
| **前端与客户端** | React SPA、TanStack Start、Next.js、Electron、Expo，或纯 API 服务            | React SPA（TanStack Router）+ Effect Atom，可选 Electron 桌面端与 Expo 移动端                     |
| **后端与接口**   | Hono 或框架内置服务端；oRPC、OpenAPI 或无接口层；Zod + TanStack Query        | Effect HTTP + Effect RPC + `HttpApi` + `Effect.Schema` 契约（零 Zod / Hono / oRPC / React Query） |
| **数据库与认证** | PostgreSQL、MySQL、SQLite、MongoDB（Drizzle、Prisma、Mongoose）；Better Auth | 基于原生 Effect + Drizzle 驱动的 PostgreSQL 或 SQLite，或不使用数据库；可选 Better Auth           |
| **运行时与部署** | Node.js、Bun 或 Cloudflare Workers；Docker 或 Void（预览）                   | Node.js 26；可选 Docker 部署                                                                      |
| **查看可用选项** | `npx vibestart-cli --list`                                                   | `npx vibestart-cli --list --mode effect`                                                          |

完整对比说明见 [Effect 模式文档](https://vibestart.net/zh/docs/stack/effect)。

## 支持的技术栈

| 层级           | 选择                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| 模式           | Standard（默认）或 Effect（`--mode effect`）                           |
| 应用           | React SPA（TanStack Router）、TanStack Start、Next.js，或不选前端      |
| 桌面端         | Electron（`apps/desktop` + `packages/electron`）                       |
| 移动端         | Expo（React Native），支持 iOS 与 Android（`apps/mobile`）             |
| 后端           | Hono、Effect HTTP，或框架自带服务                                      |
| API            | oRPC、Effect RPC + HttpApi、OpenAPI，或不选                            |
| 数据库         | PostgreSQL、MySQL、SQLite、MongoDB，或不选                             |
| ORM            | Drizzle；PostgreSQL 与 MySQL 也可选 Prisma；MongoDB 用 Mongoose        |
| Auth           | Better Auth                                                            |
| 部署           | Docker、Void on Cloudflare Workers（预览）                             |
| UI             | shadcn（Base UI）与 Tailwind 4                                         |
| 单元和集成测试 | Vitest（Effect 模式下集成 `@effect/vitest`）                           |
| 端到端测试     | Playwright（默认）或 TesterArmy e2e                                    |
| 工具链         | Vite+、Oxlint、Oxfmt、Knip、`AGENTS.md` 以及本地 Effect 智能体参考文档 |

### Void 部署（预览）

`--deployment void --runtime workers` 使用 Void 1.3.0 将 SPA、SPA + Hono 或 TanStack Start 部署到你的 Cloudflare 账号。服务端支持外部 PostgreSQL 或 MySQL + Drizzle，可选 Better Auth；不支持 Next.js、SQLite、Prisma、Effect 模式和独立 Hono 服务。生成项目包含部署脚本，以及生产密钥、Hyperdrive、`void.lock.json` 的操作说明，不生成 GitHub Actions。详见[交付文档](https://vibestart.net/zh/docs/stack/delivery#void)。

## 为什么选择 VibeStart

详见[为什么选择 vibestart](https://vibestart.net/zh/docs/why)。

借助编码 Agent 开发应用，难点往往不在第一天，而在第三十天：功能越来越多，结构逐渐失序，每修复一个 bug 又会引入新的问题。VibeStart 为 Agent 和你提供一个更好的起点：经过精心挑选的前沿技术栈及其最佳实践，以及一套让 Agent 能够写出好代码的工程基础。

- **好代码养出好代码。** Agent 会模仿周围的代码、遵守成文的规则、依靠报错修正自己。每个项目都带有风格一致的代码、写明每类改动放在哪里并如何实现的 `AGENTS.md`，以及在几秒内指出问题的类型、lint 和测试检查。`vp run ready` 按从快到慢的顺序运行全部检查。
- **只选用前沿技术，并持续更新。** 只提供已经成为当前标准、或正在成为新标准的技术：TypeScript 7、启用 React Compiler 的 React 19、Drizzle ORM 1.0、Effect v4、Oxlint 与 Oxfmt，以及统一工具链 [Vite+](https://viteplus.dev)。开源、不绑定厂商、每种能力只用一个库。
- **按需组合，而非复制模板。** 每项技术是一个带有文件、依赖和约束的集成，项目由你选择的集成组合而成。无法工作的组合会被拒绝，并给出原因和改动最少的修正方式。
- **每个组合都经过验证。** 每次发布前，所有支持的组合都会被覆盖：`vp run ready` 读取的每个文件、它的任意三项选择的搭配，都已在 CI 实际运行的某个组合中通过安装、类型检查、lint、测试、浏览器测试和生产构建。通过结果连同指纹记录在 [`verification`](https://github.com/VinkyDev/vibestart/tree/verification) 分支上，CLI 在创建项目时展示其中一条代表性验证。
- **全栈 TypeScript。** 从数据库到按钮只用一种语言，类型从表结构经由接口传递到页面，无需代码生成。使用 Zod（Standard 模式）或 Effect Schema（Effect 模式）在边界校验外部数据。
- **只写有价值的测试。** 端到端测试覆盖完整流程，集成测试基于真实数据库覆盖每个 API 操作，单元测试只留给真正含有分支逻辑的代码。
- **创建之后仍可维护。** `upgrade` 对比原始模板、你的项目和新模板，写入前先预览结果。模板文件获得更新，你的应用代码保持原样。

VibeStart 不托管你的应用，不迁移生产数据，也不隐藏代码。生成的项目是普通的代码仓库，运行时不依赖 VibeStart。

## CLI 选项

| 选项                                                         | 说明                                                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--mode <standard\|effect>`                                  | 选择 Standard 模式（默认）或独立的 Effect 技术栈模式。                                                                                                                   |
| `--<kind> <choice>`                                          | 决定某一类选择（`--framework`、`--backend`、`--api`、`--database`、`--orm`、`--auth`、`--desktop`、`--mobile`、`--deployment`、`--testing` 等）。`none` 表示可选项留空。 |
| `--addons <ids\|none>`                                       | 选择扩展，逗号分隔。默认启用 Knip 与 Ultracite；`none` 两者都不要。                                                                                                      |
| `--package-manager <pnpm\|bun>`                              | 用 pnpm（默认）或 Bun 1.4.3 及以上安装依赖。                                                                                                                             |
| `--runtime <node\|bun\|workers>`                             | Void 使用 Cloudflare Workers；Hono 可使用 Node.js（默认）或 Bun。                                                                                                        |
| `--recipe <path\|url>`                                       | 从 `vibestart.jsonc` 开始；`kind` 参数优先于它。                                                                                                                         |
| `--list`                                                     | 列出所有选择类别、选项与全部合法技术栈（可配合 `--mode effect` 或 `--json`）。                                                                                           |
| `--dry-run`                                                  | 解析技术栈并列出文件，不写入磁盘。                                                                                                                                       |
| `--json`                                                     | 只输出一个 JSON 对象，从不提问。失败时带有机器可读的 `code`。                                                                                                            |
| `--no-interactive`、`--no-git`、`--no-install`、`--no-check` | 跳过提问、`git init`、安装与初始化、最后的 `vp check`。                                                                                                                  |

## 文档

- [vibestart.net/docs](https://vibestart.net/zh/docs)：快速开始、选择技术栈、Effect 模式、CLI 参考、测试与概念
- [架构](docs/architecture.md)：模型、解析器、Integration、验证与项目维护
- [AGENTS.md](AGENTS.md)：本仓库与每个生成项目的代码规则

## 仓库结构

| 路径                    | 职责                                      |
| ----------------------- | ----------------------------------------- |
| `apps/cli`              | `vibestart` 命令                          |
| `apps/web`              | 网页工作台与文档站                        |
| `packages/core`         | Blueprint schema、解析器与生成器          |
| `packages/integrations` | Integration、模板、依赖目录与验证记录存储 |
| `packages/config`       | 共享的 TypeScript 预设                    |
| `golden/`               | 已提交的生成项目，各自是独立的 workspace  |
| `prototypes/`           | 尚未生成的技术栈的手写目标项目            |

## 参与贡献

欢迎贡献。环境搭建、需要运行的检查、模板如何验证，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)，版权归 VinkyDev 及贡献者所有。第三方材料保留各自的许可证。
