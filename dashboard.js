/**
 * 911 Emergency Calls - Deliberative Agent Operational Load Dashboard
 * Built with Observable Plot, Observable Inputs, and Hypertext Literal (htl)
 */

// 1. Estructura de Datos (Estado del Entorno)
const emergencyData = [
  {
    category: "EMS",
    count: 332692,
    weight: 0.501,
    weightVar: "w_1",
    weightNotation: "$w_1 = 0.501$",
    color: "#2b5c8f", // Azul acero
    secondaryLabel: "MÉDICO",
    percentage: "50.1%",
    filterOption: "EMS (50.1%)",
    cardTitle: "EMS (MÉDICO)",
    description: "50.1% de carga total ($w_1 = 0.501$)"
  },
  {
    category: "Traffic",
    count: 230208,
    weight: 0.347,
    weightVar: "w_2",
    weightNotation: "$w_2 = 0.347$",
    color: "#d9822b", // Naranja
    secondaryLabel: "TRÁNSITO",
    percentage: "34.7%",
    filterOption: "Traffic (34.7%)",
    cardTitle: "TRAFFIC (TRÁNSITO)",
    description: "34.7% de carga total ($w_2 = 0.347$)"
  },
  {
    category: "Fire",
    count: 100622,
    weight: 0.152,
    weightVar: "w_3",
    weightNotation: "$w_3 = 0.152$",
    color: "#708c69", // Verde opaco
    secondaryLabel: "INCENDIOS",
    percentage: "15.2%",
    filterOption: "Fire (15.2%)",
    cardTitle: "FIRE (INCENDIOS)",
    description: "15.2% de carga total ($w_3 = 0.152$)"
  }
];

// Opciones exactas para el filtro categórico
const FILTER_OPTIONS = [
  "Todas (Global)",
  "EMS (50.1%)",
  "Traffic (34.7%)",
  "Fire (15.2%)"
];

// Estado global de la aplicación
const state = {
  selectedFilter: "Todas (Global)",
  zoomMax: 450000,
  hoveredCategory: null
};

// Referencias a los contenedores DOM principales
let elements = {};

/**
 * Inicialización de la aplicación
 */
function initDashboard() {
  const appContainer = document.getElementById("app");
  if (!appContainer) return;

  // 4. Estructurar la composición visual con htl.html
  // Encabezado
  const header = htl.html`
    <header class="dashboard-header">
      <h2>Distribución interactiva de llamadas al 911 por macrocategoría</h2>
      <p class="subtitle">
        <strong>Guía de interacción:</strong> Pasa el cursor sobre cada barra para inspeccionar la tarjeta de carga operativa con el peso de utilidad asignado. Utiliza los controles para aislar una categoría o modificar el zoom del eje numérico.
      </p>
    </header>
  `;

  // 2. Componentes de Interacción (Percepción y Planificación) usando Observable Inputs
  const categoryRadioInput = Inputs.radio(FILTER_OPTIONS, {
    value: state.selectedFilter,
    label: "Aislar Categoría:"
  });

  const zoomRangeInput = Inputs.range([0, 450000], {
    value: state.zoomMax,
    step: 5000,
    label: "Explorar Eje X (Zoom):"
  });

  // Escuchar eventos de reactividad
  categoryRadioInput.addEventListener("input", () => {
    state.selectedFilter = categoryRadioInput.value;
    updateView();
  });

  zoomRangeInput.addEventListener("input", () => {
    const val = Number(zoomRangeInput.value);
    state.zoomMax = Math.max(10000, val);
    updateView();
  });

  // Panel de controles unificado con htl.html
  const controlsPanel = htl.html`
    <section class="controls-panel" aria-label="Controles de filtrado y zoom">
      <div class="control-col control-col-left">
        ${categoryRadioInput}
      </div>
      <div class="control-col control-col-right">
        ${zoomRangeInput}
      </div>
    </section>
  `;

  // Contenedor para el gráfico de Observable Plot
  const chartWrapper = htl.html`
    <main class="chart-container" id="chart-area" aria-label="Gráfico de distribución"></main>
  `;

  // Contenedor para las tarjetas de utilidad
  const cardsWrapper = htl.html`
    <section class="cards-container" id="cards-area" aria-label="Tarjetas de carga operativa"></section>
  `;

  // Pie de página (Justificación Deliberativa)
  const footer = htl.html`
    <footer class="dashboard-footer">
      <p class="utility-formula">
        <strong>Función de Utilidad:</strong> $E[U(a)] = \sum_{s} P(s) \cdot U(a, s) - C(a)$. Carga médica y vial agrupan el 84.8% del despacho.
      </p>
      <p class="source-link">
        Fuente: <a href="https://www.kaggle.com/datasets/mchirico/montcoalert" target="_blank" rel="noopener noreferrer">Kaggle (911 Emergency Calls)</a>
      </p>
    </footer>
  `;

  // Ensamblar la vista principal
  appContainer.innerHTML = "";
  appContainer.appendChild(header);
  appContainer.appendChild(controlsPanel);
  appContainer.appendChild(chartWrapper);
  appContainer.appendChild(cardsWrapper);
  appContainer.appendChild(footer);

  elements = {
    categoryRadioInput,
    zoomRangeInput,
    chartArea: document.getElementById("chart-area"),
    cardsArea: document.getElementById("cards-area")
  };

  // Render inicial
  updateView();
}

