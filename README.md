# 拼豆像素画小程序

一款基于 Taro + Vue3 开发的拼豆像素画创作小程序，支持像素画编辑、作品管理、图片导入导出等功能。

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

### 5. 微信小程序配置

1. 打开微信开发者工具
2. 导入项目，选择项目根目录
3. 在 `project.config.json` 中修改 `appid` 为你自己的小程序 AppID
4. 编译后的代码在 `dist/` 目录下

## 项目结构

```
perlerBeadsApplet/
├── src/                    # 源代码目录
│   ├── pages/              # 页面目录
│   │   ├── editor/         # 编辑器页面
│   │   ├── profile/        # 个人作品页
│   │   ├── home/           # 模板首页
│   │   ├── saveForm/       # 保存表单
│   │   ├── detail/         # 作品详情
│   │   └── settings/       # 设置页
│   ├── components/         # 公共组件
│   ├── stores/             # Pinia 状态管理
│   ├── utils/              # 工具函数
│   ├── config/             # 配置文件
│   └── assets/             # 静态资源
├── config/                 # Taro 构建配置
├── scripts/                # 构建脚本
├── screenshot/             # 项目截图
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript 配置
└── project.config.json     # 微信小程序配置
```

## 开发指南

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
