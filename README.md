# 拼豆像素画小程序

一款基于 Taro + Vue3 开发的拼豆像素画创作小程序，支持像素画编辑、作品管理、图片导入，图纸导出等功能。
项目是基于和二开 开源程序：https://github.com/noir017/perlerBeadsApplet 
感谢作者开源，而我是为我的拼豆项目 https://github.com/liangdabiao/perler-beads-ai
改造成适合自己的小程序。

## 项目简介

拼豆像素画小程序是一款创意工具应用，用户可以在手机上设计像素风格的拼豆图案。无论是想制作可爱的动物、精美的植物，还是独特的动漫角色，都可以通过简单的操作完成创作。完成后可以导出图片作为参考，用于实际的拼豆制作。

## 功能特性

### 像素画编辑器

- 可调节网格大小（默认 16x16）
- 画笔/橡皮擦工具
- 撤销/重做功能（最多 50 步历史记录）
- 缩放功能
- 图片导入转像素画
- 导出 PNG 到相册
- **导出拼豆图纸**（支持多种色号系统）

### 作品管理

- 作品列表展示
- 分类筛选（全部/最近/收藏）
- 作品状态标记（已完成/进行中）
- 作品编辑、删除、导出
- 搜索功能

### 模板浏览

- 瀑布流模板展示
- 分类标签
- 下拉刷新和无限加载

### 导出图纸功能

导出图纸是针对拼豆玩家的核心功能，生成包含以下信息的高质量 PNG 图片：

- **标题栏**：显示作品名称、网格尺寸和品牌 Logo
- **网格区域**：每个格子显示对应颜色的色号
- **坐标轴**：行列编号标注（每隔 10 格显示）
- **网格线**：每隔 10 格显示加重线
- **色号统计**：统计各颜色使用数量
- **水印**：底部显示 `pindou.348349.xyz`

**导出配置选项**：

| 选项 | 说明 | 默认值 |
|------|------|--------|
| 显示网格 | 是否显示网格线 | true |
| 网格间隔 | 网格线间隔（每隔多少格） | 10 |
| 显示坐标 | 是否显示坐标轴 | true |
| 显示色号 | 是否显示单元格色号 | true |
| 网格颜色 | 网格线颜色 | 深灰色 |
| 包含统计 | 是否包含色号统计 | true |

### 色号系统

拼豆玩家必备的工具，系统支持 **5 大品牌色号系统**的完整映射，共收录 **217 种颜色**的精确对应关系。

#### 品牌色号系统

| 色号系统 | 说明 | 色号示例 | 特点 |
|---------|------|---------|------|
| MARD | 丹麦品牌（**默认**） | A01, B02, C03... | 字母+数字组合，如 A01-Z26 |
| COCO | 可可色系 | E02, F05, G08... | 字母+数字组合，如 E01-K39 |
| 漫漫 | 漫漫色系 | E2, B3, C7... | 字母+数字组合，如 A1-Q15 |
| 盼盼 | 盼盼色系 | 65, 2, 28... | 纯数字，如 1-253 |
| 咪小窝 | 咪小窝色系 | 77, 2, 28... | 纯数字，如 1-283 |

#### 核心数据结构

文件：`src/utils/colorData.ts`

```typescript
// 色号系统类型
export type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

// 单个颜色的多品牌映射
export interface ColorMapping {
  MARD: string;    // 丹麦品牌色号
  COCO: string;    // 可可色号
  漫漫: string;    // 漫漫色号
  盼盼: string;    // 盼盼色号
  咪小窝: string;  // 咪小窝色号
}

// 完整颜色映射表（HEX 颜色 -> 各品牌色号）
export const colorSystemMapping: Record<string, ColorMapping>
```

#### 颜色匹配原理

当用户绘制像素画时，系统通过以下步骤实现颜色到色号的转换：

1. **HEX 颜色标准化**：将颜色值转为大写 HEX 格式（如 `#FF6B6B`）
2. **查找映射表**：在 `colorSystemMapping` 中精确匹配 HEX 值
3. **获取色号**：根据用户选择的品牌返回对应的色号

```typescript
// 示例：获取某个 HEX 颜色对应的 MARD 色号
getColorKeyByHex('#FF6B6B', 'MARD')  // 返回 'F01'

// 切换品牌后获取同一颜色的盼盼色号
getColorKeyByHex('#FF6B6B', '盼盼')  // 返回 '31'
```

#### 对比色算法

图纸上每个格子需要显示色号文字，为了确保可读性，系统根据背景色深浅自动选择黑色或白色文字：

