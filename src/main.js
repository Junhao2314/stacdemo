// Import OpenLayers CSS
import "ol/ol.css";

// Import OpenLayers modules
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import {register} from "ol/proj/proj4.js";
import OSM from "ol/source/OSM.js";

// Import STAC and proj4
import STAC from "ol-stac";
import proj4 from "proj4";

register(proj4);

const defaultStacUrl = "https://s3.us-west-2.amazonaws.com/sentinel-cogs/sentinel-s2-l2a-cogs/10/T/ES/2022/7/S2A_10TES_20220726_0_L2A/S2A_10TES_20220726_0_L2A.json";

// Wait for DOM to be ready
function initializeApp() {
  const mapElement = document.getElementById("map");
  const urlInput = document.getElementById("stacUrl");
  const applyButton = document.getElementById("apply");
  const statusLabel = document.getElementById("status");

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

  return { map, mapElement, urlInput, applyButton, statusLabel, background };
}

// Initialize app when DOM is ready
let stacLayer;
let app;

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

function setStatus(message, type = "info") {
  if (!app || !app.statusLabel) return;
  
  app.statusLabel.textContent = message;
  app.statusLabel.classList.toggle("error", type === "error");
  
  // Log status changes
  logActivity('status_change', { message, type });
}

function attachLayerEvents(layer, url) {
  if (!app) return;
  
  layer.once("sourceready", () => {
    const view = app.map.getView();
    const extent = layer.getExtent();

    if (extent) {
      view.fit(extent, {padding: [50, 50, 50, 50], duration: 500});
      // Log successful rendering
      logActivity('stac_rendered', { url, extent });
    }

    setStatus("Loaded: " + url);
    app.applyButton.disabled = false;
  });

  layer.once("error", (event) => {
    console.error("Failed to load STAC", event);
    setStatus("Failed to load STAC data. Check the URL and CORS settings.", "error");
    app.applyButton.disabled = false;
    // Log layer error
    logActivity('stac_layer_error', { url, error: event.message || 'Layer load failed' });
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

  app.applyButton.disabled = true;
  setStatus("Loading STAC item...");

  disposeCurrentLayer();

  try {
    const layer = new STAC({
      url,
    });

    attachLayerEvents(layer, url);
    app.map.addLayer(layer);
    stacLayer = layer;
    
    // Log successful load
    logActivity('stac_load_success', { url });
  } catch (error) {
    console.error(error);
    setStatus("Unexpected error creating STAC layer.", "error");
    app.applyButton.disabled = false;
    
    // Log error
    logActivity('stac_load_error', { url, error: error.message });
  }
}

function setupEventListeners() {
  if (!app) return;
  
  app.applyButton.addEventListener("click", () => {
    const url = app.urlInput.value.trim();
    loadStac(url);
  });

  app.urlInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      loadStac(app.urlInput.value.trim());
    }
  });
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
    // Load default STAC after map is ready
    loadStac(defaultStacUrl);
  }, 300);
}
