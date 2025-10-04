// Import OpenLayers CSS
import "ol/ol.css";

// Import OpenLayers modules
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import TileJSON from "ol/source/TileJSON.js";
import {register} from "ol/proj/proj4.js";
import {fromLonLat, transformExtent} from "ol/proj.js";
import OSM from "ol/source/OSM.js";

// Import STAC and proj4
import STAC from "ol-stac";
import proj4 from "proj4";

register(proj4);

// Default now uses a TileJSON from Microsoft Planetary Computer
const defaultStacUrl = "https://planetarycomputer.microsoft.com/api/data/v1/item/tilejson.json?collection=landsat-c2-l2&item=LC09_L2SP_123043_20250926_02_T1&assets=red&assets=green&assets=blue&color_formula=gamma+RGB+2.7%2C+saturation+1.5%2C+sigmoidal+RGB+15+0.55&format=png";

// Wait for DOM to be ready
function initializeApp() {
  const mapElement = document.getElementById("map");
  const urlInput = document.getElementById("stacUrl");
  const applyButton = document.getElementById("apply");
  const statusLabel = document.getElementById("status");

  // Advanced (TileJSON) controls - optional
  const advAssetsInput = document.getElementById("adv-assets");
  const advColorFormulaInput = document.getElementById("adv-color-formula");
  const advTileFormatInput = document.getElementById("adv-tile-format");
  const advExtraParamsInput = document.getElementById("adv-extra-params");
  const advRefreshButton = document.getElementById("adv-refresh");

  if (!mapElement) {
    console.error('Map element not found!');
    return;
  }

  // Create OSM base layer
  const background = new TileLayer({
    source: new OSM(),
    preload: 4,
  });

  // Initialize map
  const map = new Map({
    target: mapElement,
    layers: [background],
    view: new View({
      center: [0, 0],
      zoom: 2,
      maxZoom: 20,
      minZoom: 1,
    }),
  });

  // Force map to update its size when window resizes
  window.addEventListener('resize', () => {
    setTimeout(() => map.updateSize(), 100);
  });

  // Initial map size update after a short delay
  setTimeout(() => {
    map.updateSize();
    console.log('Map initialized with size:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);
  }, 100);

  return { map, mapElement, urlInput, applyButton, statusLabel, background,
    advAssetsInput, advColorFormulaInput,
    advTileFormatInput,
    advExtraParamsInput, advRefreshButton };
}

// Initialize app when DOM is ready
let stacLayer;
let app;
// Track current load attempt for timeout control
let currentLoad = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = initializeApp();
    setupEventListeners();
    loadInitialData();
  });
} else {
  app = initializeApp();
  setupEventListeners();
  loadInitialData();
}

// Backend logging function
function logActivity(action, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    data: data,
    userAgent: navigator.userAgent,
    referrer: document.referrer || 'direct'
  };
  
  // Log to console for development
  console.log('[Activity Log]', logEntry);
  
  // In production, send to backend API:
  // fetch('/api/log', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(logEntry)
  // }).catch(err => console.error('Logging failed:', err));
}

// Best-effort backend logging for failures
function logToBackend(entry) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      ...entry,
    };
    const url = '/api/log';
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else if (typeof fetch === 'function') {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_) { /* ignore */ }
}

function setStatus(message, type = "info", details = null) {
  if (!app || !app.statusLabel) return;
  
  // Prefer line breaks at '&' within long URLs for readability
  const loadedPrefix = 'Loaded: ';
  const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const htmlWithAmpBreaks = (raw) => escapeHtml(raw).replace(/&amp;/g, '&amp;<wbr>');

  if (typeof message === 'string' && message.startsWith(loadedPrefix)) {
    const rawUrl = message.slice(loadedPrefix.length);
    app.statusLabel.innerHTML = escapeHtml(loadedPrefix) + htmlWithAmpBreaks(rawUrl);
  } else {
    app.statusLabel.textContent = message;
  }
  app.statusLabel.classList.toggle("error", type === "error");
  
  // Handle details display
  const detailsElement = document.getElementById('status-details');
  const detailsContent = document.getElementById('status-details-content');
  
  if (details && detailsElement && detailsContent) {
    detailsElement.style.display = 'block';
    detailsContent.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
  } else if (detailsElement) {
    detailsElement.style.display = 'none';
  }
  
  // Log status changes
  logActivity('status_change', { message, type, hasDetails: !!details });
}

