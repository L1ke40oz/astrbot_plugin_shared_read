/**
 * Pet Sprite Rendering Engine
 * 宠物精灵渲染引擎 - 将模板数据 + 颜色 + 花纹转换为 CSS box-shadow 字符串
 *
 * Uses the CSS box-shadow pixel art technique:
 * Each non-transparent pixel becomes a `Xpx Ypx 0 #color` entry in the box-shadow value.
 * The element is 1x1px, scaled by the scale factor (default 3) to produce a 48x48 display.
 *
 * Animation state support:
 * The rendering engine supports all pet animation states (idle, happy, hungry, sad,
 * eating, being_petted). For the initial implementation, all states use the same base
 * template grid — animation motion (bouncing, bobbing, etc.) is handled by CSS keyframes
 * on the container element. The rendering engine ensures the correct customization
 * colors/patterns are applied regardless of which animation state is active.
 */

/* eslint-disable */
// @ts-nocheck

/**
 * Valid animation states for pet sprites.
 * The rendering engine can produce a sprite for any of these states.
 */
var ANIMATION_STATES = ["idle", "happy", "hungry", "sad", "eating", "being_petted"];

/**
 * Fixed colors for specific Pixel_Role values.
 * These do not change based on user color selections.
 */
var FIXED_ROLE_COLORS = {
  eye: "#2d2d2d",
  nose: "#e88ca0",
  whisker: "#c0c0c0",
  mouth: "#e88ca0"
};

/**
 * Pixel_Role enum values mapped to names for clarity.
 */
var PIXEL_ROLE = {
  TRANSPARENT: 0,
  PRIMARY_BODY: 1,
  SECONDARY_BELLY: 2,
  EYE: 3,
  NOSE: 4,
  EAR_INNER: 5,
  WHISKER: 6,
  MOUTH: 7,
  OUTLINE: 8
};

/**
 * Resolve the color for a given pixel based on its role, pattern, and mask.
 *
 * @param {number} role - Pixel_Role value (0-8)
 * @param {Object} primaryColor - { base: '#hex', shadow: '#hex' }
 * @param {Object} secondaryColor - { base: '#hex', shadow: '#hex' }
 * @param {string} pattern - 'solid' | 'two-tone' | 'tabby' | 'cow'
 * @param {number} maskValue - patternMask value at this pixel (0 or 1), or 0 if no mask
 * @returns {string|null} CSS hex color string, or null for transparent
 */
function resolvePixelColor(role, primaryColor, secondaryColor, pattern, maskValue) {
  switch (role) {
    case PIXEL_ROLE.TRANSPARENT:
      return null;

    case PIXEL_ROLE.PRIMARY_BODY:
      return resolveBodyColor(primaryColor, secondaryColor, pattern, maskValue);

    case PIXEL_ROLE.SECONDARY_BELLY:
      return resolveBellyColor(primaryColor, secondaryColor, pattern, maskValue);

    case PIXEL_ROLE.EYE:
      return FIXED_ROLE_COLORS.eye;

    case PIXEL_ROLE.NOSE:
      return FIXED_ROLE_COLORS.nose;

    case PIXEL_ROLE.EAR_INNER:
      // Ear inner uses secondary color's shadow variant for depth
      return secondaryColor.shadow;

    case PIXEL_ROLE.WHISKER:
      return FIXED_ROLE_COLORS.whisker;

    case PIXEL_ROLE.MOUTH:
      return FIXED_ROLE_COLORS.mouth;

    case PIXEL_ROLE.OUTLINE:
      // Outline uses primary color's shadow shade
      return primaryColor.shadow;

    default:
      return null;
  }
}

/**
 * Resolve color for primary_body pixels based on pattern.
 *
 * @param {Object} primaryColor - { base, shadow }
 * @param {Object} secondaryColor - { base, shadow }
 * @param {string} pattern - pattern type
 * @param {number} maskValue - mask value at this position
 * @returns {string} hex color
 */
