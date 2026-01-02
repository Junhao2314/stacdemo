/**
 * 应用主控制器 / Main Application Controller
 * 协调各模块，处理用户交互 / Coordinates modules and handles user interactions
 */

import { MapManager } from './map/MapManager.js';
import { createStatusManager } from './ui/status.js';
import { TileJsonLoader } from './loaders/TileJsonLoader.js';
import { StacLoader } from './loaders/StacLoader.js';
import { isTileJsonUrl, applyAdvancedTileJsonParams, validateUrl } from './utils/url.js';
import { logActivity } from './utils/logger.js';

// 默认 TileJSON URL / Default TileJSON URL
const DEFAULT_URL = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tilejson.json?collection=landsat-c2-l2&item=LC09_L2SP_123043_20250926_02_T1&assets=red&assets=green&assets=blue&color_formula=gamma+RGB+2.7%2C+saturation+1.5%2C+sigmoidal+RGB+15+0.55&format=png';

/**
 * 应用类 / Application Class
 */
export class App {
  constructor() {
    this.elements = null;
    this.mapManager = null;
    this.statusManager = null;
    this.tileJsonLoader = null;
    this.stacLoader = null;
    this._eventHandlers = {};
  }

  /**
   * 初始化应用 / Initialize the application
   */
  init() {
    this.elements = this._getElements();
    
    if (!this.elements.map) {
      console.error('Map element not found!');
      return;
    }

    // 初始化各模块 / Initialize modules
    this.mapManager = new MapManager(this.elements.map);
    this.statusManager = createStatusManager(this.elements.status);
    this.tileJsonLoader = new TileJsonLoader(this.mapManager, this.statusManager);
    this.stacLoader = new StacLoader(this.mapManager, this.statusManager);

    // 绑定事件 / Bind events
    this._setupEventListeners();

    // 加载初始数据 / Load initial data
    this._loadInitialData();
  }

  /**
   * 获取 DOM 元素 / Get DOM elements
   */
  _getElements() {
    return {
      map: document.getElementById('map'),
      urlInput: document.getElementById('stacUrl'),
      applyButton: document.getElementById('apply'),
      status: document.getElementById('status'),
      advAssets: document.getElementById('adv-assets'),
      advColorFormula: document.getElementById('adv-color-formula'),
      advTileFormat: document.getElementById('adv-tile-format'),
      advExtraParams: document.getElementById('adv-extra-params'),
      advRefresh: document.getElementById('adv-refresh'),
    };
  }

  /**
   * 设置事件监听 / Setup event listeners
   */
  _setupEventListeners() {
    const { urlInput, applyButton, advRefresh } = this.elements;

    this._eventHandlers.applyClick = () => {
      this.loadData(urlInput.value.trim());
    };
    applyButton.addEventListener('click', this._eventHandlers.applyClick);

    this._eventHandlers.urlKeyup = (event) => {
      if (event.key === 'Enter') {
        this.loadData(urlInput.value.trim());
      }
    };
    urlInput.addEventListener('keyup', this._eventHandlers.urlKeyup);

    if (advRefresh) {
      this._eventHandlers.advRefreshClick = () => {
        this.loadData(urlInput.value.trim(), { recenter: false });
      };
      advRefresh.addEventListener('click', this._eventHandlers.advRefreshClick);
    }
  }

  /**
   * 加载数据（自动判断类型） / Load data (auto-detect type)
   */
  loadData(url, options = { recenter: true }) {
    this.elements.applyButton.disabled = true;
    
    const onComplete = () => {
      this.elements.applyButton.disabled = false;
    };

    // URL 安全验证 / URL security validation
    const validation = validateUrl(url);
    if (!validation.valid) {
      this.statusManager.setStatus(validation.error, 'error');
      onComplete();
      return;
    }

    if (isTileJsonUrl(url)) {
      const finalUrl = applyAdvancedTileJsonParams(url, this._getAdvancedParams());
      this.tileJsonLoader.load(finalUrl, options, onComplete);
    } else {
      this.stacLoader.load(url, onComplete);
    }
  }

  /**
   * 获取高级参数 / Get advanced parameters
   */
  _getAdvancedParams() {
    return {
      assets: this.elements.advAssets?.value || '',
      colorFormula: this.elements.advColorFormula?.value || '',
      tileFormat: this.elements.advTileFormat?.value || '',
      extraParams: this.elements.advExtraParams?.value || '',
    };
  }

  /**
   * 加载初始数据 / Load initial data
   */
  async _loadInitialData() {
    this.elements.urlInput.value = DEFAULT_URL;
    logActivity('page_loaded', { defaultUrl: DEFAULT_URL });

    // 等待地图就绪后加载 / Wait for map ready then load
    await this.mapManager.ready();
    this.loadData(DEFAULT_URL);
  }

  /**
   * 销毁应用，清理所有资源 / Dispose application and cleanup all resources
   */
  dispose() {
    const { urlInput, applyButton, advRefresh } = this.elements;

    // 移除事件监听器 / Remove event listeners
    if (this._eventHandlers.applyClick) {
      applyButton.removeEventListener('click', this._eventHandlers.applyClick);
    }
    if (this._eventHandlers.urlKeyup) {
      urlInput.removeEventListener('keyup', this._eventHandlers.urlKeyup);
    }
    if (this._eventHandlers.advRefreshClick && advRefresh) {
      advRefresh.removeEventListener('click', this._eventHandlers.advRefreshClick);
    }
    this._eventHandlers = {};

    // 销毁地图管理器 / Dispose map manager
    if (this.mapManager) {
      this.mapManager.dispose();
      this.mapManager = null;
    }

    // 清理 loader 的超时令牌 / Clear loader timeout tokens
    if (this.tileJsonLoader) {
      this.tileJsonLoader.clearCurrentToken();
      this.tileJsonLoader = null;
    }
    if (this.stacLoader) {
      this.stacLoader.clearCurrentToken();
      this.stacLoader = null;
    }

    this.statusManager = null;
    this.elements = null;
  }
}
