<div align="center">

# VibeStart

**Compose. Verify. Ship.**

自由组合全栈 TypeScript 技术栈，得到一个前沿、经过验证、为 AI 编码智能体打造的项目，内置类型安全、lint 与测试。

[![npm](https://img.shields.io/npm/v/vibestart-cli?label=npm&color=cb3837)](https://www.npmjs.com/package/vibestart-cli)
[![skills.sh](https://skills.sh/b/vinkydev/vibestart)](https://skills.sh/vinkydev/vibestart/vibestart)
[![CI](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml/badge.svg)](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · **简体中文**

https://github.com/user-attachments/assets/6adc6f20-99ef-452f-83a7-7d0b69251906

</div>

## 快速开始

### 自己组合

在[网页工作台](https://vibestart.net/studio)中逐层选择技术，复制生成的命令；或者直接在终端按提示回答：

```sh
npx vibestart-cli
```

### 交给 AI 助手

将下面的命令和你的需求一起粘贴给 Claude Code、Codex、Cursor 等编码助手：

```sh
npx skills add VinkyDev/vibestart --skill vibestart
```

助手会安装 [vibestart skill](skills/vibestart/SKILL.md)，选好技术栈并创建项目。详见 [Agent Skills 指南](https://vibestart.net/zh/docs/cli/skill)。

### 开发与维护

在生成的项目中，使用统一工具链 [Vite+](https://viteplus.dev)（`vp`）进行日常开发与校验，并通过 CLI 保持模板更新：

```sh
vp run dev                     # 启动本地开发环境
vp run ready                   # 依次执行类型、lint、死代码、测试与构建检查
npx vibestart-cli doctor       # 检查项目状态与可用的模板更新
npx vibestart-cli upgrade      # 三方合并升级底层模板，保留你的业务代码
```

## 为什么选择 VibeStart

详见[为什么选择 vibestart](https://vibestart.net/zh/docs/why)。

借助编码 Agent 开发应用，难点往往不在第一天，而在第三十天：功能越来越多，结构逐渐失序，每修复一个 bug 又会引入新的问题。VibeStart 为 Agent 和你提供一个更好的起点：经过精心挑选的前沿技术栈及其最佳实践，以及一套让 Agent 能够写出好代码的工程基础。

- **好代码养出好代码。** Agent 会模仿周围的代码、遵守成文的规则、依靠报错修正自己。每个项目都带有风格一致的代码、写明每类改动放在哪里并如何实现的 `AGENTS.md`，以及在几秒内指出问题的类型、lint 和测试检查。`vp run ready` 按从快到慢的顺序运行全部检查。
- **只选用前沿技术，并持续更新。** 只提供已经成为当前标准、或正在成为新标准的技术：TypeScript 7、启用 React Compiler 的 React 19、Drizzle ORM 1.0、Oxlint 与 Oxfmt，以及统一工具链 [Vite+](https://viteplus.dev)。开源、不绑定厂商、每种能力只用一个库。
- **按需组合，而非复制模板。** 每项技术是一个带有文件、依赖和约束的集成，项目由你选择的集成组合而成。无法工作的组合会被拒绝，并给出原因和改动最少的修正方式。
- **每个组合都经过验证。** 每次发布前，所有支持的组合都会被覆盖：`vp run ready` 读取的每个文件、它的任意三项选择的搭配，都已在 CI 实际运行的某个组合中通过安装、类型检查、lint、测试、浏览器测试和生产构建。通过结果连同指纹记录在 [`verification`](https://github.com/VinkyDev/vibestart/tree/verification) 分支上，CLI 在创建项目时展示其中一条代表性验证。
- **全栈 TypeScript。** 从数据库到按钮只用一种语言，类型从表结构经由接口传递到页面，无需代码生成。
- **只写有价值的测试。** 端到端测试覆盖完整流程，集成测试基于真实数据库覆盖每个 API 操作，单元测试只留给真正含有分支逻辑的代码。
- **创建之后仍可维护。** `upgrade` 对比原始模板、你的项目和新模板，写入前先预览结果。模板文件获得更新，你的应用代码保持原样。

VibeStart 不托管你的应用，不迁移生产数据，也不隐藏代码。生成的项目是普通的代码仓库，运行时不依赖 VibeStart。

## 支持的技术栈

| 层级           | 选择                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------- |
| 模式           | Standard（默认）或 [Effect](https://vibestart.net/zh/docs/stack/effect)（`--mode effect`）      |
| 应用           | React SPA（TanStack Router）、TanStack Start、Next.js                                           |
| 桌面端         | Electron                                                                                        |
| 移动端         | Expo（React Native），iOS 与 Android                                                            |
| 后端           | Hono、Effect HTTP，或框架自带服务                                                               |
| API            | oRPC、Effect RPC、OpenAPI，或不选                                                               |
| 数据库         | PostgreSQL、MySQL、SQLite、MongoDB，或不选                                                      |
| ORM            | Drizzle；PostgreSQL 与 MySQL 也可选 Prisma；MongoDB 用 Mongoose                                 |
| Auth           | Better Auth                                                                                     |
| 部署           | Docker、[Void on Cloudflare Workers](https://vibestart.net/zh/docs/stack/delivery#void)（预览） |
| UI             | shadcn（Base UI）与 Tailwind 4                                                                  |
| 单元和集成测试 | Vitest                                                                                          |
| 端到端测试     | Playwright 或 TesterArmy e2e                                                                    |
| 工具链         | Vite+、Oxlint、Knip、`AGENTS.md`                                                                |

默认使用 Standard 模式，提供最广泛的技术栈组合；需要更严谨的服务链路约束时，可在工作台或通过 `--mode effect` 切换为独立的 [Effect 技术栈](https://vibestart.net/zh/docs/stack/effect)。

## 文档

- [vibestart.net/docs](https://vibestart.net/zh/docs)：快速开始、选择技术栈、CLI 参考、测试与概念
- [架构](docs/architecture.md)：模型、解析器、Integration、验证与项目维护
- [AGENTS.md](AGENTS.md)：本仓库与每个生成项目的代码规则

## 参与贡献

欢迎贡献。环境搭建、需要运行的检查、模板如何验证，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE)，版权归 VinkyDev 及贡献者所有。第三方材料保留各自的许可证。