function resolveBodyColor(primaryColor, secondaryColor, pattern, maskValue) {
  switch (pattern) {
    case "solid":
      return primaryColor.base;

    case "two-tone":
      return primaryColor.base;

    case "tabby":
    case "cow":
      // If mask says 1, use secondary; otherwise use primary
      return maskValue === 1 ? secondaryColor.base : primaryColor.base;

    default:
      return primaryColor.base;
  }
}

/**
 * Resolve color for secondary_belly pixels based on pattern.
 *
 * @param {Object} primaryColor - { base, shadow }
 * @param {Object} secondaryColor - { base, shadow }
 * @param {string} pattern - pattern type
 * @param {number} maskValue - mask value at this position
 * @returns {string} hex color
 */
function resolveBellyColor(primaryColor, secondaryColor, pattern, maskValue) {
  switch (pattern) {
    case "solid":
      // Solid: ALL body pixels (roles 1 AND 2) use primaryColor
      return primaryColor.base;

    case "two-tone":
      // Two-tone: role 2 uses secondaryColor
      return secondaryColor.base;

    case "tabby":
    case "cow":
      // If mask says 1, use secondary; otherwise use primary
      return maskValue === 1 ? secondaryColor.base : primaryColor.base;

    default:
      return primaryColor.base;
  }
}

/**
 * Render a pet sprite as a CSS box-shadow string.
 *
 * @param {Object} params
 * @param {number[][]} params.template - 16x16 grid of Pixel_Role enum values
 * @param {Object} params.primaryColor - { base: '#hex', shadow: '#hex' }
 * @param {Object} params.secondaryColor - { base: '#hex', shadow: '#hex' }
 * @param {string} params.pattern - 'solid' | 'two-tone' | 'tabby' | 'cow'
 * @param {number[][]|null} params.patternMask - 16x16 pattern mask grid (or null for solid/two-tone)
 * @param {Object|null} params.accessory - { pixels: (string|number)[][], anchor: {x: number, y: number} } or null
 * @param {number} [params.scale=3] - pixel scale factor
 * @returns {string} CSS box-shadow value string
 */
function renderPetSprite(params) {
  var template = params.template;
  var primaryColor = params.primaryColor;
  var secondaryColor = params.secondaryColor;
  var pattern = params.pattern;
  var patternMask = params.patternMask || null;
  var accessory = params.accessory || null;
  var scale = params.scale != null ? params.scale : 3;

  // Build a position→color map keyed by "x,y" grid coordinates.
  // This allows accessory pixels to override body pixels at the same position.
  var pixelMap = {};

  // Step 1: Populate with body pixels from the template
  for (var y = 0; y < template.length; y++) {
    var row = template[y];
    for (var x = 0; x < row.length; x++) {
      var role = row[x];

      // Skip transparent pixels
      if (role === PIXEL_ROLE.TRANSPARENT) {
        continue;
      }

      // Get mask value for this position (0 if no mask or out of bounds)
      var maskValue = 0;
      if (patternMask && patternMask[y] && patternMask[y][x] != null) {
        maskValue = patternMask[y][x];
      }

      // Resolve the color for this pixel
      var color = resolvePixelColor(role, primaryColor, secondaryColor, pattern, maskValue);

      if (color) {
        pixelMap[x + "," + y] = color;
      }
    }
  }

  // Step 2: Overlay accessory pixels at anchor-offset positions
  if (accessory && accessory.pixels && accessory.anchor) {
    var anchorX = accessory.anchor.x;
    var anchorY = accessory.anchor.y;
    var accPixels = accessory.pixels;

    for (var accRow = 0; accRow < accPixels.length; accRow++) {
      var accRowData = accPixels[accRow];
      for (var accCol = 0; accCol < accRowData.length; accCol++) {
        var accPixel = accRowData[accCol];

        // Skip transparent pixels (0 means transparent)
        if (accPixel === 0 || accPixel === "0") {
          continue;
        }

        // Calculate absolute position on the grid
        var absX = anchorX + accCol;
        var absY = anchorY + accRow;

        // Only render if within valid grid bounds (non-negative)
        if (absX >= 0 && absY >= 0) {
          // Override any existing body pixel at this position
          pixelMap[absX + "," + absY] = accPixel;
        }
      }
    }
  }

  // Step 3: Convert pixel map to box-shadow entries
  var shadows = [];
  var keys = Object.keys(pixelMap);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var parts = key.split(",");
    var px = (parseInt(parts[0], 10) + 1) * scale;
    var py = (parseInt(parts[1], 10) + 1) * scale;
    shadows.push(px + "px " + py + "px 0 " + pixelMap[key]);
  }

  return shadows.join(",");
}


