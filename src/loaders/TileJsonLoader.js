/**
 * TileJSON 加载器 / TileJSON Loader
 */

import TileLayer from 'ol/layer/Tile.js';
import TileJSON from 'ol/source/TileJSON.js';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import { LoaderBase } from './LoaderBase.js';
import { logActivity, logToBackend } from '../utils/logger.js';

export class TileJsonLoader extends LoaderBase {
  /**
   * 加载 TileJSON 数据 / Load TileJSON data
   * @param {string} url - TileJSON URL
   * @param {Object} options - 选项 / Options
   * @param {boolean} options.recenter - 是否重新定位视图 / Whether to recenter the view
   * @param {Function} onComplete - 完成回调 / Complete callback
   */
  async load(url, options = { recenter: true }, onComplete) {
    if (!url) {
      this.statusManager.setStatus('Please enter a TileJSON URL. / 请输入 TileJSON URL。', 'error');
      onComplete?.();
      return;
    }

    logActivity('tilejson_load_attempt', { url });
    this.statusManager.showLoading('Loading TileJSON... / 正在加载 TileJSON...', 'Fetching metadata... / 获取元数据中...');
    this.statusManager.setStatus('Loading TileJSON... / 正在加载 TileJSON...');
    this.mapManager.removeCurrentLayer();

    const token = this.createTimeoutToken(url, 'tilejson', onComplete);

    try {
      const response = await fetch(url, { credentials: 'omit' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch TileJSON: ${response.status} ${response.statusText}`);
      }

      this.statusManager.updateProgress('Parsing response... / 解析响应中...');
      const tileJson = await response.json();

      if (!this.isTokenValid(token)) return;

      this.statusManager.updateProgress('Creating tile layer... / 创建瓦片图层中...');

      // 计算范围 / Calculate extent
      let extent3857;
      if (Array.isArray(tileJson.bounds) && tileJson.bounds.length === 4) {
        try {
          extent3857 = transformExtent(
            tileJson.bounds, 
            'EPSG:4326', 
            this.mapManager.getView().getProjection()
          );
        } catch (error) {
          console.warn('[TileJsonLoader] Failed to transform bounds:', error.message, tileJson.bounds);
        }
      }

      // 创建图层 / Create layer
      const layerOptions = {
        source: new TileJSON({ url, crossOrigin: 'anonymous' }),
      };
      if (extent3857) {
        layerOptions.extent = extent3857;
      }

      const layer = new TileLayer(layerOptions);
      this._attachEvents(layer, url, token, options);
      this.mapManager.addLayer(layer);

      // 设置视图 / Set view
      if (options.recenter) {
        this._setViewFromTileJson(tileJson, extent3857);
      }

      this.statusManager.updateProgress('Rendering tiles... / 渲染瓦片中...');
      logActivity('tilejson_load_success', { url });

    } catch (error) {
      this.finishLoading(token);
      console.error(error);
      this.statusManager.setStatus('Failed to load TileJSON. Check the URL and CORS settings. / 加载 TileJSON 失败。请检查 URL 和 CORS 设置。', 'error');
      
      const msg = error?.message || 'TileJSON load failed';
      logActivity('tilejson_load_error', { url, error: msg });
      logToBackend({ level: 'error', action: 'tilejson_load_error', url, message: msg });
      
      onComplete?.();
    }
  }

  _attachEvents(layer, url, token, options) {
    layer.once('sourceready', () => {
      if (!this.isTokenValid(token)) return;
      this.finishLoading(token);

      const extent = layer.getExtent();
      if (extent && options.recenter) {
        this.mapManager.fitExtent(extent);
        logActivity('tilejson_rendered', { url, extent });
      }

      this.statusManager.setStatus('Loaded: / 已加载: ' + url);
    });

    layer.once('error', (event) => {
      if (!this.isTokenValid(token)) return;
      this.finishLoading(token);

      console.error('Failed to load TileJSON layer', event);
      this.statusManager.setStatus('Failed to load TileJSON data. Check the URL and CORS settings. / 加载 TileJSON 数据失败。请检查 URL 和 CORS 设置。', 'error');
      
      const errMsg = event?.message || 'Layer load failed';
      logActivity('tilejson_layer_error', { url, error: errMsg });
      logToBackend({ level: 'error', action: 'tilejson_layer_error', url, message: errMsg });
    });
  }

  _setViewFromTileJson(tileJson, extent3857) {
    const view = this.mapManager.getView();

    if (tileJson.center?.length >= 2) {
      const [lon, lat, zoom] = tileJson.center;
      try {
        view.setCenter(fromLonLat([lon, lat]));
        if (typeof zoom === 'number') {
          view.setZoom(zoom);
        }
      } catch (error) {
        console.warn('[TileJsonLoader] Failed to set center from tileJson:', error.message, { lon, lat, zoom });
      }
    } else if (extent3857) {
      try {
        this.mapManager.fitExtent(extent3857);
      } catch (error) {
        console.warn('[TileJsonLoader] Failed to fit extent:', error.message, extent3857);
      }
    }

    if (typeof tileJson.minzoom === 'number') {
      try {
        view.setMinZoom(tileJson.minzoom);
      } catch (error) {
        console.warn('[TileJsonLoader] Failed to set minZoom:', error.message, tileJson.minzoom);
      }
    }
    if (typeof tileJson.maxzoom === 'number') {
      try {
        view.setMaxZoom(tileJson.maxzoom);
      } catch (error) {
        console.warn('[TileJsonLoader] Failed to set maxZoom:', error.message, tileJson.maxzoom);
      }
    }
  }
}
