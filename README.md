# dshflow

> DeepSeek Harness 插件 —— 把运行中的 Cordis 插件树（fiber 树）画成交互式流程图。

`dshflow` 挂载在 `dsh web` 的 webserver 上，只读读取当前进程的插件树与服务注册表，渲染成流程图，
作为会话视图里的 **dshflow 标签页** 打开。插件热插拔（HMR）时图实时刷新。

- 每个插件 = 一个节点（名称、完整包名、生命周期状态、提供/注入的服务、配置），父子挂载 = 边
- 点击节点查看详情，支持节点搜索与自动布局

## 安装与使用

```sh
dsh plugin --profile web add dshflow
dsh web
```

启动后打开任意会话，点顶部 **dshflow** 标签页即可。

## API 端点

前缀 `/dshflow`（可配 `basePath`）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/tree` | 插件树 + 服务注册表快照（JSON） |
| `GET` | `/api/events` | SSE：树变化时推送完整快照 |
| `GET` | `/api/service/:name` | 单个服务值的深层投影 |

所有值均做只读安全投影，函数 / 循环引用 / bigint 以 `$dsh` 标记代替。

## 配置

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `basePath` | `/dshflow` | API 前缀 |
| `pollIntervalMs` | `2000` | 轮询兜底间隔（ms） |

## 本地开发

```sh
pnpm install
pnpm app:dev    # 前端预览（连不到 dsh 时用 fixture 数据）
pnpm lib        # 构建并组装 dshflow 发布包
dsh plugin --profile web add link:./dshflow   # 本地联调
```

## 现状与边界

当前只做「看清插件树」，所有 API 只读。可视化改配置（写回 `cordis.patch.yml`）是后续可能的方向；
运行时控制与编排执行不在计划内。

## License

MIT