/**
 * Look up a template object by its ID from PET_TEMPLATES registry.
 *
 * @param {string} templateId - template identifier (e.g. "pointy-ear-cat")
 * @param {string} species - species key to search within (e.g. "cat")
 * @returns {Object|null} template object or null if not found
 */
function findTemplateById(templateId, species) {
  // Try the specified species first
  if (typeof PET_TEMPLATES !== "undefined" && PET_TEMPLATES[species]) {
    var templates = PET_TEMPLATES[species];
    for (var i = 0; i < templates.length; i++) {
      if (templates[i].id === templateId) {
        return templates[i];
      }
    }
  }

  // Fallback: search all species
  if (typeof PET_TEMPLATES !== "undefined") {
    var speciesKeys = Object.keys(PET_TEMPLATES);
    for (var s = 0; s < speciesKeys.length; s++) {
      var speciesTemplates = PET_TEMPLATES[speciesKeys[s]];
      for (var j = 0; j < speciesTemplates.length; j++) {
        if (speciesTemplates[j].id === templateId) {
          return speciesTemplates[j];
        }
      }
    }
  }

  return null;
}

/**
 * Resolve customization data into rendering parameters, applying fallbacks
 * for missing or invalid values.
 *
 * @param {Object} customizationData - { template_id, primary_color, secondary_color, pattern, accessory }
 * @param {string} species - pet species (cat, dog, rabbit, hamster)
 * @returns {Object} resolved params ready for renderPetSprite()
 */
