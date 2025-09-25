# 🌍 OpenLayers STAC Viewer

A professional tool that combines [OpenLayers](https://openlayers.org/) with [ol-stac](https://github.com/m-mohr/ol-stac) to visualize SpatioTemporal Asset Catalog (STAC) Item JSON documents from any public source.

## ✨ Features

- **STAC Data Visualization**: Load and display STAC Item JSON data with automatic extent fitting
- **OpenLayers Integration**: Built on OpenLayers v10.6.1 with ol-stac for robust geospatial rendering
- **Responsive Design**: Optimized UI that works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with gradient header and inline controls
- **Status Tracking**: Real-time status updates displayed in the footer
- **Error Handling**: Comprehensive error handling with user-friendly messages

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

## 🎨 Recent UI Improvements

### Layout Optimizations
- **Full-width gradient header** with centered text for better visual impact
- **Inline controls**: Input field and Apply button on the same line for better UX
- **Status in footer**: Status messages moved to footer for cleaner interface
- **Professional styling**: Enhanced shadows, transitions, and hover effects
- **Responsive design**: Automatic layout adjustments for mobile devices

### Technical Improvements
- Fixed JavaScript syntax errors in main.js
- Improved map initialization with proper DOM readiness checks
- Added map resize handlers for responsive behavior
- Enhanced error handling and logging throughout the application

## 🚀 Deployment

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

## 📝 License

MIT License - Feel free to use and modify as needed.
