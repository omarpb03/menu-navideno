"use strict";
/* =============================================================================
   APP.JS — Lógica de la tienda navideña
   Parte 1: lógica pura (cantidades, precios, recomendador, mensaje de WhatsApp)
   Parte 2: interfaz (solo corre en el navegador)
   Los datos del menú viven en menu.js
   ============================================================================= */

const D = (typeof module !== "undefined" && module.exports)
  ? require("./menu.js")
  : { CONFIG, CATEGORIAS, PLATILLOS };
const CFG = D.CONFIG;
const FECHAS = CFG.fechasEntrega || ["2026-12-24", "2026-12-31"];   // únicas fechas de entrega que se pueden elegir
const MENU = D.PLATILLOS.filter(p => !p.oculto);                       // los platillos con "oculto: true" no se muestran
const CATS = D.CATEGORIAS.filter(c => MENU.some(p => p.cat === c.id)); // y las categorías vacías tampoco
const POR_ID = Object.fromEntries(MENU.map(p => [p.id, p]));

/* ============================== PARTE 1: LÓGICA ============================== */

const dinero = n => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(n);

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const techo = (n, paso) => Math.ceil(n / paso - 1e-9) * paso;
const r2 = n => Math.round(n * 100) / 100;

const pasoDe = p => p.paso || (p.unidad === "pza" ? 1 : 0.5);
const minDe = p => p.min || pasoDe(p);

function textoCantidad(p, qty) {
  if (p.unidad === "pza") return `${qty} ${qty === 1 ? p.unidadSing : p.unidadPlur}`;
  return `${qty} ${p.unidad}`;
}

function etiquetaPrecio(p) {
  if (p.precioEtiqueta) return p.precioEtiqueta;
  return `${dinero(p.precio)} / ${p.unidad}`;
}

/* ---- opciones y precios ---- */
function extrasDe(p, opts) {
  let extra = 0;
  for (const g of p.opciones || []) {
    const sel = opts[g.id];
    const lista = Array.isArray(sel) ? sel : (sel ? [sel] : []);
    for (const nombre of lista) {
      const el = g.elecciones.find(x => x.nombre === nombre);
      if (el) extra += el.extra || 0;
    }
  }
  return extra;
}
const precioUnit = (p, opts) => p.precio + extrasDe(p, opts || {});
const totalLinea = l => r2(precioUnit(POR_ID[l.id], l.opts) * l.qty);
const totalCarrito = cart => r2(cart.reduce((s, l) => s + totalLinea(l), 0));

function opcionesPorDefecto(p) {
  const o = {};
  for (const g of p.opciones || []) if (g.requerida && !g.multiple) o[g.id] = g.elecciones[0].nombre;
  return o;
}
function opcionesFaltantes(p, opts) {
  return (p.opciones || []).filter(g => g.requerida && !(opts[g.id] && opts[g.id].length)).map(g => g.titulo);
}
function textoOpciones(p, opts) {
  return (p.opciones || [])
    .map(g => {
      const sel = opts[g.id];
      const lista = Array.isArray(sel) ? sel : (sel ? [sel] : []);
      return lista.length ? `${g.titulo}: ${lista.join(", ")}` : "";
    })
    .filter(Boolean).join(" · ");
}

/* ---- carrito ---- */
function claveLinea(l) {
  const o = Object.keys(l.opts || {}).sort().map(k => [k, l.opts[k]]);
  return `${l.id}|${JSON.stringify(o)}|${l.nota || ""}`;
}
function agregarAlCarrito(cart, linea) {
  const k = claveLinea(linea);
  const existente = cart.find(l => claveLinea(l) === k);
  if (existente) existente.qty = r2(existente.qty + linea.qty);
  else cart.push({ id: linea.id, qty: linea.qty, opts: { ...(linea.opts || {}) }, nota: linea.nota || "" });
}