function resolveCustomizationParams(customizationData, species) {
  var data = customizationData || {};

  // Resolve template
  var templateId = data.template_id;
  var template = findTemplateById(templateId, species);

  // Fallback: use first template of species, or first template of any species
  if (!template) {
    if (templateId) {
      console.warn("[PetCustomization] Unknown template_id '" + templateId + "' for species '" + species + "', falling back to default");
    }
    if (typeof PET_TEMPLATES !== "undefined" && PET_TEMPLATES[species] && PET_TEMPLATES[species].length > 0) {
      template = PET_TEMPLATES[species][0];
    } else if (typeof PET_TEMPLATES !== "undefined") {
      var firstSpecies = Object.keys(PET_TEMPLATES)[0];
      if (firstSpecies && PET_TEMPLATES[firstSpecies].length > 0) {
        template = PET_TEMPLATES[firstSpecies][0];
      }
    }
  }

  // Resolve colors from palette
  var primaryColorKey = data.primary_color || "orange";
  var secondaryColorKey = data.secondary_color || "cream";

  var primaryColor = (typeof COLOR_PALETTE !== "undefined" && COLOR_PALETTE[primaryColorKey])
    ? COLOR_PALETTE[primaryColorKey]
    : { base: "#f0a84c", shadow: "#e8943a" }; // fallback orange

  if (typeof COLOR_PALETTE !== "undefined" && !COLOR_PALETTE[primaryColorKey] && data.primary_color) {
    console.warn("[PetCustomization] Unknown primary_color '" + data.primary_color + "', falling back to orange");
  }

  var secondaryColor = (typeof COLOR_PALETTE !== "undefined" && COLOR_PALETTE[secondaryColorKey])
    ? COLOR_PALETTE[secondaryColorKey]
    : { base: "#f5c87a", shadow: "#e8b860" }; // fallback cream

  if (typeof COLOR_PALETTE !== "undefined" && !COLOR_PALETTE[secondaryColorKey] && data.secondary_color) {
    console.warn("[PetCustomization] Unknown secondary_color '" + data.secondary_color + "', falling back to cream");
  }

  // Resolve pattern
  var pattern = data.pattern || "solid";
  var validPatterns = ["solid", "two-tone", "tabby", "cow"];
  if (validPatterns.indexOf(pattern) === -1) {
    console.warn("[PetCustomization] Unknown pattern '" + pattern + "', falling back to solid");
    pattern = "solid";
  }

  // Resolve pattern mask from template
  var patternMask = null;
  if (template && template.patternMasks && (pattern === "tabby" || pattern === "cow")) {
    patternMask = template.patternMasks[pattern] || null;
  }

  // Resolve accessory
  var accessory = null;
  if (data.accessory && typeof ACCESSORIES !== "undefined") {
    // Support both "bow" and "bell-collar" style IDs
    var accKey = data.accessory;
    var accObj = ACCESSORIES[accKey];

    // Try matching by id field if direct key lookup fails
    if (!accObj) {
      var accKeys = Object.keys(ACCESSORIES);
      for (var k = 0; k < accKeys.length; k++) {
        if (ACCESSORIES[accKeys[k]].id === accKey) {
          accObj = ACCESSORIES[accKeys[k]];
          break;
        }
      }
    }

    if (accObj && template && template.accessoryAnchors) {
      // Find the anchor for this accessory type
      var anchorKey = accKey;
      // Map accessory IDs to anchor keys (e.g. "bell-collar" → "collar")
      var anchorMapping = {
        "bell-collar": "collar",
        "bellCollar": "collar",
        "scarf": "scarf",
        "crown": "crown",
        "sunglasses": "sunglasses"
      };
      var resolvedAnchorKey = anchorMapping[accKey] || accKey;
      var anchor = template.accessoryAnchors[resolvedAnchorKey];

      if (anchor) {
        accessory = {
          pixels: accObj.pixels,
          anchor: anchor
        };
      }
    } else if (!accObj && data.accessory) {
      console.warn("[PetCustomization] Unknown accessory '" + data.accessory + "', ignoring (treated as null)");
    }
  }

  return {
    template: template ? template.grid : null,
    primaryColor: primaryColor,
    secondaryColor: secondaryColor,
    pattern: pattern,
    patternMask: patternMask,
    accessory: accessory
  };
}

/**
 * Render a pet sprite for a given animation state.
 *
 * For the initial implementation, all animation states use the same base template grid.
 * Animation motion (bouncing, bobbing, squinting, etc.) is handled by CSS keyframes
 * on the container element. This function ensures the correct customization colors/patterns
 * are applied to produce the box-shadow string for any state.
 *
 * Future enhancement: per-state template variants (e.g., closed eyes for happy,
 * open mouth for eating) can be added by looking up state-specific grids from the template.
 *
 * @param {Object} customizationData - { template_id, primary_color, secondary_color, pattern, accessory }
 * @param {string} animationState - one of ANIMATION_STATES: 'idle', 'happy', 'hungry', 'sad', 'eating', 'being_petted'
 * @param {string} species - pet species (cat, dog, rabbit, hamster)
 * @param {number} [scale=3] - pixel scale factor
 * @returns {string} CSS box-shadow value string (empty string if template not found)
 */
function renderPetForState(customizationData, animationState, species, scale) {
  // Validate animation state, default to idle
  if (ANIMATION_STATES.indexOf(animationState) === -1) {
    animationState = "idle";
  }

  var params = resolveCustomizationParams(customizationData, species);

  // If no template could be resolved, return empty string
  if (!params.template) {
    return "";
  }

  // Future: per-state template variants would be selected here.
  // For now, all states use the same base grid from the template.
  // The animation state is used by CSS keyframes for motion effects.

  return renderPetSprite({
    template: params.template,
    primaryColor: params.primaryColor,
    secondaryColor: params.secondaryColor,
    pattern: params.pattern,
    patternMask: params.patternMask,
    accessory: params.accessory,
    scale: scale != null ? scale : 3
  });
}

