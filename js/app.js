(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const defaults = {
    main: "#f47a20",
    secondary: "#ffffff",
    accent: "#171717",
    pants: "#171717",
    socks: "#f47a20",
    pattern: "none",
    opacity: 28,
    team: "YOUR TEAM",
    name: "PLAYER",
    number: "19",
    textColor: "#ffffff",
    collar: "v",
    stripes: "classic",
    font: null,
    layers: [],
    selectedLayer: null
  };

  let state = structuredClone(defaults);
  let dragging = null;
  let toastTimer = null;

  const NS = "http://www.w3.org/2000/svg";

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function escapeXML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;"
    })[char]);
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const full = clean.length === 3
      ? clean.split("").map(x => x + x).join("")
      : clean;
    const num = parseInt(full, 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
  }

  function patternMarkup(id) {
    const c = state.accent;
    const opacity = Number(state.opacity) / 100;

    const patterns = {
      none: "",
      stripes: `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 0H18" stroke="${c}" stroke-width="5" opacity="${opacity}"/>
      </pattern>`,
      diagonal: `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M-5 20L20 -5 M5 25L25 5" stroke="${c}" stroke-width="5" opacity="${opacity}"/>
      </pattern>`,
      chevron: `<pattern id="${id}" width="36" height="30" patternUnits="userSpaceOnUse">
        <path d="M-18 0L0 15L18 0 M0 15L18 30L36 15" fill="none" stroke="${c}" stroke-width="4" opacity="${opacity}"/>
      </pattern>`,
      grid: `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 0H18 M0 0V18" fill="none" stroke="${c}" stroke-width="1.5" opacity="${opacity}"/>
      </pattern>`,
      dots: `<pattern id="${id}" width="15" height="15" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2.3" fill="${c}" opacity="${opacity}"/>
      </pattern>`,
      camo: `<pattern id="${id}" width="70" height="60" patternUnits="userSpaceOnUse">
        <path d="M2 8Q18 -5 29 12T50 10L62 27Q44 42 30 27T5 38Z" fill="${c}" opacity="${opacity}"/>
        <path d="M40 45Q55 25 68 45L57 60H36Z" fill="${c}" opacity="${opacity * .7}"/>
      </pattern>`,
      waves: `<pattern id="${id}" width="48" height="24" patternUnits="userSpaceOnUse">
        <path d="M-24 12Q-12 -2 0 12T24 12T48 12T72 12" fill="none" stroke="${c}" stroke-width="3" opacity="${opacity}"/>
      </pattern>`
    };

    return patterns[state.pattern] || "";
  }

  function stripeMarkup(x, y, width, height, rotate = 0) {
    if (state.stripes === "none") return "";

    const c = state.accent;
    const parts = state.stripes === "single"
      ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${c}"/>`
      : state.stripes === "double"
        ? `<rect x="${x}" y="${y}" width="${width}" height="${height * .27}" fill="${c}"/>
           <rect x="${x}" y="${y + height * .66}" width="${width}" height="${height * .27}" fill="${c}"/>`
        : `<rect x="${x}" y="${y}" width="${width}" height="${height * .2}" fill="${c}"/>
           <rect x="${x}" y="${y + height * .4}" width="${width}" height="${height * .2}" fill="${state.secondary}"/>
           <rect x="${x}" y="${y + height * .8}" width="${width}" height="${height * .2}" fill="${c}"/>`;

    return `<g transform="rotate(${rotate} ${x + width / 2} ${y + height / 2})">${parts}</g>`;
  }

  function collarMarkup() {
    const c = state.accent;
    if (state.collar === "round") {
      return `<path d="M160 78 Q200 117 240 78" fill="none" stroke="${c}" stroke-width="12"/>
              <path d="M165 79 Q200 109 235 79" fill="none" stroke="${state.secondary}" stroke-width="4"/>`;
    }

    if (state.collar === "lace") {
      return `<path d="M160 78 Q200 116 240 78" fill="none" stroke="${c}" stroke-width="11"/>
              <path d="M177 87L195 111L205 111L223 87" fill="none" stroke="${state.secondary}" stroke-width="3"/>
              <path d="M190 101L210 101M191 107L209 107" stroke="${c}" stroke-width="2.5"/>`;
    }

    return `<path d="M160 78L200 111L240 78" fill="none" stroke="${c}" stroke-width="12" stroke-linejoin="round"/>
            <path d="M168 80L200 104L232 80" fill="none" stroke="${state.secondary}" stroke-width="3"/>`;
  }

  function layerMarkup(side) {
    return state.layers
      .filter(layer => layer.side === side)
      .map(layer => {
        const selected = layer.id === state.selectedLayer;
        const width = layer.size * 2.6;
        const height = width * (layer.ratio || 1);
        const x = layer.x;
        const y = layer.y;

        return `
          <g class="layer-image" data-layer-id="${layer.id}"
             opacity="${layer.opacity / 100}"
             transform="translate(${x} ${y})">
            ${selected ? `<rect x="${-width / 2 - 4}" y="${-height / 2 - 4}" width="${width + 8}" height="${height + 8}" fill="none" stroke="#2685ff" stroke-width="1.5" stroke-dasharray="4 3"/>` : ""}
            <image href="${escapeXML(layer.src)}"
              x="${-width / 2}" y="${-height / 2}"
              width="${width}" height="${height}"
              preserveAspectRatio="xMidYMid meet"/>
          </g>`;
      }).join("");
  }

  function jerseySVG(side) {
    const back = side === "back";
    const patternId = `fabric-pattern-${side}`;
    const main = state.main;
    const secondary = state.secondary;
    const accent = state.accent;
    const font = state.font ? "UserJerseyFont" : "Arial Black, Arial, sans-serif";

    const bodyPath = "M157 76 L177 65 Q200 79 223 65 L243 76 L292 101 L326 190 L293 209 L272 167 L267 340 Q200 362 133 340 L128 167 L107 209 L74 190 L108 101 Z";
    const leftSleeve = "M157 76 L108 101 L74 190 L107 209 L128 167 L151 119 Z";
    const rightSleeve = "M243 76 L292 101 L326 190 L293 209 L272 167 L249 119 Z";

    const sleeveStripes = state.stripes === "none" ? "" : `
      <path d="M84 166L117 180L110 196L78 182Z" fill="${accent}"/>
      <path d="M283 180L316 166L322 182L290 196Z" fill="${accent}"/>
      ${state.stripes === "double" ? `
        <path d="M90 147L124 160L119 170L85 157Z" fill="${secondary}"/>
        <path d="M277 160L310 147L315 157L282 170Z" fill="${secondary}"/>` : ""}
      ${state.stripes === "classic" ? `
        <path d="M82 176L115 190" stroke="${secondary}" stroke-width="5"/>
        <path d="M285 190L318 176" stroke="${secondary}" stroke-width="5"/>` : ""}
    `;

    const numberMarkup = back
      ? `<text x="200" y="236" text-anchor="middle" font-size="88" font-family="${font}" font-weight="900" fill="${state.textColor}" stroke="${hexToRgba(accent, .5)}" stroke-width="1.5" paint-order="stroke">${escapeXML(state.number)}</text>
         <text x="200" y="135" text-anchor="middle" font-size="19" font-family="${font}" font-weight="900" letter-spacing="2" fill="${state.textColor}">${escapeXML(state.name.toUpperCase())}</text>`
      : `<text x="200" y="261" text-anchor="middle" font-size="39" font-family="${font}" font-weight="900" fill="${state.textColor}" stroke="${hexToRgba(accent, .35)}" stroke-width="1" paint-order="stroke">${escapeXML(state.number)}</text>`;

    const jersey = `
    <svg class="jersey-svg" xmlns="${NS}" viewBox="0 0 400 390" role="img" aria-label="${back ? "Джерси сзади" : "Джерси спереди"}">
      <defs>
        <linearGradient id="body-shade-${side}" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".27"/>
          <stop offset=".38" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000000" stop-opacity=".17"/>
        </linearGradient>
        <linearGradient id="sleeve-shade-${side}" x1="0" x2="1">
          <stop offset="0" stop-color="#000000" stop-opacity=".12"/>
          <stop offset=".45" stop-color="#ffffff" stop-opacity=".2"/>
          <stop offset="1" stop-color="#000000" stop-opacity=".13"/>
        </linearGradient>
        <filter id="soft-shadow-${side}" x="-30%" y="-30%" width="160%" height="170%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        ${patternMarkup(patternId)}
      </defs>

      <ellipse cx="200" cy="351" rx="112" ry="12" fill="#000" opacity=".12" filter="url(#soft-shadow-${side})"/>

      <!-- Main fabric -->
      <path class="fabric" d="${bodyPath}" fill="${main}"/>
      <path d="${bodyPath}" fill="url(#body-shade-${side})"/>
      <path d="${bodyPath}" fill="url(#${patternId})"/>

      <!-- Sleeves -->
      <path class="fabric" d="${leftSleeve}" fill="${main}"/>
      <path class="fabric" d="${rightSleeve}" fill="${main}"/>
      <path d="${leftSleeve}" fill="url(#sleeve-shade-${side})"/>
      <path d="${rightSleeve}" fill="url(#sleeve-shade-${side})"/>

      <!-- Cuffs -->
      <path d="M74 190L107 209L99 228L66 207Z" fill="${accent}"/>
      <path d="M293 209L326 190L334 207L301 228Z" fill="${accent}"/>
      ${sleeveStripes}

      <!-- Waist stripes -->
      ${state.stripes === "none" ? "" : `
        <path d="M132 319Q200 340 268 319L267 340Q200 361 133 340Z" fill="${accent}"/>
        ${state.stripes === "classic" ? `<path d="M132 328Q200 349 268 328L268 334Q200 355 132 334Z" fill="${secondary}"/>` : ""}
        ${state.stripes === "double" ? `<path d="M132 326Q200 347 268 326L268 330Q200 351 132 330Z" fill="${secondary}"/>` : ""}
      `}

      <!-- Seams -->
      <path class="seam" d="M157 77L137 125L133 317"/>
      <path class="seam" d="M243 77L263 125L267 317"/>
      <path class="seam" d="M108 102L128 167"/>
      <path class="seam" d="M292 102L272 167"/>
      <path class="seam" d="M145 90Q200 120 255 90"/>

      <!-- Fabric folds -->
      <path class="fold" d="M151 142Q164 164 151 191"/>
      <path class="fold" d="M249 142Q236 164 249 191"/>
      <path class="fold" d="M166 279Q177 292 170 309"/>
      <path class="fold" d="M231 280Q222 297 230 311"/>
      <path class="dark-fold" d="M117 116L96 175"/>
      <path class="dark-fold" d="M283 116L304 175"/>
      <path class="dark-fold" d="M145 245Q155 260 145 278"/>
      <path class="dark-fold" d="M255 245Q245 260 255 278"/>

      <!-- Collar -->
      ${collarMarkup()}

      <!-- Front/back details -->
      ${numberMarkup}

      ${!back ? `
        <path d="M174 163L226 163L220 174L180 174Z" fill="${secondary}" opacity=".8"/>
        <circle cx="200" cy="187" r="3" fill="${accent}"/>
      ` : `
        <text x="200" y="325" text-anchor="middle" font-size="9" font-weight="800" letter-spacing="2" fill="${state.textColor}" opacity=".8">HOCKEY</text>
      `}

      <!-- Custom logo layers -->
      ${layerMarkup(side)}

      <!-- Outline -->
      <path d="${bodyPath}" fill="none" stroke="${hexToRgba("#000000", .2)}" stroke-width="1.4"/>
    </svg>`;

    return jersey;
  }

  function pantsSVG() {
    const c = state.pants;
    return `
    <svg xmlns="${NS}" viewBox="0 0 220 160">
      <defs>
        <linearGradient id="pants-shade" x1="0" x2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".12"/>
          <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".2"/>
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="147" rx="74" ry="7" fill="#000" opacity=".1"/>
      <path d="M62 20Q110 7 158 20L166 75L149 136L116 136L110 75L104 136L71 136L54 75Z" fill="${c}" stroke="#000" stroke-opacity=".2" stroke-width="2"/>
      <path d="M62 20Q110 7 158 20L166 75L149 136L116 136L110 75L104 136L71 136L54 75Z" fill="url(#pants-shade)"/>
      <path d="M64 26Q110 39 156 26" fill="none" stroke="${state.accent}" stroke-width="7"/>
      <path d="M65 31Q110 44 155 31" fill="none" stroke="${state.secondary}" stroke-width="2"/>
      <path d="M110 44L110 76" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
      <path d="M73 85L99 92M137 92L158 85" stroke="#fff" stroke-opacity=".16" stroke-width="3"/>
      <path d="M75 135L104 135M116 135L148 135" stroke="${state.accent}" stroke-width="4"/>
      <path d="M72 46L78 88M148 46L142 88" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
    </svg>`;
  }

  function socksSVG() {
    const c = state.socks;
    return `
    <svg xmlns="${NS}" viewBox="0 0 220 160">
      <ellipse cx="110" cy="148" rx="73" ry="6" fill="#000" opacity=".1"/>
      <path d="M54 13L99 13L99 98L91 139L51 139L57 98Z" fill="${c}" stroke="#000" stroke-opacity=".17" stroke-width="1.5"/>
      <path d="M121 13L166 13L163 98L169 139L129 139L121 98Z" fill="${c}" stroke="#000" stroke-opacity=".17" stroke-width="1.5"/>
      <path d="M54 13L99 13L99 30L55 30Z" fill="${state.accent}"/>
      <path d="M121 13L166 13L165 30L121 30Z" fill="${state.accent}"/>
      <path d="M54 38L98 38L97 46L54 46Z" fill="${state.secondary}"/>
      <path d="M121 38L165 38L165 46L121 46Z" fill="${state.secondary}"/>
      <path d="M54 13L99 13L99 139L51 139L57 98Z" fill="#fff" opacity=".06"/>
      <path d="M121 13L166 13L169 139L129 139L121 98Z" fill="#000" opacity=".06"/>
      <path d="M65 56L91 56M132 56L158 56" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>
    </svg>`;
  }

  function render() {
    $("#frontJersey").innerHTML = jerseySVG("front");
    $("#backJersey").innerHTML = jerseySVG("back");
    $("#pantsPreview").innerHTML = pantsSVG();
    $("#socksPreview").innerHTML = socksSVG();
    $("#teamPreview").textContent = state.team.trim() || "YOUR TEAM";
    updateLayerList();
    updateLayerControls();
  }

  function updateLayerList() {
    const list = $("#layerList");

    if (!state.layers.length) {
      list.innerHTML = '<div class="empty-layers">Пока нет загруженных слоёв</div>';
      return;
    }

    list.innerHTML = state.layers.map(layer => `
      <div class="layer-row ${layer.id === state.selectedLayer ? "selected" : ""}" data-id="${layer.id}">
        <img src="${escapeHTML(layer.src)}" alt="">
        <span>${escapeHTML(layer.name)} · ${layer.side === "front" ? "Спереди" : "Сзади"}</span>
      </div>
    `).join("");

    $$(".layer-row").forEach(row => {
      row.addEventListener("click", () => {
        state.selectedLayer = row.dataset.id;
        render();
      });
    });
  }

  function updateLayerControls() {
    const layer = state.layers.find(item => item.id === state.selectedLayer);
    $("#layerSize").disabled = !layer;
    $("#layerOpacity").disabled = !layer;

    if (layer) {
      $("#layerSize").value = layer.size;
      $("#layerOpacity").value = layer.opacity;
    }
  }

  function updateColor(key, selector) {
    $(selector).addEventListener("input", event => {
      state[key] = event.target.value;
      render();
    });
  }

  updateColor("main", "#mainColor");
  updateColor("secondary", "#secondaryColor");
  updateColor("accent", "#accentColor");
  updateColor("pants", "#pantsColor");
  updateColor("socks", "#socksColor");
  updateColor("textColor", "#textColor");

  $("#patternOpacity").addEventListener("input", event => {
    state.opacity = Number(event.target.value);
    render();
  });

  $("#teamName").addEventListener("input", event => {
    state.team = event.target.value;
    $("#teamPreview").textContent = state.team || "YOUR TEAM";
  });

  $("#playerName").addEventListener("input", event => {
    state.name = event.target.value;
    render();
  });

  $("#playerNumber").addEventListener("input", event => {
    state.number = event.target.value.slice(0, 2);
    render();
  });

  $("#collarStyle").addEventListener("change", event => {
    state.collar = event.target.value;
    render();
  });

  $("#stripeStyle").addEventListener("change", event => {
    state.stripes = event.target.value;
    render();
  });

  $$(".palette").forEach(button => {
    button.addEventListener("click", () => {
      const [main, secondary, accent] = button.dataset.colors.split(",");
      state.main = main;
      state.secondary = secondary;
      state.accent = accent;
      $("#mainColor").value = main;
      $("#secondaryColor").value = secondary;
      $("#accentColor").value = accent;
      render();
    });
  });

  $$(".pattern-option").forEach(button => {
    button.addEventListener("click", () => {
      $$(".pattern-option").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      state.pattern = button.dataset.pattern;
      render();
    });
  });

  $$(".tab").forEach(button => {
    button.addEventListener("click", () => {
      $$(".tab").forEach(item => item.classList.remove("active"));
      $$(".tab-content").forEach(item => item.classList.remove("active"));

      button.classList.add("active");
      $(`#tab-${button.dataset.tab}`).classList.add("active");
    });
  });

  $("#fontUpload").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Шрифт слишком большой. Максимум 5 МБ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      state.font = reader.result;

      let style = document.querySelector("#uploadedFontStyle");
      if (!style) {
        style = document.createElement("style");
        style.id = "uploadedFontStyle";
        document.head.appendChild(style);
      }

      style.textContent = `
        @font-face {
          font-family: 'UserJerseyFont';
          src: url('${reader.result}');
        }
      `;

      $("#fontStatus").textContent = `Загружен: ${file.name}`;
      render();
      showToast("Шрифт загружен");
    };
    reader.readAsDataURL(file);
  });

  $("#imageUpload").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast("Изображение слишком большое. Максимум 4 МБ.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const ratio = image.height / image.width;
        const layer = {
          id: `layer-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          src: reader.result,
          x: 200,
          y: 190,
          size: 18,
          opacity: 100,
          ratio: Math.min(Math.max(ratio, .35), 2.5),
          side: "front"
        };

        state.layers.push(layer);
        state.selectedLayer = layer.id;
        render();
        showToast("Логотип добавлен на переднюю часть");
      };

      image.onerror = () => showToast("Не удалось открыть изображение");
      image.src = reader.result;
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  });

  // Перемещение логотипов мышью и пальцем
  function getSVGPoint(svg, event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 200, y: 190 };

    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  }

  function bindDrag(container) {
    container.addEventListener("pointerdown", event => {
      const group = event.target.closest(".layer-image");
      if (!group) return;

      const layer = state.layers.find(item => item.id === group.dataset.layerId);
      if (!layer) return;

      state.selectedLayer = layer.id;
      const svg = group.ownerSVGElement;
      const point = getSVGPoint(svg, event);

      dragging = {
        id: layer.id,
        svg,
        offsetX: layer.x - point.x,
        offsetY: layer.y - point.y
      };

      group.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    container.addEventListener("pointermove", event => {
      if (!dragging) return;

      const point = getSVGPoint(dragging.svg, event);
      const layer = state.layers.find(item => item.id === dragging.id);
      if (!layer) return;

      layer.x = Math.max(35, Math.min(365, point.x + dragging.offsetX));
      layer.y = Math.max(35, Math.min(350, point.y + dragging.offsetY));

      const group = dragging.svg.querySelector(`[data-layer-id="${dragging.id}"]`);
      if (group) group.setAttribute("transform", `translate(${layer.x} ${layer.y})`);
    });

    const stopDrag = () => {
      if (!dragging) return;
      dragging = null;
      render();
    };

    container.addEventListener("pointerup", stopDrag);
    container.addEventListener("pointercancel", stopDrag);
  }

  bindDrag($("#frontJersey"));
  bindDrag($("#backJersey"));

  $("#layerSize").addEventListener("input", event => {
    const layer = state.layers.find(item => item.id === state.selectedLayer);
    if (!layer) return;
    layer.size = Number(event.target.value);
    render();
  });

  $("#layerOpacity").addEventListener("input", event => {
    const layer = state.layers.find(item => item.id === state.selectedLayer);
    if (!layer) return;
    layer.opacity = Number(event.target.value);
    render();
  });

  $("#deleteLayerBtn").addEventListener("click", () => {
    if (!state.selectedLayer) {
      showToast("Сначала выбери слой");
      return;
    }

    state.layers = state.layers.filter(layer => layer.id !== state.selectedLayer);
    state.selectedLayer = null;
    render();
    showToast("Слой удалён");
  });

  $("#frontLayerBtn").addEventListener("click", () => {
    if (!state.selectedLayer) {
      showToast("Сначала выбери слой");
      return;
    }

    const index = state.layers.findIndex(layer => layer.id === state.selectedLayer);
    if (index >= 0) {
      const [layer] = state.layers.splice(index, 1);
      state.layers.push(layer);
      render();
      showToast("Слой перемещён");
    }
  });

  function syncInputs() {
    $("#mainColor").value = state.main;
    $("#secondaryColor").value = state.secondary;
    $("#accentColor").value = state.accent;
    $("#pantsColor").value = state.pants;
    $("#socksColor").value = state.socks;
    $("#textColor").value = state.textColor;
    $("#patternOpacity").value = state.opacity;
    $("#teamName").value = state.team;
    $("#playerName").value = state.name;
    $("#playerNumber").value = state.number;
    $("#collarStyle").value = state.collar;
    $("#stripeStyle").value = state.stripes;

    $$(".pattern-option").forEach(button => {
      button.classList.toggle("selected", button.dataset.pattern === state.pattern);
    });

    if (state.font) {
      let style = $("#uploadedFontStyle");
      if (!style) {
        style = document.createElement("style");
        style.id = "uploadedFontStyle";
        document.head.appendChild(style);
      }
      style.textContent = `@font-face{font-family:'UserJerseyFont';src:url('${state.font}')}`;
      $("#fontStatus").textContent = "Пользовательский шрифт загружен";
    } else {
      $("#fontStatus").textContent = "";
    }
  }

  function saveProject() {
    try {
      localStorage.setItem("hockeyJerseyLabProject", JSON.stringify(state));
      showToast("Проект сохранён");
    } catch (error) {
      showToast("Не удалось сохранить. Возможно, изображения слишком большие.");
    }
  }

  function loadProject() {
    try {
      const saved = localStorage.getItem("hockeyJerseyLabProject");
      if (!saved) {
        showToast("Сохранённый проект не найден");
        return;
      }

      const parsed = JSON.parse(saved);
      state = { ...structuredClone(defaults), ...parsed };
      syncInputs();
      render();
      showToast("Проект загружен");
    } catch (error) {
      showToast("Ошибка загрузки проекта");
    }
  }

  $("#saveBtn").addEventListener("click", saveProject);
  $("#loadBtn").addEventListener("click", loadProject);

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Сбросить дизайн до исходного состояния?")) return;

    state = structuredClone(defaults);
    syncInputs();
    render();
    showToast("Дизайн сброшен");
  });

  // PNG export
  function svgToImage(svgElement) {
    return new Promise((resolve, reject) => {
      const clone = svgElement.cloneNode(true);
      clone.setAttribute("xmlns", NS);
      clone.setAttribute("width", "800");
      clone.setAttribute("height", "780");

      const xml = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("SVG render error"));
      };

      image.src = url;
    });
  }

  async function exportPNG() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1800;
      canvas.height = 1450;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f7f7f8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = "center";
      ctx.fillStyle = "#171719";
      ctx.font = "bold 38px Arial";
      ctx.fillText(state.team || "YOUR TEAM", 900, 75);

      const front = await svgToImage($("#frontJersey svg"));
      const back = await svgToImage($("#backJersey svg"));
      const pants = await svgToImage($("#pantsPreview svg"));
      const socks = await svgToImage($("#socksPreview svg"));

      ctx.drawImage(front, 100, 100, 790, 790);
      ctx.drawImage(back, 910, 100, 790, 790);
      ctx.drawImage(pants, 570, 900, 280, 210);
      ctx.drawImage(socks, 930, 900, 280, 210);

      ctx.fillStyle = "#999";
      ctx.font = "bold 16px Arial";
      ctx.fillText("FRONT", 495, 880);
      ctx.fillText("BACK", 1305, 880);
      ctx.fillText("HOCKEY JERSEY LAB", 900, 1370);

      const link = document.createElement("a");
      link.download = "hockey-jersey-design.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      showToast("PNG готов");
    } catch (error) {
      console.error(error);
      showToast("Ошибка экспорта. Попробуй ещё раз.");
    }
  }

  $("#exportBtn").addEventListener("click", exportPNG);
  $("#exportBtnBottom").addEventListener("click", exportPNG);

  // Initial state
  syncInputs();
  render();
})();