```typescript
function getContrastColor(hex: string): string {
  // 使用 Luma 公式计算亮度
  // Luma > 0.5 → 浅色背景 → 黑色文字
  // Luma ≤ 0.5 → 深色背景 → 白色文字
}
```

#### 使用场景

| 场景 | 说明 |
|------|------|
| 导出图纸 | 将像素画导出为带色号的拼豆图纸 |
| 颜色统计 | 统计作品中各颜色的使用数量，对应所需色号 |
| 采购参考 | 根据色号统计计算各品牌所需的豆子数量 |

#### 色号统计功能

导出图纸时可选包含色号统计区域，显示：
- 每种颜色的色号（按品牌）
- 该颜色的使用颗数
- 总计使用颗数

方便玩家对照品牌色卡购买所需颜色的拼豆。

## 项目截图

### 主页

![主页](<screenshot/main.png> "主页")

### 编辑器

![编辑器](<screenshot/editor.png> "编辑器")


## 技术栈

| 类别       | 技术                    |
| -------- | --------------------- |
| 框架       | Taro 4.1.11 + Vue 3   |
| 状态管理     | Pinia 2.0.10          |
| 构建工具     | Vite 4.2.0            |
| CSS 预处理器 | Sass                  |
| 编程语言     | TypeScript 5.1.0      |
| UI 图标    | Material Design Icons |

## 环境要求

- Node.js >= 16.x
- npm >= 8.x 或 pnpm >= 7.x
- 微信开发者工具（用于微信小程序开发和预览）

## 部署说明

### 1. 克隆项目

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 开发模式

微信小程序开发：

```bash
npm run dev:weapp
```

其他平台：

```bash
# 支付宝小程序
npm run dev:alipay

# 百度小程序
npm run dev:swan

# 字节跳动小程序
npm run dev:tt

# QQ 小程序
npm run dev:qq

# H5
npm run dev:h5
```

### 4. 生产构建

```bash
# 微信小程序
npm run build:weapp

# 其他平台
npm run build:alipay
npm run build:swan
npm run build:tt
npm run build:qq
npm run build:h5
```

### 5. 微信小程序上线流程

#### 5.1 前期准备

| 步骤 | 说明 |
|------|------|
| 注册小程序 | 前往 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序账号 |
| 获取 AppID | 登录后在小程序后台「开发」→「开发管理」→「开发设置」中查看 |
| 申请类目 | 根据小程序功能选择合适的类目（如：工具-图片/摄影） |
| 域名配置 | 如使用网络请求，需在后台配置 request 合法域名 |

#### 5.2 项目配置

1. **修改 AppID**

   在 `project.config.json` 中修改：
   ```json
   {
     "appid": "your_appid_here"
   }
   ```

2. **配置合法域名**（如需要）

   在小程序后台「开发」→「开发管理」→「开发设置」→「服务器域名」中添加：
   - request 合法域名
   - uploadFile 合法域名
   - downloadFile 合法域名

3. **检查权限配置**

   在 `src/app.config.ts` 中确认页面路径已正确配置。

#### 5.3 开发调试

```bash
# 启动开发模式
npm run dev:weapp

# 使用微信开发者工具导入项目
# 1. 打开微信开发者工具
# 2. 点击「导入项目」
# 3. 选择项目根目录
# 4. 输入 AppID
# 5. 确认导入
```

#### 5.4 生产构建

```bash
# 构建微信小程序生产版本
npm run build:weapp
```

构建完成后，代码输出到 `dist/` 目录。

#### 5.5 提交审核

1. **在微信开发者工具中上传代码**

   - 点击「上传」按钮
   - 填写版本号和备注
   - 确认上传

