/**
 * 日志记录模块 / Logger Module
 * 负责活动日志和后端日志上报 / Handles activity logging and backend log reporting
 */

/**
 * 日志配置 / Logger configuration
 */
const logConfig = {
  // 后端日志端点，设为 null 禁用后端上报
  // Backend log endpoint, set to null to disable backend reporting
  backendEndpoint: null, // 例如 / e.g.: '/api/log'
  // 是否在开发环境输出详细日志
  // Whether to output verbose logs in development environment
  verbose: import.meta.env?.DEV ?? false,
};

/**
 * 配置日志模块 / Configure logger module
 * @param {Object} options - 配置选项 / Configuration options
 * @param {string|null} options.backendEndpoint - 后端日志端点 / Backend log endpoint
 * @param {boolean} options.verbose - 是否输出详细日志 / Whether to output verbose logs
 */
export function configureLogger(options = {}) {
  Object.assign(logConfig, options);
}

/**
 * 记录用户活动 / Log user activity
 * @param {string} action - 操作类型 / Action type
 * @param {Object} data - 相关数据 / Related data
 */
export function logActivity(action, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    data,
    userAgent: navigator.userAgent,
    referrer: document.referrer || 'direct'
  };
  
  console.log('[Activity Log]', logEntry);
}

/**
 * 发送日志到后端（使用 sendBeacon 或 fetch）
 * Send log to backend (using sendBeacon or fetch)
 * @param {Object} entry - 日志条目 / Log entry
 */
export function logToBackend(entry) {
  // 如果未配置后端端点，跳过上报
  // Skip reporting if backend endpoint is not configured
  if (!logConfig.backendEndpoint) {
    if (logConfig.verbose) {
      console.debug('[Logger] Backend logging disabled, skipping:', entry);
    }
    return;
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      ...entry,
    };
    const url = logConfig.backendEndpoint;
    const body = JSON.stringify(payload);
    
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const success = navigator.sendBeacon(url, blob);
      if (!success && logConfig.verbose) {
        console.warn('[Logger] sendBeacon failed for:', entry.action);
      }
    } else if (typeof fetch === 'function') {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch((error) => {
        if (logConfig.verbose) {
          console.warn('[Logger] Failed to send log:', error.message, entry);
        }
      });
    }
  } catch (error) {
    if (logConfig.verbose) {
      console.warn('[Logger] Error preparing log entry:', error.message, entry);
    }
  }
}
