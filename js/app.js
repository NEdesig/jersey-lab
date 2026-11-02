

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const svg = $("jerseyCanvas");

  const STORAGE_KEY = "hockey_jersey_lab_v1";

  const presets = {
    white: ["#f5f5f5", "#101010", "#101010", "#ffffff"],
    black: ["#151515", "#ffffff", "#ffffff", "#151515"],
    navy: ["#00234c", "#ffffff", "#e1ad32", "#00234c"],
    red: ["#c51e30", "#ffffff", "#111111", "#c51e30"],
    orange: ["#f07813", "#ffffff", "#171717", "#f07813"],
    green: ["#176c3a", "#ffffff", "#e5c34b", "#176c3a"],
    purple: ["#6534a5", "#ffffff", "#e5c9ff", "#6534a5"],
    yellow: ["#f2c94c", "#111111", "#ffffff", "#f2c94c"]
  };

  const state = {
    product: "jersey",
    model: "game",
    view: "front",
    collar: "crew",
    pattern: "none",
    patternScale: 30,
    patternOpacity: 35,
    patternColor: "#111111",
    colors: {
      body: "#f5f5f5",
      sleeves: "#f5f5f5",
      collar: "#101010",
      cuffs: "#101010",
      hem: "#101010",
      stripes: "#ffffff",
      pants: "#151515",
      socks: "#f07813"
    },
    playerName: "PLAYER",
    playerNumber: "97",
    teamName: "YOUR TEAM",
    font: "Arial, sans-serif",
    fontFace: "",
    layers: [],
    gallery: [],
    selectedLayer: null,
    nextId: 1,
    history: []
  };

  let drag = null;
  let toastTimer = null;

  const esc = (str) => String(str).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
  }

  function markChanged() {
    $("saveStatus").textContent = "● ЕСТЬ ИЗМЕНЕНИЯ";
    $("saveStatus").style.color = "#f2b35b";
  }

  function snapshot() {
    state.history.push(JSON.stringify({
      colors: state.colors,
      model: state.model,
      collar: state.collar,
      pattern: state.pattern,
      patternScale: state.patternScale,
      patternOpacity: state.patternOpacity,
      patternColor: state.patternColor,
      layers: state.layers,
      playerName: state.playerName,
      playerNumber: state.playerNumber,
      teamName: state.teamName
    }));

    if (state.history.length > 30) state.history.shift();
  }

  function getClipShape() {
    if (state.product === "jersey") {
      return `
        <path id="garmentClip" d="
          M190 105
          L240 69 Q300 39 360 69
          L410 105 L505 149
          L463 267 L417 245
          L411 557 Q300 582 189 557
          L183 245 L137 267 L95 149 Z"/>
      `;
    }

    if (state.product === "pants") {
      return `
        <path id="garmentClip" d="
          M180 75 Q300 48 420 75
          L402 360 L350 370 L300 300
          L250 370 L198 360 Z"/>
      `;
    }

    return `
      <path id="garmentClip" d="
        M195 55 L405 55 L392 570
        Q300 590 208 570 Z"/>
    `;
  }

  function collarSVG() {
    const c = state.colors.collar;
    const inner = state.colors.body;

    if (state.collar === "v") {
      return `
        <path d="M245 67 Q300 100 355 67 L338 117 L300 145 L262 117 Z"
          fill="${c}" stroke="#777" stroke-width="2"/>
        <path d="M264 82 L300 120 L336 82 L327 110 L300 136 L273 110 Z"
          fill="${inner}"/>
      `;
    }

    if (state.collar === "referee" || state.model === "referee") {
      return `
        <path d="M240 69 Q300 112 360 69 L348 115
          Q300 154 252 115 Z"
          fill="${c}" stroke="#555" stroke-width="2"/>
        <path d="M255 82 Q300 118 345 82 L338 108
          Q300 138 262 108 Z"
          fill="${inner}"/>
        <path d="M287 122 L313 122 L313 146 L287 146 Z"
          fill="${c}"/>
      `;
    }

    if (state.collar === "lace") {
      return `
        <path d="M240 69 Q300 108 360 69 L347 117
          Q300 151 253 117 Z"
          fill="${c}" stroke="#555" stroke-width="2"/>
        <path d="M260 85 Q300 120 340 85 L333 109
          Q300 135 267 109 Z"
          fill="${inner}"/>
        <path d="M291 118 L300 139 L309 118 M295 125 L305 125"
          fill="none" stroke="#fff" stroke-width="3"/>
      `;
    }

    return `
      <path d="M240 69 Q300 105 360 69 L348 111
        Q300 146 252 111 Z"
        fill="${c}" stroke="#555" stroke-width="2"/>
      <path d="M258 83 Q300 116 342 83 L333 104
        Q300 131 267 104 Z"
        fill="${inner}"/>
    `;
  }

  function stripePattern() {
    const scale = Number(state.patternScale);
    const color = state.patternColor;
    const opacity = Number(state.patternOpacity) / 100;

    if (state.pattern === "none") return "";

    const patterns = {
      stripes: `
        <pattern id="fabricPattern" width="${scale}" height="${scale}"
          patternUnits="userSpaceOnUse">
          <rect width="${scale}" height="${scale}" fill="transparent"/>
          <rect width="${scale}" height="${Math.max(3, scale * .23)}"
            fill="${color}" opacity="${opacity}"/>
        </pattern>
      `,
      vertical: `
        <pattern id="fabricPattern" width="${scale}" height="${scale}"
          patternUnits="userSpaceOnUse">
          <rect width="${scale}" height="${scale}" fill="transparent"/>
          <rect width="${Math.max(3, scale * .22)}" height="${scale}"
            fill="${color}" opacity="${opacity}"/>
        </pattern>
      `,
      diagonal: `
        <pattern id="fabricPattern" width="${scale}" height="${scale}"
          patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="${scale}" height="${scale}" fill="transparent"/>
          <rect width="${Math.max(3, scale * .25)}" height="${scale}"
            fill="${color}" opacity="${opacity}"/>
        </pattern>
      `,
      dots: `
        <pattern id="fabricPattern" width="${scale}" height="${scale}"
          patternUnits="userSpaceOnUse">
          <circle cx="${scale / 2}" cy="${scale / 2}"
            r="${Math.max(1, scale * .13)}"
            fill="${color}" opacity="${opacity}"/>
        </pattern>
      `,
      checker: `
        <pattern id="fabricPattern" width="${scale}" height="${scale}"
          patternUnits="userSpaceOnUse">
          <rect width="${scale / 2}" height="${scale / 2}"
            fill="${color}" opacity="${opacity}"/>
          <rect x="${scale / 2}" y="${scale / 2}"
            width="${scale / 2}" height="${scale / 2}"
            fill="${color}" opacity="${opacity}"/>
        </pattern>
      `,
      chevron: `
        <pattern id="fabricPattern" width="${scale * 2}" height="${scale}"
          patternUnits="userSpaceOnUse">
          <path d="M0 0 L${scale} ${scale / 2} L0 ${scale} M${scale} 0 L${scale * 2} ${scale / 2} L${scale} ${scale}"
            fill="none" stroke="${color}" stroke-width="3"
            opacity="${opacity}"/>
        </pattern>
      `,
      referee: `
        <pattern id="fabricPattern" width="${scale * 2}" height="${scale}"
          patternUnits="userSpaceOnUse">
          <rect width="${scale}" height="${scale}"
            fill="${color}" opacity="${opacity}"/>
        </pattern>
      `
    };

    return patterns[state.pattern] || "";
  }

  function jerseyBase() {
    const body = state.colors.body;
    const sleeves = state.colors.sleeves;
    const cuffs = state.colors.cuffs;
    const hem = state.colors.hem;
    const stripe = state.colors.stripes;

    const referee = state.model === "referee";

    return `
      <defs>
        <clipPath id="garmentClip">
          ${getClipShape()}
        </clipPath>
        ${stripePattern()}
      </defs>

      <g id="garment">
        <path d="
          M190 105 L240 69 Q300 39 360 69
          L410 105 L505 149 L463 267
          L417 245 L411 557 Q300 582 189 557
          L183 245 L137 267 L95 149 Z"
          fill="${body}" stroke="#777" stroke-width="3"/>

        <path d="M190 105 L95 149 L137 267 L183 245 L229 136 Z"
          fill="${sleeves}" stroke="#777" stroke-width="2"/>
        <path d="M410 105 L505 149 L463 267 L417 245 L371 136 Z"
          fill="${sleeves}" stroke="#777" stroke-width="2"/>

        <g clip-path="url(#garmentClip)">
          ${referee ? `
            <rect x="85" y="35" width="430" height="550"
              fill="url(#fabricPattern)"/>
            <rect x="85" y="35" width="430" height="550"
              fill="${state.pattern === "none" ? "transparent" : "url(#fabricPattern)"}"/>
          ` : state.pattern !== "none" ? `
            <rect x="85" y="35" width="430" height="550"
              fill="url(#fabricPattern)"/>
          ` : ""}
          ${referee ? `
            ${[0,1,2,3,4,5,6,7,8,9,10].map(i =>
              `<rect x="${105 + i * 40}" y="35" width="20" height="550" fill="#fff" opacity=".95"/>`
            ).join("")}
          ` : ""}
          <path d="M85 430 H515 V458 H85 Z" fill="${stripe}"/>
          <path d="M85 450 H515 V458 H85 Z" fill="${hem}"/>
          <path d="M85 235 H515 V258 H85 Z" fill="${stripe}"/>
          <path d="M85 258 H515 V267 H85 Z" fill="${cuffs}"/>
          <path d="M85 515 H515 V532 H85 Z" fill="${stripe}"/>
          <path d="M85 532 H515 V547 H85 Z" fill="${hem}"/>
          ${referee ? `
            <path d="M115 190 H180 V230 H115 Z" fill="#f18a21"/>
            <path d="M420 190 H485 V230 H420 Z" fill="#f18a21"/>
          ` : ""}
        </g>

        <path d="M95 149 L137 267 L183 245"
          fill="none" stroke="#777" stroke-width="3"/>
        <path d="M505 149 L463 267 L417 245"
          fill="none" stroke="#777" stroke-width="3"/>
        <path d="M190 105 Q300 145 410 105"
          fill="none" stroke="#777" stroke-width="2"/>
        <path d="M189 557 Q300 580 411 557"
          fill="none" stroke="${hem}" stroke-width="9"/>
        <path d="M95 149 L137 267" stroke="#aaa" stroke-width="2"/>
        <path d="M505 149 L463 267" stroke="#aaa" stroke-width="2"/>

        ${collarSVG()}

        ${state.view === "front" ? `
          <g id="playerInfo">
            ${!referee ? `
              <text x="300" y="360" text-anchor="middle"
                font-family="${esc(state.font)}"
                font-size="105" font-weight="900"
                fill="#fff" stroke="#111" stroke-width="5"
                paint-order="stroke">${esc(state.playerNumber)}</text>
              <text x="300" y="305" text-anchor="middle"
                font-family="${esc(state.font)}"
                font-size="25" font-weight="900"
                fill="#fff" stroke="#111" stroke-width="1.5"
                paint-order="stroke">${esc(state.teamName)}</text>
            ` : `
              <text x="300" y="350" text-anchor="middle"
                font-size="36" font-weight="900"
                fill="#fff" stroke="#111" stroke-width="2"
                paint-order="stroke">REFEREE</text>
            `}
          </g>
        ` : `
          <text x="300" y="230" text-anchor="middle"
            font-family="${esc(state.font)}"
            font-size="32" font-weight="900"
            fill="#fff" stroke="#111" stroke-width="2"
            paint-order="stroke">${esc(state.playerName)}</text>
          <text x="300" y="370" text-anchor="middle"
            font-family="${esc(state.font)}"
            font-size="125" font-weight="900"
            fill="#fff" stroke="#111" stroke-width="6"
            paint-order="stroke">${esc(state.playerNumber)}</text>
        `}
        ${state.view === "front" ? `
          <path d="M155 190 L170 190 L180 205 L170 220 L155 220 Z"
            fill="${cuffs}" opacity=".8"/>
          <path d="M445 190 L430 190 L420 205 L430 220 L445 220 Z"
            fill="${cuffs}" opacity=".8"/>
        ` : ""}
      </g>
    `;
  }

  function pantsBase() {
    const c = state.colors.pants;
    return `
      <g id="garment">
        <path d="M180 100 Q300 60 420 100
          L400 390 L340 400 L300 320
          L260 400 L200 390 Z"
          fill="${c}" stroke="#777" stroke-width="4"/>
        <path d="M180 100 Q300 60 420 100 L415 155
          Q300 180 185 155 Z"
          fill="#24242a" stroke="#777" stroke-width="3"/>
        <path d="M245 170 L220 385 M355 170 L380 385"
          stroke="${state.colors.stripes}" stroke-width="14"/>
        <path d="M260 400 L300 320 L340 400"
          fill="none" stroke="#444" stroke-width="3"/>
        <path d="M190 150 L410 150" stroke="#111" stroke-width="4"/>
      </g>
    `;
  }

  function socksBase() {
    const c = state.colors.socks;
    return `
      <g id="garment">
        <path d="M175 75 L285 75 L278 560
          Q230 585 190 560 Z"
          fill="${c}" stroke="#777" stroke-width="3"/>
        <path d="M315 75 L425 75 L410 560
          Q370 585 322 560 Z"
          fill="${c}" stroke="#777" stroke-width="3"/>
        <path d="M178 410 L282 410 L281 448 L176 448 Z"
          fill="${state.colors.stripes}"/>
        <path d="M320 410 L422 410 L420 448 L319 448 Z"
          fill="${state.colors.stripes}"/>
        <path d="M178 448 L282 448 L281 465 L176 465 Z"
          fill="${state.colors.cuffs}"/>
        <path d="M320 448 L422 448 L420 465 L319 465 Z"
          fill="${state.colors.cuffs}"/>
        <path d="M175 550 L280 550 L278 565 Q230 585 190 565 Z"
          fill="${state.colors.hem}"/>
        <path d="M320 550 L415 550 L410 565 Q370 585 322 565 Z"
          fill="${state.colors.hem}"/>
      </g>
    `;
  }

  function elementSVG(layer) {
    const x = layer.x;
    const y = layer.y;
    const rotation = layer.rotation || 0;
    const scale = layer.scale || 1;
    const color = layer.color || "#ffffff";
    const transform = `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`;

    if (layer.type === "image") {
      return `
        <g class="design-layer" data-id="${layer.id}"
          transform="${transform}">
          <image href="${layer.src}" x="-65" y="-45"
            width="130" height="90"
            preserveAspectRatio="xMidYMid meet"/>
          <rect x="-65" y="-45" width="130" height="90"
            fill="transparent" stroke="${state.selectedLayer === layer.id ? "#a99aff" : "transparent"}"
            stroke-width="2"/>
        </g>
      `;
    }

    if (layer.type === "text") {
      return `
        <g class="design-layer" data-id="${layer.id}"
          transform="${transform}">
          <text x="0" y="0" text-anchor="middle"
            font-family="${esc(layer.font || state.font)}"
            font-size="${layer.size || 42}"
            font-weight="900"
            fill="${color}" stroke="${layer.outline || "#111"}"
            stroke-width="1.5" paint-order="stroke">
            ${esc(layer.text)}
          </text>
        </g>
      `;
    }

    if (layer.type === "pattern") {
      const p = layer.pattern;
      const s = layer.size || 30;
      const opacity = (layer.opacity ?? 35) / 100;
      let shape = "";

      if (p === "stripes" || p === "referee") {
        shape = `<path d="M-150 -150 H-130 V150 H-150 Z M-80 -150 H-60 V150 H-80 Z M-10 -150 H10 V150 H-10 Z M60 -150 H80 V150 H60 Z M130 -150 H150 V150 H130 Z" fill="${color}"/>`;
      } else if (p === "dots") {
        shape = `<pattern id="layerPattern${layer.id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><circle cx="${s/2}" cy="${s/2}" r="${s/6}" fill="${color}"/></pattern><rect x="-150" y="-150" width="300" height="300" fill="url(#layerPattern${layer.id})"/>`;
      } else if (p === "chevron") {
        shape = `<path d="M-140 -120 L0 0 L-140 120 M0 -120 L140 0 L0 120" fill="none" stroke="${color}" stroke-width="10"/>`;
      } else if (p === "diagonal") {
        shape = `<path d="M-150 -150 L-130 -150 L150 130 L150 150 Z M-150 -70 L-130 -70 L70 150 L50 150 Z M-150 10 L-130 10 L-10 150 L-30 150 Z" fill="${color}"/>`;
      } else if (p === "checker") {
        shape = `<pattern id="layerPattern${layer.id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><rect width="${s/2}" height="${s/2}" fill="${color}"/><rect x="${s/2}" y="${s/2}" width="${s/2}" height="${s/2}" fill="${color}"/></pattern><rect x="-150" y="-150" width="300" height="300" fill="url(#layerPattern${layer.id})"/>`;
      }

      return `
        <g class="design-layer" data-id="${layer.id}"
          transform="${transform}" opacity="${opacity}">
          ${shape}
        </g>
      `;
    }

    let shape = "";

    if (layer.shape === "circle") {
      shape = `<circle cx="0" cy="0" r="40" fill="${color}"/>`;
    } else if (layer.shape === "star") {
      shape = `<path d="M0 -48 L13 -15 L48 -15 L20 8 L30 43 L0 23 L-30 43 L-20 8 L-48 -15 L-13 -15 Z" fill="${color}"/>`;
    } else if (layer.shape === "shield") {
      shape = `<path d="M-40 -45 H40 V15 Q30 40 0 55 Q-30 40 -40 15 Z" fill="${color}" stroke="#111" stroke-width="3"/>`;
    } else if (layer.shape === "stripe") {
      shape = `<rect x="-100" y="-12" width="200" height="24" rx="4" fill="${color}"/>`;
    } else if (layer.shape === "line") {
      shape = `<path d="M-100 0 H100" stroke="${color}" stroke-width="9"/>`;
    } else if (layer.shape === "armband") {
      shape = `<rect x="-55" y="-20" width="110" height="40" rx="5" fill="#f18a21" stroke="#222" stroke-width="3"/>`;
    } else if (layer.shape === "pocket") {
      shape = `<path d="M-35 -35 H35 V30 L0 45 L-35 30 Z" fill="${color}" stroke="#222" stroke-width="4"/>`;
    } else if (layer.shape === "shoulder") {
      shape = `<path d="M-100 -20 H100 V-5 H-100 Z M-100 10 H100 V25 H-100 Z" fill="${color}"/>`;
    }

    return `
      <g class="design-layer" data-id="${layer.id}"
        transform="${transform}">
        ${shape}
        <circle cx="0" cy="0" r="2" fill="transparent"/>
      </g>
    `;
  }

  function render() {
    const base = state.product === "jersey"
      ? jerseyBase()
      : state.product === "pants"
        ? pantsBase()
        : socksBase();

    const layers = state.layers
      .filter(layer => !layer.product || layer.product === state.product)
      .map(elementSVG).join("");

    svg.innerHTML = `
      <rect width="600" height="680" fill="transparent"/>
      ${base}
      <g id="designLayers">${layers}</g>
      <g id="selectionOutline"></g>
    `;

    $("garmentLabel").textContent =
      `${state.product.toUpperCase()} / ${state.view.toUpperCase()}`;

    $("layerList").innerHTML = state.layers.length
      ? state.layers.map(layer => `
        <div class="layer-item ${state.selectedLayer === layer.id ? "active" : ""}"
          data-layer="${layer.id}">
          <span>${layer.type === "image" ? "▧" : layer.type === "text" ? "T" : "◆"}</span>
          <span>${esc(layer.name || layer.text || layer.shape || "Элемент")}</span>
          <small>${layer.product === "all" ? "Все" : layer.product || state.product}</small>
        </div>
      `).join("")
      : `<div class="empty-state">Пока нет дополнительных слоёв</div>`;

    updateLayerControls();
    markChanged();
  }

  function updateLayerControls() {
    const layer = state.layers.find(l => l.id === state.selectedLayer);
    if (!layer) return;

    $("layerX").value = Math.round(layer.x);
    $("layerY").value = Math.round(layer.y);
    $("layerSize").value = Math.round((layer.scale || 1) * 100);
    $("layerRotation").value = layer.rotation || 0;
  }

  function addLayer(layer) {
    snapshot();
    layer.id = state.nextId++;
    layer.x = layer.x ?? 300;
    layer.y = layer.y ?? 330;
    layer.scale = layer.scale ?? 1;
    layer.rotation = layer.rotation ?? 0;
    layer.product = layer.product || state.product;
    state.layers.push(layer);
    state.selectedLayer = layer.id;
    render();
    openTab("layers");
  }

  function openTab(name) {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === name);
    });
    document.querySelectorAll(".tab-content").forEach(tab => {
      tab.classList.toggle("active", tab.id === `tab-${name}`);
    });
  }

  function setProduct(product) {
    state.product = product;
    document.querySelectorAll(".product").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.product === product);
    });
    state.selectedLayer = null;
    render();
  }

  function updateColorInputs(color) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    $("red").value = r;
    $("green").value = g;
    $("blue").value = b;
    $("redValue").textContent = r;
    $("greenValue").textContent = g;
    $("blueValue").textContent = b;
    $("hexColor").value = color.toUpperCase();
    $("colorPreview").style.background = color;
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(v =>
      Number(v).toString(16).padStart(2, "0")
    ).join("").toUpperCase();
  }

  function changeColor() {
    const color = rgbToHex(
      $("red").value,
      $("green").value,
      $("blue").value
    );
    updateColorInputs(color);
  }

  function applyColor() {
    const part = $("colorPart").value;
    let color = $("hexColor").value.trim();

    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      toast("Неверный HEX-код");
      return;
    }

    snapshot();
    state.colors[part] = color;
    render();
    toast("Цвет применён");
  }

  function applyPreset(name) {
    const colors = presets[name];
    if (!colors) return;

    snapshot();
    state.colors.body = colors[0];
    state.colors.sleeves = colors[0];
    state.colors.collar = colors[1];
    state.colors.cuffs = colors[1];
    state.colors.hem = colors[1];
    state.colors.stripes = colors[2];
    state.colors.pants = colors[3];
    state.colors.socks = colors[0];

    render();
    updateColorInputs(state.colors.body);
    toast("Цветовая схема применена");
  }

  function applyPattern() {
    const p = state.pattern;
    if (p === "none") {
      toast("Выбери узор");
      return;
    }

    addLayer({
      type: "pattern",
      name: "Паттерн: " + p,
      pattern: p,
      size: Number(state.patternScale),
      opacity: Number(state.patternOpacity),
      color: state.patternColor,
      product: state.product
    });

    toast("Узор добавлен");
  }

  function addText() {
    const text = $("customText").value.trim();
    if (!text) {
      toast("Сначала введи текст");
      return;
    }

    addLayer({
      type: "text",
      name: "Текст: " + text,
      text,
      size: Number($("textSize").value),
      font: $("fontSelect").value,
      color: "#ffffff",
      product: state.product
    });

    $("customText").value = "";
    toast("Текст добавлен");
  }

  function addDetail(shape) {
    const names = {
      stripe: "Полоса",
      shoulder: "Плечевые полосы",
      armband: "Оранжевая повязка",
      pocket: "Карман",
      star: "Звезда",
      circle: "Круг",
      shield: "Щит",
      line: "Линия"
    };

    addLayer({
      type: "shape",
      shape,
      name: names[shape] || "Деталь",
      color: shape === "armband" ? "#f18a21" : "#ffffff",
      product: state.product
    });

    toast("Деталь добавлена");
  }

  function readImage(file, callback) {
    if (!file || !file.type.startsWith("image/")) {
      toast("Выбери изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("Максимальный размер файла — 5 МБ");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.onerror = () => toast("Не удалось прочитать файл");
    reader.readAsDataURL(file);
  }

  function addImage(src, name) {
    addLayer({
      type: "image",
      src,
      name: name || "Логотип",
      product: state.product
    });
    toast("Изображение добавлено");
  }

  function selectLayer(id) {
    state.selectedLayer = Number(id);
    render();
  }

  function deleteSelected() {
    if (!state.selectedLayer) {
      toast("Выбери слой");
      return;
    }

    snapshot();
    state.layers = state.layers.filter(l => l.id !== state.selectedLayer);
    state.selectedLayer = null;
    render();
    toast("Слой удалён");
  }

  function changeLayer(property, value) {
    const layer = state.layers.find(l => l.id === state.selectedLayer);
    if (!layer) return;

    layer[property] = property === "scale"
      ? Number(value) / 100
      : Number(value);

    render();
  }

  function moveLayer(direction) {
    const index = state.layers.findIndex(l => l.id === state.selectedLayer);
    if (index < 0) return;

    const target = index + direction;
    if (target < 0 || target >= state.layers.length) return;

    snapshot();
    const [layer] = state.layers.splice(index, 1);
    state.layers.splice(target, 0, layer);
    render();
  }

  function saveProject() {
    try {
      const data = {
        ...state,
        history: [],
        fontFace: ""
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      $("saveStatus").textContent = "● СОХРАНЕНО";
      $("saveStatus").style.color = "#75d9a2";
      toast("Проект сохранён на устройстве");
    } catch (error) {
      toast("Не удалось сохранить. Возможно, слишком большие изображения");
    }
  }

  function loadProject() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      Object.assign(state, data);
      state.history = [];
      state.selectedLayer = null;
      render();
    } catch (error) {
      console.warn("Не удалось загрузить проект", error);
    }
  }

  function undo() {
    const previous = state.history.pop();
    if (!previous) {
      toast("Нет действий для отмены");
      return;
    }

    Object.assign(state, JSON.parse(previous));
    state.selectedLayer = null;
    render();
    toast("Последнее действие отменено");
  }

  function resetDesign() {
    if (!confirm("Сбросить текущий дизайн?")) return;

    snapshot();

    state.layers = [];
    state.selectedLayer = null;
    state.model = "game";
    state.collar = "crew";
    state.pattern = "none";
    state.colors = {
      body: "#f5f5f5",
      sleeves: "#f5f5f5",
      collar: "#101010",
      cuffs: "#101010",
      hem: "#101010",
      stripes: "#ffffff",
      pants: "#151515",
      socks: "#f07813"
    };

    render();
    toast("Дизайн сброшен");
  }

  function saveToGallery() {
    const layer = state.layers.find(l => l.id === state.selectedLayer);
    if (!layer) {
      toast("Сначала выбери элемент");
      return;
    }

    try {
      state.gallery.push(JSON.parse(JSON.stringify(layer)));
      localStorage.setItem(STORAGE_KEY + "_gallery", JSON.stringify(state.gallery));
      renderGallery();
      toast("Добавлено в галерею");
    } catch {
      toast("Не удалось сохранить элемент");
    }
  }

  function renderGallery() {
    $("galleryList").innerHTML = state.gallery.length
      ? state.gallery.map((item, index) => `
        <div class="gallery-item">
          <span>${esc(item.name || item.text || item.shape || "Элемент")}</span>
          <button data-gallery-add="${index}">ДОБАВИТЬ</button>
        </div>
      `).join("")
      : `<div class="empty-state">Галерея пока пуста</div>`;
  }

  function addGalleryItem(index) {
    const item = state.gallery[index];
    if (!item) return;

    const copy = JSON.parse(JSON.stringify(item));
    delete copy.id;
    copy.x = 300;
    copy.y = 330;
    copy.product = state.product;
    addLayer(copy);
    toast("Элемент добавлен из галереи");
  }

  function exportPNG() {
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1800");
    clone.setAttribute("height", "2040");

    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], {
      type: "image/svg+xml;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1800;
      canvas.height = 2040;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(png => {
        if (!png) {
          toast("Ошибка экспорта");
          URL.revokeObjectURL(url);
          return;
        }

        const link = document.createElement("a");
        link.download =
          `hockey-${state.product}-${state.view}.png`;
        link.href = URL.createObjectURL(png);
        link.click();

        URL.revokeObjectURL(link.href);
        URL.revokeObjectURL(url);
        toast("PNG экспортирован");
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast("Не удалось экспортировать изображение");
    };

    img.src = url;
  }

  function pointerPosition(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = point.matrixTransform(matrix.inverse());
    return { x: p.x, y: p.y };
  }

  svg.addEventListener("pointerdown", event => {
    const group = event.target.closest(".design-layer");
    if (!group) return;

    const id = Number(group.dataset.id);
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;

    state.selectedLayer = id;
    const pos = pointerPosition(event);
    if (!pos) return;

    drag = {
      id,
      offsetX: pos.x - layer.x,
      offsetY: pos.y - layer.y
    };

    svg.setPointerCapture(event.pointerId);
    render();
  });

  svg.addEventListener("pointermove", event => {
    if (!drag) return;

    const layer = state.layers.find(l => l.id === drag.id);
    const pos = pointerPosition(event);
    if (!layer || !pos) return;

    layer.x = Math.max(0, Math.min(600, pos.x - drag.offsetX));
    layer.y = Math.max(0, Math.min(680, pos.y - drag.offsetY));

    const group = svg.querySelector(`[data-id="${drag.id}"]`);
    if (group) {
      group.setAttribute(
        "transform",
        `translate(${layer.x} ${layer.y}) rotate(${layer.rotation || 0}) scale(${layer.scale || 1})`
      );
    }
  });

  function finishDrag() {
    if (!drag) return;
    drag = null;
    render();
  }

  svg.addEventListener("pointerup", finishDrag);
  svg.addEventListener("pointercancel", finishDrag);
  svg.addEventListener("lostpointercapture", finishDrag);

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => openTab(btn.dataset.tab));
  });

  document.querySelectorAll(".product").forEach(btn => {
    btn.addEventListener("click", () => setProduct(btn.dataset.product));
  });

  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      document.querySelectorAll("[data-view]").forEach(b =>
        b.classList.toggle("active", b === btn)
      );
      render();
    });
  });

  document.querySelectorAll("[data-model]").forEach(btn => {
    btn.addEventListener("click", () => {
      snapshot();
      state.model = btn.dataset.model;
      if (state.model === "referee") {
        state.collar = "referee";
        state.pattern = "referee";
        state.colors.body = "#ffffff";
        state.colors.sleeves = "#ffffff";
        state.colors.stripes = "#111111";
        state.colors.collar = "#111111";
        state.colors.cuffs = "#111111";
        state.colors.hem = "#111111";
      }
      document.querySelectorAll("[data-model]").forEach(b =>
        b.classList.toggle("selected", b === btn)
      );
      render();
      toast("Модель изменена");
    });
  });

  document.querySelectorAll("[data-collar]").forEach(btn => {
    btn.addEventListener("click", () => {
      snapshot();
      state.collar = btn.dataset.collar;
      document.querySelectorAll("[data-collar]").forEach(b =>
        b.classList.toggle("selected", b === btn)
      );
      render();
    });
  });

  document.querySelectorAll("[data-preset]").forEach(btn => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
  });

  document.querySelectorAll("[data-pattern]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.pattern = btn.dataset.pattern;
      document.querySelectorAll("[data-pattern]").forEach(b =>
        b.classList.toggle("selected", b === btn)
      );
    });
  });

  document.querySelectorAll("[data-detail]").forEach(btn => {
    btn.addEventListener("click", () => addDetail(btn.dataset.detail));
  });

  $("red").addEventListener("input", changeColor);
  $("green").addEventListener("input", changeColor);
  $("blue").addEventListener("input", changeColor);

  $("hexColor").addEventListener("input", event => {
    const value = event.target.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      updateColorInputs(value);
    }
  });

  $("applyColor").addEventListener("click", applyColor);

  $("colorPart").addEventListener("change", () => {
    updateColorInputs(state.colors[$("colorPart").value]);
  });

  $("applyPlayer").addEventListener("click", () => {
    snapshot();
    state.teamName = $("teamName").value.trim() || "YOUR TEAM";
    state.playerName = $("playerName").value.trim() || "PLAYER";
    state.playerNumber = $("playerNumber").value || "97";
    render();
    toast("Информация обновлена");
  });

  $("addPattern").addEventListener("click", () => {
    state.patternScale = Number($("patternScale").value);
    state.patternOpacity = Number($("patternOpacity").value);
    state.patternColor = $("patternColor").value;
    applyPattern();
  });

  $("patternScale").addEventListener("input", event => {
    $("patternScaleValue").textContent = event.target.value;
  });

  $("patternOpacity").addEventListener("input", event => {
    $("patternOpacityValue").textContent = event.target.value + "%";
  });

  $("textSize").addEventListener("input", event => {
    $("textSizeValue").textContent = event.target.value;
  });

  $("imageSize").addEventListener("input", event => {
    $("imageSizeValue").textContent = event.target.value + "%";
    const layer = state.layers.find(l => l.id === state.selectedLayer);
    if (layer && layer.type === "image") {
      layer.scale = Number(event.target.value) / 100;
      render();
    }
  });

  $("addText").addEventListener("click", addText);

  $("imageUpload").addEventListener("change", event => {
    const file = event.target.files[0];
    readImage(file, src => addImage(src, file.name));
    event.target.value = "";
  });

  $("galleryUpload").addEventListener("change", event => {
    Array.from(event.target.files).forEach(file => {
      readImage(file, src => {
        state.gallery.push({
          type: "image",
          src,
          name: file.name,
          product: "all"
        });
        localStorage.setItem(STORAGE_KEY + "_gallery", JSON.stringify(state.gallery));
        renderGallery();
      });
    });
    event.target.value = "";
  });

  $("fontUpload").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast("Шрифт слишком большой");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const name = "CustomFont" + Date.now();
      const style = document.createElement("style");
      style.textContent = `
        @font-face {
          font-family: "${name}";
          src: url("${reader.result}");
        }
      `;
      document.head.appendChild(style);

      state.font = name;
      const option = document.createElement("option");
      option.value = name;
      option.textContent = file.name;
      option.selected = true;
      $("fontSelect").appendChild(option);

      toast("Шрифт загружен");
      render();
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  });

  $("fontSelect").addEventListener("change", event => {
    state.font = event.target.value;
    render();
  });

  $("layerList").addEventListener("click", event => {
    const item = event.target.closest("[data-layer]");
    if (item) selectLayer(item.dataset.layer);
  });

  $("deleteLayer").addEventListener("click", deleteSelected);
  $("moveUp").addEventListener("click", () => moveLayer(1));
  $("moveDown").addEventListener("click", () => moveLayer(-1));

  $("layerX").addEventListener("input", e => changeLayer("x", e.target.value));
  $("layerY").addEventListener("input", e => changeLayer("y", e.target.value));
  $("layerSize").addEventListener("input", e => changeLayer("scale", e.target.value));
  $("layerRotation").addEventListener("input", e => changeLayer("rotation", e.target.value));

  $("saveBtn").addEventListener("click", saveProject);
  $("exportBtn").addEventListener("click", exportPNG);
  $("undoBtn").addEventListener("click", undo);
  $("resetBtn").addEventListener("click", resetDesign);

  $("saveToGallery").addEventListener("click", saveToGallery);

  $("galleryList").addEventListener("click", event => {
    const button = event.target.closest("[data-gallery-add]");
    if (button) addGalleryItem(Number(button.dataset.galleryAdd));
  });

  // Автоматическое сохранение галереи и загрузка проекта
  try {
    const gallery = localStorage.getItem(STORAGE_KEY + "_gallery");
    if (gallery) state.gallery = JSON.parse(gallery);
  } catch (error) {
    console.warn("Галерея недоступна", error);
  }

  loadProject();
  render();
  renderGallery();
  updateColorInputs(state.colors.body);

})();