function attachLayerEvents(layer, url, token, options = { recenter: true }) {
  if (!app) return;
  
  layer.once("sourceready", () => {
    if (token && (token.timedOut || currentLoad !== token)) {
      return;
    }
    if (token && token.timeoutId) {
      clearTimeout(token.timeoutId);
      token.timeoutId = null;
      currentLoad = null;
    }
    const view = app.map.getView();
    const extent = layer.getExtent();

    if (extent && options.recenter) {
      view.fit(extent, {padding: [50, 50, 50, 50], duration: 500});
      // Log successful rendering
      logActivity('stac_rendered', { url, extent });
    }

    setStatus("Loaded: " + url);
    app.applyButton.disabled = false;
  });

  layer.once("error", (event) => {
    if (token && (token.timedOut || currentLoad !== token)) {
      return;
    }
    if (token && token.timeoutId) {
      clearTimeout(token.timeoutId);
      token.timeoutId = null;
      currentLoad = null;
    }
    console.error("Failed to load STAC", event);
    setStatus("Failed to load STAC data. Check the URL and CORS settings.", "error");
    app.applyButton.disabled = false;
    // Log layer error
    const errMsg = event && event.message ? event.message : 'Layer load failed';
    logActivity('stac_layer_error', { url, error: errMsg });
    logToBackend({ level: 'error', action: 'stac_layer_error', url, message: errMsg });
  });
}

function disposeCurrentLayer() {
  if (stacLayer && app) {
    app.map.removeLayer(stacLayer);

    if (typeof stacLayer.dispose === "function") {
      stacLayer.dispose();
    }

    stacLayer = undefined;
  }
}

function isTileJsonUrl(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('tilejson') || u.includes('f=tilejson');
}

function applyAdvancedTileJsonParams(url) {
  if (!app) return url;
  try {
    const u = new URL(url, window.location.href);
    const sp = u.searchParams;

    // assets (repeatable)
    if (app.advAssetsInput && app.advAssetsInput.value && app.advAssetsInput.value.trim()) {
      sp.delete('assets');
      const parts = app.advAssetsInput.value.split(/[\n,;\s]+/).map(s => s.trim()).filter(Boolean);
      parts.forEach(v => sp.append('assets', v));
    }

    // color_formula
    if (app.advColorFormulaInput && app.advColorFormulaInput.value && app.advColorFormulaInput.value.trim()) {
      sp.set('color_formula', app.advColorFormulaInput.value.trim());
    }



    // asset_as_band default True (hidden)
    sp.set('asset_as_band', 'True');

    // tile_format
    if (app.advTileFormatInput && app.advTileFormatInput.value && app.advTileFormatInput.value.trim()) {
      sp.set('tile_format', app.advTileFormatInput.value.trim());
    }

    // extra params
    if (app.advExtraParamsInput && app.advExtraParamsInput.value && app.advExtraParamsInput.value.trim()) {
      const extra = app.advExtraParamsInput.value.trim().replace(/^[?&]+/, '');
      const extraParams = new URLSearchParams(extra);
      for (const [k, v] of extraParams.entries()) {
        sp.append(k, v);
      }
    }

    return u.toString();
  } catch (_) {
    return url;
  }
}