/* ---- fechas ---- */
function fechaDesdeISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function fechaLarga(iso) {
  if (!iso) return "";
  return fechaDesdeISO(iso).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

/* ---- validación del pedido ---- */
function validarPedido(cart, f) {
  const e = [];
  if (!cart.length) e.push("Agrega al menos un platillo a tu pedido.");
  if (cart.length && CFG.pedidoMinimo && totalCarrito(cart) < CFG.pedidoMinimo)
    e.push(`El pedido mínimo es de ${dinero(CFG.pedidoMinimo)}.`);
  if ((f.nombre || "").trim().length < 2) e.push("Escribe tu nombre.");
  if ((f.telefono || "").replace(/\D/g, "").length < 10) e.push("Escribe un teléfono de 10 dígitos.");
  if (!FECHAS.includes(f.fecha)) e.push("Elige la fecha en que pasarás a recoger tu pedido.");
  return e;
}

/* ---- mensaje de WhatsApp ---- */
function mensajePedido(cart, f) {
  const L = [];
  L.push("*Pedido Navideño*", "");
  L.push(`*Nombre:* ${f.nombre.trim()}`);
  L.push(`*Teléfono:* ${f.telefono.trim()}`);
  L.push("*Entrega:* Paso a recoger con ustedes");
  L.push(`*Fecha:* ${fechaLarga(f.fecha)}`);
  L.push("", "*Mi pedido:*");
  for (const l of cart) {
    const p = POR_ID[l.id];
    const o = textoOpciones(p, l.opts);
    L.push(`• ${p.nombre} — ${textoCantidad(p, l.qty)}${o ? ` (${o})` : ""} — ${dinero(totalLinea(l))}`);
    if (l.nota) L.push(`   _${l.nota}_`);
  }
  L.push("", `*Total estimado:* ${dinero(totalCarrito(cart))}`);
  if ((f.notas || "").trim()) L.push("", `*Notas:* ${f.notas.trim()}`);
  L.push("", "_El total es estimado; la disponibilidad y la dirección para recoger se confirman por este medio._");
  return L.join("\n");
}

/* ---- recomendador ---- */
const BONUS_OCASION = { familia: "tradicional", amigos: "compartir", pareja: "elegante" };
const ETIQ_GUSTO = {
  tradicional: "lo tradicional de Navidad", italiano: "algo italiano", queso: "con queso",
  ligero: "algo fresco y ligero", mexicano: "sabor mexicano",
};
const FRASE_OCASION = {
  tradicional: "Un clásico para la mesa familiar.",
  compartir: "Ideal para compartir entre amigos.",
  elegante: "Elegante para una cena íntima.",
};

function permitido(p, r) {
  const malos = [...(p.contiene || []), ...(p.posibleContiene || [])];
  return !malos.some(x => r.evitar.includes(x));
}
function puntaje(p, r) {
  let s = 0;
  for (const g of r.gustos) if (p.tags.includes(g)) s += 3;
  if (p.tags.includes(BONUS_OCASION[r.ocasion])) s += 1;
  return s;
}
function ranking(rol, r) {
  return MENU.map((p, i) => ({ p, i }))
    .filter(({ p }) => p.rol === rol && permitido(p, r))
    .sort((a, b) => puntaje(b.p, r) - puntaje(a.p, r) || a.i - b.i)
    .map(x => x.p);
}
function elegir(lista, variante, usados) {
  const cand = lista.filter(p => !usados.has(p.id) && !(p.familia && usados.has(p.familia)));
  if (!cand.length) return null;
  const top = cand.slice(0, Math.min(3, cand.length));
  return top[variante % top.length];
}
function motivoDe(p, r) {
  const g = r.gustos.find(x => p.tags.includes(x));
  if (g) return `Va con lo que se les antoja: ${ETIQ_GUSTO[g]}.`;
  const b = BONUS_OCASION[r.ocasion];
  return p.tags.includes(b) ? FRASE_OCASION[b] : "";
}

/* Charolas de lasagna: 6 o 12 personas */
function lineasLasagna(n) {
  if (n <= 6) return [{ qty: 1, opts: { tamano: "6 personas" } }];
  if (n <= 12) return [{ qty: 1, opts: { tamano: "12 personas" } }];
  const doces = Math.floor(n / 12), resto = n - doces * 12;
  const out = [];
  if (resto > 6) out.push({ qty: doces + 1, opts: { tamano: "12 personas" } });
  else {
    out.push({ qty: doces, opts: { tamano: "12 personas" } });
    if (resto > 0) out.push({ qty: 1, opts: { tamano: "6 personas" } });
  }
  return out;
}

/* Cantidad sugerida por persona: fuerte 300 g (170 g c/u si hay dos), guarnición/pasta 150 g,
   ensalada 120 g, crema 250 ml. Se redondea hacia arriba al paso del producto. */
function lineasSugeridas(p, r, nFuertes) {
  const n = r.personas;
  const personasPlato = nFuertes > 1 ? Math.ceil(n / 2) : n;
  if (p.id === "lasagna") return lineasLasagna(personasPlato);
  if (p.unidad === "pza") {
    return [{ qty: Math.max(1, Math.ceil(n / (p.personas || 4))), opts: opcionesPorDefecto(p) }];
  }
  let pp;
  if (p.rol === "fuerte") pp = nFuertes > 1 ? 0.17 : 0.3;
  else if (p.unidad === "lt") pp = 0.25;
  else if (p.cat === "ensaladas") pp = 0.12;
  else pp = 0.15;
  const qty = Math.max(minDe(p), techo(n * pp, pasoDe(p)));
  return [{ qty, opts: opcionesPorDefecto(p) }];
}

function recomendar(r, variante = 0) {
  const usados = new Set();
  const nFuertes = r.personas >= 10 ? 2 : 1;
  const elegidos = [];

  for (let i = 0; i < nFuertes; i++) {
    const p = elegir(ranking("fuerte", r), variante, usados);
    if (p) { usados.add(p.id); if (p.familia) usados.add(p.familia); elegidos.push(p); }
  }
  const g = elegir(ranking("guarnicion", r), variante, usados);
  if (g) { usados.add(g.id); elegidos.push(g); }
  const e = elegir(ranking("entrada", r), variante, usados);
  if (e) { usados.add(e.id); elegidos.push(e); }

  if (!elegidos.length) return { vacio: true, lineas: [], total: 0 };

  const lineas = [];
  for (const p of elegidos) {
    for (const l of lineasSugeridas(p, r, nFuertes)) {
      lineas.push({ id: p.id, qty: l.qty, opts: l.opts, motivo: motivoDe(p, r) });
    }
  }
  return { vacio: false, lineas, total: totalCarrito(lineas) };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    POR_ID, dinero, textoCantidad, precioUnit, totalLinea, totalCarrito, agregarAlCarrito,
    opcionesPorDefecto, opcionesFaltantes, textoOpciones, mensajePedido, validarPedido,
    recomendar, lineasLasagna, claveLinea, fechaLarga,
  };
}

