/**
 * 项目类型定义 / Project Type Definitions
 * @file 使用 JSDoc 定义项目中使用的类型 / Define types used in the project using JSDoc
 */

/**
 * URL 验证结果 / URL Validation Result
 * @typedef {Object} UrlValidationResult
 * @property {boolean} valid - 是否有效 / Whether valid
 * @property {string} [error] - 错误信息（验证失败时） / Error message (when validation fails)
 * @property {string} [normalizedUrl] - 标准化后的 URL（验证成功时） / Normalized URL (when validation succeeds)
 */

/**
 * 高级 TileJSON 参数 / Advanced TileJSON Parameters
 * @typedef {Object} AdvancedTileJsonParams
 * @property {string} [assets] - 资产列表 / Asset list
 * @property {string} [colorFormula] - 颜色公式 / Color formula
 * @property {string} [tileFormat] - 瓦片格式 / Tile format
 * @property {string} [extraParams] - 额外参数 / Extra parameters
 */

/**
 * 数据加载选项 / Data Load Options
 * @typedef {Object} LoadOptions
 * @property {boolean} [recenter=true] - 是否重新定位视图 / Whether to recenter the view
 */

/**
 * 状态类型 / Status Type
 * @typedef {'info' | 'error'} StatusType
 */

/**
 * 状态管理器接口 / Status Manager Interface
 * @typedef {Object} StatusManager
 * @property {(message?: string, progress?: string) => void} showLoading - 显示加载状态 / Show loading status
 * @property {() => void} hideLoading - 隐藏加载状态 / Hide loading status
 * @property {(progress: string) => void} updateProgress - 更新进度 / Update progress
 * @property {(message: string, type?: StatusType, details?: any) => void} setStatus - 设置状态 / Set status
 */

/**
 * 日志配置 / Logger Configuration
 * @typedef {Object} LoggerConfig
 * @property {string | null} backendEndpoint - 后端日志端点 / Backend log endpoint
 * @property {boolean} verbose - 是否输出详细日志 / Whether to output verbose logs
 */

/**
 * 后端日志条目 / Backend Log Entry
 * @typedef {Object} LogEntry
 * @property {string} [level] - 日志级别 / Log level
 * @property {string} [action] - 操作类型 / Action type
 * @property {string} [url] - 相关 URL / Related URL
 * @property {string} [message] - 消息 / Message
 * @property {any} [data] - 附加数据 / Additional data
 */

/**
 * 超时令牌 / Timeout Token
 * @typedef {Object} TimeoutToken
 * @property {number | null} timeoutId - 超时 ID / Timeout ID
 * @property {boolean} timedOut - 是否已超时 / Whether timed out
 * @property {any} [rawData] - 原始数据（可选） / Raw data (optional)
 * @property {(() => void)} [onComplete] - 完成回调（可选） / Complete callback (optional)
 */

/**
 * DOM 元素集合 / DOM Elements Collection
 * @typedef {Object} AppElements
 * @property {HTMLElement | null} map - 地图容器 / Map container
 * @property {HTMLInputElement | null} urlInput - URL 输入框 / URL input
 * @property {HTMLButtonElement | null} applyButton - 应用按钮 / Apply button
 * @property {HTMLElement | null} status - 状态标签 / Status label
 * @property {HTMLInputElement | null} advAssets - 高级参数：资产 / Advanced param: assets
 * @property {HTMLInputElement | null} advColorFormula - 高级参数：颜色公式 / Advanced param: color formula
 * @property {HTMLSelectElement | null} advTileFormat - 高级参数：瓦片格式 / Advanced param: tile format
 * @property {HTMLInputElement | null} advExtraParams - 高级参数：额外参数 / Advanced param: extra params
 * @property {HTMLButtonElement | null} advRefresh - 刷新按钮 / Refresh button
 */

export {};
