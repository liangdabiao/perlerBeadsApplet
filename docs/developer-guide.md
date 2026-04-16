# 拼豆像素画小程序 — 开发者文档

## 目录

1. [技术栈与项目概览](#1-技术栈与项目概览)
2. [项目结构与文件组织](#2-项目结构与文件组织)
3. [页面模块详解](#3-页面模块详解)
4. [核心功能实现](#4-核心功能实现)
5. [数据模型与存储](#5-数据模型与存储)
6. [网络请求层](#6-网络请求层)
7. [状态管理](#7-状态管理)
8. [跨页面数据传递](#8-跨页面数据传递)
9. [自定义 TabBar](#9-自定义-tabbar)
10. [主题与样式系统](#10-主题与样式系统)
11. [构建与部署](#11-构建与部署)

---

## 1. 技术栈与项目概览

| 类别 | 技术 | 版本 |
|------|------|------|
| 跨端框架 | Taro | 4.1.11 |
| UI 框架 | Vue 3 (Composition API + `<script setup>`) | ^3.2.24 |
| 状态管理 | Pinia | ^2.0.10 |
| 构建工具 | Vite | ^4.2.0 |
| CSS 预处理器 | Sass | ^1.60.0 |
| 编程语言 | TypeScript | ^5.1.0 |
| 图标库 | Material Design Icons | ^3.0.1 |

**主要目标平台**：微信小程序（`weapp`），同时支持支付宝、百度、字节跳动、QQ、H5 等平台。

**设计稿宽度**：750px，Taro 自动进行 px → rpx 转换（`config/index.ts` 中 `designWidth` 设为 750）。

---

## 2. 项目结构与文件组织

```
src/
├── app.ts                    # 应用入口，初始化 Vue + Pinia
├── app.config.ts             # Taro 路由配置与 TabBar 声明
├── app.scss                  # 全局样式
├── components/               # 全局共享组件
│   └── MIcon/index.vue       # Material Design Icons 封装组件
├── custom-tab-bar/           # 自定义底部 TabBar
│   ├── index.vue
│   └── index.scss
├── config/                   # 应用配置
│   ├── app.ts                # 应用级配置（当前为空对象）
│   └── theme.ts              # 全局主题色定义
├── pages/                    # 页面目录
│   ├── editor/               # 像素画编辑器（TabBar 页）
│   │   ├── index.vue
│   │   ├── index.scss
│   │   └── components/
│   │       ├── drawPanel/    # Canvas 绘制面板
│   │       ├── menu/         # 顶部菜单栏
│   │       └── toolArea/     # 底部工具区域
│   ├── profile/              # 作品列表页（TabBar 页）
│   ├── home/                 # 模板浏览页（当前未启用）
│   ├── saveForm/             # 保存表单页
│   ├── detail/               # 作品详情页
│   ├── settings/             # 设置页
│   └── debug/                # 调试工具页
│       └── components/
│           └── dataEditor/   # 数据编辑器（可增删改查本地存储）
├── stores/                   # Pinia 状态管理
│   ├── editorTemp.ts         # 编辑器临时数据
│   └── user.ts               # 用户信息
└── utils/                    # 工具函数
    ├── pixelArt.ts           # 核心：像素画渲染/导出/导入算法
    ├── storage.ts            # 本地存储 CRUD（作品数据持久化）
    ├── base64.ts             # ArrayBuffer ↔ Base64 转换
    ├── tools.ts              # 通用工具（sleep 等）
    └── request/              # HTTP 请求封装
        ├── index.ts          # 请求方法（get/post/put/del/patch/upload/download）
        ├── apiConfig.ts      # API 服务工厂（createApiService/createRestApiService）
        ├── interceptors.ts   # 请求/响应/错误拦截器
        └── types.ts          # TypeScript 类型定义
```

---

## 3. 页面模块详解

### 3.1 路由配置

在 `src/app.config.ts` 中声明：

```ts
pages: [
  'pages/profile/index',   // 作品列表（TabBar）
  'pages/editor/index',    // 编辑器（TabBar）
  'pages/saveForm/index',  // 保存表单
  'pages/settings/index',  // 设置
  'pages/detail/index',    // 作品详情
  'pages/debug/index',     // 调试工具
  // 'pages/home/index'    // 模板浏览（已注释，暂未启用）
]
```

> `pages/home/index` 已在路由列表中注释掉，模板浏览功能暂未上线。

### 3.2 编辑器页 — `pages/editor`

**核心页面**，用户在此进行像素画创作。页面结构自上而下为：

```
┌──────────────────────────┐
│  MenuBar (顶部操作菜单)    │
│  撤销 | 重做 | 清空 |      │
│  保存 | 导出 | 导入 |      │
│  缩小 | 放大               │
├──────────────────────────┤
│                          │
│     DrawPanel            │
│   (Canvas 绘制区域)       │
│                          │
├──────────────────────────┤
│  ToolArea (底部工具栏)     │
│  画笔 | 橡皮 | 网格 |      │
│  选择 | 移动               │
│  颜色选择器 / 网格大小      │
└──────────────────────────┘
│     CustomTabBar          │
└──────────────────────────┘
```

#### 3.2.1 状态流转

| 状态 | 类型 | 用途 |
|------|------|------|
| `gridSize` | `ref<number>` | 网格尺寸，默认 16，可选 16/24/32/48/100 |
| `currentColor` | `ref<string>` | 当前画笔颜色，默认 `#C4634E` |
| `currentTool` | `ref<string>` | 当前工具：`brush` / `eraser` / `grid` / `select` / `move` |
| `pixelData` | `ref<string[]>` | 像素颜色数组，长度 = gridSize² |
| `historyStack` | `ref<string[][]>` | 撤销/重做历史栈，最大 50 步 |
| `historyIndex` | `ref<number>` | 当前历史位置指针 |
| `hideCanvas` | `ref<boolean>` | 隐藏 Canvas 切换为 Image 展示 |
| `currentColorPalette` | `ref<string[]>` | 当前选中的颜色集（用于图片导入时的颜色匹配） |

#### 3.2.2 操作逻辑

- **撤销**：`historyIndex--`，从 `historyStack` 中恢复对应快照并同步到 DrawPanel
- **重做**：`historyIndex++`，逻辑与撤销相反
- **清空**：弹出确认框，确认后调用 DrawPanel 的 `clearCanvas()` 重置为全白
- **保存**：将 pixelData 转为 PNG Buffer 和临时文件路径，存入 `editorTempStore`，跳转保存表单页
- **导出**：直接将 pixelData 渲染为 PNG 并保存到系统相册（需授权 `scope.writePhotosAlbum`）
- **导入**：调用 `Taro.chooseImage` 选择图片，通过 `imageToPixelArtData` 转换为像素数据
- **缩放**：调用 DrawPanel 的 `zoomIn()` / `zoomOut()`，步进 0.2x
- **网格大小变更**：重置 pixelData 为全白数组，清空历史栈

#### 3.2.3 初始化逻辑

页面挂载时调用 `initPixel()`：
1. 从 `editorTempStore` 读取临时数据（从详情页或保存表单编辑进入时会有数据）
2. 若有临时数据：将 PNG Buffer 转为临时文件，再用 `pngToPixelArtData` 反向解析出 pixelData
3. 若无临时数据：初始化为 gridSize×gridSize 的全白数组
4. 保存初始状态到历史栈，计算画布尺寸

#### 3.2.4 DrawPanel 组件 — `drawPanel/index.vue`

**这是整个应用最核心的组件**，负责所有 Canvas 绘制和触摸交互。

**Props**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| gridSize | number | 16 | 网格尺寸 |
| currentColor | string | '#FF6B6B' | 画笔颜色 |
| canvasWidth | number | 0 | 画布宽度 |
| canvasHeight | number | 0 | 画布高度 |
| currentTool | string | 'brush' | 当前工具 |
| viewOnly | boolean | false | 只读模式（详情页使用） |
| hideMode | boolean | false | 隐藏 Canvas 用 Image 替代 |

**Exposes（通过 ref 调用的方法）**：

| 方法 | 说明 |
|------|------|
| `clearCanvas()` | 清空画布为全白 |
| `setPixelData(data)` | 设置像素数据并重绘 |
| `getPixelData()` | 获取当前像素数据副本 |
| `redraw()` | 重绘整个网格 |
| `reinitCanvas()` | 重新初始化画布（尺寸变化时） |
| `zoomIn()` | 放大 0.2x（最大 6x） |
| `zoomOut()` | 缩小 0.2x（最小 0.3x） |
| `resetView()` | 重置缩放和偏移 |

**渲染架构**：

DrawPanel 使用**双 Canvas 架构**实现高性能渲染：

1. **可见 Canvas**（`#pixelCanvas`）：显示在页面上，处理触摸事件
2. **离屏 Canvas**（`Taro.createOffscreenCanvas`）：不可见，用于像素数据合成

渲染流程：
```
pixelData[] → writePixelToBuffer() → imageDataBuffer (Uint8ClampedArray)
    → flushBufferToOffscreen() → offscreenCanvas
    → ctx.drawImage(offscreenCanvas) → 可见 Canvas
```

**关键算法**：

- **Bresenham 直线算法**（`bresenhamLine`）：在快速滑动时补间绘制连续像素线，避免断点
- **绘制节流**：`DRAW_THROTTLE = 16ms`（约 60fps），防止触摸事件过于频繁导致卡顿
- **requestAnimationFrame 调度**：通过 `scheduleRender()` 合并多次渲染请求为一帧

**触摸交互逻辑**：

| 触摸方式 | 行为 |
|----------|------|
| 单指（画笔/橡皮模式） | 在网格上绘制像素，离开网格区域则进入拖拽模式 |
| 单指（移动工具） | 拖拽平移画布 |
| 单指（只读模式） | 拖拽平移画布 |
| 双指 | 缩放（0.3x ~ 6x）+ 平移 |

**缩放参数**：
- `MIN_SCALE = 0.3`，`MAX_SCALE = 6`
- 网格线在 `blockSize >= 6` 时才绘制，小缩放下隐藏网格线避免视觉混乱

**hideMode 模式**：
当 `hideMode=true` 时，Canvas 被移到屏幕外（`left: -9999px`），将离屏 Canvas 转为临时图片路径显示为 `<image>` 标签。此模式用于颜色集选择面板弹出时减少 Canvas 性能开销。

#### 3.2.5 MenuBar 组件 — `menu/index.vue`

顶部操作栏，提供 8 个操作按钮，每个按钮通过 `emit` 向父组件发送事件。清空操作会弹出确认框。

#### 3.2.6 ToolArea 组件 — `toolArea/index.vue`

底部工具区域，根据当前工具切换显示内容：

- **画笔/橡皮/填充模式** → 显示颜色选择器（两行颜色格子）+ 调色板按钮
- **网格模式** → 显示网格大小选择器（16/24/32/48/100）
- **其他模式** → 只显示工具栏

**内置颜色集**（`colorSets`）：

| ID | 名称 | 说明 |
|----|------|------|
| default | 默认颜色集 | 18 色基础色 |
| warm | 暖色调 | 红橙黄系 15 色 |
| cool | 冷色调 | 蓝绿紫系 15 色 |
| pastel | 柔和色 | 淡雅柔和 15 色 |
| vibrant | 鲜艳色 | 高饱和 15 色 |
| grayscale | 灰度色 | 黑白灰 15 色 |

选择颜色集时通过 `emit('colorSetChange', colors)` 通知父组件更新 `currentColorPalette`，用于图片导入时的颜色量化匹配。

> **注意**：`handleColorSelect` 方法体被注释掉了，当前点击颜色格子不会改变画笔颜色，颜色选择功能暂时不可用。

---

### 3.3 作品列表页 — `pages/profile`

展示用户所有已保存的像素画作品。

#### 3.3.1 分类筛选

| 分类 | 值 | 逻辑 |
|------|------|------|
| 全部 | `all` | 显示所有作品 |
| 最近 | `recent` | 按创建时间降序排列，取前 10 条 |
| 收藏 | `favorite` | 筛选 `status === 'finished'` 的作品 |

#### 3.3.2 卡片操作（长按 ActionSheet）

| 操作 | 实现 |
|------|------|
| 查看详情 | 将作品数据存入 `StorageSync`（key: `pixelart_detail_{id}`），跳转详情页 |
| 编辑 | 将 PNG 数据转为 Buffer 存入 `editorTempStore`，`switchTab` 到编辑器页 |
| 导出 | 将 Base64 PNG 转为临时文件，调用 `saveImageToPhotosAlbum`（含权限处理） |
| 切换状态 | 在 `finished` / `unfinished` 间切换 |
| 删除 | 弹出确认框后删除 |

#### 3.3.3 缩略图机制

作品列表需要显示缩略图，但小程序重启后临时文件会丢失。`ensureThumbnailExists` 函数处理了这一情况：

```
1. 检查 pngTempPath 文件是否存在
2. 若存在 → 直接使用
3. 若不存在 → 从 Base64 pngData 重新生成：
   - base64ToArrayBuffer → arrayBufferToTempFilePath → upscalePixelArtPng
   - 同时更新 storage 中的 pngTempPath
```

#### 3.3.4 页面生命周期

- `onMounted`：首次加载作品列表
- `useDidShow`：每次页面显示时刷新列表（处理从编辑器保存后返回的场景）

---

### 3.4 保存表单页 — `pages/saveForm`

在编辑器中点击"保存"后跳转到此页面。

**表单字段**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 标题 | string | 是 | 最大 50 字符 |
| 简介 | string | 否 | 最大 200 字符 |
| 标签 | string[] | 否 | 最多 5 个，手动添加 |
| 状态 | 'unfinished' \| 'finished' | 否 | 默认进行中 |

**数据来源**：从 `editorTempStore` 获取 `EditorTempData`（包含 gridSize、pngBuffer、pngTempPath）。

**保存逻辑**：
```
用户点击保存 → savePixelArt() →
  1. ArrayBuffer pngBuffer → Base64 编码
  2. 生成唯一 ID（时间戳 + 随机字符）
  3. 插入到 storage 列表头部
  4. 清除 editorTempStore
  5. switchTab 到作品列表页
```

---

### 3.5 作品详情页 — `pages/detail`

展示单个作品的完整信息，包含只读模式的 DrawPanel 预览。

**数据传递方式**：通过 `Taro.setStorageSync('pixelart_detail_{id}', item)` 存储数据，详情页通过 URL 参数 `?id=xxx` 读取。

**加载流程**：
```
获取 URL 参数 id → 从 Storage 读取作品数据 →
  base64ToArrayBuffer(pngData) → arrayBufferToTempFilePath →
    pngToPixelArtData → 解析出 pixelData →
      drawPanelRef.setPixelData(pixelData)
```

**支持操作**：导出图片到相册、切换作品状态（已完成/进行中）。

---

### 3.6 设置页 — `pages/settings`

当前为**半成品页面**，大部分菜单项被注释掉了。

已实现功能：
- 显示当前版本号（从 `process.env.TARO_APP_VERSION` 读取）
- 计算缓存大小（遍历 `USER_DATA_PATH` 目录计算文件总大小）
- 清除缓存（删除 `USER_DATA_PATH/tmp` 目录下所有文件）

---

### 3.7 调试工具页 — `pages/debug`

开发调试辅助页面，不在正式版中暴露给用户。

**功能模块**：

| 模块 | 功能 |
|------|------|
| 数据编辑器 | 查看/编辑/删除/复制/导入/导出本地存储中的作品数据 |
| 存储信息 | 查看 Storage 中的所有 key、大小、限制 |
| 清除存储 | 清空所有本地存储（危险操作，有确认框） |
| 系统信息 | 显示设备品牌、型号、系统版本、屏幕尺寸、像素比 |
| 路由跳转 | 快捷跳转到编辑器/作品列表页 |
| Toast 测试 | 测试不同类型的 Toast 提示 |

**数据编辑器**（`dataEditor/index.vue`）：
- 直接操作 `pixel_art_gallery` Storage key
- 支持手动编辑作品的标题、描述、标签、状态、网格大小等元数据
- 支持导出全部数据为 JSON（复制到剪贴板）
- 支持从 JSON 导入数据（覆盖现有数据）

---

### 3.8 模板浏览页 — `pages/home`

**当前状态**：路由已注释掉，暂未启用。使用 Mock 数据。

设计为一个瀑布流模板浏览页面：
- 支持分类筛选（推荐/最新/热门/动物/植物/人物/风景/动漫/美食）
- 双列瀑布流布局（通过 `computed` 按奇偶索引分配到左右列）
- 下拉刷新 + 滚动加载更多（分页加载，每页 10 条）
- 搜索功能
- 数据为 Mock 生成，图片来自 `picsum.photos`

---

## 4. 核心功能实现

### 4.1 像素画渲染引擎

核心文件：`src/utils/pixelArt.ts`

#### 4.1.1 数据结构

```ts
interface PixelArtData {
  gridSize: number     // 网格尺寸 (N×N)
  pixelData: string[]  // 像素颜色数组，长度 = gridSize²，每项为 HEX 颜色值
}
```

`pixelData` 采用一维数组按行优先排列：`pixelData[row * gridSize + col]`。

#### 4.1.2 导出为 PNG

**流程**：

```
PixelArtData → createOffscreenCanvas(size, size) →
  drawPixelArtToCanvas(ctx, data, canvasSize) →
    遍历 pixelData，每个像素绘制一个 fillRect →
      canvasToTempFilePath / canvasToArrayBuffer
```

**质量参数**：
- `highQuality=false`：Canvas 尺寸 = gridSize（原始大小）
- `highQuality=true`：Canvas 尺寸 = gridSize × ceil(256/gridSize)（放大到约 256px）

`HIGH_QUALITY_SIZE = 256` 为高清导出的目标尺寸。

#### 4.1.3 图片导入为像素数据

**`imageToPixelArtData(imagePath, targetGridSize, colorPalette?)`**：

1. 获取图片原始尺寸
2. 计算缩放比例使图片适应 gridSize（保持宽高比，居中放置）
3. 在 gridSize×gridSize 的 Canvas 上绘制缩放后的图片（白底）
4. 逐像素采样中心点颜色，转为 HEX
5. 若传入 `colorPalette`，调用 `findClosestColor` 找到调色板中最接近的颜色（欧氏距离）

**`pngToPixelArtData(imagePath, gridSize)`**：

用于从已保存的 PNG 文件反向解析出 pixelData（编辑器初始化和详情页加载时使用）。直接将 PNG 绘制到 gridSize×gridSize 的 Canvas，逐像素采样。

#### 4.1.4 颜色匹配算法

```ts
function calculateColorDistance(c1, c2): number {
  // RGB 空间欧氏距离
  return sqrt((r1-r2)² + (g1-g2)² + (b1-b2)²)
}

function findClosestColor(hexColor, colorPalette): string {
  // 遍历调色板，返回距离最小的颜色
}
```

> **注意**：当前使用的是 RGB 欧氏距离，与人眼感知色差有一定偏差。如需更精确的匹配，可考虑使用 CIE Lab 色彩空间的 Delta E 算法。

#### 4.1.5 缩略图放大

`upscalePixelArtPng(imagePath, gridSize, highQuality)`：将低分辨率的 PNG 像素画放大为高清版本，流程为 `pngToPixelArtData → convertPixelArtToPngPath`。

---

### 4.2 Canvas 渲染性能优化

DrawPanel 采用了多层优化策略：

1. **离屏 Canvas + ImageData Buffer**：
   - 维护一个 `Uint8ClampedArray` 类型的 `imageDataBuffer` 作为像素数据的内存表示
   - 通过 `flushBufferToOffscreen()` 将 buffer 批量写入离屏 Canvas
   - 主 Canvas 只需 `drawImage(offscreenCanvas)` 一次绘制

2. **脏标记渲染**：
   - `needsRebuildBitmap` 标记离屏 Canvas 是否需要重建
   - 只有在像素数据变化或缩放变化时才重建

3. **requestAnimationFrame 合并**：
   - `scheduleRender()` 确保一帧内只执行一次 `drawFullGrid()`

4. **触摸节流**：
   - `DRAW_THROTTLE = 16ms`，触摸移动事件最多每 16ms 处理一次

5. **网格线条件绘制**：
   - `blockSize < 6` 时不绘制网格线，减少绘制开销

---

### 4.3 撤销/重做系统

实现在编辑器页面的 `historyStack` 和 `historyIndex`：

```ts
const historyStack = ref<string[][]>([])  // 历史快照数组
const historyIndex = ref(-1)              // 当前位置
const MAX_HISTORY = 50                     // 最大 50 步
```

**保存快照** (`saveToHistory`)：
1. 如果当前位置不在栈顶，截断栈顶之后的所有快照
2. 将当前 pixelData 的深拷贝 push 到栈中
3. 超过 50 步时 shift 移除最早的快照

**撤销** (`handleUndo`)：
1. `historyIndex--`
2. 从栈中取出对应快照，同步到 DrawPanel

**重做** (`handleRedo`)：
1. `historyIndex++`
2. 逻辑与撤销相反

---

## 5. 数据模型与存储

### 5.1 数据结构

**内存数据**（`PixelArtItem`）：
```ts
interface PixelArtItem {
  id: string              // 唯一 ID
  title: string           // 标题
  description: string     // 简介
  tags: string[]          // 标签
  status: 'unfinished' | 'finished'  // 状态
  gridSize: number        // 网格尺寸
  pngData: ArrayBuffer    // PNG 二进制数据
  pngTempPath: string     // 缩略图临时文件路径
  createdAt: string       // 创建时间 (ISO)
  updatedAt: string       // 更新时间 (ISO)
}
```

**存储数据**（`PixelArtItemStorage`）：
```ts
interface PixelArtItemStorage {
  // ...同上，但 pngData 类型为 string（Base64 编码）
  pngData: string
}
```

> 关键区别：`pngData` 在存储时从 `ArrayBuffer` 转为 `Base64` 字符串，因为 `Taro.setStorage` 不支持直接存储二进制数据。

### 5.2 存储 API

文件：`src/utils/storage.ts`

Storage Key：`pixel_art_gallery`，存储整个作品列表的 JSON 字符串。

| 函数 | 说明 |
|------|------|
| `savePixelArt(item)` | 新增作品，插入到列表头部 |
| `updatePixelArt(id, updates)` | 更新指定作品的部分字段 |
| `getPixelArtList()` | 获取全部作品列表 |
| `getPixelArtById(id)` | 按 ID 获取单个作品 |
| `deletePixelArt(id)` | 删除指定作品 |

### 5.3 ID 生成策略

```ts
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
```

使用时间戳（36 进制）+ 随机字符（36 进制）组合，确保唯一性。

### 5.4 存储限制

微信小程序本地存储限制为 **10MB**。每个作品的 PNG Base64 编码后约占几 KB 到几十 KB（取决于网格大小），实际可存储数百个作品。

---

## 6. 网络请求层

文件：`src/utils/request/`

### 6.1 架构设计

请求层封装了 Taro 原生的 `Taro.request` API，提供了类似 Axios 的使用体验：

```
interceptors → request() → Taro.request() → response interceptors → 返回 data
```

### 6.2 核心方法

| 方法 | 说明 |
|------|------|
| `request(config)` | 基础请求方法 |
| `get(url, params, config)` | GET 请求 |
| `post(url, data, config)` | POST 请求 |
| `put(url, data, config)` | PUT 请求 |
| `del(url, params, config)` | DELETE 请求 |
| `patch(url, data, config)` | PATCH 请求 |
| `uploadFile(url, filePath, name, formData)` | 文件上传 |
| `downloadFile(url)` | 文件下载 |
| `initRequest({ baseURL })` | 初始化 baseURL 和默认拦截器 |

### 6.3 拦截器

**默认请求拦截器**：自动在 header 中添加 `Authorization: Bearer {token}`（从 Storage 读取 `token`）。

**默认响应拦截器**：
- 2xx：检查 `success` 字段，失败时 Toast 提示
- 401：提示登录过期，清除 token
- 5xx：提示服务器错误
- 其他：提示请求失败

**默认错误拦截器**：Toast 提示网络错误，并重新抛出异常。

### 6.4 API 服务工厂

`apiConfig.ts` 提供三个工厂函数：

- **`createApiService<T>(config)`**：创建基础 CRUD 服务
- **`createRestApiService<T>(config)`**：创建增强 REST 服务，额外提供 `getById`、`update`、`remove`
- **`createCustomApiService<T, P>(url, methods)`**：创建自定义服务，可混入自定义方法

**约定响应格式**：
```ts
interface ApiResponse<T> {
  code: number
  data: T
  message: string
  success: boolean
}
```

### 6.5 当前使用状态

请求层已完整实现，但当前项目中**没有实际的后端 API 调用**。所有数据存储在本地 Storage 中。请求层为后续接入后端做好了准备。

---

## 7. 状态管理

### 7.1 editorTempStore

文件：`src/stores/editorTemp.ts`

**用途**：在编辑器页、保存表单页、作品详情页之间传递编辑器数据。

```ts
interface EditorTempData {
  gridSize: number       // 网格尺寸
  pngBuffer: ArrayBuffer  // PNG 二进制数据
  pngTempPath: string     // PNG 临时文件路径
}
```

**使用场景**：
- 编辑器 → 保存表单：保存时携带 PNG 数据
- 作品列表 → 编辑器：编辑已有作品时携带 PNG 数据
- 编辑器初始化：从 store 读取数据进行反向解析

### 7.2 userStore

文件：`src/stores/user.ts`

**用途**：管理用户登录状态和信息。

```ts
interface UserInfo {
  avatarUrl: string
  nickName: string
  openId?: string
}
```

**功能**：
- `loadUserInfo()`：从 Storage 加载（key: `user_info`）
- `saveUserInfo(info)`：保存到 Storage
- `wechatLogin()`：调用 `Taro.login` + `Taro.getUserProfile` 获取微信用户信息
- `logout()`：清除用户信息
- `getAvatar()` / `getNickName()`：获取头像和昵称，有默认值

> **注意**：`wechatLogin` 使用了 `Taro.getUserProfile`，该 API 在微信基础库 2.27.1 之后需要用户主动触发（如按钮点击）才能调用，不能在 `onLoad`/`onShow` 中自动调用。当前代码中此功能暂未在实际页面中使用。

---

## 8. 跨页面数据传递

本应用使用了两种跨页面数据传递方式：

### 8.1 Pinia Store（editorTempStore）

用于编辑器相关的临时数据传递，生命周期短（用完即清）。

**传递路径**：
```
编辑器页 --[setTempData]--> Store --[getTempData]--> 保存表单页/编辑器页
作品列表页 --[setTempData]--> Store --[getTempData]--> 编辑器页
```

### 8.2 Storage（Taro.setStorageSync）

用于需要持久化或传递较大量数据的场景。

**传递路径**：
```
作品列表页 --[setStorageSync('pixelart_detail_{id}')]--> 详情页 --[getStorageSync]--> 加载数据
```

### 8.3 URL 参数

简单参数通过 URL query 传递（如详情页的 `?id=xxx`）。

---

## 9. 自定义 TabBar

文件：`src/custom-tab-bar/index.vue`

**配置**：`app.config.ts` 中 `tabBar.custom = true`，声明了两个 Tab：

| Tab | 路径 | 图标 |
|-----|------|------|
| 作品 | `pages/profile/index` | `image` |
| 编辑 | `pages/editor/index` | `edit` |

**高亮逻辑**：通过 `Taro.getCurrentPages()` 获取当前页面路由，匹配 list 中的 `pagePath` 来设置 `selected`。

**样式**：胶囊药丸形状（`nav-pill`），选中项背景色为主题色 `#C4634E`，图标和文字变白。

---

## 10. 主题与样式系统

### 10.1 主题色定义

文件：`src/config/theme.ts`

```ts
export const theme = {
  primaryColor: '#C4634E',      // 主色（陶土红）
  secondaryColor: '#7A9B76',    // 辅色（橄榄绿）
  accentColor: '#F5D547',       // 强调色（芥末黄）
  backgroundColor: '#EBE8E3',   // 背景色（暖灰）
  textPrimary: '#2D2A26',       // 主文本色
  textSecondary: '#5C5852',     // 次要文本色
  // ... 更多色值
}
```

> **注意**：主题定义了完整的色板，但各页面样式是直接硬编码颜色值（如 SCSS 中的 `#5C5852`、`#C4634E`），并未引用 `theme` 常量。若需实现主题切换功能，需要将硬编码颜色替换为 CSS 变量或动态绑定。

### 10.2 全局样式

`app.scss` 中定义全局基础样式。

各页面/组件的样式在各自目录下的 `index.scss` 中定义。

### 10.3 设计规范

- 设计稿宽度 750px，Taro 自动转换 px 为小程序 rpx
- 使用 Sass 预处理器
- 组件间距、圆角、阴影等在各 SCSS 文件中定义，无统一的 Design Token 系统

---

## 11. 构建与部署

### 11.1 开发环境

```bash
pnpm install           # 安装依赖
npm run dev:weapp      # 启动微信小程序开发模式（watch）
```

开发构建输出到 `dist/` 目录，在微信开发者工具中导入项目根目录即可预览。

### 11.2 生产构建

```bash
npm run build:weapp    # 构建微信小程序生产包
```

生产构建会自动执行版本号递增（`scripts/bump-version.js`）：
- 读取 `package.json` 中的 `version`
- patch 版本号 +1（如 1.0.13 → 1.0.14）
- 同步更新 `.env.production` 中的 `TARO_APP_VERSION`

### 11.3 环境变量

| 文件 | 变量 | 用途 |
|------|------|------|
| `.env.development` | `TARO_APP_VERSION` | 开发环境版本号 |
| `.env.production` | `TARO_APP_VERSION` | 生产环境版本号（自动递增） |

### 11.4 代码规范

```bash
npx eslint src/              # ESLint 检查
npx stylelint "src/**/*.scss" # Stylelint 检查
```

### 11.5 微信开发者工具配置

`project.config.json` 关键配置：
- `miniprogramRoot: "dist/"` — 编译输出目录
- `appid` — 需替换为自己的小程序 AppID
- `libVersion: "3.14.2"` — 基础库版本