/* ============================== PARTE 2: INTERFAZ ============================== */

if (typeof document !== "undefined") {

  const CLAVE_GUARDADO = "menu-navideno-2026";
  const S = {
    cart: [],
    form: { nombre: "", telefono: "", fecha: "", notas: "" },
    hoja: null,       // platillo abierto en la hoja de detalle
    asist: null,      // estado del asistente
    errores: [],
    enviado: false,
  };

  const $ = s => document.querySelector(s);

  function guardar() {
    try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify({ cart: S.cart, form: S.form })); } catch (e) { /* sin almacenamiento */ }
  }
  function cargarGuardado() {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || "null");
      if (g && Array.isArray(g.cart)) {
        S.cart = g.cart.filter(l => POR_ID[l.id]);
        S.form = { ...S.form, ...(g.form || {}) };
        if (!FECHAS.includes(S.form.fecha)) S.form.fecha = "";   // por si cambian las fechas disponibles
      }
    } catch (e) { /* ignorar */ }
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function aviso(texto) {
    const t = $("#toast");
    t.textContent = texto;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3800);
  }

  /* ---------- modales ---------- */
  function mostrar(id) { $("#" + id).hidden = false; document.body.classList.add("sin-scroll"); }
  function ocultar(id) {
    $("#" + id).hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) document.body.classList.remove("sin-scroll");
  }
  function cerrarTodo() { ["hoja", "carrito", "asistente"].forEach(ocultar); }

  const ICO_X = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`;

  /* Cada hoja tiene un cuerpo que se desplaza y un pie fijo con la acción principal
     (siempre al alcance del pulgar). Se conserva el desplazamiento al repintar. */
  function pintarPanel(id, cuerpo, pie) {
    const panel = $("#" + id + "-panel");
    const viejo = panel.querySelector(".cuerpo");
    const y = viejo ? viejo.scrollTop : 0;
    panel.innerHTML = `<button class="cerrar" data-acc="cerrar" aria-label="Cerrar">${ICO_X}</button>
      <div class="cuerpo">${cuerpo}</div>${pie ? `<div class="pie">${pie}</div>` : ""}`;
    panel.querySelector(".cuerpo").scrollTop = y;
  }
  function limpiarPanel(id) { $("#" + id + "-panel").innerHTML = ""; }

  /* ---------- portada y menú ---------- */
  function pintarPortada() {
    document.title = CFG.titulo;
    $("#titulo").textContent = CFG.titulo;
    $("#lema").textContent = CFG.lema;
    $("#fechas").textContent = CFG.avisoFechas || "";
    const f = $("#firma"); f.textContent = CFG.firma || ""; f.hidden = !CFG.firma;   // "By ..." al final de la página
  }

  function pintarCategorias() {
    $("#cats").innerHTML = `<button class="chip-ayuda" data-acc="asistente">Ayúdame a elegir</button>` + CATS.map(c =>
      `<a class="chip-cat" href="#cat-${c.id}">${esc(c.nombre)}</a>`).join("");
  }

  /* Resalta en la barra la categoría que se está viendo y la mantiene visible. */
  function vigilarCategorias() {
    if (typeof IntersectionObserver === "undefined") return;
    const chips = [...document.querySelectorAll(".chip-cat")];
    const io = new IntersectionObserver(entradas => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        for (const ch of chips) {
          const on = ch.getAttribute("href") === "#" + e.target.id;
          ch.classList.toggle("activo", on);
          if (on && ch.scrollIntoView) ch.scrollIntoView({ block: "nearest", inline: "center" });
        }
      }
    }, { rootMargin: "-25% 0px -65% 0px" });
    document.querySelectorAll(".categoria").forEach(s => io.observe(s));
  }

  function pintarMenu() {
    $("#menu").innerHTML = CATS.map(c => {
      const items = MENU.filter(p => p.cat === c.id);
      return `<section class="categoria" id="cat-${c.id}">
        <h2>${esc(c.nombre)}</h2>
        <div class="rejilla">${items.map(p => tarjeta(p, c)).join("")}</div>
      </section>`;
    }).join("");
  }

  /* Si el platillo tiene su propia foto se usa; si no, se usa la imagen de fondo
     (fotos/fondo.jpg) con otro encuadre en cada tarjeta y un tinte del color de la categoría. */
  const ENCUADRES = ["80% 62%", "25% 78%", "48% 48%", "45% 12%", "8% 35%", "50% 92%", "95% 28%", "78% 95%"];
  function fotoHTML(p, c, clase) {
    const i = Math.max(0, MENU.indexOf(p));
    if (p.foto) return `<span class="${clase}" style="--c:${c.color}"><img src="${esc(p.foto)}" alt="${esc(p.nombre)}" loading="lazy">`;
    return `<span class="${clase} generica" style="--c:${c.color};--pos:${ENCUADRES[i % ENCUADRES.length]}">`;
  }
  function tarjeta(p, c) {
    return `<button class="tarjeta" data-acc="abrir" data-id="${p.id}" aria-label="Ver ${esc(p.nombre)}">
      ${fotoHTML(p, c, "foto")}<span class="mas" aria-hidden="true">+</span></span>
      <span class="fila"><span class="nombre">${esc(p.nombre)}</span><span class="precio">${esc(etiquetaPrecio(p))}</span></span>
      <span class="desc">${esc(p.desc || "")}</span>
    </button>`;
  }

  /* ---------- barra inferior ---------- */
  function pintarBarra() {
    const n = S.cart.length;
    const badge = $("#barra-n");
    badge.hidden = n === 0;
    badge.textContent = n;
    $("#barra-texto").textContent = n ? dinero(totalCarrito(S.cart)) : "Mi pedido";
  }

  /* ---------- hoja de detalle de platillo ---------- */
  function abrirHoja(id) {
    const p = POR_ID[id];
    S.hoja = { p, opts: opcionesPorDefecto(p), qty: Math.max(minDe(p), 1), nota: "" };
    limpiarPanel("hoja");
    pintarHoja();
    mostrar("hoja");
  }

  function pintarHoja() {
    const { p } = S.hoja;
    const cat = CATS.find(x => x.id === p.cat);
    const grupos = (p.opciones || []).map(g => {
      const tipo = g.multiple ? "checkbox" : "radio";
      return `<fieldset class="grupo">
        <legend>${esc(g.titulo)} ${g.requerida ? '<em>obligatorio</em>' : '<em>opcional</em>'}</legend>
        ${g.elecciones.map(el => {
          const marcado = g.multiple
            ? (S.hoja.opts[g.id] || []).includes(el.nombre)
            : S.hoja.opts[g.id] === el.nombre;
          return `<label class="opcion">
            <input type="${tipo}" name="g-${g.id}" data-grupo="${g.id}" value="${esc(el.nombre)}" ${marcado ? "checked" : ""}>
            <span>${esc(el.nombre)}</span>
            ${el.extra ? `<small>+${dinero(el.extra)}</small>` : ""}
          </label>`;
        }).join("")}
      </fieldset>`;
    }).join("");

    const cuerpo = `
      ${fotoHTML(p, cat, "foto-hoja")}</span>
      <h3>${esc(p.nombre)}</h3>
      <p class="desc-hoja">${esc(p.desc || "")}</p>
      <p class="precio-hoja">${esc(etiquetaPrecio(p))}</p>
      ${grupos}
      <div class="grupo">
        <span class="etiqueta">Cantidad (${p.unidad === "pza" ? esc(p.unidadPlur) : p.unidad})</span>
        <div class="paso">
          <button class="btn-paso" data-acc="hoja-menos" aria-label="Menos">−</button>
          <output id="hoja-qty">${esc(textoCantidad(p, S.hoja.qty))}</output>
          <button class="btn-paso" data-acc="hoja-mas" aria-label="Más">+</button>
        </div>
      </div>
      <label class="grupo">
        <span class="etiqueta">Nota para este platillo <em>opcional</em></span>
        <textarea id="hoja-nota" rows="2" maxlength="200" placeholder="Ej. sin picante, bien cocido…">${esc(S.hoja.nota)}</textarea>
      </label>
      <p class="error" id="hoja-error" hidden></p>`;
    pintarPanel("hoja", cuerpo,
      `<button class="btn btn-primario" data-acc="hoja-agregar"><span>Agregar al pedido</span><strong id="hoja-total"></strong></button>`);
    actualizarHoja();
  }

  function actualizarHoja() {
    const { p, opts, qty } = S.hoja;
    $("#hoja-qty").textContent = textoCantidad(p, qty);
    $("#hoja-total").textContent = dinero(r2(precioUnit(p, opts) * qty));
  }

  function agregarDesdeHoja() {
    const { p, opts, qty, nota } = S.hoja;
    const faltan = opcionesFaltantes(p, opts);
    if (faltan.length) {
      const e = $("#hoja-error");
      e.textContent = `Elige: ${faltan.join(", ")}.`;
      e.hidden = false;
      return;
    }
    agregarAlCarrito(S.cart, { id: p.id, qty, opts, nota: nota.trim() });
    S.enviado = false;
    guardar(); pintarBarra();
    ocultar("hoja");
    aviso(`${p.nombre} agregado a tu pedido`);
  }

  /* ---------- carrito ---------- */
  function abrirCarrito() { S.errores = []; limpiarPanel("carrito"); pintarCarrito(); mostrar("carrito"); }

  function pintarCarrito() {
    const f = S.form;
    const lineas = S.cart.map((l, i) => {
      const p = POR_ID[l.id];
      const o = textoOpciones(p, l.opts);
      return `<li class="linea">
        <div class="linea-info">
          <strong>${esc(p.nombre)}</strong>
          ${o ? `<span class="chico">${esc(o)}</span>` : ""}
          ${l.nota ? `<span class="chico nota">“${esc(l.nota)}”</span>` : ""}
          <span class="chico">${esc(dinero(precioUnit(p, l.opts)))} · ${p.unidad === "pza" ? esc(p.unidadSing) : p.unidad}</span>
        </div>
        <div class="linea-der">
          <div class="paso paso-chico">
            <button class="btn-paso" data-acc="linea-menos" data-i="${i}" aria-label="Menos">−</button>
            <output>${esc(textoCantidad(p, l.qty))}</output>
            <button class="btn-paso" data-acc="linea-mas" data-i="${i}" aria-label="Más">+</button>
          </div>
          <strong>${dinero(totalLinea(l))}</strong>
          <button class="quitar" data-acc="linea-quitar" data-i="${i}">Quitar</button>
        </div>
      </li>`;
    }).join("");

    const cuerpo = `
      <h3>Mi pedido</h3>
      ${S.cart.length ? `<ul class="lineas">${lineas}</ul>
        <div class="total"><span>Total estimado</span><strong>${dinero(totalCarrito(S.cart))}</strong></div>`
        : `<p class="vacio">Aún no has agregado nada. Elige platillos del menú o deja que el asistente te recomiende.</p>`}

      ${S.cart.length ? `
      <h4>Tus datos</h4>
      <label class="campo"><span>Nombre</span>
        <input id="f-nombre" autocomplete="name" autocapitalize="words" enterkeyhint="next" value="${esc(f.nombre)}" placeholder="Tu nombre"></label>
      <label class="campo"><span>Teléfono (WhatsApp)</span>
        <input id="f-telefono" type="tel" inputmode="tel" autocomplete="tel" value="${esc(f.telefono)}" placeholder="10 dígitos"></label>

      <div class="aviso-recoger"><strong>Recoge tu pedido con nosotros</strong>
        <span>${esc(CFG.notaRecoger || "")}</span></div>

      <fieldset class="grupo">
        <legend>¿Qué día pasas a recoger?</legend>
        ${FECHAS.map(d => `<label class="opcion"><input type="radio" name="fecha" value="${d}" ${f.fecha === d ? "checked" : ""}><span>${esc(cap(fechaLarga(d)))}</span></label>`).join("")}
      </fieldset>
      <p class="chico">${esc(CFG.avisoFechas || "")}</p>

      <label class="campo"><span>Notas generales <em>opcional</em></span>
        <textarea id="f-notas" rows="2" placeholder="Alergias, comentarios…">${esc(f.notas)}</textarea></label>

      ${S.errores.length ? `<ul class="errores" id="errores">${S.errores.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
      ${S.enviado ? `<p class="exito">Se abrió WhatsApp con tu pedido. Presiona <b>Enviar</b> allá para terminar. Si no se abrió, usa “Copiar pedido”.</p>` : ""}

      <button class="btn btn-suave" data-acc="copiar">Copiar pedido</button>
      <button class="btn btn-texto" data-acc="vaciar">Vaciar pedido</button>` : `
      <button class="btn btn-primario" data-acc="cerrar">Ver el menú</button>
      <button class="btn btn-suave" data-acc="asistente">Ayúdame a elegir</button>`}`;
    const pie = S.cart.length
      ? `<button class="btn btn-whats" data-acc="enviar"><span>Enviar por WhatsApp</span><strong>${dinero(totalCarrito(S.cart))}</strong></button>` : "";
    pintarPanel("carrito", cuerpo, pie);
  }

  function enviarPedido() {
    S.errores = validarPedido(S.cart, S.form);
    if (S.errores.length) {
      pintarCarrito();
      const e = $("#errores"); if (e && e.scrollIntoView) e.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (/X/i.test(CFG.whatsapp)) {
      aviso("Falta configurar el número de WhatsApp en menu.js");
      return;
    }
    const texto = mensajePedido(S.cart, S.form);
    const num = CFG.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    S.enviado = true; guardar(); pintarCarrito();
  }

  async function copiarPedido() {
    S.errores = validarPedido(S.cart, S.form);
    if (S.errores.length) { pintarCarrito(); return; }
    const texto = mensajePedido(S.cart, S.form);
    try { await navigator.clipboard.writeText(texto); aviso("Pedido copiado. Pégalo en WhatsApp."); }
    catch (e) { window.prompt("Copia tu pedido:", texto); }
  }

  /* ---------- asistente ---------- */
  const PREGUNTAS = [
    { id: "ocasion", tipo: "uno", titulo: "¿Con quién será la cena?",
      opciones: [["familia", "En familia"], ["amigos", "Con amigos"], ["pareja", "Cena íntima, en pareja"]] },
    { id: "personas", tipo: "numero", titulo: "¿Cuántas personas serán?" },
    { id: "evitar", tipo: "multi", titulo: "¿Hay algo que NO coman?",
      opciones: [["cerdo", "Cerdo"], ["mariscos", "Mariscos y pescado"], ["frutos_secos", "Nueces y frutos secos"], ["queso", "Queso"]],
      ninguno: "Nada, comemos de todo" },
    { id: "gustos", tipo: "multi", titulo: "¿Qué se les antoja?",
      opciones: [["tradicional", "Lo tradicional"], ["mexicano", "Sabor mexicano"], ["italiano", "Algo italiano"], ["queso", "Con queso"], ["ligero", "Fresco y ligero"]],
      ninguno: "Sorpréndanme" },
  ];

  function abrirAsistente() {
    ocultar("carrito");
    S.asist = { paso: 0, resp: { ocasion: null, personas: 6, evitar: [], gustos: [] }, variante: 0, res: null };
    limpiarPanel("asistente");
    pintarAsistente();
    mostrar("asistente");
  }

  function etiquetaRespuesta(q, r) {
    if (q.tipo === "numero") return `${r.personas} ${r.personas === 1 ? "persona" : "personas"}`;
    if (q.tipo === "uno") return q.opciones.find(o => o[0] === r.ocasion)[1];
    const sel = r[q.id];
    return sel.length ? sel.map(k => q.opciones.find(o => o[0] === k)[1]).join(", ") : q.ninguno;
  }

  function pintarAsistente() {
    const A = S.asist;
    let html = `<h3>Te ayudamos a elegir</h3>
      <p class="chico">Responde unas preguntas y armamos una propuesta con cantidades.</p><div class="chat">`;
    let pie = "";

    const hechas = A.res ? PREGUNTAS.length : A.paso;
    for (let i = 0; i < hechas; i++) {
      html += `<div class="burbuja bot">${esc(PREGUNTAS[i].titulo)}</div>
               <div class="burbuja yo">${esc(etiquetaRespuesta(PREGUNTAS[i], A.resp))}</div>`;
    }

    if (!A.res) {
      const q = PREGUNTAS[A.paso];
      const sig = `<button class="btn btn-primario" data-acc="as-sig">Continuar</button>`;
      html += `<div class="burbuja bot">${esc(q.titulo)}</div><div class="respuestas">`;
      if (q.tipo === "uno") {
        html += q.opciones.map(([v, t]) => `<button class="chip" data-acc="as-uno" data-v="${v}">${esc(t)}</button>`).join("");
      } else if (q.tipo === "numero") {
        html += `<div class="paso paso-grande"><button class="btn-paso" data-acc="as-menos" aria-label="Menos">−</button>
          <output>${A.resp.personas}</output>
          <button class="btn-paso" data-acc="as-mas" aria-label="Más">+</button></div>`;
        pie = sig;
      } else {
        const sel = A.resp[q.id];
        html += q.opciones.map(([v, t]) =>
          `<button class="chip ${sel.includes(v) ? "activo" : ""}" data-acc="as-multi" data-v="${v}" aria-pressed="${sel.includes(v)}">${esc(t)}</button>`).join("");
        html += `<button class="chip ${sel.length ? "" : "activo"}" data-acc="as-ninguno">${esc(q.ninguno)}</button>`;
        pie = sig;
      }
      html += `</div>`;
      if (A.paso > 0) pie = `<div class="pie-fila"><button class="btn btn-suave btn-atras" data-acc="as-atras">Atrás</button>${pie}</div>`;
    } else {
      html += `<div class="burbuja bot" id="as-inicio">${A.res.vacio
        ? "Con esas restricciones no encontré una combinación completa. Escríbenos por WhatsApp y armamos algo a tu medida."
        : `Esto les propongo para ${A.resp.personas} ${A.resp.personas === 1 ? "persona" : "personas"}:`}</div>`;
      if (!A.res.vacio) html += propuestaHTML(A);
      html += `<div class="acciones">
        ${A.res.vacio ? "" : `<button class="btn btn-suave" data-acc="as-otra">Otra propuesta</button>`}
        <button class="btn btn-texto" data-acc="as-reiniciar">Cambiar mis respuestas</button></div>`;
      if (!A.res.vacio)
        pie = `<button class="btn btn-primario" data-acc="as-agregar"><span>Agregar todo al pedido</span><strong>${dinero(A.res.total)}</strong></button>`;
    }
    html += `</div>`;
    pintarPanel("asistente", html, pie);

    const cuerpo = $("#asistente-panel .cuerpo");
    if (!A.res) cuerpo.scrollTop = cuerpo.scrollHeight;          // la pregunta nueva queda a la vista
    else if (A.nuevo) {
      A.nuevo = false;
      const t = $("#as-inicio");
      if (t && t.scrollIntoView) t.scrollIntoView({ block: "start" });
    }
  }

  function propuestaHTML(A) {
    const lineas = A.res.lineas.map((l, i) => {
      const p = POR_ID[l.id];
      const selects = (p.opciones || []).map(g => `
        <label class="mini-sel"><span>${esc(g.titulo)}</span>
          <select data-acc-sel="1" data-i="${i}" data-grupo="${g.id}">
            ${g.elecciones.map(el => `<option ${l.opts[g.id] === el.nombre ? "selected" : ""}>${esc(el.nombre)}</option>`).join("")}
          </select></label>`).join("");
      return `<li class="linea">
        <div class="linea-info">
          <strong>${esc(p.nombre)}</strong>
          <span class="chico">${esc(textoCantidad(p, l.qty))}</span>
          ${l.motivo ? `<span class="chico motivo">${esc(l.motivo)}</span>` : ""}
          ${selects}
        </div>
        <strong class="sub">${dinero(totalLinea(l))}</strong>
      </li>`;
    }).join("");
    return `<div class="propuesta"><ul class="lineas">${lineas}</ul>
      <div class="total"><span>Total estimado</span><strong id="as-total">${dinero(A.res.total)}</strong></div>
      <p class="chico">Cantidades calculadas para ${A.resp.personas} personas, con porciones generosas. Puedes ajustarlas después en tu pedido.
      Si hay alergias, confírmalo con nosotras: el filtro se basa en los ingredientes que conocemos del menú.</p></div>`;
  }

  function calcularPropuesta() { S.asist.res = recomendar(S.asist.resp, S.asist.variante); S.asist.nuevo = true; }

  /* ---------- eventos ---------- */
  document.addEventListener("click", ev => {
    const el = ev.target.closest("[data-acc]");
    if (!el) {
      if (ev.target.classList && ev.target.classList.contains("modal")) cerrarTodo();
      return;
    }
    const acc = el.dataset.acc;
    const i = Number(el.dataset.i);
    switch (acc) {
      case "abrir": abrirHoja(el.dataset.id); break;
      case "cerrar": cerrarTodo(); break;
      case "asistente": abrirAsistente(); break;
      case "carrito": abrirCarrito(); break;
      case "inicio": cerrarTodo(); window.scrollTo({ top: 0, behavior: "smooth" }); break;

      case "hoja-menos": { const h = S.hoja; h.qty = r2(Math.max(minDe(h.p), h.qty - pasoDe(h.p))); actualizarHoja(); break; }
      case "hoja-mas": { const h = S.hoja; h.qty = r2(h.qty + pasoDe(h.p)); actualizarHoja(); break; }
      case "hoja-agregar": agregarDesdeHoja(); break;

      case "linea-menos": {
        const l = S.cart[i], p = POR_ID[l.id];
        l.qty = r2(Math.max(minDe(p), l.qty - pasoDe(p)));
        guardar(); pintarBarra(); pintarCarrito(); break;
      }
      case "linea-mas": { const l = S.cart[i]; l.qty = r2(l.qty + pasoDe(POR_ID[l.id])); guardar(); pintarBarra(); pintarCarrito(); break; }
      case "linea-quitar": S.cart.splice(i, 1); guardar(); pintarBarra(); pintarCarrito(); break;
      case "vaciar": if (window.confirm("¿Vaciar todo tu pedido?")) { S.cart = []; S.enviado = false; guardar(); pintarBarra(); pintarCarrito(); } break;
      case "enviar": enviarPedido(); break;
      case "copiar": copiarPedido(); break;

      case "as-uno": S.asist.resp.ocasion = el.dataset.v; S.asist.paso++; pintarAsistente(); break;
      case "as-menos": S.asist.resp.personas = Math.max(1, S.asist.resp.personas - 1); pintarAsistente(); break;
      case "as-mas": S.asist.resp.personas = Math.min(80, S.asist.resp.personas + 1); pintarAsistente(); break;
      case "as-multi": {
        const q = PREGUNTAS[S.asist.paso], sel = S.asist.resp[q.id], v = el.dataset.v;
        S.asist.resp[q.id] = sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v];
        pintarAsistente(); break;
      }
      case "as-ninguno": S.asist.resp[PREGUNTAS[S.asist.paso].id] = []; pintarAsistente(); break;
      case "as-sig":
        if (S.asist.paso < PREGUNTAS.length - 1) S.asist.paso++;
        else calcularPropuesta();
        pintarAsistente(); break;
      case "as-atras": S.asist.paso = Math.max(0, S.asist.paso - 1); pintarAsistente(); break;
      case "as-otra": S.asist.variante++; calcularPropuesta(); pintarAsistente(); break;
      case "as-reiniciar": S.asist.res = null; S.asist.paso = 0; S.asist.variante = 0; pintarAsistente(); break;
      case "as-agregar":
        for (const l of S.asist.res.lineas) agregarAlCarrito(S.cart, { id: l.id, qty: l.qty, opts: l.opts, nota: "" });
        S.enviado = false; guardar(); pintarBarra(); ocultar("asistente"); abrirCarrito();
        aviso("Propuesta agregada. Revisa cantidades y completa tus datos."); break;
    }
  });

  document.addEventListener("change", ev => {
    const t = ev.target;
    // Opciones en la hoja de detalle
    if (t.dataset && t.dataset.grupo && S.hoja && !t.dataset.accSel) {
      const g = S.hoja.p.opciones.find(x => x.id === t.dataset.grupo);
      if (g.multiple) {
        const cur = new Set(S.hoja.opts[g.id] || []);
        t.checked ? cur.add(t.value) : cur.delete(t.value);
        S.hoja.opts[g.id] = [...cur];
      } else S.hoja.opts[g.id] = t.value;
      const e = $("#hoja-error"); if (e) e.hidden = true;
      actualizarHoja();
      return;
    }
    // Selector dentro de la propuesta del asistente
    if (t.dataset && t.dataset.accSel && S.asist && S.asist.res) {
      const l = S.asist.res.lineas[Number(t.dataset.i)];
      l.opts[t.dataset.grupo] = t.value;
      S.asist.res.total = totalCarrito(S.asist.res.lineas);
      pintarAsistente();
      return;
    }
    // Formulario del pedido
    if (t.name === "fecha") { S.form.fecha = t.value; guardar(); }
  });

  document.addEventListener("input", ev => {
    const t = ev.target;
    if (t.id === "hoja-nota" && S.hoja) S.hoja.nota = t.value;
    const mapa = { "f-nombre": "nombre", "f-telefono": "telefono", "f-notas": "notas" };
    if (mapa[t.id]) { S.form[mapa[t.id]] = t.value; guardar(); }
  });

  document.addEventListener("keydown", ev => { if (ev.key === "Escape") cerrarTodo(); });

  /* ---------- inicio ---------- */
  function iniciar() {
    cargarGuardado();
    pintarPortada(); pintarCategorias(); pintarMenu(); vigilarCategorias(); pintarBarra();
  }
  iniciar();
}