function loadTileJson(url, options = { recenter: true }) {
  if (!app) {
    console.error('App not initialized');
    return;
  }
  
  if (!url) {
    setStatus("Please enter a TileJSON URL.", "error");
    app.applyButton.disabled = false;
    return;
  }

  // Log TileJSON loading attempt
  logActivity('tilejson_load_attempt', { url });

  // Clear previous timeout if a new load starts
  if (currentLoad && currentLoad.timeoutId) {
    clearTimeout(currentLoad.timeoutId);
    currentLoad = null;
  }
  app.applyButton.disabled = true;
  setStatus("Loading TileJSON...");

  disposeCurrentLayer();

  try {
    // Create a timeout token and enforce 10s limit
    const token = { timeoutId: null, timedOut: false };
    currentLoad = token;
    token.timeoutId = setTimeout(() => {
      token.timedOut = true;
      if (stacLayer) {
        disposeCurrentLayer();
      }
      setStatus("Operation timed out.", "error");
      app.applyButton.disabled = false;
      logActivity('tilejson_timeout', { url });
      logToBackend({ level: 'error', action: 'tilejson_timeout', url, message: 'Apply action timed out' });
    }, 10000);

    // Preload TileJSON to derive extent/center and (optionally) set view
    fetch(url, { credentials: 'omit' })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error("Failed to fetch TileJSON: " + resp.status + " " + resp.statusText);
        }
        return resp.json();
      })
      .then((tj) => {
        let extent3857;
        try {
          if (Array.isArray(tj.bounds) && tj.bounds.length === 4) {
            extent3857 = transformExtent(tj.bounds, 'EPSG:4326', app.map.getView().getProjection());
          }
        } catch (_) {}

        const layerOptions = {
          source: new TileJSON({
            url,
            crossOrigin: 'anonymous',
          }),
        };
        if (extent3857) {
          layerOptions.extent = extent3857;
        }
        const layer = new TileLayer(layerOptions);

        attachLayerEvents(layer, url, token, options);
        app.map.addLayer(layer);
        stacLayer = layer;

        const view = app.map.getView();
        if (options.recenter) {
          if (tj.center && Array.isArray(tj.center) && tj.center.length >= 2) {
            const lon = tj.center[0];
            const lat = tj.center[1];
            const zoom = tj.center[2];
            try {
              view.setCenter(fromLonLat([lon, lat]));
              if (typeof zoom === 'number') {
                view.setZoom(zoom);
              }
            } catch (_) {}
          } else if (extent3857) {
            try {
              view.fit(extent3857, { padding: [50, 50, 50, 50], duration: 500 });
            } catch (_) {}
          }

          if (typeof tj.minzoom === 'number') {
            try { view.setMinZoom(tj.minzoom); } catch (_) {}
          }
          if (typeof tj.maxzoom === 'number') {
            try { view.setMaxZoom(tj.maxzoom); } catch (_) {}
          }
        }

        // Log successful load
        logActivity('tilejson_load_success', { url });
      })
      .catch((error) => {
        if (token && token.timeoutId) {
          clearTimeout(token.timeoutId);
          token.timeoutId = null;
          currentLoad = null;
        }
        console.error(error);
        setStatus("Failed to load TileJSON. Check the URL and CORS settings.", "error");
        app.applyButton.disabled = false;
        const msg = (error && error.message) ? error.message : 'TileJSON load failed';
        logActivity('tilejson_load_error', { url, error: msg });
        logToBackend({ level: 'error', action: 'tilejson_load_error', url, message: msg });
      });

  } catch (error) {
    console.error(error);
    setStatus("Unexpected error creating TileJSON layer.", "error");
    app.applyButton.disabled = false;

    const msg = (error && error.message) ? error.message : 'Unexpected TileJSON layer creation error';
    logActivity('tilejson_unexpected_error', { url, error: msg });
    logToBackend({ level: 'error', action: 'tilejson_unexpected_error', url, message: msg });
  }
}

