/**
 * 地图管理模块 / Map Management Module
 * 封装 OpenLayers 地图的创建和操作 / Encapsulates OpenLayers map creation and operations
 */

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import ScaleLine from 'ol/control/ScaleLine.js';

/**
 * 地图管理器类 / Map Manager Class
 */
export class MapManager {
  constructor(targetElement) {
    this.targetElement = targetElement;
    this.map = null;
    this.baseLayer = null;
    this.currentLayer = null;
    this._readyResolve = null;
    this._readyPromise = new Promise(resolve => {
      this._readyResolve = resolve;
    });
    this._resizeHandler = null;
    this._resizeTimer = null;
    
    this._init();
  }

  _init() {
    this.baseLayer = new TileLayer({
      source: new OSM(),
      preload: 4,
    });

    // 创建比例尺控件 - 简洁线条风格
    // Create scale line control - clean line style
    this.scaleLineControl = new ScaleLine({
      units: 'metric',
      bar: false,
      minWidth: 80,
      maxWidth: 140,
      className: 'ol-scale-line custom-scale-line',
    });

    this.map = new Map({
      target: this.targetElement,
      layers: [this.baseLayer],
      view: new View({
        center: [0, 0],
        zoom: 2,
        maxZoom: 20,
        minZoom: 1,
      }),
      controls: [this.scaleLineControl],
    });

    // 窗口大小变化时更新地图（防抖）
    // Update map on window resize (debounced)
    this._resizeHandler = () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.updateSize(), 100);
    };
    window.addEventListener('resize', this._resizeHandler);

    // 地图渲染完成后标记就绪 / Mark ready after map render complete
    this.map.once('rendercomplete', () => {
      this.updateSize();
      console.log('Map initialized with size:', 
        this.targetElement.offsetWidth, 'x', this.targetElement.offsetHeight);
      this._readyResolve();
    });
  }

  /**
   * 返回地图就绪的 Promise / Return map ready Promise
   */
  ready() {
    return this._readyPromise;
  }

  /**
   * 更新地图尺寸 / Update map size
   */
  updateSize() {
    this.map?.updateSize();
  }

  /**
   * 获取地图视图 / Get map view
   */
  getView() {
    return this.map.getView();
  }

  /**
   * 添加图层 / Add layer
   */
  addLayer(layer) {
    this.map.addLayer(layer);
    this.currentLayer = layer;
  }

  /**
   * 移除当前数据图层 / Remove current data layer
   */
  removeCurrentLayer() {
    if (this.currentLayer) {
      this.map.removeLayer(this.currentLayer);
      
      if (typeof this.currentLayer.dispose === 'function') {
        this.currentLayer.dispose();
      }
      
      this.currentLayer = null;
    }
  }

  /**
   * 获取当前图层 / Get current layer
   */
  getCurrentLayer() {
    return this.currentLayer;
  }

  /**
   * 适配视图到指定范围 / Fit view to specified extent
   */
  fitExtent(extent, options = {}) {
    const defaultOptions = { padding: [50, 50, 50, 50], duration: 500 };
    this.getView().fit(extent, { ...defaultOptions, ...options });
  }

  /**
   * 销毁地图管理器，清理所有资源 / Dispose map manager and cleanup all resources
   */
  dispose() {
    // 移除 resize 事件监听器 / Remove resize event listener
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    
    // 清除防抖定时器 / Clear debounce timer
    if (this._resizeTimer) {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    }
    
    // 移除当前数据图层 / Remove current data layer
    this.removeCurrentLayer();
    
    // 销毁 OpenLayers Map 实例 / Dispose OpenLayers Map instance
    if (this.map) {
      this.map.setTarget(null);
      this.map = null;
    }
    
    this.baseLayer = null;
  }
}
