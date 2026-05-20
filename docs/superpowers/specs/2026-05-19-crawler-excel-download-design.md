# 爬虫智能下载Excel功能设计

## 概述

在游戏买量系统的智能爬虫中，新增自动检测网页导出/下载按钮并下载Excel文件的能力。下载后自动解析数据、导入数据库、在素材库中展示。

**目标网站**：优先支持 AdXray，通用检测逻辑适用于所有网站。

## 架构

采用**方案 A：纯 Electron 下载捕获**，整个流程在桌面端闭环：

```
BrowserWindow (打开AdXray)
  → 注入JS扫描下载按钮
  → 自动点击按钮触发下载
  → session.on('will-download') 捕获文件
  → 保存到 {userData}/crawled/{platformId}/
  → IPC通知前端
  → 前端用 SheetJS 解析Excel
  → 调用 API 导入后端数据库
  → 刷新素材库表格
```

## 模块划分

### 1. 下载按钮检测（CrawlerManager）

新增 `detectDownloadButtons(platformId)` 方法：

- 注入JS扫描页面所有 `<button>`、`<a>`、`<div role="button">` 等可点击元素
- 匹配关键词：`导出`、`下载`、`Export`、`Download`、`Excel`、`CSV`、`XLS`、`导出全部`
- 同时检查 `textContent`、`title`、`aria-label`、`innerText`
- 按匹配度打分排序，返回按钮列表 `[{text, selector, confidence, tagName}]`

新增 `clickDownloadButton(platformId, selector)` 方法：

- 点击指定的下载按钮
- 返回点击结果

### 2. 下载捕获（CrawlerManager）

在 CrawlerManager 构造函数中监听下载事件：

- `session.on('will-download')` 拦截下载请求
- 修改 `downloadItem.setSavePath()` 保存到 `{userData}/crawled/{platformId}/{timestamp}_{filename}`
- `downloadItem.on('done')` 处理完成事件
- 支持格式：`.xlsx`、`.xls`、`.csv`
- 超时控制：30秒无响应自动取消
- 维护已下载文件列表 `downloads: Map<string, DownloadRecord[]>`

### 3. Excel 解析（前端 SheetJS）

前端使用 `xlsx` 库（SheetJS）解析：

- 读取文件 → 解析为 JSON
- 智能表头映射到 Creative 结构：
  - `广告主/Advertiser/advertiser` → `advertiser`
  - `素材标题/Title/素材名称` → `title`
  - `曝光量/Impressions/展示次数` → `impressions`
  - `类型/Type/素材类型` → `creativeType`
  - `素材链接/URL/图片链接` → `thumbnail` / `videoUrl`
- AdXray 专用列名映射表 + 模糊匹配兜底
- 无法映射的列保留原始值

### 4. IPC 协议扩展

新增 IPC 通道：

| 通道 | 方向 | 参数 | 返回 |
|------|------|------|------|
| `crawler:detect-downloads` | 渲染→主进程 | `platformId: string` | `{ buttons: [{text, selector, confidence}] }` |
| `crawler:click-download` | 渲染→主进程 | `platformId: string, selector: string` | `{ success: boolean, message: string }` |
| `crawler:get-downloads` | 渲染→主进程 | `platformId: string` | `{ files: [{path, name, size, downloadedAt}] }` |
| `crawler:on-download-complete` | 主进程→渲染 | - | `{ platformId, filePath, fileName, fileSize }` |

### 5. 前端 UI

在 PlatformData 页面"数据采集"tab新增"智能下载"卡片：

- [开始检测下载按钮] — 扫描当前页面
- [立即下载] — 触发下载
- 下载记录列表：文件名、状态、导入条数

在 BrowserPage 添加浮动操作按钮，浏览时可一键触发下载。

### 6. 数据导入

下载完成后：

- 前端读取文件 → SheetJS 解析
- 映射到 Creative[] 结构
- 调用 `platformApi.storeScrapedData()` 写入后端
- 显示导入结果：成功 N 条，跳过 M 条
- 刷新素材库表格

## 文件变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `electron/crawler/crawler-manager.ts` | 修改 | 新增按钮检测、下载捕获 |
| `electron/ipc-handlers.ts` | 修改 | 新增3个IPC通道 |
| `electron/preload.ts` | 修改 | 暴露新IPC方法 |
| `frontend/src/stores/platformData.ts` | 修改 | 新增下载相关状态和action |
| `frontend/src/pages/PlatformData.tsx` | 修改 | 新增智能下载UI区域 |
| `frontend/src/pages/BrowserPage.tsx` | 修改 | 新增浮动下载按钮 |
| `frontend/package.json` | 修改 | 新增 xlsx 依赖 |

## 错误处理

| 场景 | 处理 |
|------|------|
| 页面无下载按钮 | 提示"未检测到导出按钮"，列出页面所有按钮供手动选择 |
| 下载超时(30s) | 自动取消，提示"下载超时" |
| 文件格式不支持 | 提示"不支持的文件格式" |
| Excel解析失败 | 提示具体错误，保留原始文件 |
| 表头无法映射 | 使用原始列名，标记为"未识别" |
| 写入后端失败 | 本地缓存解析结果，提示"入库失败，数据已缓存" |

## 安全考量

- 下载文件保存在用户数据目录，不污染系统
- 文件大小限制：单文件最大 50MB
- 文件类型白名单：仅允许 xlsx/xls/csv
- 解析时禁用 Excel 宏执行