/**
 * Filtra los datos según la categoría seleccionada
 */
function getFilteredData() {
  if (state.selectedFilter === "Todas (Global)") {
    return [...emergencyData];
  }
  return emergencyData.filter(d => d.filterOption === state.selectedFilter);
}

/**
 * 3. Gráfico Principal (Observable Plot)
 * Construye el gráfico de barras horizontales (Plot.barX)
 */
function renderPlot() {
  const filteredData = getFilteredData();
  const maxDomain = Math.max(10000, state.zoomMax);

  // Generar ticks limpios con intervalos de 50k o proporcionales al zoom
  let ticks;
  if (maxDomain >= 400000) {
    ticks = [0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000].filter(t => t <= maxDomain);
  } else if (maxDomain >= 200000) {
    ticks = [0, 50000, 100000, 150000, 200000, 250000, 300000, 350000].filter(t => t <= maxDomain);
  } else {
    ticks = undefined; // Auto-tick
  }

  const plotChart = Plot.plot({
    width: 820,
    height: 260,
    marginLeft: 75,
    marginRight: 95,
    marginTop: 20,
    marginBottom: 45,
    x: {
      domain: [0, maxDomain],
      label: "Frecuencia Absoluta de Incidentes →",
      grid: true,
      ticks: ticks,
      tickFormat: (d) => `${d / 1000}k`,
      line: true
    },
    y: {
      domain: ["EMS", "Traffic", "Fire"],
      label: null,
      padding: 0.38,
      tickSize: 6
    },
    marks: [
      // Regla en el eje Y = 0
      Plot.ruleX([0], { stroke: "#64748b", strokeWidth: 1 }),

      // Barras horizontales (Plot.barX)
      Plot.barX(filteredData, {
        y: "category",
        x: "count",
        fill: (d) => d.color,
        insetTop: 2,
        insetBottom: 2,
        // Tooltip nativo (title)
        title: (d) => `Carga Operativa: ${d.category} (${d.secondaryLabel})\n` +
                      `Frecuencia: ${d.count.toLocaleString("en-US")} incidentes\n` +
                      `Peso Deliberativo: ${d.percentage} (${d.weightNotation})`
      }),

      // Etiquetas de texto al final de cada barra (ej. "333k (50.1%)")
      Plot.text(filteredData, {
        y: "category",
        x: "count",
        text: (d) => `${Math.round(d.count / 1000)}k (${d.percentage})`,
        dx: 6,
        textAnchor: "start",
        fontSize: 12,
        fontWeight: 500,
        fill: "#1e293b"
      })
    ]
  });

  // Añadir eventos interactivos de mouse sobre las barras SVG
  const bars = plotChart.querySelectorAll("rect");
  bars.forEach((bar, index) => {
    const dataItem = filteredData[index];
    if (!dataItem) return;

    bar.style.cursor = "pointer";
    bar.style.transition = "filter 0.2s ease, transform 0.2s ease";

    bar.addEventListener("mouseenter", () => {
      bar.style.filter = "brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.25))";
      highlightCard(dataItem.category);
    });

    bar.addEventListener("mouseleave", () => {
      bar.style.filter = "none";
      unhighlightCards();
    });

    bar.addEventListener("click", () => {
      // Al hacer click en la barra, se selecciona esa categoría
      state.selectedFilter = dataItem.filterOption;
      if (elements.categoryRadioInput) {
        elements.categoryRadioInput.value = dataItem.filterOption;
      }
      updateView();
    });
  });

  return plotChart;
}

