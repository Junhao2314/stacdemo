/**
 * 应用入口 / Application Entry Point
 * OpenLayers STAC Viewer
 */

// 导入样式 / Import styles
import 'ol/ol.css';

// 注册 proj4 / Register proj4
import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';

// 导入应用 / Import application
import { App } from './App.js';

// 注册投影 / Register projection
register(proj4);

// 启动应用 / Bootstrap application
function bootstrap() {
  const app = new App();
  app.init();
}

// DOM 就绪后启动 / Start after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
