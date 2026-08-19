# dshflow

> DeepSeek Harness 插件 —— 用 [`@vunk/flow`](https://www.npmjs.com/package/@vunk/flow) 把
> “万物皆插件” 的 Cordis 插件树画成一张流程图。

`dshflow` 是一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
（`dsh`）的第三方插件。它把自己挂载到 `dsh web` 现有的 webserver 上，实时读取当前进程里
运行中的 **Cordis 插件树（fiber 树）** 与 **服务注册表**，暴露成 JSON / SSE，并用
`@vunk/flow`（基于 LogicFlow）渲染成交互式流程图。

- 每个 dsh 插件 = 一个节点，父子挂载关系 = 边
- 节点上显示插件名、生命周期状态（pending / loading / active / failed / disposed / unloading）、提供的服务
- 通过 SSE 实时刷新，插件热插拔（HMR）时图会跟着变

---

## 目录

- [Roadmap（路线图）](#roadmap路线图)
- [给 dsh 用户：安装与使用](#给-dsh-用户安装与使用)
- [运行效果](#运行效果)
- [API 端点](#api-端点)
- [给开发者：Vue 组件库](#给开发者vue-组件库)
- [目录结构](#目录结构)
- [本地开发](#本地开发)

---

## Roadmap（路线图）

可视化是第一步，**编排（orchestration）是终极目标**。dsh 的「万物皆插件 + 可逆 effect +
可重排瀑布」让「图即编排」不是愿景，而是三套现成机制（patch 组合、`ctx.plugin()` 动态挂载、
waterfall 拦截点）等着被接上。

| 阶段 | 主题 | 范围 | 关键交付 |
| --- | --- | --- | --- |
| **v0 · 可视化**（当前） | 看清插件树 | 只读：`/api/tree` + SSE、节点组件、Dagre 布局、详情侧栏 | `DshFlow` + 每个 dsh 插件一个节点组件 |
| **v1 · 编排组合** | 可视化改配置 | patch / bundle / profile 图形化编辑，写回 `cordis.patch.yml`，不碰运行时 | 可视化的 cordis.patch.yml 编辑器、逐行 config 编辑 |
| **v2 · 运行时控制** | 控制运行中的树 | 按 fiber uid 挂载 / 卸载 / 改配置；沿用 `cordis-host-runner` 语义 + 审批边界 | 节点上的启用 / 停用 / 更新操作、审计与确认 |
| **v3 · 编排执行**（终极） | 图即执行 | 节点映射 waterfall 拦截点（`pre-step` / `request` / `tools/*`），子图编译为 workflow 子 agent | 可视化 agent loop 编辑器、subflow → scoped 子 agent |

### 三条不可逾越的线

1. **信任边界** — 任何能挂载代码的面板 ≈ shell 权限，必须带审批 / 审计。
2. **持久性** — 动态变更只活在进程内存；要固化必须 promote 成 Plugin 文件 / patch（即 v1）。
3. **可回放性** — 凡改动 prompt / 工具集的编排都要写进 `SessionEvent`，否则 replay 会坏。

---

## 给 dsh 用户：安装与使用

### 前置条件

- Node.js `22.19+` 或 `24+`
- 已启用 Corepack 的 pnpm（`pnpm --version` 可解析）
- 已安装 DeepSeek Harness（`npx @deepseek-ai/dsh web` 能跑起来即可）

### 第 1 步：把插件装进某个 profile

`dshflow` 声明了 `dsh.bundle`（自带 `cordis.patch.yml`），所以用 `dsh plugin add`
安装时，`dsh` 会自动把它加进该 profile 的 `dsh.profile.bundles` 层叠列表：

```sh
dsh plugin --profile web add dshflow
```

> `web` 是默认 GUI profile。headless / 自定义 profile 同理，把 `web` 换成对应名字即可。
> 该命令本质是：在 `$DSH_HOME/profiles/<name>/` 里执行 `pnpm add dshflow`，然后
> 把声明了 `dsh.bundle` 的包自动追加进 `bundles`。

### 第 2 步：启动

```sh
dsh web
```

### 第 3 步：打开可视化页面

```
http://127.0.0.1:3080/dshflow/
```

`dshflow` 不新开端口，复用 `dsh web` 已有的服务，因此带上 `--port` 时页面地址跟着变：

```sh
dsh web --port 8080
# => http://127.0.0.1:8080/dshflow/
```

### 手动方式（不依赖 `dsh plugin`）

也可以把它当成普通 Cordis 插件行，直接写进 profile 的用户补丁层：

1. 在 profile 目录安装包：

   ```sh
   cd "$DSH_HOME/profiles/web"   # 默认 $DSH_HOME 为 ~/.dsh
   pnpm add dshflow
   ```

2. 编辑同目录下的 `cordis.patch.yml`，插入一行：

   ```yaml
   - insert:
       - id: dshflow
         name: 'dshflow'
   ```

3. `dsh web`，然后访问 `/dshflow/`。

### 确认是否生效

```sh
dsh --profile web --dump-config | grep -A2 dshflow
```

看到 `id: dshflow` / `name: dshflow` 即已挂载。

---

## 运行效果

- 根节点是 `root`，向下依次是各 bundle / 插件层（`dsh-base`、`dsh-web-app`、……）
- 每个节点按分类着色（模型、会话、工具、沙箱、权限、Web UI……）
- 点击节点在侧栏查看详情：插件名、状态、`inject` 依赖、提供的服务、所属 fiber 子树
- Dagre 自动布局，支持缩放 / 平移 / fit-view

---

## API 端点

`dshflow` 在 `dsh web` 的 webserver 上注册以下路由（`/dshflow/` 为默认前缀，可在插件
config 里改 `basePath`）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/dshflow/api/tree` | 当前进程完整插件树 + 服务注册表（JSON） |
| `GET` | `/dshflow/api/events` | SSE 流：插件树每次变化时推送完整快照 |
| `GET` | `/dshflow/*` | 可视化前端（Vue + `@vunk/flow`），SPA 回退到 `index.html` |

`tree` 返回的核心结构：

```ts
interface DshFlowTree {
  generatedAt: string
  root: DshFlowNode            // fiber 树的根
  services: DshFlowService[]   // 每个 ctx.<key> 服务及其提供者
}

interface DshFlowNode {
  id: string            // fiber uid
  name: string          // 插件名（包名），根节点为 'root'
  state: 'pending' | 'loading' | 'active' | 'failed' | 'disposed' | 'unloading'
  provides: string[]    // 该 fiber 子树提供的服务
  inject: string[]      // inject 声明的服务
  children: DshFlowNode[]
}
```

---

## 给开发者：Vue 组件库

可视化部分是一套可复用的 Vue 3 组件，基于 `@vunk/flow@^1.3.0`：

| 组件 | 说明 |
| --- | --- |
| `DshFlow` | 主流程图：包好 LogicFlow 画布 + 节点注册 + Dagre 布局 + 侧栏详情 |
| `DshNode` | 插件节点的基座组件（名称 / 状态徽标 / 服务列表） |
| `DshNode<Plugin>` | 每个 dsh 插件对应一个节点组件（见下方约定） |

命名约定：**文件夹名与组件名一一对应**。

```text
components/
  dsh-flow/          -> DshFlow           主流程图
  dsh-node/          -> DshNode           节点基座
  node-llm/          -> DshNodeLlm        @deepseek-ai/dsh-llm
  node-session/      -> DshNodeSession    @deepseek-ai/dsh-session
  node-agent/        -> DshNodeAgent      @deepseek-ai/dsh-agent
  node-agent-loop/   -> DshNodeAgentLoop  @deepseek-ai/dsh-agent-loop
  node-tools/        -> DshNodeTools      @deepseek-ai/dsh-tools
  ...                 （dsh 用了几个插件，就有几个节点组件）
```

节点组件统一很薄：声明自己对应的插件名、分类配色 / 图标，渲染委托给 `DshNode`。运行时
的插件名 → 节点类型映射由 `shared` 里的 catalog 完成，因此 dsh 树里出现的每个插件都能落到
对应的节点组件上。

---

## 目录结构

```text
dshflow/
  plugin/            # dsh 宿主插件源码（内部包，构建产物组装进 dshflow）
  components/        # Vue 组件库（DshFlow + 各插件节点组件）
  shared/            # 共享类型与 catalog（插件名 -> 分类/节点组件映射）
  app/               # 可视化前端应用（构建成静态资源，由 plugin 托管）
  dshflow/           # 发布目录：组装成 dshflow npm 包（plugin + web + cordis.patch.yml）
  cordis.patch.yml   # dshflow 的 bundle 补丁（insert 一行 dshflow）
```

---

## 本地开发

```sh
pnpm install

# 可视化前端（app）
pnpm app:dev          # 开发预览（连不到 dsh 时用 fixture 数据）

# 组装发布包（dshflow/）
pnpm lib              # 构建前端 + 插件，组装成 dshflow 包（cd dshflow && npm pack --dry-run 预览）

# 插件（plugin，仅构建插件本体）
pnpm plugin:build
```

### 本地联调 dsh

1. 组装发布包：`pnpm lib`
2. 用本地路径装进 profile：

   ```sh
   dsh plugin --profile web add link:./dshflow
   # 或手动：
   #   cd "$DSH_HOME/profiles/web" && pnpm add link:$(pwd)/dshflow
   ```

3. `dsh web` 后访问 `http://127.0.0.1:3080/dshflow/`。

---

## License

MIT
