<div align="center">

# VibeStart

**Compose. Verify. Ship.**

自由组合全栈 TypeScript 技术栈，得到一个前沿、经过验证、为 AI 编码智能体打造的项目，内置类型安全、lint 与测试。

[![npm](https://img.shields.io/npm/v/vibestart-cli?label=npm&color=cb3837)](https://www.npmjs.com/package/vibestart-cli)
[![CI](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml/badge.svg)](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · **简体中文**

https://github.com/user-attachments/assets/6adc6f20-99ef-452f-83a7-7d0b69251906

</div>

## 快速开始

### 自己组合

在[网页工作台](https://vibestart.net/studio)中逐层选择技术，复制生成的命令；或者直接在终端按提示回答：

```sh
npx vibestart-cli my-app
```

### 交给 AI 助手

将下面的命令和你的需求一起粘贴给 Codex、Cursor、WorkBuddy 等编码助手：

```sh
npx skills add VinkyDev/vibestart --skill vibestart
```

助手会安装 [vibestart skill](skills/vibestart/SKILL.md)，选好技术栈并创建项目；之后也可以让它添加能力或升级模板。详见 [Agent Skills 指南](apps/web/content/docs/cli/skill.mdx)。

## 为什么选择 VibeStart

详见[为什么选择 vibestart](https://vibestart.net/docs/why)。

借助编码 Agent 开发应用，难点往往不在第一天，而在第三十天：功能越来越多，结构逐渐失序，每修复一个 bug 又会引入新的问题。VibeStart 为 Agent 和你提供一个更好的起点：经过精心挑选的前沿技术栈及其最佳实践，以及一套让 Agent 能够写出好代码的工程基础。

- **好代码养出好代码。** Agent 会模仿周围的代码、遵守成文的规则、依靠报错修正自己。每个项目都带有风格一致的代码、写明每类改动放在哪里并如何实现的 `AGENTS.md`，以及在几秒内指出问题的类型、lint 和测试检查。`vp run ready` 按从快到慢的顺序运行全部检查。
- **只选用前沿技术，并持续更新。** 只提供已经成为当前标准、或正在成为新标准的技术：TypeScript 7、启用 React Compiler 的 React 19、Drizzle ORM 1.0、Oxlint 与 Oxfmt，以及统一工具链 [Vite+](https://viteplus.dev)。开源、不绑定厂商、每种能力只用一个库。更好的工具成为标准时，模板会切换过去并移除旧工具。
- **按需组合，而非复制模板。** 每项技术是一个带有文件、依赖和约束的集成，项目由你选择的集成组合而成。无法工作的组合会被拒绝，并给出原因和改动最少的修正方式。
- **每个组合都经过验证。** 每次发布前，所有支持的组合都会被生成、安装，并依次通过类型检查、lint、测试、浏览器测试和生产构建。结果连同指纹记录在 [`verification.json`](packages/integrations/verification.json)，CLI 在创建项目时展示。
- **全栈 TypeScript。** 从数据库到按钮只用一种语言，类型从表结构经由接口传递到页面，无需代码生成。Zod 校验来自外部的数据。
- **只写有价值的测试。** 端到端测试覆盖完整流程，集成测试基于真实数据库覆盖每个 API 操作，单元测试只留给真正含有分支逻辑的代码。
- **创建之后仍可维护。** `upgrade` 对比原始模板、你的项目和新模板，写入前先预览结果。模板文件获得更新，你的应用代码保持原样。

VibeStart 不托管你的应用，不迁移生产数据，也不隐藏代码。生成的项目是普通的代码仓库，运行时不依赖 VibeStart。

## 支持的技术栈

| 层级   | 选择                                                 |
| ------ | ---------------------------------------------------- |
| 应用   | React SPA(TanStack Router)、TanStack Start、Next.js  |
| 桌面端 | Electron                                             |
| 后端   | Hono,或框架自带服务                                  |
| API    | oRPC、OpenAPI,或不选                                 |
| 数据库 | PostgreSQL 或 SQLite(Drizzle),或不选                 |
| Auth   | Better Auth                                          |
| 部署   | Docker                                               |
| UI     | shadcn(Base UI)与 Tailwind 4                         |
| 工具链 | Vite+、Oxlint、Knip、Vitest、Playwright、`AGENTS.md` |

## CLI 选项

用参数跳过提问：

```sh
npx vibestart-cli my-app --framework next --backend self --api orpc --database postgres --auth better-auth
```

| 选项                                                         | 说明                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--<kind> <choice>`                                          | 决定某一类选择(`--framework`、`--backend`、`--api`、`--database`、`--auth`、`--desktop`、`--deployment` 等)。`none` 表示可选项留空。 |
| `--addons <ids\|none>`                                       | 选择扩展,逗号分隔。默认启用 Knip 与 Ultracite;`none` 两者都不要。                                                                    |
| `--package-manager <pnpm\|bun>`                              | 用 pnpm(默认)或 Bun 1.4.2 及以上安装依赖。                                                                                           |
| `--runtime <node\|bun>`                                      | Hono 服务运行在 Node.js(默认)或 Bun 上。                                                                                             |
| `--recipe <path\|url>`                                       | 从 `vibestart.jsonc` 开始;`kind` 参数优先于它。                                                                                      |
| `--list`                                                     | 列出所有选择类别、选项与全部合法技术栈。                                                                                             |
| `--dry-run`                                                  | 解析技术栈并列出文件,不写入磁盘。                                                                                                    |
| `--json`                                                     | 只输出一个 JSON 对象,从不提问。失败时带有机器可读的 `code`。                                                                         |
| `--no-interactive`、`--no-git`、`--no-install`、`--no-check` | 跳过提问、`git init`、安装与初始化、最后的 `vp check`。                                                                              |

## 文档

- [vibestart.net/docs](https://vibestart.net/docs)：快速开始、选择技术栈、CLI 参考、测试与概念
- [架构](docs/architecture.md):模型、解析器、Integration、验证与项目维护
- [AGENTS.md](AGENTS.md):本仓库与每个生成项目的代码规则

## 仓库结构

| 路径                    | 职责                                              |
| ----------------------- | ------------------------------------------------- |
| `apps/cli`              | `vibestart` 命令                                  |
| `apps/web`              | 网页工作台与文档站                                |
| `packages/core`         | Blueprint schema、解析器与生成器                  |
| `packages/integrations` | Integration、模板、依赖目录与 `verification.json` |
| `packages/config`       | 共享的 TypeScript 预设                            |
| `golden/`               | 已提交的生成项目,各自是独立的 workspace           |

## 参与贡献

欢迎贡献。环境搭建、需要运行的检查、模板如何验证,请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE),版权归 VinkyDev 及贡献者所有。第三方材料保留各自的许可证。
