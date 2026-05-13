/**
 * Pet Customization UI (捏宠物)
 * 独立模块 — 管理捏宠物面板的 UI 交互、状态和渲染预览。
 *
 * 依赖（需在本文件之前加载）：
 *   - pet-templates.js (PET_TEMPLATES)
 *   - pet-palette.js (COLOR_PALETTE, PATTERN_TYPES, ACCESSORIES, DEFAULT_CUSTOMIZATION)
 *   - pet-sprite-renderer.js (renderPetSprite, resolveCustomizationParams)
 *   - app.js (API_BASE, apiPut, escapeHtml, escapeAttr, showPetToast, loadPetHouse)
 */

/* eslint-disable */
// @ts-nocheck

// ==================== State ====================

var customizationState = {
  petId: null,
  species: null,
  templateId: null,
  primaryColor: null,
  secondaryColor: null,
  pattern: null,
  accessory: null,
  isOpen: false
};

// ==================== Public API ====================

/**
 * Open the pet customization panel.
 * @param {string|null} petId - Pet ID (null for new pet)
 * @param {string} species - Pet species (cat, dog, rabbit, hamster)
 * @param {Object|null} existingData - Existing customization_data for re-customization
 */
function openCustomizationUI(petId, species, existingData) {
  // Guard: check if template data is available (script load failure)
  if (typeof PET_TEMPLATES === "undefined" || !PET_TEMPLATES) {
    showPetToast("模板数据加载失败，无法打开自定义面板");
    console.warn("[PetCustomization] PET_TEMPLATES not available, cannot open customization UI");
    return;
  }

  // Initialize state from existing data or defaults
  var defaults = DEFAULT_CUSTOMIZATION[species] || DEFAULT_CUSTOMIZATION.cat;
  var data = existingData || defaults;

  customizationState.petId = petId;
  customizationState.species = species;
  customizationState.templateId = data.template_id || defaults.template_id;
  customizationState.primaryColor = data.primary_color || defaults.primary_color;
  customizationState.secondaryColor = data.secondary_color || defaults.secondary_color;
  customizationState.pattern = data.pattern || defaults.pattern;
  customizationState.accessory = data.accessory || null;
  customizationState.isOpen = true;

  // Ensure the overlay element exists (create dynamically on first use)
  var overlay = document.getElementById("pet-customization-overlay");
  if (!overlay) {
    overlay = _createOverlay();
  }

  // Populate all selectors
  _populateTemplates();
  _populateColors("primary");
  _populateColors("secondary");
  _populatePatterns();
  _populateAccessories();

  // Render initial preview
  _updatePreview();

  // Show the overlay
  overlay.classList.add("open");
}

/**
 * Close the customization panel without saving.
 */
function closeCustomizationUI() {
  var overlay = document.getElementById("pet-customization-overlay");
  if (overlay) overlay.classList.remove("open");

  customizationState.isOpen = false;

  // Clean up preview style
  var styleEl = document.getElementById("style-pet-custom-preview-sprite");
  if (styleEl) styleEl.textContent = "";

  // Invoke cancel callback if set (e.g., refresh pet house after new pet creation)
  if (typeof window._onCustomizationCancel === "function") {
    window._onCustomizationCancel();
  }

  // Clear callbacks
  window._onCustomizationConfirm = null;
  window._onCustomizationCancel = null;
}

/**
 * Randomly generate a valid appearance combination for a given species.
 * @param {string} species - One of 'cat', 'dog', 'rabbit', 'hamster'
 * @returns {Object} { template_id, primary_color, secondary_color, pattern, accessory }
 */
function randomizeAppearance(species) {
  var templates = PET_TEMPLATES[species] || PET_TEMPLATES.cat;
  var randomTemplate = templates[Math.floor(Math.random() * templates.length)];

  var colorKeys = Object.keys(COLOR_PALETTE);
  var randomPrimary = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  var randomSecondary = colorKeys[Math.floor(Math.random() * colorKeys.length)];

  var randomPattern = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];

  var accessoryKeys = Object.keys(ACCESSORIES);
  var accessoryOptions = accessoryKeys.concat([null]);
  var randomAccessory = accessoryOptions[Math.floor(Math.random() * accessoryOptions.length)];

  return {
    template_id: randomTemplate.id,
    primary_color: randomPrimary,
    secondary_color: randomSecondary,
    pattern: randomPattern,
    accessory: randomAccessory
  };
}

// ==================== Internal: DOM Creation ====================

