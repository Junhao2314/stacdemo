/**
 * 状态栏 UI 模块 / Status Bar UI Module
 * @file 状态栏 UI 管理 / Status bar UI management
 */

/** @typedef {import('../types.js').StatusManager} StatusManager */
/** @typedef {import('../types.js').StatusType} StatusType */

import { logActivity } from '../utils/logger.js';

/**
 * HTML 转义 / HTML escape
 * @param {unknown} s - 待转义的值 / Value to escape
 * @returns {string} 转义后的字符串 / Escaped string
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 在 & 处添加换行提示 / Add line break hints at &
 * @param {string} raw - 原始字符串 / Raw string
 * @returns {string} 处理后的 HTML 字符串 / Processed HTML string
 */
function htmlWithAmpBreaks(raw) {
  return escapeHtml(raw).replace(/&amp;/g, '&amp;<wbr>');
}

/**
 * 创建状态管理器 / Create status manager
 * @param {HTMLElement | null} statusLabel - 状态标签元素 / Status label element
 * @returns {StatusManager} 状态管理器 / Status manager
 */
export function createStatusManager(statusLabel) {
  const detailsElement = document.getElementById('status-details');
  const detailsContent = document.getElementById('status-details-content');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const loadingProgress = document.getElementById('loading-progress');

  return {
    /**
     * 显示加载状态 / Show loading status
     * @param {string} message - 加载消息 / Loading message
     * @param {string} progress - 进度信息（可选） / Progress info (optional)
     */
    showLoading(message = 'Loading...', progress = '') {
      if (loadingOverlay) {
        loadingOverlay.classList.add('active');
      }
      if (loadingText) {
        loadingText.textContent = message;
      }
      if (loadingProgress) {
        loadingProgress.textContent = progress;
      }
    },

    /**
     * 隐藏加载状态 / Hide loading status
     */
    hideLoading() {
      if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
      }
    },

    /**
     * 更新加载进度 / Update loading progress
     * @param {string} progress - 进度信息 / Progress info
     */
    updateProgress(progress) {
      if (loadingProgress) {
        loadingProgress.textContent = progress;
      }
    },

    /**
     * 设置状态信息 / Set status message
     * @param {string} message - 状态消息 / Status message
     * @param {string} type - 类型 ('info' | 'error') / Type
     * @param {*} details - 详细信息 / Details
     */
    setStatus(message, type = 'info', details = null) {
      // 非加载状态时隐藏 loading overlay
      // Hide loading overlay when not in loading state
      if (!message.toLowerCase().includes('loading')) {
        this.hideLoading();
      }

      if (!statusLabel) return;

      const loadedPrefix = 'Loaded: / 已加载: ';
      
      if (typeof message === 'string' && message.startsWith(loadedPrefix)) {
        const rawUrl = message.slice(loadedPrefix.length);
        statusLabel.innerHTML = escapeHtml(loadedPrefix) + htmlWithAmpBreaks(rawUrl);
      } else {
        statusLabel.textContent = message;
      }
      
      statusLabel.classList.toggle('error', type === 'error');

      // 处理详情显示 / Handle details display
      if (details && detailsElement && detailsContent) {
        detailsElement.style.display = 'block';
        detailsContent.textContent = typeof details === 'string' 
          ? details 
          : JSON.stringify(details, null, 2);
      } else if (detailsElement) {
        detailsElement.style.display = 'none';
      }

      logActivity('status_change', { message, type, hasDetails: !!details });
    }
  };
}