function loadStac(url) {
  if (!app) {
    console.error('App not initialized');
    return;
  }
  
  if (!url) {
    setStatus("Please enter a STAC item URL.", "error");
    app.applyButton.disabled = false;
    return;
  }

  // Log STAC loading attempt
  logActivity('stac_load_attempt', { url });
  
  // Clear previous timeout if a new load starts
  if (currentLoad && currentLoad.timeoutId) {
    clearTimeout(currentLoad.timeoutId);
    currentLoad = null;
  }
  app.applyButton.disabled = true;
  setStatus("Loading STAC item...");

  disposeCurrentLayer();

  // First fetch the data to check if it's valid
  fetch(url, { 
    method: 'GET',
    headers: {
      'Accept': 'application/json, application/geo+json'
    },
    credentials: 'omit' 
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Log the raw data for debugging
      console.log('STAC Response Data:', data);
      
      // Check if it's a FeatureCollection with empty features
      if (data.type === 'FeatureCollection' && 
          data.features && 
          data.features.length === 0) {
        // Display the raw data in the status with full details
        setStatus(`No features found in the response. Click 'View details' to see raw data.`, "error", data);
        console.log('Full response data:', JSON.stringify(data, null, 2));
        app.applyButton.disabled = false;
        logActivity('stac_empty_features', { url, data });
        return;
      }
      
      // If data looks valid, proceed with creating the layer
      try {
        const layer = new STAC({
          url,
        });

        // Create a timeout token and enforce 10s limit
        const token = { timeoutId: null, timedOut: false, rawData: data };
        currentLoad = token;
        token.timeoutId = setTimeout(() => {
          token.timedOut = true;
          if (stacLayer === layer) {
            disposeCurrentLayer();
          }
          // Show timeout with raw data info
          setStatus(`Operation timed out. Click 'View details' to see the fetched data.`, "error", token.rawData);
          console.log('Timeout - Full response data:', JSON.stringify(token.rawData, null, 2));
          app.applyButton.disabled = false;
          logActivity('stac_timeout', { url, data: token.rawData });
          logToBackend({ level: 'error', action: 'stac_timeout', url, message: 'Apply action timed out', data: token.rawData });
        }, 10000);

        attachLayerEvents(layer, url, token);
        app.map.addLayer(layer);
        stacLayer = layer;
        
        // Log successful load
        logActivity('stac_load_success', { url, data });
      } catch (error) {
        console.error(error);
        setStatus(`Error creating STAC layer. Click 'View details' to see the response data.`, "error", data);
        console.log('Layer creation error - Full response data:', JSON.stringify(data, null, 2));
        app.applyButton.disabled = false;
        
        // Log error
        const msg = (error && error.message) ? error.message : 'Unexpected STAC layer creation error';
        logActivity('stac_load_error', { url, error: msg, data });
        logToBackend({ level: 'error', action: 'stac_load_error', url, message: msg, data });
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      setStatus(`Failed to fetch STAC data: ${error.message}`, "error");
      app.applyButton.disabled = false;
      
      // Log fetch error
      logActivity('stac_fetch_error', { url, error: error.message });
      logToBackend({ level: 'error', action: 'stac_fetch_error', url, message: error.message });
    });
}

function loadData(url, options = {}) {
  const opts = { recenter: true, ...options };
  let finalUrl = url;
  if (isTileJsonUrl(finalUrl)) {
    finalUrl = applyAdvancedTileJsonParams(finalUrl);
    loadTileJson(finalUrl, opts);
  } else {
    loadStac(finalUrl);
  }
}

function setupEventListeners() {
  if (!app) return;
  
  app.applyButton.addEventListener("click", () => {
    const url = app.urlInput.value.trim();
    loadData(url);
  });

  app.urlInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      loadData(app.urlInput.value.trim());
    }
  });

  if (app.advRefreshButton) {
    app.advRefreshButton.addEventListener("click", () => {
      const url = app.urlInput.value.trim();
      loadData(url, { recenter: false });
    });
  }
}

function loadInitialData() {
  if (!app) return;
  
  // Initialize with default URL
  app.urlInput.value = defaultStacUrl;

  // Log initial page load
  logActivity('page_loaded', { defaultUrl: defaultStacUrl });

  // Ensure map is properly sized before loading default STAC
  setTimeout(() => {
    app.map.updateSize();
    // Load default data (supports STAC item or TileJSON) after map is ready
    loadData(defaultStacUrl);
  }, 300);
}
