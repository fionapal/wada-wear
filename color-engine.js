// Wada Wear — Color Engine
// Pure functions for color extraction, matching, and combination lookup.
// Depends on: chroma.js (loaded via <script>), data.js (COLORS, COMBINATION_INDEX)

var ColorEngine = (function () {
  'use strict';

  /**
   * Extract the dominant color of an image by scaling it to 1×1 pixel
   * and reading the resulting averaged color.
   * @param {HTMLImageElement} img - The image to analyze.
   * @returns {{ r: number, g: number, b: number, hex: string }}
   */
  function extractDominantColor(img) {
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1, 1);
    var data = ctx.getImageData(0, 0, 1, 1).data;
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      hex: rgbToHex(data[0], data[1], data[2])
    };
  }

  /**
   * Extract the color at a specific point on the image.
   * @param {HTMLImageElement} img
   * @param {number} x - X coordinate relative to displayed image (0–1 normalized).
   * @param {number} y - Y coordinate relative to displayed image (0–1 normalized).
   * @returns {{ r: number, g: number, b: number, hex: string }}
   */
  function extractColorAtPoint(img, x, y) {
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var px = Math.round(x * img.naturalWidth);
    var py = Math.round(y * img.naturalHeight);
    px = Math.max(0, Math.min(px, img.naturalWidth - 1));
    py = Math.max(0, Math.min(py, img.naturalHeight - 1));
    var data = ctx.getImageData(px, py, 1, 1).data;
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      hex: rgbToHex(data[0], data[1], data[2])
    };
  }

  /**
   * Find the N closest colors from the dataset to a target hex color.
   * Uses chroma.js CIEDE2000 for perceptually accurate color distance.
   * @param {string} targetHex - Hex color string (e.g., "#ae5224").
   * @param {number} n - Number of closest matches to return (default 3).
   * @returns {Array<{ color: Object, distance: number }>}
   */
  function findClosestColors(targetHex, n) {
    n = n || 3;
    var target = chroma(targetHex);
    var results = [];

    for (var i = 0; i < COLORS.length; i++) {
      var color = COLORS[i];
      var dist = chroma.deltaE(target, chroma(color.hex));
      results.push({ color: color, distance: dist });
    }

    results.sort(function (a, b) {
      return a.distance - b.distance;
    });

    return results.slice(0, n);
  }

  /**
   * Get all combination palettes that include the given color.
   * @param {Object} colorObj - A color object from COLORS.
   * @returns {Array<{ id: number, colors: Array }>} Array of combination objects.
   */
  function getColorCombinations(colorObj) {
    if (!colorObj || !colorObj.combinations) return [];
    return colorObj.combinations.map(function (cid) {
      return {
        id: cid,
        colors: COMBINATION_INDEX[cid] || []
      };
    });
  }

  /**
   * Convert RGB values to hex string.
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @returns {string}
   */
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (c) {
      var hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  return {
    extractDominantColor: extractDominantColor,
    extractColorAtPoint: extractColorAtPoint,
    findClosestColors: findClosestColors,
    getColorCombinations: getColorCombinations
  };
})();
