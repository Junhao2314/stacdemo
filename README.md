# 🌍 OpenLayers STAC Viewer

A professional tool that combines [OpenLayers](https://openlayers.org/) with [ol-stac](https://github.com/m-mohr/ol-stac) to visualize SpatioTemporal Asset Catalog (STAC) Item JSON documents from any public source.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Open http://localhost:5173/ in your browser. The app loads with a pre-filled Sentinel-2 sample STAC item.

## 🌐 Suggested STAC Sources

- [Sentinel-2 COGs on AWS](https://registry.opendata.aws/sentinel-2/)
- [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/catalog)
- [Earth Search STAC API](https://earth-search.aws.element84.com)

**Note**: The STAC item must be accessible over HTTPS and allow cross-origin requests (CORS).

## 🚀 Deployment

### Vercel Deployment

- Ensure `vercel.json` and `.vercelignore` exist in the project root.
- Vercel uses the `@vercel/static-build` to run `npm run build` and serve `dist`.
- SPA routing is handled with a rewrite to `index.html`.

Steps:
1. Install Vercel CLI locally: `npm i -g vercel`
2. Link the project: `vercel` (choose scope and project)
3. Deploy: `vercel --prod`

Alternatively, deploy from Vercel Dashboard:
- Import the Git repo
- Framework preset: "Other"
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci` (or default)

### GitHub Pages Deployment

1. Push the repository to GitHub
2. Enable Pages in Settings > Pages > Build and deployment
3. Choose GitHub Actions as the source
4. The workflow in `.github/workflows/deploy.yml` will automatically build and deploy

### Docker Deployment (Optional)

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

## 🔮 Future

### Planned Features

- **STAC Catalog Integration**: Improve compatibility with public STAC catalog sources:
  - [STAC Index Public Catalogs](https://stacindex.org/catalogs?access=public&type=static#/)
  - [AWS STAC Catalogs Collection](https://github.com/opengeos/geospatial-data-catalogs/blob/master/aws_stac_catalogs.json)

  Enable browsing and loading STAC items from various public catalogs directly within the viewer.


## 📝 License

Feel free to use and modify as needed.
