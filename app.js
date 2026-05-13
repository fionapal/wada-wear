// Wada Wear — Application Controller
// UI flow, event binding, localStorage, PIN lock, Service Worker.
// Depends on: data.js, color-engine.js

(function () {
  'use strict';

  // =========================================================================
  // DOM References
  // =========================================================================
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return document.querySelectorAll(sel); };

  var app          = $('#app');
  var pinOverlay   = $('#pin-overlay');
  var pinSubtitle  = $('#pin-subtitle');
  var pinDots      = $('#pin-dots');
  var pinPad       = $('#pin-pad');
  var pinError     = $('#pin-error');

  var btnSelect    = $('#btn-select-photo');
  var fileInput    = $('#file-input');
  var photoPrompt  = $('#photo-prompt');
  var photoResult  = $('#photo-result');
  var photoImage   = $('#photo-image');
  var photoPin     = $('#photo-pin');
  var photoSwatch  = $('#photo-swatch');
  var swatchPreview = $('#swatch-preview');
  var candidates   = $('#candidates');
  var candidateList = $('#candidate-list');
  var photoMessage = $('#photo-message');

  var familyTabs   = $('#family-tabs');
  var colorGrid    = $('#color-grid');
  var mineGrid     = $('#mine-grid');
  var mineEmpty    = $('#mine-empty');

  var comboHeader  = $('#combo-header');
  var comboList    = $('#combo-list');
  var btnBack      = $('#btn-back');

  var viewPhoto    = $('#view-photo');
  var viewBrowse   = $('#view-browse');
  var viewCombo    = $('#view-combo');
  var viewMine     = $('#view-mine');

  // =========================================================================
  // Constants
  // =========================================================================
  var LS_PIN         = 'wada_wear_pin';
  var LS_COLORS      = 'wada_wear_colors';
  var MAX_PIN_TRIES  = 3;
  var PIN_COOLDOWN_S = 30;
  var FAMILIES       = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Neutral'];

  // =========================================================================
  // State
  // =========================================================================
  var pinDigits     = '';
  var pinSetMode    = false;
  var pinFailCount  = 0;
  var cooldownUntil = 0;
  var currentPhotoHex = null;
  var pinDragging   = false;

  // =========================================================================
  // Service Worker
  // =========================================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        // SW registration failed — app still works online
      });
    });
  }

  // =========================================================================
  // PIN Lock
  // =========================================================================
  function initPin() {
    var stored = localStorage.getItem(LS_PIN);
    if (stored) {
      pinSetMode = false;
      pinSubtitle.textContent = 'Enter your PIN';
    } else {
      pinSetMode = true;
      pinSubtitle.textContent = 'Create a 4-digit PIN';
    }
    pinDigits = '';
    updatePinDots();
    buildPinPad();
    pinOverlay.classList.remove('hidden');
    app.classList.add('hidden');
  }

  function buildPinPad() {
    var html = '';
    for (var i = 1; i <= 9; i++) {
      html += '<button type="button" class="pin-key" data-key="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" class="pin-key pin-key-empty"></button>';
    html += '<button type="button" class="pin-key" data-key="0">0</button>';
    html += '<button type="button" class="pin-key pin-key-del" data-key="del">&larr;</button>';
    pinPad.innerHTML = html;

    pinPad.querySelectorAll('.pin-key').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handlePinKey(btn.dataset.key);
      });
    });
  }

  function handlePinKey(key) {
    if (key === 'del') {
      pinDigits = pinDigits.slice(0, -1);
    } else if (pinDigits.length < 4) {
      pinDigits += key;
    }
    updatePinDots();

    if (pinDigits.length === 4) {
      if (pinSetMode) {
        finishPinSetup();
      } else {
        verifyPin();
      }
    }
  }

  function updatePinDots() {
    var dots = pinDots.querySelectorAll('.pin-dot');
    dots.forEach(function (dot, i) {
      if (i < pinDigits.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  function finishPinSetup() {
    localStorage.setItem(LS_PIN, pinDigits);
    pinDigits = '';
    pinSetMode = false;
    pinSubtitle.textContent = 'PIN set. Enter it to unlock.';
    updatePinDots();
    pinError.textContent = '';
  }

  function verifyPin() {
    var stored = localStorage.getItem(LS_PIN);

    // Cooldown check
    if (cooldownUntil > 0) {
      var remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (remaining > 0) {
        pinError.textContent = 'Too many attempts. Wait ' + remaining + 's.';
        pinDigits = '';
        updatePinDots();
        return;
      }
      cooldownUntil = 0;
      pinFailCount = 0;
    }

    if (pinDigits === stored) {
      unlock();
    } else {
      pinFailCount++;
      pinDigits = '';
      updatePinDots();
      if (pinFailCount >= MAX_PIN_TRIES) {
        cooldownUntil = Date.now() + PIN_COOLDOWN_S * 1000;
        pinError.textContent = 'Too many attempts. Wait ' + PIN_COOLDOWN_S + 's.';
      } else {
        pinError.textContent = 'Wrong PIN. ' + (MAX_PIN_TRIES - pinFailCount) + ' tries left.';
      }
    }
  }

  function unlock() {
    pinError.textContent = '';
    pinDigits = '';
    pinFailCount = 0;
    cooldownUntil = 0;
    pinOverlay.classList.add('hidden');
    app.classList.remove('hidden');
  }

  // =========================================================================
  // Tab Navigation
  // =========================================================================
  function switchView(viewName) {
    [viewPhoto, viewBrowse, viewCombo, viewMine].forEach(function (v) {
      v.classList.remove('active');
    });
    $$('.tab').forEach(function (t) {
      t.classList.remove('active');
    });

    if (viewName === 'photo') {
      viewPhoto.classList.add('active');
      $('.tab[data-view="photo"]').classList.add('active');
    } else if (viewName === 'browse') {
      viewBrowse.classList.add('active');
      $('.tab[data-view="browse"]').classList.add('active');
      if (!familyTabs.hasChildNodes()) initBrowse();
    } else if (viewName === 'mine') {
      viewMine.classList.add('active');
      $('.tab[data-view="mine"]').classList.add('active');
      renderMyColors();
    } else if (viewName === 'combo') {
      viewCombo.classList.add('active');
    }
  }

  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchView(tab.dataset.view);
    });
  });

  btnBack.addEventListener('click', function () {
    // Return to the view that opened the combo
    var activeTab = document.querySelector('.tab.active');
    if (activeTab) {
      switchView(activeTab.dataset.view);
    } else {
      switchView('photo');
    }
  });

  // =========================================================================
  // Photo Match
  // =========================================================================
  btnSelect.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!file.type.match(/image\//)) {
      photoMessage.textContent = 'Please select an image file.';
      return;
    }
    photoMessage.textContent = '';
    loadImage(file);
  });

  function loadImage(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      photoImage.onload = function () {
        processPhoto();
      };
      photoImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function processPhoto() {
    photoPrompt.classList.add('hidden');
    photoResult.classList.remove('hidden');
    candidates.classList.add('hidden');

    var dominant = ColorEngine.extractDominantColor(photoImage);
    currentPhotoHex = dominant.hex;

    // Position pin at center
    photoPin.style.left = '50%';
    photoPin.style.top = '50%';
    updatePinColor(0.5, 0.5);
    initPinDrag();

    // Show candidates
    showCandidates(dominant.hex);

    // Show swatch
    swatchPreview.style.backgroundColor = dominant.hex;
  }

  function updatePinColor(nx, ny) {
    var color = ColorEngine.extractColorAtPoint(photoImage, nx, ny);
    currentPhotoHex = color.hex;
    swatchPreview.style.backgroundColor = color.hex;
    showCandidates(color.hex);
  }

  function initPinDrag() {
    var wrap = $('#photo-image-wrap');

    var onStart = function (e) {
      e.preventDefault();
      pinDragging = true;
    };

    var onMove = function (e) {
      if (!pinDragging) return;
      e.preventDefault();
      var touch = e.touches ? e.touches[0] : e;
      var rect = photoImage.getBoundingClientRect();
      var nx = (touch.clientX - rect.left) / rect.width;
      var ny = (touch.clientY - rect.top) / rect.height;
      nx = Math.max(0, Math.min(1, nx));
      ny = Math.max(0, Math.min(1, ny));
      photoPin.style.left = (nx * 100) + '%';
      photoPin.style.top = (ny * 100) + '%';
      updatePinColor(nx, ny);
    };

    var onEnd = function () {
      pinDragging = false;
    };

    photoPin.addEventListener('touchstart', onStart, { passive: false });
    photoPin.addEventListener('mousedown', onStart);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchend', onEnd);
    document.addEventListener('mouseup', onEnd);

    // Also allow tapping directly on the image
    photoImage.addEventListener('click', function (e) {
      var rect = photoImage.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width;
      var ny = (e.clientY - rect.top) / rect.height;
      nx = Math.max(0, Math.min(1, nx));
      ny = Math.max(0, Math.min(1, ny));
      photoPin.style.left = (nx * 100) + '%';
      photoPin.style.top = (ny * 100) + '%';
      updatePinColor(nx, ny);
    });
  }

  function showCandidates(hex) {
    var results = ColorEngine.findClosestColors(hex, 3);
    var html = '';
    results.forEach(function (r) {
      var c = r.color;
      var dist = Math.round(r.distance * 100) / 100;
      html += '<button type="button" class="candidate-card" data-name="' + escAttr(c.name) + '">';
      html += '<span class="candidate-swatch" style="background-color:' + c.hex + '"></span>';
      html += '<span class="candidate-info">';
      html += '<span class="candidate-name">' + escHtml(c.name) + '</span>';
      html += '<span class="candidate-dist">' + c.hex + ' &middot; &Delta;E ' + dist + '</span>';
      html += '</span></button>';
    });
    candidateList.innerHTML = html;
    candidates.classList.remove('hidden');

    candidateList.querySelectorAll('.candidate-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var name = card.dataset.name;
        var color = getColorByName(name);
        confirmColor(color);
      });
    });
  }

  function confirmColor(colorObj) {
    addColor(colorObj);
    showComboView(colorObj);
  }

  // =========================================================================
  // Browse Colors
  // =========================================================================
  function initBrowse() {
    // Family tabs
    var tabHtml = '';
    FAMILIES.forEach(function (fam, i) {
      tabHtml += '<button type="button" class="family-tab' + (i === 0 ? ' active' : '') +
                 '" data-family="' + fam + '">' + fam + '</button>';
    });
    familyTabs.innerHTML = tabHtml;

    familyTabs.querySelectorAll('.family-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        familyTabs.querySelectorAll('.family-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        tab.classList.add('active');
        renderColorGrid(tab.dataset.family);
      });
    });

    renderColorGrid(FAMILIES[0]);
  }

  function renderColorGrid(family) {
    var colors = getColorsByFamily(family);
    var html = '';
    colors.forEach(function (c) {
      html += '<button type="button" class="color-card" data-name="' + escAttr(c.name) + '">';
      html += '<span class="color-card-swatch" style="background-color:' + c.hex + '"></span>';
      html += '<span class="color-card-name">' + escHtml(c.name) + '</span>';
      html += '</button>';
    });
    colorGrid.innerHTML = html;

    colorGrid.querySelectorAll('.color-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var color = getColorByName(card.dataset.name);
        showComboView(color);
      });
    });
  }

  // =========================================================================
  // My Colors (localStorage)
  // =========================================================================
  function loadMyColors() {
    try {
      return JSON.parse(localStorage.getItem(LS_COLORS)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveMyColors(colors) {
    localStorage.setItem(LS_COLORS, JSON.stringify(colors));
  }

  function addColor(colorObj) {
    var mine = loadMyColors();
    // Avoid duplicates
    if (!mine.some(function (m) { return m.datasetName === colorObj.name; })) {
      mine.push({
        datasetName: colorObj.name,
        hex: colorObj.hex,
        addedAt: new Date().toISOString().slice(0, 10)
      });
      saveMyColors(mine);
    }
  }

  function removeColor(name) {
    var mine = loadMyColors().filter(function (m) {
      return m.datasetName !== name;
    });
    saveMyColors(mine);
    renderMyColors();
  }

  function renderMyColors() {
    var mine = loadMyColors();
    if (mine.length === 0) {
      mineGrid.innerHTML = '';
      mineEmpty.classList.remove('hidden');
      return;
    }
    mineEmpty.classList.add('hidden');

    var html = '';
    mine.forEach(function (m) {
      var c = getColorByName(m.datasetName);
      html += '<button type="button" class="mine-card" data-name="' + escAttr(m.datasetName) + '">';
      html += '<span class="mine-swatch" style="background-color:' + m.hex + '"></span>';
      html += '<span class="mine-name">' + escHtml(m.datasetName) + '</span>';
      html += '<span class="mine-date">' + m.addedAt + '</span>';
      html += '<span class="mine-remove" data-name="' + escAttr(m.datasetName) + '">&times;</span>';
      html += '</button>';
    });
    mineGrid.innerHTML = html;

    // Tap swatch → combo view
    mineGrid.querySelectorAll('.mine-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.classList.contains('mine-remove')) return;
        var color = getColorByName(card.dataset.name);
        if (color) showComboView(color);
      });
    });

    // Remove button
    mineGrid.querySelectorAll('.mine-remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        removeColor(btn.dataset.name);
      });
    });
  }

  // =========================================================================
  // Combination Detail View
  // =========================================================================
  function showComboView(colorObj) {
    var mine = loadMyColors();
    var ownedHexes = mine.map(function (m) { return m.hex; });

    // Header
    var headerHtml = '';
    headerHtml += '<div class="combo-color-hero" style="background-color:' + colorObj.hex + '"></div>';
    headerHtml += '<h2 class="combo-color-name">' + escHtml(colorObj.name) + '</h2>';
    headerHtml += '<p class="combo-color-hex">' + colorObj.hex + '</p>';
    headerHtml += '<p class="combo-count">Appears in ' + colorObj.combinations.length + ' combinations</p>';
    comboHeader.innerHTML = headerHtml;

    // Combination list
    var combos = ColorEngine.getColorCombinations(colorObj);
    var listHtml = '';
    combos.forEach(function (combo) {
      listHtml += '<div class="palette-card">';
      listHtml += '<div class="palette-swatches">';
      combo.colors.forEach(function (c) {
        var isOwned = ownedHexes.indexOf(c.hex) !== -1;
        var isCurrent = c.name === colorObj.name;
        listHtml += '<button type="button" class="palette-swatch-btn" data-name="' + escAttr(c.name) + '">';
        listHtml += '<span class="palette-swatch' +
                    (isCurrent ? ' current' : '') +
                    (isOwned ? ' owned' : '') +
                    '" style="background-color:' + c.hex + '">';
        if (isOwned) listHtml += '<span class="owned-check">&#10003;</span>';
        listHtml += '</span>';
        listHtml += '<span class="palette-swatch-name">' + escHtml(c.name) + '</span>';
        listHtml += '</button>';
      });
      listHtml += '</div>';
      listHtml += '<span class="palette-id">Combination ' + combo.id + '</span>';
      listHtml += '</div>';
    });
    comboList.innerHTML = listHtml;

    // Navigate to other colors
    comboList.querySelectorAll('.palette-swatch-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var color = getColorByName(btn.dataset.name);
        if (color) showComboView(color);
      });
    });

    switchView('combo');
  }

  // =========================================================================
  // Utilities
  // =========================================================================
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // =========================================================================
  // Init
  // =========================================================================
  initPin();

})();