2. **在微信公众平台提交审核**

   - 登录 [微信公众平台](https://mp.weixin.qq.com/)
   - 进入「管理」→「版本管理」
   - 找到刚上传的版本，点击「提交审核」

3. **填写审核信息**

   | 字段 | 说明 |
   |------|------|
   | 功能页面 | 选择小程序的页面路径 |
   | 功能描述 | 简要描述小程序功能 |
   | 隐私协议 | 上传或选择隐私协议 |

4. **等待审核**

   - 审核时长：通常 1-7 个工作日
   - 期间可查看审核进度

#### 5.6 发布上线

审核通过后：

1. 在「版本管理」中点击「发布」
2. 确认发布版本
3. 发布成功后，小程序即可在线上使用

#### 5.7 常见问题

| 问题 | 解决方案 |
|------|---------|
| canvas 类型错误 | 确保使用 `Taro.createOffscreenCanvas` 而非 `createSelectorQuery` |
| 图片不显示 | 检查临时文件路径是否正确释放 |
| 授权失败 | 在 `project.config.json` 中配置 `permission` |
| 构建失败 | 检查 `app.config.ts` 路由配置是否正确 |

#### 5.8 更新迭代

```bash
# 1. 修改代码后重新构建
npm run build:weapp

# 2. 在微信开发者工具中上传新版本
# 3. 在公众平台提交审核
# 4. 审核通过后发布
```

## 项目结构

```
perlerBeadsApplet/
├── src/                    # 源代码目录
│   ├── pages/              # 页面目录
│   │   ├── editor/         # 像素画编辑器
│   │   │   ├── components/ # 编辑器组件
│   │   │   │   ├── drawPanel/   # Canvas 绘制面板
│   │   │   │   ├── menu/         # 顶部菜单栏
│   │   │   │   └── toolArea/     # 底部工具区域
│   │   │   └── index.vue         # 编辑器页面
│   │   ├── profile/        # 个人作品页
│   │   ├── home/           # 模板首页
│   │   ├── saveForm/       # 保存表单
│   │   ├── detail/         # 作品详情
│   │   ├── settings/       # 设置页
│   │   └── debug/          # 调试工具页
│   ├── components/         # 公共组件
│   │   ├── DownloadSettingsModal/ # 下载设置弹窗
│   │   └── MIcon/          # Material Design Icons 封装
│   ├── stores/             # Pinia 状态管理
│   │   ├── editorTemp.ts   # 编辑器临时数据
│   │   └── user.ts         # 用户信息
│   ├── utils/              # 工具函数
│   │   ├── pixelArt.ts     # 像素画渲染/导出/导入算法
│   │   ├── colorData.ts    # 色号系统：5大品牌色号映射
│   │   ├── storage.ts      # 本地存储 CRUD
│   │   ├── base64.ts       # ArrayBuffer ↔ Base64 转换
│   │   └── request/        # HTTP 请求封装
│   ├── types/              # TypeScript 类型定义
│   │   └── downloadTypes.ts # 导出图纸相关类型定义
│   └── config/             # 配置文件
├── docs/                   # 开发文档
│   └── developer-guide.md  # 开发者文档
├── config/                 # Taro 构建配置
├── scripts/                # 构建脚本
├── screenshot/             # 项目截图
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript 配置
└── project.config.json     # 微信小程序配置
```

## 核心模块说明

### 像素画渲染引擎

文件：`src/utils/pixelArt.ts`

核心数据结构：
```ts
interface PixelArtData {
  gridSize: number     // 网格尺寸 (N×N)
  pixelData: string[]  // 像素颜色数组，长度 = gridSize²
}
```

**主要功能**：
- `convertPixelArtToPngPath()` - 像素数据转 PNG 临时文件
- `convertPixelArtToPngBuffer()` - 像素数据转 PNG ArrayBuffer
- `exportPixelArtToGallery()` - 导出像素画到相册
- `imageToPixelArtData()` - 图片导入转像素数据
- `pngToPixelArtData()` - PNG 反向解析为像素数据
- `generatePatternImage()` - 生成拼豆图纸图片
- `exportPatternToGallery()` - 导出图纸到相册

### 色号系统

文件：`src/utils/colorData.ts`

支持 5 大品牌色号的完整映射，共 217 种颜色：
- MARD（丹麦品牌）- 默认
- COCO（可可色系）
- 漫漫
- 盼盼
- 咪小窝

颜色匹配算法使用 RGB 空间欧氏距离计算最接近的颜色。

### 导出配置

文件：`src/types/downloadTypes.ts`

```ts
type GridDownloadOptions = {
  showGrid: boolean;        // 是否显示网格线
  gridInterval: number;     // 网格线间隔
  showCoordinates: boolean; // 是否显示坐标轴
  showCellNumbers: boolean; // 是否显示单元格色号
  gridLineColor: string;    // 网格线颜色
  includeStats: boolean;    // 是否包含色号统计
  exportCsv: boolean;       // 是否导出 CSV（预留）
};
```

## 开发指南

> 📖 **详细开发文档**：如需了解更多技术细节，请参阅 [开发者文档](./docs/developer-guide.md)。

### 版本更新

项目内置版本号自动更新脚本，构建时会自动更新版本号：

```bash
npm run bump-version
```

### 代码规范

项目使用 ESLint 和 Stylelint 进行代码规范检查：

```bash
# 检查代码规范
npx eslint src/

# 检查样式规范
npx stylelint "src/**/*.scss"
```

## License

MIT
