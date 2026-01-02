/**
 * 数据加载器基类 / Data Loader Base Class
 * @file 提供超时控制和通用加载逻辑 / Provides timeout control and common loading logic
 */

/** @typedef {import('../types.js').TimeoutToken} TimeoutToken */
/** @typedef {import('../types.js').StatusManager} StatusManager */

import { logActivity, logToBackend } from '../utils/logger.js';

/** @type {number} */
const DEFAULT_TIMEOUT = 10000;

/**
 * 加载器基类 / Loader Base Class
 */
export class LoaderBase {
  /** @type {MapManager} */
  mapManager;
  /** @type {StatusManager} */
  statusManager;
  /** @type {TimeoutToken | null} */
  currentToken;

  /**
   * @param {MapManager} mapManager - 地图管理器 / Map manager
   * @param {StatusManager} statusManager - 状态管理器 / Status manager
   */
  constructor(mapManager, statusManager) {
    this.mapManager = mapManager;
    this.statusManager = statusManager;
    this.currentToken = null;
  }

  /**
   * 创建超时令牌 / Create timeout token
   * @param {string} url - 加载的 URL / URL to load
   * @param {string} actionName - 操作名称（用于日志） / Action name (for logging)
   * @param {(() => void) | undefined} onTimeout - 超时回调 / Timeout callback
   * @returns {TimeoutToken} 令牌对象 / Token object
   */
  createTimeoutToken(url, actionName, onTimeout) {
    // 清除之前的超时 / Clear previous timeout
    this.clearCurrentToken();

    const token = { timeoutId: null, timedOut: false };
    this.currentToken = token;

    token.timeoutId = setTimeout(() => {
      token.timedOut = true;
      this.mapManager.removeCurrentLayer();
      this.statusManager.setStatus('Operation timed out. / 操作超时。', 'error');
      
      logActivity(`${actionName}_timeout`, { url });
      logToBackend({ 
        level: 'error', 
        action: `${actionName}_timeout`, 
        url, 
        message: 'Apply action timed out' 
      });

      onTimeout?.();
    }, DEFAULT_TIMEOUT);

    return token;
  }

  /**
   * 清除当前令牌的超时 / Clear current token timeout
   */
  clearCurrentToken() {
    if (this.currentToken?.timeoutId) {
      clearTimeout(this.currentToken.timeoutId);
      this.currentToken.timeoutId = null;
    }
    this.currentToken = null;
  }

  /**
   * 检查令牌是否有效 / Check if token is valid
   * @param {TimeoutToken | null} token - 令牌 / Token
   * @returns {boolean} 是否有效 / Whether valid
   */
  isTokenValid(token) {
    return token && !token.timedOut && this.currentToken === token;
  }

  /**
   * 完成加载（清除超时） / Finish loading (clear timeout)
   * @param {TimeoutToken | null} token - 令牌 / Token
   */
  finishLoading(token) {
    if (token?.timeoutId) {
      clearTimeout(token.timeoutId);
      token.timeoutId = null;
    }
    if (this.currentToken === token) {
      this.currentToken = null;
    }
  }
}
