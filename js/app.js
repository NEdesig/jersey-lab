
(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const SVG = "http://www.w3.org/2000/svg";

  const state = {
    product: "jersey",
    view: "front",
    zoom: 1,
    grid: false,
    target: "body",
    pattern: "clean",
    patternColor: "#f2a900",
    patternWidth: 14,
    shape: "star",
    selected: null,
    colors: {
      body: "#ffffff",
      sleeves: "#ffffff",
      collar: "#071d3b",
      cuffs: "#071d3b",
      hem: "#071d3b",
      shorts: "#17171c",
      socks: "#f2a900"
    },
    layers: [],
    gallery: [],
    history: [],
    historyIndex: -1,
    fontFamily: "Arial",
    fontData: null
  };

  const colorNames = {
    body: "Корпус",
    sleeves: "Рукава",
    collar: "Ворот",
    cuffs: "Манжеты",
    hem: "Низ",
    shorts: "Шорты",
    socks: "Гетры"
  };

  const holder = $("#garmentHolder");
  const stage = $("#stage");
  const toastBox = $("#toast");

  let toastTimer;
  let dragging = null;
  let dragStart = null;

  function toast(message) {
    toastBox.textContent = message;
    toastBox.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toastBox.classList.remove("show");
    }, 2300);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    })[char]);
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b]
      .map(v => Math.max(0, Math.min(255, Number(v)))
        .toString(16).padStart(2, "0"))
      .join("");
  }

  function makeId() {
    return "layer-" + Date.now() + "-" +
      Math.random().toString(36).slice(2, 7);
  }

  function saveHistory() {
    const snapshot = JSON.stringify({
      colors: state.colors,
      layers: state.layers,
      product: state.product,
      view: state.view,
      pattern: state.pattern
    });

    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);

    if (state.history.length > 40) {
      state.history.shift();
    }

    state.historyIndex = state.history.length - 1;
  }

  function restoreHistory(index) {
    if (index < 0 || index >= state.history.length) return;

    const data = JSON.parse(state.history[index]);

    state.colors = data.colors;
    state.layers = data.layers;
    state.product = data.product;
    state.view = data.view;
    state.pattern = data.pattern;

    state.historyIndex = index;
    state.selected = null;

    syncControls();
    render();
  }

  function getGarmentSVG() {
    const c = state.colors;

    let content = "";

    if (state.product === "jersey") {
      content = jerseySVG(c);
    } else if (state.product === "shorts") {
      content = shortsSVG(c);
    } else {
      content = socksSVG(c);
    }

    return `
      <svg
        id="garmentSVG"
        class="garment-svg"
        xmlns="${SVG}"
        viewBox="0 0 600 650"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="fabric" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".22"/>
            <stop offset="45%" stop-color="#000000" stop-opacity="0"/>
            <stop offset="100%" stop-color="#000000" stop-opacity=".12"/>
          </linearGradient>

          <linearGradient id="sleeveShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ffffff" stop-opacity=".18"/>
            <stop offset="100%" stop-color="#000000" stop-opacity=".12"/>
          </linearGradient>

          <pattern id="fabricTexture" width="8" height="8"
            patternUnits="userSpaceOnUse">
            <path d="M0 0L8 8M8 0L0 8"
              stroke="#ffffff" stroke-opacity=".035" stroke-width=".6"/>
          </pattern>

          <clipPath id="bodyClip">
            ${state.product === "jersey"
              ? '<path d="M225 80 L375 80 L475 130 L530 270 L465 310 L430 235 L440 585 Q300 610 160 585 L170 235 L135 310 L70 270 L125 130 Z"/>'
              : state.product === "shorts"
              ? '<path d="M130 90 L470 90 L455 570 L330 570 L300 330 L270 570 L145 570 Z"/>'
              : '<path d="M210 80 L390 80 L370 575 L230 575 Z"/>'
            }
          </clipPath>
        </defs>

        ${content}
        ${patternSVG()}
        <g id="designLayers"></g>
      </svg>
    `;
  }

  function jerseySVG(c) {
    const front = state.view === "front";

    return `
      <!-- ТЕНИ И ОСНОВНАЯ ТКАНЬ -->
      <g stroke-linejoin="round">

        <!-- ЛЕВЫЙ РУКАВ -->
        <path class="garment-base"
          fill="${c.sleeves}"
          d="M220 95 L130 130 L70 270 L135 310
             L185 205 L225 150 Z"/>

        <!-- ПРАВЫЙ РУКАВ -->
        <path class="garment-base"
          fill="${c.sleeves}"
          d="M380 95 L470 130 L530 270 L465 310
             L415 205 L375 150 Z"/>

        <!-- КОРПУС -->
        <path class="garment-base"
          fill="${c.body}"
          d="M225 80 L375 80 L475 130 L430 235
             L440 585 Q300 610 160 585
             L170 235 L125 130 Z"/>

        <!-- ФАКТУРА -->
        <path
          d="M225 80 L375 80 L475 130 L430 235
             L440 585 Q300 610 160 585
             L170 235 L125 130 Z"
          fill="url(#fabric)"
          pointer-events="none"
        />

        <!-- ВОРОТ -->
        <path
          d="M230 80 Q300 165 370 80"
          fill="none"
          stroke="${c.collar}"
          stroke-width="24"
          stroke-linecap="round"
        />

        <path
          d="M245 83 Q300 145 355 83"
          fill="none"
          stroke="#ffffff"
          stroke-opacity=".65"
          stroke-width="3"
        />

        <!-- МАНЖЕТЫ -->
        <path
          d="M78 265 L137 298 L128 320 L65 288 Z"
          fill="${c.cuffs}"
        />

        <path
          d="M522 265 L463 298 L472 320 L535 288 Z"
          fill="${c.cuffs}"
        />

        <!-- НИЗ -->
        <path
          d="M160 568 Q300 592 440 568 L440 585
             Q300 610 160 585 Z"
          fill="${c.hem}"
        />

        <!-- ТЕКСТУРА РУКАВОВ -->
        <path d="M220 95 L130 130 L70 270"
          fill="none" stroke="url(#sleeveShade)"
          stroke-width="15"/>

        <path d="M380 95 L470 130 L530 270"
          fill="none" stroke="url(#sleeveShade)"
          stroke-width="15"/>

        <!-- ПЕРЕДНЯЯ СТОРОНА -->
        ${front ? `
          <path d="M220 100 L300 155 L380 100"
            fill="none" stroke="#ffffff"
            stroke-opacity=".35" stroke-width="3"/>

          <path d="M300 155 L300 565"
            fill="none" stroke="#000000"
            stroke-opacity=".07" stroke-width="2"/>

          <path d="M175 210 L195 380"
            fill="none" stroke="#ffffff"
            stroke-opacity=".18" stroke-width="5"/>

          <path d="M425 210 L405 380"
            fill="none" stroke="#ffffff"
            stroke-opacity=".18" stroke-width="5"/>

          <g opacity=".15" stroke="#ffffff" fill="none" stroke-width="4">
            <path d="M160 250 Q190 330 170 430"/>
            <path d="M440 250 Q410 330 430 430"/>
          </g>
        ` : `
          <path d="M220 100 L300 155 L380 100"
            fill="none" stroke="#ffffff"
            stroke-opacity=".35" stroke-width="3"/>
          <path d="M300 160 L300 565"
            fill="none" stroke="#000000"
            stroke-opacity=".05" stroke-width="2"/>
        `}
      </g>
    `;
  }

  function shortsSVG(c) {
    return `
      <g stroke-linejoin="round">

        <path class="garment-base"
          fill="${c.shorts}"
          d="M130 90 L470 90 L455 570 L330 570
             L300 330 L270 570 L145 570 Z"/>

        <path d="M130 90 L470 90 L455 570 L330 570
             L300 330 L270 570 L145 570 Z"
          fill="url(#fabric)"/>

        <path d="M130 90 Q300 120 470 90"
          fill="none" stroke="#a4a4aa" stroke-width="8"/>

        <path d="M270 570 L300 330 L330 570"
          fill="none" stroke="#000000" stroke-opacity=".3"
          stroke-width="4"/>

        <path d="M160 160 L180 520"
          stroke="${c.cuffs}" stroke-width="17" fill="none"/>

        <path d="M440 160 L420 520"
          stroke="${c.cuffs}" stroke-width="17" fill="none"/>

        <path d="M145 540 L270 540 L267 570 L145 570 Z"
          fill="${c.hem}"/>

        <path d="M330 540 L455 540 L455 570 L333 570 Z"
          fill="${c.hem}"/>

        <path d="M130 90 L470 90"
          stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/>
      </g>
    `;
  }

  function socksSVG(c) {
    return `
      <g stroke-linejoin="round">

        <path class="garment-base"
          fill="${c.socks}"
          d="M180 75 L280 75 L270 540
             Q260 585 215 585
             Q180 585 180 550 Z"/>

        <path class="garment-base"
          fill="${c.socks}"
          d="M320 75 L420 75 L420 550
             Q420 585 385 585
             Q340 585 330 540 Z"/>

        <path d="M180 75 L280 75 L278 115 L182 115 Z"
          fill="${c.collar}"/>

        <path d="M320 75 L420 75 L418 115 L322 115 Z"
          fill="${c.collar}"/>

        <path d="M180 455 L270 455 L268 495 L180 495 Z"
          fill="${c.cuffs}"/>

        <path d="M330 455 L420 455 L420 495 L332 495 Z"
          fill="${c.cuffs}"/>

        <path d="M180 495 L268 495 L265 520 L180 520 Z"
          fill="${c.body}"/>

        <path d="M332 495 L420 495 L420 520 L332 520 Z"
          fill="${c.body}"/>

        <path d="M180 550 Q220 570 270 540"
          fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/>

        <path d="M330 540 Q380 570 420 550"
          fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="3"/>
      </g>
    `;
  }

  function patternSVG() {
    const color = state.patternColor;
    const width = Number(state.patternWidth);

    let pattern = "";

    switch (state.pattern) {
      case "vertical":
        pattern = `
          <path d="M260 80 V590 M340 80 V590"
            stroke="${color}" stroke-width="${width}"
            fill="none" opacity=".9"/>
        `;
        break;

      case "horizontal":
        pattern = `
          <path d="M150 250 H450 M150 470 H450"
            stroke="${color}" stroke-width="${width}"
            fill="none" opacity=".9"/>
        `;
        break;

      case "chevron":
        pattern = `
          <path d="M180 200 L300 290 L420 200
                   M180 330 L300 420 L420 330"
            fill="none" stroke="${color}"
            stroke-width="${width}" opacity=".85"/>
        `;
        break;

      case "diagonal":
        pattern = `
          <path d="M150 400 L390 140 M200 480 L440 220"
            fill="none" stroke="${color}"
            stroke-width="${width}" opacity=".9"/>
        `;
        break;

      case "gradient":
        pattern = `
          <defs>
            <linearGradient id="customGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="${color}" stop-opacity=".05"/>
              <stop offset="50%" stop-color="${color}" stop-opacity=".65"/>
              <stop offset="100%" stop-color="${color}" stop-opacity=".05"/>
            </linearGradient>
          </defs>
          <path d="M150 100 H450 V590 H150 Z"
            fill="url(#customGradient)"/>
        `;
        break;
    }

    if (!pattern || state.pattern === "clean") return "";

    return `
      <g clip-path="url(#bodyClip)" pointer-events="none">
        ${pattern}
      </g>
    `;
  }

  function layerMarkup(layer) {
    const x = Number(layer.x);
    const y = Number(layer.y);
    const scale = Number(layer.scale || 1);
    const width = Number(layer.width || 110);
    const height = Number(layer.height || 65);

    let content = "";

    if (layer.type === "text") {
      content = `
        <text
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="${esc(layer.font || "Arial")}"
          font-size="${Number(layer.fontSize || 30)}"
          font-weight="${Number(layer.weight || 800)}"
          fill="${esc(layer.color || "#ffffff")}"
          stroke="${esc(layer.outline || "#111827")}"
          stroke-width="${Number(layer.strokeWidth || 1.5)}"
          paint-order="stroke fill"
        >${esc(layer.text)}</text>
      `;
    }

    if (layer.type === "image") {
      content = `
        <image
          href="${layer.src}"
          x="${-width / 2}"
          y="${-height / 2}"
          width="${width}"
          height="${height}"
          preserveAspectRatio="xMidYMid meet"
        />
      `;
    }

    if (layer.type === "shape") {
      if (layer.shape === "circle") {
        content = `<circle r="35" fill="${esc(layer.color)}"/>`;
      }

      if (layer.shape === "star") {
        content = `
          <path d="M0 -42 L11 -13 L42 -13 L17 6
                   L27 38 L0 20 L-27 38 L-17 6
                   L-42 -13 L-11 -13 Z"
            fill="${esc(layer.color)}"/>
        `;
      }

      if (layer.shape === "shield") {
        content = `
          <path d="M-35 -38 L35 -38 L32 12
                   Q0 50 -32 12 Z"
            fill="${esc(layer.color)}"/>
        `;
      }

      if (layer.shape === "stripe") {
        content = `
          <rect x="-55" y="-12" width="110" height="24"
            rx="4" fill="${esc(layer.color)}"/>
        `;
      }
    }

    if (layer.type === "pattern") {
      content = `
        <rect x="-180" y="-40" width="360" height="80"
          fill="none" stroke="${esc(layer.color)}"
          stroke-width="${Number(layer.width || 12)}"/>
      `;
    }

    return `
      <g
        class="design-layer ${state.selected === layer.id ? "selected" : ""}"
        data-id="${esc(layer.id)}"
        transform="translate(${x} ${y}) scale(${scale})"
      >
        ${content}
        <rect class="layer-hit"
          x="${-Math.max(width, 100) / 2}"
          y="${-Math.max(height, 60) / 2}"
          width="${Math.max(width, 100)}"
          height="${Math.max(height, 60)}"
        />
        ${state.selected === layer.id ? `
          <rect class="selection-box"
            x="${-Math.max(width, 100) / 2}"
            y="${-Math.max(height, 60) / 2}"
            width="${Math.max(width, 100)}"
            height="${Math.max(height, 60)}"
          />
        ` : ""}
      </g>
    `;
  }

  function render() {
    holder.innerHTML = getGarmentSVG();

    const group = $("#designLayers");

    group.innerHTML = state.layers.map(layerMarkup).join("");

    bindLayerEvents();

    $("#viewLabel").textContent =
      state.product.toUpperCase() + " / " +
      (state.view === "front" ? "ПЕРЕД" : "СПИНА");

    holder.style.transform = `scale(${state.zoom})`;

    renderLayers();
    updateColorButtons();
  }

  function renderLayers() {
    const container = $("#layersList");

    if (!state.layers.length) {
      container.innerHTML =
        '<div class="empty-layers">Пока нет дополнительных слоёв</div>';
      return;
    }

    container.innerHTML = state.layers.map(layer => {
      const thumb = layer.type === "image"
        ? `<img src="${layer.src}" alt="">`
        : layer.type === "text"
        ? "T"
        : layer.type === "pattern"
        ? "▥"
        : "✦";

      return `
        <div class="layer-item ${state.selected === layer.id ? "active" : ""}"
             data-layer="${esc(layer.id)}">
          <div class="layer-thumb">${thumb}</div>
          <span class="layer-name">${esc(layer.name)}</span>
          <button data-layer-up="${esc(layer.id)}" title="Вверх">↑</button>
          <button data-layer-down="${esc(layer.id)}" title="Вниз">↓</button>
          <button data-layer-delete="${esc(layer.id)}" title="Удалить">×</button>
        </div>
      `;
    }).join("");
  }

  function updateColorButtons() {
    $$(".color-target").forEach(button => {
      const key = button.dataset.color;
      button.classList.toggle("active", key === state.target);

      const swatch = $("i", button);
      swatch.style.background = state.colors[key];
    });
  }

  function syncControls() {
    const color = state.colors[state.target] || "#ffffff";
    const rgb = hexToRgb(color);

    $("#nativeColor").value = color;
    $("#colorName").textContent = colorNames[state.target];
    $("#colorHex").textContent = color.toUpperCase();

    $("#redRange").value = rgb.r;
    $("#greenRange").value = rgb.g;
    $("#blueRange").value = rgb.b;

    $("#rOut").textContent = rgb.r;
    $("#gOut").textContent = rgb.g;
    $("#bOut").textContent = rgb.b;

    $$(".product-tabs button").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.product === state.product
      );
    });

    $$(".view-switch button").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === state.view
      );
    });

    $$(".pattern-card").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.pattern === state.pattern
      );
    });

    updateColorButtons();
  }

  // ЦВЕТА

  function setColor(color) {
    state.colors[state.target] = color.toUpperCase();

    syncControls();
    render();
  }

  $$(".color-target").forEach(button => {
    button.addEventListener("click", () => {
      state.target = button.dataset.color;
      syncControls();
    });
  });

  $("#nativeColor").addEventListener("input", e => {
    setColor(e.target.value);
  });

  ["red", "green", "blue"].forEach(channel => {
    $("#" + channel + "Range").addEventListener("input", () => {
      const r = Number($("#redRange").value);
      const g = Number($("#greenRange").value);
      const b = Number($("#blueRange").value);

      const color = rgbToHex(r, g, b);

      $("#rOut").textContent = r;
      $("#gOut").textContent = g;
      $("#bOut").textContent = b;

      setColor(color);
    });
  });

  $$(".presets button").forEach(button => {
    button.addEventListener("click", () => {
      setColor(button.dataset.value);
    });
  });

  // ПРОДУКТ И СТОРОНА

  $$(".product-tabs button").forEach(button => {
    button.addEventListener("click", () => {
      state.product = button.dataset.product;
      state.selected = null;
      syncControls();
      render();
      saveHistory();
    });
  });

  $$(".view-switch button").forEach(button => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      state.selected = null;
      syncControls();
      render();
    });
  });

  // УЗОРЫ

  $$(".pattern-card").forEach(button => {
    button.addEventListener("click", () => {
      state.pattern = button.dataset.pattern;
      syncControls();
      render();
      saveHistory();
    });
  });

  $("#patternColor").addEventListener("input", e => {
    state.patternColor = e.target.value;
  });

  $("#patternWidth").addEventListener("input", e => {
    state.patternWidth = Number(e.target.value);
  });

  $("#addPatternBtn").addEventListener("click", () => {
    if (state.pattern === "clean") {
      toast("Сначала выбери узор");
      return;
    }

    addLayer({
      type: "pattern",
      name: "Паттерн",
      x: 300,
      y: 330,
      width: 360,
      height: 80,
      color: state.patternColor,
      pattern: state.pattern,
      strokeWidth: state.patternWidth
    });
  });

  // ФИГУРЫ

  $$(".shape-btn").forEach(button => {
    button.addEventListener("click", () => {
      state.shape = button.dataset.shape;

      $$(".shape-btn").forEach(b =>
        b.classList.toggle("active", b === button)
      );
    });
  });

  $("#addShapeBtn").addEventListener("click", () => {
    addLayer({
      type: "shape",
      name: "Фигура",
      shape: state.shape,
      color: $("#patternColor").value,
      x: 300,
      y: 330,
      width: 100,
      height: 90
    });
  });

  // ТЕКСТ

  $("#addTextBtn").addEventListener("click", () => {
    const team = $("#teamName").value.trim();
    const player = $("#playerName").value.trim();
    const number = $("#playerNumber").value.trim();

    if (!team && !player && !number) {
      toast("Сначала введи текст или номер");
      return;
    }

    if (team) {
      addLayer({
        type: "text",
        name: "Название команды",
        text: team,
        x: 300,
        y: 270,
        font: state.fontFamily,
        fontSize: 30,
        color: $("#textColor").value,
        outline: $("#outlineColor").value,
        strokeWidth: 1.5
      });
    }

    if (player) {
      addLayer({
        type: "text",
        name: "Фамилия",
        text: player.toUpperCase(),
        x: 300,
        y: 260,
        font: state.fontFamily,
        fontSize: 30,
        color: $("#textColor").value,
        outline: $("#outlineColor").value,
        strokeWidth: 2
      });
    }

    if (number !== "") {
      addLayer({
        type: "text",
        name: "Номер " + number,
        text: number,
        x: 300,
        y: 390,
        font: state.fontFamily,
        fontSize: 100,
        color: $("#textColor").value,
        outline: $("#outlineColor").value,
        strokeWidth: 5
      });
    }
  });

  // ЗАГРУЗКА ШРИФТА

  $("#fontUpload").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;

    const data = await readFile(file);

    const fontName = "CustomFont" + Date.now();

    try {
      const face = new FontFace(fontName, `url(${data})`);
      await face.load();
      document.fonts.add(face);

      state.fontFamily = fontName;
      state.fontData = data;

      toast("Шрифт загружен!");
    } catch (error) {
      console.error(error);
      toast("Не удалось загрузить шрифт");
    }
  });

  // ЗАГРУЗКА ИЗОБРАЖЕНИЙ

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  function uploadImage(inputId, name) {
    $("#" + inputId).addEventListener("change", async e => {
      const file = e.target.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast("Выбери файл изображения");
        return;
      }

      const data = await readFile(file);

      addLayer({
        type: "image",
        name,
        src: data,
        x: 300,
        y: 300,
        width: 130,
        height: 100
      });

      e.target.value = "";
    });
  }

  uploadImage("logoUpload", "Логотип");
  uploadImage("sponsorUpload", "Спонсор");

  // СЛОИ

  function addLayer(data) {
    const layer = {
      id: makeId(),
      scale: 1,
      ...data
    };

    state.layers.push(layer);
    state.selected = layer.id;

    render();
    saveHistory();
    toast("Элемент добавлен");
  }

  function bindLayerEvents() {
    $$(".design-layer").forEach(element => {
      element.addEventListener("pointerdown", e => {
        const id = element.dataset.id;

        state.selected = id;

        const layer = state.layers.find(item => item.id === id);
        if (!layer) return;

        dragging = element;
        dragStart = {
          x: e.clientX,
          y: e.clientY,
          originalX: layer.x,
          originalY: layer.y
        };

        element.setPointerCapture(e.pointerId);

        renderLayers();
        renderSelection();
      });

      element.addEventListener("pointermove", e => {
        if (!dragging || dragging !== element || !dragStart) return;

        const layer = state.layers.find(
          item => item.id === element.dataset.id
        );

        if (!layer) return;

        const svg = $("#garmentSVG");
        const rect = svg.getBoundingClientRect();

        const dx = (e.clientX - dragStart.x) / rect.width * 600;
        const dy = (e.clientY - dragStart.y) / rect.height * 650;

        layer.x = Math.round(dragStart.originalX + dx);
        layer.y = Math.round(dragStart.originalY + dy);

        element.setAttribute(
          "transform",
          `translate(${layer.x} ${layer.y}) scale(${layer.scale})`
        );
      });

      element.addEventListener("pointerup", () => {
        if (!dragging) return;

        dragging = null;
        dragStart = null;

        render();
        saveHistory();
      });

      element.addEventListener("pointercancel", () => {
        dragging = null;
        dragStart = null;
      });
    });
  }

  function renderSelection() {
    const group = $("#designLayers");
    if (!group) return;

    const layer = state.layers.find(
      item => item.id === state.selected
    );

    if (!layer) return;

    render();
  }

  $("#layersList").addEventListener("click", e => {
    const up = e.target.closest("[data-layer-up]");
    const down = e.target.closest("[data-layer-down]");
    const del = e.target.closest("[data-layer-delete]");
    const item = e.target.closest("[data-layer]");

    if (up) {
      moveLayer(up.dataset.layerUp, 1);
      return;
    }

    if (down) {
      moveLayer(down.dataset.layerDown, -1);
      return;
    }

    if (del) {
      deleteLayer(del.dataset.layerDelete);
      return;
    }

    if (item) {
      state.selected = item.dataset.layer;
      render();
    }
  });

  function moveLayer(id, direction) {
    const index = state.layers.findIndex(layer => layer.id === id);

    if (index < 0) return;

    const newIndex = Math.max(
      0,
      Math.min(state.layers.length - 1, index + direction)
    );

    const [layer] = state.layers.splice(index, 1);
    state.layers.splice(newIndex, 0, layer);

    state.selected = id;

    render();
    saveHistory();
  }

  function deleteLayer(id) {
    state.layers = state.layers.filter(layer => layer.id !== id);

    if (state.selected === id) state.selected = null;

    render();
    saveHistory();
    toast("Элемент удалён");
  }

  $("#deleteLayerBtn").addEventListener("click", () => {
    if (!state.selected) {
      toast("Выбери слой");
      return;
    }

    deleteLayer(state.selected);
  });

  $("#bringFrontBtn").addEventListener("click", () => {
    if (!state.selected) {
      toast("Выбери слой");
      return;
    }

    const index = state.layers.findIndex(
      layer => layer.id === state.selected
    );

    if (index < 0) return;

    const [layer] = state.layers.splice(index, 1);
    state.layers.push(layer);

    render();
    saveHistory();
  });

  // ГАЛЕРЕЯ

  function renderGallery() {
    const container = $("#galleryGrid");

    if (!state.gallery.length) {
      container.innerHTML =
        '<div class="empty-layers">Галерея пока пуста</div>';
      return;
    }

    container.innerHTML = state.gallery.map((item, index) => `
      <div class="gallery-item">
        ${item.type === "image"
          ? `<img src="${item.src}" alt="">`
          : `<div class="gallery-symbol">✦</div>`
        }
        <button data-gallery="${index}">
          ${esc(item.name)}
        </button>
      </div>
    `).join("");
  }

  $("#saveElementBtn").addEventListener("click", () => {
    const layer = state.layers.find(
      item => item.id === state.selected
    );

    if (!layer) {
      toast("Сначала выбери слой");
      return;
    }

    const copy = JSON.parse(JSON.stringify(layer));
    copy.id = makeId();

    state.gallery.push(copy);

    try {
      localStorage.setItem(
        "jerseyLabGallery",
        JSON.stringify(state.gallery)
      );
    } catch {
      toast("Недостаточно места для галереи");
      return;
    }

    renderGallery();
    toast("Сохранено в галерею");
  });

  $("#galleryGrid").addEventListener("click", e => {
    const button = e.target.closest("[data-gallery]");
    if (!button) return;

    const item = state.gallery[Number(button.dataset.gallery)];

    if (!item) return;

    const copy = JSON.parse(JSON.stringify(item));
    copy.id = makeId();
    copy.x = 300;
    copy.y = 330;

    state.layers.push(copy);
    state.selected = copy.id;

    render();
    saveHistory();
    toast("Элемент добавлен из галереи");
  });

  // СЕТКА И МАСШТАБ

  $("#gridBtn").addEventListener("click", () => {
    state.grid = !state.grid;
    stage.classList.toggle("grid-on", state.grid);
  });

  $("#centerBtn").addEventListener("click", () => {
    state.zoom = 1;
    holder.style.transform = "scale(1)";
  });

  $("#zoomIn").addEventListener("click", () => {
    state.zoom = Math.min(1.5, state.zoom + 0.1);
    holder.style.transform = `scale(${state.zoom})`;
  });

  $("#zoomOut").addEventListener("click", () => {
    state.zoom = Math.max(0.6, state.zoom - 0.1);
    holder.style.transform = `scale(${state.zoom})`;
  });

  // СОХРАНЕНИЕ ПРОЕКТА

  function projectData() {
    return {
      version: 1,
      colors: state.colors,
      layers: state.layers,
      gallery: state.gallery,
      product: state.product,
      view: state.view,
      pattern: state.pattern,
      patternColor: state.patternColor,
      patternWidth: state.patternWidth,
      fontFamily: state.fontFamily,
      fontData: state.fontData,
      teamName: $("#teamName").value,
      playerName: $("#playerName").value,
      playerNumber: $("#playerNumber").value,
      textColor: $("#textColor").value,
      outlineColor: $("#outlineColor").value
    };
  }

  function applyProject(data) {
    if (!data) return;

    state.colors = {
      ...state.colors,
      ...(data.colors || {})
    };

    state.layers = data.layers || [];
    state.gallery = data.gallery || [];
    state.product = data.product || "jersey";
    state.view = data.view || "front";
    state.pattern = data.pattern || "clean";
    state.patternColor = data.patternColor || "#f2a900";
    state.patternWidth = data.patternWidth || 14;
    state.fontFamily = data.fontFamily || "Arial";
    state.fontData = data.fontData || null;

    $("#teamName").value = data.teamName || "";
    $("#playerName").value = data.playerName || "";
    $("#playerNumber").value = data.playerNumber || "97";
    $("#textColor").value = data.textColor || "#ffffff";
    $("#outlineColor").value = data.outlineColor || "#111827";

    if (state.fontData && state.fontFamily !== "Arial") {
      const face = new FontFace(
        state.fontFamily,
        `url(${state.fontData})`
      );

      face.load().then(font => document.fonts.add(font)).catch(() => {});
    }

    syncControls();
    render();
    renderGallery();
  }

  $("#saveProjectBtn").addEventListener("click", () => {
    try {
      localStorage.setItem(
        "jerseyLabProject",
        JSON.stringify(projectData())
      );

      localStorage.setItem(
        "jerseyLabGallery",
        JSON.stringify(state.gallery)
      );

      toast("Проект сохранён на устройстве");
    } catch (error) {
      console.error(error);
      toast("Не удалось сохранить. Возможно, слишком много изображений.");
    }
  });

  // ЭКСПОРТ PNG

  async function exportPNG() {
    const svg = $("#garmentSVG");

    if (!svg) return;

    try {
      const clone = svg.cloneNode(true);

      clone.setAttribute("xmlns", SVG);
      clone.setAttribute("width", "1200");
      clone.setAttribute("height", "1300");

      clone.querySelectorAll(".selection-box").forEach(el => el.remove());

      clone.querySelectorAll(".design-layer").forEach(el => {
        el.classList.remove("selected");
      });

      const source = new XMLSerializer().serializeToString(clone);

      const blob = new Blob(
        [source],
        { type: "image/svg+xml;charset=utf-8" }
      );

      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");

        canvas.width = 1200;
        canvas.height = 1300;

        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(result => {
          if (!result) {
            toast("Не удалось создать PNG");
            URL.revokeObjectURL(url);
            return;
          }

          const downloadUrl = URL.createObjectURL(result);
          const link = document.createElement("a");

          link.href = downloadUrl;
          link.download =
            `jersey-lab-${state.product}-${state.view}.png`;

          link.click();

          URL.revokeObjectURL(url);
          URL.revokeObjectURL(downloadUrl);

          toast("PNG готов!");
        }, "image/png");
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        toast("Ошибка экспорта изображения");
      };

      image.src = url;

    } catch (error) {
      console.error(error);
      toast("Ошибка экспорта");
    }
  }

  $("#savePngBtn").addEventListener("click", exportPNG);
  $("#mobileSaveBtn").addEventListener("click", exportPNG);

  // ИСТОРИЯ

  $("#undoBtn").addEventListener("click", () => {
    if (state.historyIndex <= 0) {
      toast("Нет предыдущих действий");
      return;
    }

    restoreHistory(state.historyIndex - 1);
  });

  $("#redoBtn").addEventListener("click", () => {
    if (state.historyIndex >= state.history.length - 1) {
      toast("Нет следующих действий");
      return;
    }

    restoreHistory(state.historyIndex + 1);
  });

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Сбросить текущий дизайн?")) return;

    state.colors = {
      body: "#ffffff",
      sleeves: "#ffffff",
      collar: "#071d3b",
      cuffs: "#071d3b",
      hem: "#071d3b",
      shorts: "#17171c",
      socks: "#f2a900"
    };

    state.layers = [];
    state.selected = null;
    state.pattern = "clean";
    state.product = "jersey";
    state.view = "front";
    state.zoom = 1;

    syncControls();
    render();
    saveHistory();

    toast("Дизайн сброшен");
  });

  // ЗАГРУЗКА СОХРАНЁННОГО ПРОЕКТА

  try {
    const saved = localStorage.getItem("jerseyLabProject");
    const savedGallery = localStorage.getItem("jerseyLabGallery");

    if (saved) {
      applyProject(JSON.parse(saved));
    }

    if (savedGallery) {
      state.gallery = JSON.parse(savedGallery);
      renderGallery();
    }
  } catch (error) {
    console.error("Ошибка загрузки сохранения:", error);
  }

  // СТАРТ

  syncControls();
  render();
  renderGallery();

  saveHistory();

})();