function _createOverlay() {
  var overlay = document.createElement("div");
  overlay.id = "pet-customization-overlay";
  overlay.className = "customization-overlay";

  overlay.innerHTML =
    '<div class="customization-panel">' +
      '<div class="customization-header">' +
        '<span class="customization-title">捏宠物</span>' +
        '<button id="pet-custom-close" class="customization-close-btn" title="关闭">×</button>' +
      '</div>' +
      '<div class="customization-preview">' +
        '<div class="customization-preview-sprite">' +
          '<div id="pet-custom-preview" class="pet-sprite"></div>' +
        '</div>' +
      '</div>' +
      '<div class="customization-body">' +
        '<div class="customization-section">' +
          '<span class="customization-section-label">体型</span>' +
          '<div id="pet-custom-templates" class="template-selector"></div>' +
        '</div>' +
        '<div class="customization-section">' +
          '<span class="customization-section-label">主色</span>' +
          '<div id="pet-custom-primary-colors" class="color-palette-grid"></div>' +
        '</div>' +
        '<div class="customization-section">' +
          '<span class="customization-section-label">副色</span>' +
          '<div id="pet-custom-secondary-colors" class="color-palette-grid"></div>' +
        '</div>' +
        '<div class="customization-section">' +
          '<span class="customization-section-label">花纹</span>' +
          '<div id="pet-custom-patterns" class="pattern-selector"></div>' +
        '</div>' +
        '<div class="customization-section">' +
          '<span class="customization-section-label">配饰</span>' +
          '<div id="pet-custom-accessories" class="accessory-selector"></div>' +
        '</div>' +
      '</div>' +
      '<div class="customization-actions">' +
        '<button id="pet-custom-random" class="customization-btn random">🎲 随机生成</button>' +
        '<div class="customization-actions-right">' +
          '<button id="pet-custom-cancel" class="customization-btn cancel">取消</button>' +
          '<button id="pet-custom-confirm" class="customization-btn confirm">确认</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  _bindEvents(overlay);
  return overlay;
}

function _bindEvents(overlay) {
  overlay.querySelector("#pet-custom-close").addEventListener("click", closeCustomizationUI);
  overlay.querySelector("#pet-custom-cancel").addEventListener("click", closeCustomizationUI);
  overlay.querySelector("#pet-custom-confirm").addEventListener("click", _confirmSave);

  overlay.querySelector("#pet-custom-random").addEventListener("click", function () {
    var result = randomizeAppearance(customizationState.species);
    customizationState.templateId = result.template_id;
    customizationState.primaryColor = result.primary_color;
    customizationState.secondaryColor = result.secondary_color;
    customizationState.pattern = result.pattern;
    customizationState.accessory = result.accessory;
    _populateTemplates();
    _populateColors("primary");
    _populateColors("secondary");
    _populatePatterns();
    _populateAccessories();
    _updatePreview();
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeCustomizationUI();
  });
}

// ==================== Internal: Populate Selectors ====================

function _populateTemplates() {
  var container = document.getElementById("pet-custom-templates");
  if (!container) return;

  var templates = PET_TEMPLATES[customizationState.species] || [];
  container.innerHTML = templates.map(function (tmpl) {
    var sel = tmpl.id === customizationState.templateId ? " selected" : "";
    return '<button class="template-option' + sel + '" data-template-id="' +
      tmpl.id + '" title="' + escapeAttr(tmpl.name) + '">' + escapeHtml(tmpl.name) + '</button>';
  }).join("");

  container.querySelectorAll(".template-option").forEach(function (btn) {
    btn.addEventListener("click", function () {
      customizationState.templateId = btn.dataset.templateId;
      container.querySelectorAll(".template-option").forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
      _updatePreview();
    });
  });
}

function _populateColors(type) {
  var containerId = type === "primary" ? "pet-custom-primary-colors" : "pet-custom-secondary-colors";
  var container = document.getElementById(containerId);
  if (!container) return;

  var current = type === "primary" ? customizationState.primaryColor : customizationState.secondaryColor;
  var keys = Object.keys(COLOR_PALETTE);

  container.innerHTML = keys.map(function (key) {
    var c = COLOR_PALETTE[key];
    var sel = key === current ? " selected" : "";
    return '<button class="color-swatch' + sel + '" data-color-key="' + key +
      '" title="' + escapeAttr(c.name) + '" style="background-color:' + c.base + ';"></button>';
  }).join("");

  container.querySelectorAll(".color-swatch").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (type === "primary") { customizationState.primaryColor = btn.dataset.colorKey; }
      else { customizationState.secondaryColor = btn.dataset.colorKey; }
      container.querySelectorAll(".color-swatch").forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
      _updatePreview();
    });
  });
}

