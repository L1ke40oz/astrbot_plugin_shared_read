/**
 * Pet Customization - Color Palette, Pattern Types, Accessories & Defaults
 * 捏宠物系统 - 调色板、花纹类型、配饰定义与默认外观
 */

// ==================== Color Palette ====================

/**
 * Preset color palette for pet fur colors.
 * Each color has a base shade and a shadow shade for pixel art depth.
 * @type {Object.<string, {base: string, shadow: string, name: string}>}
 */
var COLOR_PALETTE = {
  orange:     { base: "#f0a84c", shadow: "#e8943a", name: "橘" },
  black:      { base: "#3d3d3d", shadow: "#2a2a2a", name: "黑" },
  white:      { base: "#f0f0f0", shadow: "#d8d8d8", name: "白" },
  gray:       { base: "#a0a0a0", shadow: "#808080", name: "灰" },
  darkBrown:  { base: "#8b5e3c", shadow: "#6b4528", name: "深棕" },
  lightBrown: { base: "#d4a85c", shadow: "#c8944a", name: "浅棕" },
  cream:      { base: "#f5c87a", shadow: "#e8b860", name: "奶油" },
  ginger:     { base: "#e87d4a", shadow: "#d06838", name: "姜黄" }
};

// ==================== Pattern Types ====================

/**
 * Available fur pattern types.
 * @type {string[]}
 */
var PATTERN_TYPES = ["solid", "two-tone", "tabby", "cow"];

// ==================== Accessories ====================

/**
 * Accessory definitions with pixel art data.
 * Each accessory is a small pixel overlay (≤8×8).
 * Pixel values: 0 = transparent, hex string = colored pixel.
 * @type {Object.<string, {id: string, name: string, pixels: (string|number)[][], size: {w: number, h: number}}>}
 */
var ACCESSORIES = {
  bellCollar: {
    id: "bell-collar",
    name: "铃铛项圈",
    pixels: [
      ["#d04040", "#d04040", "#d04040", "#d04040", "#d04040", "#d04040", "#d04040", "#d04040"],
      ["#b03030", "#b03030", "#b03030", "#ffd700", "#ffd700", "#b03030", "#b03030", "#b03030"],
      [0,         0,         0,         "#ccac00", "#ccac00", 0,         0,         0]
    ],
    size: { w: 8, h: 3 }
  },
  scarf: {
    id: "scarf",
    name: "围巾",
    pixels: [
      [0,         "#4a90d9", "#4a90d9", "#4a90d9", "#4a90d9", "#4a90d9", "#4a90d9", 0],
      ["#4a90d9", "#3a78b8", "#4a90d9", "#3a78b8", "#4a90d9", "#3a78b8", "#4a90d9", "#4a90d9"],
      [0,         "#4a90d9", "#3a78b8", "#4a90d9", "#3a78b8", "#4a90d9", "#3a78b8", 0],
      [0,         0,         0,         0,         0,         0,         "#4a90d9", "#3a78b8"]
    ],
    size: { w: 8, h: 4 }
  },
  crown: {
    id: "crown",
    name: "花冠",
    pixels: [
      [0,         "#ff69b4", 0,         "#90ee90", 0,         "#ff69b4", 0,         "#90ee90"],
      ["#228b22", "#ff69b4", "#228b22", "#90ee90", "#228b22", "#ff69b4", "#228b22", "#90ee90"],
      ["#228b22", "#228b22", "#228b22", "#228b22", "#228b22", "#228b22", "#228b22", "#228b22"]
    ],
    size: { w: 8, h: 3 }
  },
  sunglasses: {
    id: "sunglasses",
    name: "墨镜",
    pixels: [
      [0,         "#333333", "#333333", 0,         "#333333", "#333333", 0],
      ["#333333", "#1a1a1a", "#1a1a1a", "#333333", "#1a1a1a", "#1a1a1a", "#333333"],
      [0,         "#333333", "#333333", 0,         "#333333", "#333333", 0]
    ],
    size: { w: 7, h: 3 }
  }
};

// ==================== Default Customization ====================

/**
 * Default customization data per species for legacy pets (no customization_data).
 * @type {Object.<string, {template_id: string, primary_color: string, secondary_color: string, pattern: string, accessory: string|null}>}
 */
var DEFAULT_CUSTOMIZATION = {
  cat: {
    template_id: "pointy-ear-cat",
    primary_color: "orange",
    secondary_color: "cream",
    pattern: "solid",
    accessory: null
  },
  dog: {
    template_id: "pointy-ear-dog",
    primary_color: "lightBrown",
    secondary_color: "cream",
    pattern: "solid",
    accessory: null
  },
  rabbit: {
    template_id: "standard-rabbit",
    primary_color: "white",
    secondary_color: "cream",
    pattern: "solid",
    accessory: null
  },
  hamster: {
    template_id: "standard-hamster",
    primary_color: "lightBrown",
    secondary_color: "cream",
    pattern: "solid",
    accessory: null
  }
};
