**[English](README.md)** | **[中文](README_ZH.md)**

# 🌍 OpenLayers STAC 查看器

一个专业工具，结合 [OpenLayers](https://openlayers.org/) 和 [ol-stac](https://github.com/m-mohr/ol-stac)，用于可视化来自任何公开来源的 SpatioTemporal Asset Catalog (STAC) Item JSON 文档。

## 🚀 快速开始

### 环境要求
- Node.js (v14 或更高版本)
- npm 或 yarn

### 安装

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

在浏览器中打开 http://localhost:5173/，应用会加载一个预填充的 Sentinel-2 示例 STAC 项目。

## 🌐 推荐的 STAC 数据源

- [AWS 上的 Sentinel-2 COGs](https://registry.opendata.aws/sentinel-2/)
- [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/catalog)
- [Earth Search STAC API](https://earth-search.aws.element84.com)

**注意**：STAC 项目必须可通过 HTTPS 访问，并允许跨域请求 (CORS)。

## 🚀 部署

### Vercel 部署

- 确保项目根目录存在 `vercel.json` 和 `.vercelignore` 文件。
- Vercel 使用 `@vercel/static-build` 运行 `npm run build` 并提供 `dist` 目录服务。
- SPA 路由通过重写到 `index.html` 处理。

步骤：
1. 本地安装 Vercel CLI：`npm i -g vercel`
2. 链接项目：`vercel`（选择范围和项目）
3. 部署：`vercel --prod`

或者从 Vercel 控制台部署：
- 导入 Git 仓库
- 框架预设："Other"
- 构建命令：`npm run build`
- 输出目录：`dist`
- 安装命令：`npm ci`（或默认）

### GitHub Pages 部署

1. 将仓库推送到 GitHub
2. 在 Settings > Pages > Build and deployment 中启用 Pages
3. 选择 GitHub Actions 作为来源
4. `.github/workflows/deploy.yml` 中的工作流将自动构建和部署

### Docker 部署（可选）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🔮 未来计划

### 计划功能

- **STAC 目录集成**：提高与公共 STAC 目录源的兼容性：
  - [STAC Index 公共目录](https://stacindex.org/catalogs?access=public&type=static#/)
  - [AWS STAC 目录集合](https://github.com/opengeos/geospatial-data-catalogs/blob/master/aws_stac_catalogs.json)

  支持在查看器中直接浏览和加载来自各种公共目录的 STAC 项目。

## 📝 许可证

可自由使用和修改。