/**
 * 4. Tarjetas de Resumen (Cards) estructuradas con htl.html
 */
function renderCards() {
  const container = htl.html`<div class="cards-container">
    ${emergencyData.map((d) => {
      const isSelected = state.selectedFilter === d.filterOption;
      const isFilteredOut = state.selectedFilter !== "Todas (Global)" && !isSelected;
      const cardClass = `stat-card card-${d.category.toLowerCase()} ${isFilteredOut ? "dimmed" : ""} ${isSelected ? "highlighted" : ""}`;

      const card = htl.html`
        <article class="${cardClass}" id="card-${d.category}" data-category="${d.category}">
          <div class="card-title">${d.cardTitle}</div>
          <div class="card-value">${d.count.toLocaleString("en-US")}</div>
          <div class="card-description">${d.description}</div>
        </article>
      `;

      // Interacción al hacer click en la tarjeta: aísla la categoría
      card.addEventListener("click", () => {
        if (state.selectedFilter === d.filterOption) {
          state.selectedFilter = "Todas (Global)";
        } else {
          state.selectedFilter = d.filterOption;
        }
        if (elements.categoryRadioInput) {
          elements.categoryRadioInput.value = state.selectedFilter;
        }
        updateView();
      });

      return card;
    })}
  </div>`;

  return container;
}

/**
 * Resalta una tarjeta cuando el usuario pasa el cursor sobre una barra
 */
function highlightCard(category) {
  emergencyData.forEach(d => {
    const el = document.getElementById(`card-${d.category}`);
    if (!el) return;
    if (d.category === category) {
      el.classList.add("highlighted");
      el.style.transform = "translateY(-4px)";
      el.style.boxShadow = `0 6px 18px rgba(0, 0, 0, 0.12), 0 0 0 2px ${d.color}`;
    } else {
      el.style.opacity = "0.45";
    }
  });
}

/**
 * Restaura el estado visual de las tarjetas
 */
function unhighlightCards() {
  emergencyData.forEach(d => {
    const el = document.getElementById(`card-${d.category}`);
    if (!el) return;
    el.classList.remove("highlighted");
    el.style.transform = "";
    el.style.boxShadow = "";
    el.style.opacity = "";
  });
}

/**
 * Actualiza la vista reactiva completa
 */
function updateView() {
  if (!elements.chartArea || !elements.cardsArea) return;

  // Actualizar gráfico
  elements.chartArea.innerHTML = "";
  const plot = renderPlot();
  elements.chartArea.appendChild(plot);

  // Actualizar tarjetas
  elements.cardsArea.innerHTML = "";
  const cards = renderCards();
  elements.cardsArea.appendChild(cards);
}

// Iniciar al cargar el DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