function _populatePatterns() {
  var container = document.getElementById("pet-custom-patterns");
  if (!container) return;

  var names = { "solid": "纯色", "two-tone": "双色", "tabby": "虎斑", "cow": "奶牛花" };
  container.innerHTML = PATTERN_TYPES.map(function (pat) {
    var sel = pat === customizationState.pattern ? " selected" : "";
    return '<button class="pattern-option' + sel + '" data-pattern="' + pat +
      '" title="' + escapeAttr(names[pat] || pat) + '">' + escapeHtml(names[pat] || pat) + '</button>';
  }).join("");

  container.querySelectorAll(".pattern-option").forEach(function (btn) {
    btn.addEventListener("click", function () {
      customizationState.pattern = btn.dataset.pattern;
      container.querySelectorAll(".pattern-option").forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
      _updatePreview();
    });
  });
}

function _populateAccessories() {
  var container = document.getElementById("pet-custom-accessories");
  if (!container) return;

  var html = '<button class="accessory-option' + (!customizationState.accessory ? ' selected' : '') +
    '" data-accessory="" title="无配饰">无配饰</button>';

  var accKeys = Object.keys(ACCESSORIES);
  for (var i = 0; i < accKeys.length; i++) {
    var acc = ACCESSORIES[accKeys[i]];
    var sel = customizationState.accessory === acc.id ? " selected" : "";
    html += '<button class="accessory-option' + sel + '" data-accessory="' + acc.id +
      '" title="' + escapeAttr(acc.name) + '">' + escapeHtml(acc.name) + '</button>';
  }
  container.innerHTML = html;

  container.querySelectorAll(".accessory-option").forEach(function (btn) {
    btn.addEventListener("click", function () {
      customizationState.accessory = btn.dataset.accessory || null;
      container.querySelectorAll(".accessory-option").forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
      _updatePreview();
    });
  });
}

// ==================== Internal: Preview Rendering ====================

function _updatePreview() {
  var previewEl = document.getElementById("pet-custom-preview");
  if (!previewEl) return;

  var customData = {
    template_id: customizationState.templateId,
    primary_color: customizationState.primaryColor,
    secondary_color: customizationState.secondaryColor,
    pattern: customizationState.pattern,
    accessory: customizationState.accessory
  };

  var params = resolveCustomizationParams(customData, customizationState.species);
  if (!params.template) return;

  var boxShadow = renderPetSprite({
    template: params.template,
    primaryColor: params.primaryColor,
    secondaryColor: params.secondaryColor,
    pattern: params.pattern,
    patternMask: params.patternMask,
    accessory: params.accessory,
    scale: 3
  });

  // Inject style for ::after pseudo-element
  var spriteId = "pet-custom-preview-sprite";
  previewEl.setAttribute("data-sprite-id", spriteId);

  var styleId = "style-" + spriteId;
  var styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = '[data-sprite-id="' + spriteId + '"]::after { box-shadow: ' + boxShadow + '; }';
}

// ==================== Internal: Save ====================

async function _confirmSave() {
  var petId = customizationState.petId;
  var data = {
    template_id: customizationState.templateId,
    primary_color: customizationState.primaryColor,
    secondary_color: customizationState.secondaryColor,
    pattern: customizationState.pattern,
    accessory: customizationState.accessory
  };

  if (petId) {
    // Save to server with retry-once on network failure/timeout
    var attempts = 0;
    var maxAttempts = 2;
    var success = false;

    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        var res = await _apiPutWithTimeout("pets/" + petId + "/customization", data, 10000);
        if (res.success) {
          success = true;
          window._onCustomizationCancel = null;
          closeCustomizationUI();
          if (typeof loadPetHouse === "function") await loadPetHouse();
        } else if (attempts >= maxAttempts) {
          showPetToast("保存失败，请重试");
        }
      } catch (e) {
        console.error("[PetCustomization] Save failed (attempt " + attempts + "):", e);
        if (attempts >= maxAttempts) {
          showPetToast("保存失败，请重试");
        } else {
          await new Promise(function (r) { setTimeout(r, 500); });
        }
      }
    }
  } else {
    // New pet flow: pass data to caller via callback
    window._onCustomizationCancel = null;
    closeCustomizationUI();
    if (typeof window._onCustomizationConfirm === "function") {
      window._onCustomizationConfirm(data);
    }
  }
}

async function _apiPutWithTimeout(endpoint, body, timeoutMs) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    var resp = await fetch(API_BASE + "/api/" + endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return resp.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === "AbortError") throw new Error("Network timeout");
    throw e;
  }
}
