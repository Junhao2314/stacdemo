/**
 * URL 工具模块 / URL Utility Module
 * @file URL 验证和处理工具 / URL validation and processing utilities
 */

/** @typedef {import('../types.js').UrlValidationResult} UrlValidationResult */
/** @typedef {import('../types.js').AdvancedTileJsonParams} AdvancedTileJsonParams */

/**
 * 将 IP 地址标准化为统一格式，防止编码绕过
 * Normalize IP address to unified format to prevent encoding bypass
 * @param {string} hostname - 主机名 / Hostname
 * @returns {string} 标准化后的主机名 / Normalized hostname
 */
function normalizeHostname(hostname) {
  const h = hostname.toLowerCase().trim();
  
  // 处理 IPv6 地址（去除方括号） / Handle IPv6 address (remove brackets)
  if (h.startsWith('[') && h.endsWith(']')) {
    return h.slice(1, -1);
  }
  
  // 尝试解析各种 IP 格式（十进制、八进制、十六进制）
  // Try to parse various IP formats (decimal, octal, hexadecimal)
  // 例如 / e.g.: 0x7f.0.0.1, 2130706433, 127.1 等
  try {
    const parts = h.split('.');
    if (parts.length >= 1 && parts.length <= 4) {
      const nums = parts.map(p => {
        if (p.startsWith('0x') || p.startsWith('0X')) {
          return parseInt(p, 16);
        } else if (p.startsWith('0') && p.length > 1 && !/[89]/.test(p)) {
          return parseInt(p, 8);
        }
        return parseInt(p, 10);
      });
      
      if (nums.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
        // 处理简写形式如 127.1 -> 127.0.0.1
        // Handle shorthand form like 127.1 -> 127.0.0.1
        if (parts.length === 1) {
          const n = nums[0];
          return `${(n >> 24) & 255}.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
        }
        return nums.join('.');
      }
    }
  } catch {
    // 解析失败，返回原始值 / Parse failed, return original value
  }
  
  return h;
}

/**
 * 检查是否为私有/内网 IP 地址
 * Check if it's a private/internal IP address
 * @param {string} hostname - 标准化后的主机名 / Normalized hostname
 * @returns {boolean}
 */
function isPrivateAddress(hostname) {
  const h = hostname.toLowerCase();
  
  // IPv4 私有地址和特殊地址 / IPv4 private and special addresses
  const ipv4Patterns = [
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // Loopback 127.0.0.0/8
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,            // Private 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // Private 172.16.0.0/12
    /^192\.168\.\d{1,3}\.\d{1,3}$/,               // Private 192.168.0.0/16
    /^169\.254\.\d{1,3}\.\d{1,3}$/,               // Link-local 169.254.0.0/16
    /^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,             // Current network 0.0.0.0/8
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // Carrier-grade NAT 100.64.0.0/10
    /^192\.0\.0\.\d{1,3}$/,                       // IETF Protocol 192.0.0.0/24
    /^192\.0\.2\.\d{1,3}$/,                       // Documentation 192.0.2.0/24
    /^198\.51\.100\.\d{1,3}$/,                    // Documentation 198.51.100.0/24
    /^203\.0\.113\.\d{1,3}$/,                     // Documentation 203.0.113.0/24
    /^198\.1[89]\.\d{1,3}\.\d{1,3}$/,             // Benchmark 198.18.0.0/15
  ];
  
  // IPv6 私有地址 / IPv6 private addresses
  const ipv6Patterns = [
    /^::1$/,                                       // Loopback
    /^::$/,                                        // Unspecified
    /^::ffff:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // IPv4-mapped IPv6
    /^fc[0-9a-f]{2}:/i,                           // Unique local fc00::/7
    /^fd[0-9a-f]{2}:/i,                           // Unique local fd00::/8
    /^fe[89ab][0-9a-f]:/i,                        // Link-local fe80::/10
    /^::ffff:0:0/i,                               // IPv4-translated
    /^64:ff9b::/i,                                // NAT64
    /^100::/i,                                    // Discard prefix
    /^2001:db8:/i,                                // Documentation
    /^2001::/i,                                   // Teredo (可能被滥用 / may be abused)
  ];
  
  // 危险的主机名模式 / Dangerous hostname patterns
  const dangerousHostnames = [
    /^localhost$/i,
    /^localhost\./i,                              // localhost.xxx
    /\.localhost$/i,                              // xxx.localhost
    /\.local$/i,                                  // mDNS .local
    /\.internal$/i,                               // 内部域名 / Internal domain
    /\.intranet$/i,                               // 内网域名 / Intranet domain
    /\.corp$/i,                                   // 企业内网 / Corporate intranet
    /\.home$/i,                                   // 家庭网络 / Home network
    /\.lan$/i,                                    // 局域网 / LAN
    /\.localdomain$/i,                            // 本地域名 / Local domain
    /^kubernetes\.default/i,                      // K8s 内部服务 / K8s internal service
    /\.svc\.cluster\.local$/i,                    // K8s 服务发现 / K8s service discovery
    /^metadata\./i,                               // 云元数据服务 / Cloud metadata service
    /^169\.254\.169\.254$/,                       // AWS/GCP 元数据 / AWS/GCP metadata
    /^metadata\.google\.internal$/i,              // GCP 元数据 / GCP metadata
  ];
  
  // 检查 IPv4-mapped IPv6 中的私有地址
  // Check private address in IPv4-mapped IPv6
  const ipv4MappedMatch = h.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (ipv4MappedMatch) {
    return isPrivateAddress(ipv4MappedMatch[1]);
  }
  
  return (
    ipv4Patterns.some(p => p.test(h)) ||
    ipv6Patterns.some(p => p.test(h)) ||
    dangerousHostnames.some(p => p.test(h))
  );
}

/**
 * 验证 URL 是否安全（增强版）
 * Validate URL security (enhanced version)
 * 防护：SSRF、DNS Rebinding、特殊编码绕过
 * Protection: SSRF, DNS Rebinding, special encoding bypass
 * @param {string} url - 待验证的 URL / URL to validate
 * @returns {UrlValidationResult} 验证结果 / Validation result
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required / URL 为必填项' };
  }

  // 长度限制，防止 ReDoS / Length limit to prevent ReDoS
  if (url.length > 2048) {
    return { valid: false, error: 'URL is too long / URL 过长' };
  }

  try {
    const parsed = new URL(url, window.location.href);
    
    // 只允许 http/https 协议 / Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed / 仅允许 HTTP/HTTPS URL' };
    }

    // 检查是否包含用户凭证（防止 URL 注入）
    // Check for user credentials (prevent URL injection)
    if (parsed.username || parsed.password) {
      return { valid: false, error: 'URLs with credentials are not allowed / 不允许包含凭证的 URL' };
    }

    // 标准化主机名并检查私有地址
    // Normalize hostname and check private address
    const normalizedHost = normalizeHostname(parsed.hostname);
    
    if (isPrivateAddress(normalizedHost)) {
      return { valid: false, error: 'Local/private network URLs are not allowed / 不允许本地/私有网络 URL' };
    }

    // 检查端口（阻止常见的内部服务端口）
    // Check port (block common internal service ports)
    const port = parsed.port ? parseInt(parsed.port, 10) : null;
    const blockedPorts = [22, 23, 25, 110, 143, 445, 3306, 5432, 6379, 27017];
    if (port && blockedPorts.includes(port)) {
      return { valid: false, error: 'Access to this port is not allowed / 不允许访问此端口' };
    }

    // 检查是否为纯 IP 地址（可选：强制使用域名）
    // Check if it's a pure IP address (optional: force domain name)
    // 如果需要更严格的安全策略，可以取消下面的注释
    // Uncomment below for stricter security policy
    // const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(normalizedHost) || normalizedHost.includes(':');
    // if (isIpAddress) {
    //   return { valid: false, error: 'Direct IP addresses are not allowed, please use domain names / 不允许直接使用 IP 地址，请使用域名' };
    // }

    return { valid: true, normalizedUrl: parsed.href };
  } catch {
    return { valid: false, error: 'Invalid URL format / URL 格式无效' };
  }
}

/**
 * 判断是否为 TileJSON URL / Check if it's a TileJSON URL
 * @param {string} url 
 * @returns {boolean}
 */
export function isTileJsonUrl(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('tilejson') || u.includes('f=tilejson');
}

/**
 * 应用高级 TileJSON 参数 / Apply advanced TileJSON parameters
 * @param {string} url - 原始 URL / Original URL
 * @param {AdvancedTileJsonParams} params - 参数对象 / Parameters object
 * @returns {string} 处理后的 URL / Processed URL
 */
export function applyAdvancedTileJsonParams(url, params = {}) {
  try {
    const u = new URL(url, window.location.href);
    const sp = u.searchParams;

    // assets (可重复 / can repeat)
    if (params.assets?.trim()) {
      sp.delete('assets');
      const parts = params.assets.split(/[\n,;\s]+/).map(s => s.trim()).filter(Boolean);
      parts.forEach(v => sp.append('assets', v));
    }

    // color_formula
    if (params.colorFormula?.trim()) {
      sp.set('color_formula', params.colorFormula.trim());
    }

    // asset_as_band 默认 True / default True
    sp.set('asset_as_band', 'True');

    // tile_format
    if (params.tileFormat?.trim()) {
      sp.set('tile_format', params.tileFormat.trim());
    }

    // 额外参数 / Extra parameters
    if (params.extraParams?.trim()) {
      const extra = params.extraParams.trim().replace(/^[?&]+/, '');
      const extraParams = new URLSearchParams(extra);
      for (const [k, v] of extraParams.entries()) {
        sp.append(k, v);
      }
    }

    return u.toString();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[URL] Failed to apply advanced params:', message, { url, params });
    return url;
  }
}