/**
 * Apply a dynamically rendered pet sprite to a DOM element as an inline style.
 *
 * This replaces the old hardcoded CSS `::after` box-shadow approach with a dynamic
 * inline style. The element should be a 1x1px element (or use the ::after pseudo-element
 * pattern). This function creates/updates a <style> tag with a unique ID to set the
 * ::after pseudo-element's box-shadow, since inline styles cannot target pseudo-elements.
 *
 * The element will also receive the appropriate animation state CSS class for motion effects.
 *
 * @param {HTMLElement} element - the pet sprite container element (has class "pet-sprite")
 * @param {Object} customizationData - { template_id, primary_color, secondary_color, pattern, accessory }
 * @param {string} species - pet species (cat, dog, rabbit, hamster)
 * @param {string} [animationState='idle'] - current animation state
 * @param {number} [scale=3] - pixel scale factor
 */
function applyPetSprite(element, customizationData, species, animationState, scale) {
  if (!element) return;

  animationState = animationState || "idle";
  scale = scale != null ? scale : 3;

  // Generate the box-shadow string for this state
  var boxShadow = renderPetForState(customizationData, animationState, species, scale);

  if (!boxShadow) return;

  // Strategy: Use a unique data attribute + injected <style> tag to set ::after box-shadow.
  // This is necessary because inline styles cannot target pseudo-elements.
  var spriteId = element.getAttribute("data-sprite-id");
  if (!spriteId) {
    spriteId = "pet-sprite-" + Math.random().toString(36).substring(2, 10);
    element.setAttribute("data-sprite-id", spriteId);
  }

  // Find or create the style element for this sprite
  var styleId = "style-" + spriteId;
  var styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  // Set the ::after box-shadow via the injected style rule
  styleEl.textContent = '[data-sprite-id="' + spriteId + '"]::after { box-shadow: ' + boxShadow + '; }';

  // Update animation state CSS class on the element
  // Remove any existing pet-anim-* class and species class
  var classList = element.className.split(/\s+/);
  var newClasses = [];
  for (var i = 0; i < classList.length; i++) {
    if (classList[i].indexOf("pet-anim-") !== 0 && classList[i].indexOf("pet-sprite-") !== 0) {
      newClasses.push(classList[i]);
    }
  }

  // Add species class and animation state class
  newClasses.push("pet-sprite-" + species);
  // Map animation state to CSS class name (being_petted → petted for CSS compatibility)
  var animClass = animationState === "being_petted" ? "petted" : animationState;
  newClasses.push("pet-anim-" + animClass);

  element.className = newClasses.join(" ");
}

/**
 * Apply pet sprites to all pet cards in the pet house view.
 * Call this after loading pet data to replace hardcoded CSS sprites with dynamic ones.
 *
 * @param {Array} pets - array of pet data objects from the API
 *   Each pet should have: { id, species, customization_data, animation_state }
 */
function applyAllPetSprites(pets) {
  if (!pets || !pets.length) return;

  for (var i = 0; i < pets.length; i++) {
    var pet = pets[i];
    var card = document.querySelector('.pet-card[data-pet-id="' + pet.id + '"]');
    if (!card) continue;

    var spriteEl = card.querySelector(".pet-sprite");
    if (!spriteEl) continue;

    // Use customization_data if available, otherwise use species default
    var customData = pet.customization_data;
    if (!customData && typeof DEFAULT_CUSTOMIZATION !== "undefined") {
      customData = DEFAULT_CUSTOMIZATION[pet.species] || DEFAULT_CUSTOMIZATION.cat;
    }

    var animState = pet.animation_state || "idle";
    applyPetSprite(spriteEl, customData, pet.species, animState);
  }
}
