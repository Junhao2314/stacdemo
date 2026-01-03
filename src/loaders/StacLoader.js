/**
 * STAC 数据加载器 / STAC Data Loader
 */

import STAC from 'ol-stac';
import { LoaderBase } from './LoaderBase.js';
import { logActivity, logToBackend } from '../utils/logger.js';

export class StacLoader extends LoaderBase {
  /**
   * 加载 STAC 数据 / Load STAC data
   * @param {string} url - STAC Item URL
   * @param {Function} onComplete - 完成回调 / Complete callback
   */
  async load(url, onComplete) {
    if (!url) {
      this.statusManager.setStatus('Please enter a STAC item URL. / 请输入 STAC item URL。', 'error');
      onComplete?.();
      return;
    }

    logActivity('stac_load_attempt', { url });
    this.statusManager.showLoading('Loading STAC item... / 正在加载 STAC item...', 'Fetching data... / 获取数据中...');
    this.statusManager.setStatus('Loading STAC item... / 正在加载 STAC item...');
    this.mapManager.removeCurrentLayer();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json, application/geo+json' },
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.statusManager.updateProgress('Parsing response... / 解析响应中...');
      const data = await response.json();
      console.log('STAC Response Data:', data);

      // 检查空 FeatureCollection / Check empty FeatureCollection
      if (data.type === 'FeatureCollection' && data.features?.length === 0) {
        this.statusManager.setStatus(
          "No features found in the response. Click 'View details' to see raw data. / 响应中未找到要素。点击「查看详情」查看原始数据。",
          'error',
          data
        );
        logActivity('stac_empty_features', { url, data });
        onComplete?.();
        return;
      }

      this.statusManager.updateProgress('Creating STAC layer... / 创建 STAC 图层中...');
      // 创建 STAC 图层 / Create STAC layer
      this._createStacLayer(url, data, onComplete);

    } catch (error) {
      console.error('Fetch error:', error);
      this.statusManager.setStatus(`Failed to fetch STAC data: ${error.message} / 获取 STAC 数据失败: ${error.message}`, 'error');
      logActivity('stac_fetch_error', { url, error: error.message });
      logToBackend({ level: 'error', action: 'stac_fetch_error', url, message: error.message });
      onComplete?.();
    }
  }

  _createStacLayer(url, data, onComplete) {
    try {
      // 直接传入已获取的数据，避免 ol-stac 内部重复 fetch
      // Pass fetched data directly to avoid duplicate fetch inside ol-stac
      const layer = new STAC({ data });
      
      const token = this.createTimeoutToken(url, 'stac', onComplete);
      token.rawData = data;
      token.onComplete = onComplete;

      this._attachEvents(layer, url, token);
      this.mapManager.addLayer(layer);
      
      logActivity('stac_load_success', { url, data });

    } catch (error) {
      console.error(error);
      this.statusManager.setStatus(
        "Error creating STAC layer. Click 'View details' to see the response data. / 创建 STAC 图层出错。点击「查看详情」查看响应数据。",
        'error',
        data
      );
      
      const msg = error?.message || 'Unexpected STAC layer creation error';
      logActivity('stac_load_error', { url, error: msg, data });
      logToBackend({ level: 'error', action: 'stac_load_error', url, message: msg, data });
      
      onComplete?.();
    }
  }

  _attachEvents(layer, url, token) {
    const complete = () => token.onComplete?.();

    layer.once('sourceready', () => {
      if (!this.isTokenValid(token)) return;
      this.finishLoading(token);

      const extent = layer.getExtent();
      if (extent) {
        this.mapManager.fitExtent(extent);
        logActivity('stac_rendered', { url, extent });
      }

      this.statusManager.setStatus('Loaded: / 已加载: ' + url);
      complete();
    });

    layer.once('error', (event) => {
      if (!this.isTokenValid(token)) return;
      this.finishLoading(token);

      console.error('Failed to load STAC', event);
      this.statusManager.setStatus('Failed to load STAC data. Check the URL and CORS settings. / 加载 STAC 数据失败。请检查 URL 和 CORS 设置。', 'error');
      
      const errMsg = event?.message || 'Layer load failed';
      logActivity('stac_layer_error', { url, error: errMsg });
      logToBackend({ level: 'error', action: 'stac_layer_error', url, message: errMsg });
      complete();
    });
  }
}
