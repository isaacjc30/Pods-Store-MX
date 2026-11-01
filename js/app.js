const fmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: CONFIG.currency, maximumFractionDigits: 0 });
const cart = new Map();        // id -> cantidad (solo en memoria)
const slideIndex = new Map();  // id -> foto que se ve en la tarjeta
let filter = "all";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Si un elemento no existe en esta página (por ejemplo, en Términos o Garantía), usa un
// objeto neutro para que el resto del script siga funcionando sin romperse.
const NEUTRAL = new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => "" : NEUTRAL),
  set: () => true,
  apply: () => NEUTRAL,
});
const $ = (id) => document.getElementById(id) || NEUTRAL;
const productById = (id) => CONFIG.products.find((p) => p.id === id);
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const minPrice = () => Math.min(...CONFIG.products.map((p) => p.price));
// Mayoreo solo se activa si está encendido Y al menos un tramo tiene precio confirmado.
const wholesaleOn = () => Boolean(CONFIG.wholesale && CONFIG.wholesale.enabled && CONFIG.wholesale.tiers.some((t) => t.price != null));

// ===== Precios =====
// Precio por pieza según cantidad. Solo se aplica un tramo de mayoreo que tenga precio confirmado.
function bestTier(qty) {
  if (!wholesaleOn()) return null;
  const usable = CONFIG.wholesale.tiers.filter((t) => t.price != null && qty >= t.min);
  if (!usable.length) return null;
  return usable.reduce((a, b) => (b.min > a.min ? b : a));
}
function unitPrice(p, qty) {
  const tier = bestTier(qty);
  return tier ? tier.price : p.price;
}
// Total del carrito: cada línea usa el precio que corresponde a su cantidad
const lineTotal = (id, qty) => unitPrice(productById(id), qty) * qty;
const total = () => [...cart].reduce((sum, [id, qty]) => sum + lineTotal(id, qty), 0);
const itemCount = () => [...cart.values()].reduce((a, b) => a + b, 0);

// Precio anterior tachado: solo si el precio de referencia está verificado.
const refShown = (p) => Boolean(p.referencePrice) && p.referenceVerified === true;
const priceHTML = (p) => (refShown(p)
  ? `<span class="price-wrap"><s class="price-old">${fmt.format(p.referencePrice)}</s><span class="price">${fmt.format(p.price)}</span></span>`
  : `<span class="price">${fmt.format(p.price)}</span>`);

// Si una foto no carga, se quita; si no queda ninguna, se oculta el bloque completo.
function imgFail(el) {
  const slides = el.closest(".slides");
  el.remove();
  if (!slides) return;
  const left = slides.querySelectorAll("img");
  if (!left.length) slides.closest(".card-img")?.remove();
  else if (left.length === 1) slides.querySelectorAll(".dot").forEach((d) => (d.hidden = true));
}

// ===== Carrusel de fotos =====
function slideshowHTML(p) {
  const start = slideIndex.get(p.id) || 0;
  const slides = p.images
    .map((src, i) => `<img src="${src}" alt="${esc(p.name)}, foto ${i + 1}" loading="lazy" class="${i === start ? "on" : ""}" onerror="imgFail(this)">`)
    .join("");
  const dots = p.images.length > 1
    ? `<div class="dots">${p.images.map((_, i) => `<button class="dot ${i === start ? "on" : ""}" data-i="${i}" aria-label="Ver foto ${i + 1}"></button>`).join("")}</div>`
    : "";
  return `<div class="slides" data-id="${p.id}">${slides}${dots}</div>`;
}

function showSlide(el, i) {
  if (!el) return;
  const imgs = el.querySelectorAll("img");
  if (!imgs.length) return;
  const n = imgs.length;
  const idx = ((i % n) + n) % n;
  imgs.forEach((img, k) => img.classList.toggle("on", k === idx));
  // Fondo borroso con la misma foto: la imagen nítida se ve completa sin recortes
  const frame = el.closest(".card-img");
  if (frame) frame.style.setProperty("--bg", `url("${new URL(imgs[idx].getAttribute("src"), document.baseURI).href}")`);
  el.querySelectorAll(".dot").forEach((d, k) => d.classList.toggle("on", k === idx));
  slideIndex.set(el.dataset.id, idx);
}

const stepSlide = (el, dir) => showSlide(el, (slideIndex.get(el.dataset.id) || 0) + dir);

setInterval(() => {
  if (reduceMotion || document.hidden) return;
  document.querySelectorAll(".slides:not(.paused)").forEach((el) => stepSlide(el, 1));
}, 4000);

// ===== Disponibilidad =====
const availBadge = (p) => (p.available === false
  ? `<span class="avail off"><i></i> Agotado</span>`
  : `<span class="avail"><i></i> Disponible</span>`);

// ===== Render =====
function renderFilters() {
  const tags = ["all", ...new Set(CONFIG.products.map((p) => p.tag))];
  $("filters").innerHTML = tags
    .map((t) => `<button class="chip" data-key="${esc(t)}" aria-pressed="${t === filter}">${t === "all" ? "Todos" : esc(t)}</button>`)
    .join("");
}

function renderGrid() {
  const items = CONFIG.products.filter((p) => filter === "all" || p.tag === filter);
  $("grid").innerHTML = items
    .map((p) => `
      <article class="card">
        ${(p.images || []).length ? `<div class="card-img">${slideshowHTML(p)}</div>` : ""}
        <div class="card-meta">${availBadge(p)}<span class="tag">${esc(p.tag)} · Réplica OEM</span></div>
        <h3><a href="producto.html?id=${p.id}">${esc(p.name)}</a></h3>
        <p>${esc(p.desc)}</p>
        <div class="card-foot">
          ${priceHTML(p)}
          <button class="add ${cart.has(p.id) ? "done" : ""}" data-add="${p.id}" ${p.available === false ? "disabled" : ""}>${cart.has(p.id) ? "En tu carrito ✓" : "Agregar"}</button>
        </div>
        <div class="card-links">
          <a class="details-link" href="producto.html?id=${p.id}">Ver detalles →</a>
          <a class="details-link" href="${waLink(`Hola, Pods Store MX. Quiero consultar el ${p.name} (${fmt.format(p.price)}). ¿Hay disponibilidad?`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
        </div>
      </article>`)
    .join("");
}

// Inicia el fondo borroso de cada tarjeta con su primera foto
function initBackdrops() {
  document.querySelectorAll("#grid .slides").forEach((el) => showSlide(el, slideIndex.get(el.dataset.id) || 0));
}

// ===== Ofertas =====
function renderOffers() {
  const grid = $("offersGrid");
  if (!CONFIG.offers.length) {
    grid.innerHTML = `<div class="empty-slot"><p>Próximamente habrá nuevas promociones.</p></div>`;
    return;
  }
  grid.innerHTML = CONFIG.offers
    .map((o) => {
      const p = productById(o.productId);
      if (!p) return "";
      const ref = o.referenceVerified === true ? o.reference : null;
      const pct = ref ? Math.round((1 - o.price / ref) * 100) : null;
      return `
      <article class="card offer">
        <span class="offer-badge">${esc(o.label || "Oferta")}${pct ? ` · −${pct}%` : ""}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="card-foot">
          <span class="price-wrap">${ref ? `<s class="price-old">${fmt.format(ref)}</s>` : ""}<span class="price">${fmt.format(o.price)}</span></span>
          <button class="add" data-add="${p.id}" ${p.available === false ? "disabled" : ""}>Agregar</button>
        </div>
        <div class="card-links"><a class="details-link" href="${waLink(`Hola, Pods Store MX. Me interesa la oferta del ${p.name} (${fmt.format(o.price)}). ¿Hay disponibilidad?`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a></div>
      </article>`;
    })
    .join("");
}

// ===== Mayoreo y menudeo (solo si wholesale.enabled) =====
function renderWholesale() {
  const section = $("mayoreo");
  const navLink = document.querySelector(".js-wholesale");
  if (!wholesaleOn()) {
    section.hidden = true;
    if (navLink) navLink.hidden = true;
    return;
  }
  section.hidden = false;
  if (navLink) navLink.hidden = false;
  $("menudeoList").innerHTML = CONFIG.products.map((p) => `
    <div class="list-row"><span>${esc(p.name)}</span><strong>${fmt.format(p.price)} c/u</strong></div>`).join("");
  $("wh-model").innerHTML = CONFIG.products.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  $("tiersBody").innerHTML = [`<tr><td>1 pieza</td><td>${fmt.format(minPrice())}</td></tr>`]
    .concat(CONFIG.wholesale.tiers.map((t) => `<tr><td>${t.min} piezas o más</td><td>${t.price == null ? "Por confirmar" : fmt.format(t.price)}</td></tr>`))
    .join("");
  updateWholesale();
}

function updateWholesale() {
  if (!wholesaleOn()) return;
  const p = productById($("wh-model").value) || CONFIG.products[0];
  const qty = Math.max(1, Math.min(999, Number($("wh-qty").value) || 1));
  const unit = unitPrice(p, qty);
  const subtotal = unit * qty;
  const saving = (p.price - unit) * qty;
  let text = `${qty} × ${p.name}: ${fmt.format(unit)} c/u. Total: ${fmt.format(subtotal)}.`;
  if (saving > 0) text += ` Ahorras ${fmt.format(saving)} frente al menudeo.`;
  $("whResult").textContent = text;
  $("whWa").href = waLink(`Hola, Pods Store MX. Quiero cotizar mayoreo: ${qty} × ${p.name}. Total estimado: ${fmt.format(subtotal)} MXN. ¿Me confirman disponibilidad?`);
}

// ===== Comparar =====
function renderCompare() {
  $("compareBody").innerHTML = CONFIG.products
    .map((p) => `
      <tr>
        <th scope="row"><a href="producto.html?id=${p.id}">${esc(p.name)}</a></th>
        <td>${fmt.format(p.price)}</td>
        <td>Ajuste ${esc(p.fit)}</td>
        <td>${CONFIG.warrantyDays} días</td>
      </tr>`)
    .join("");
}

function renderRefs() {
  $("refGrid").innerHTML = CONFIG.reviews.length
    ? CONFIG.reviews.map((r) => `
      <figure class="shot">
        <img src="${r.src}" alt="Mensaje de un comprador con calificación de ${r.rating} de 5" loading="lazy" onerror="this.closest('.shot').remove()">
        <figcaption class="rating"><span class="stars" aria-hidden="true">★★★★★</span> <strong>${r.rating}</strong> de 5</figcaption>
      </figure>`).join("")
    : `<figure class="empty-slot"><p>Pronto publicaremos mensajes de compradores.</p></figure>`;
}

// ===== Carrito =====
function renderCart() {
  $("cartCount").textContent = itemCount();
  const lines = [...cart].map(([id, qty]) => {
    const p = productById(id);
    const unit = unitPrice(p, qty);
    return `
      <div class="line">
        <div>
          <strong>${esc(p.name)}</strong>
          <small>${fmt.format(unit)} c/u${unit < p.price ? " · precio de mayoreo" : ""}</small>
          <div class="qty">
            <button data-dec="${id}" aria-label="Quitar uno">−</button>
            <span>${qty}</span>
            <button data-inc="${id}" aria-label="Agregar uno">+</button>
            <button class="remove" data-remove="${id}">Eliminar</button>
          </div>
        </div>
        <strong class="num">${fmt.format(lineTotal(id, qty))}</strong>
      </div>`;
  });
  $("lines").innerHTML = lines.length ? lines.join("") : `<p class="empty">Tu carrito está vacío.<br>Agrega modelos desde el catálogo.</p>`;
  $("total").textContent = fmt.format(total());
  $("sendWa").setAttribute("aria-disabled", String(itemCount() === 0));
  $("sendWa").href = waLink(orderText());
}

// Mensaje de WhatsApp generado desde el carrito
function orderText() {
  const name = $("name").value.trim();
  const zoneNote = $("note").value.trim();
  let text = `Hola, ${CONFIG.brand}. Quiero realizar una compra.\n\nProductos:\n`;
  let usesWholesale = false;
  cart.forEach((qty, id) => {
    const p = productById(id);
    const unit = unitPrice(p, qty);
    if (unit < p.price) usesWholesale = true;
    text += `- ${p.name} x${qty} (${fmt.format(unit)} c/u)\n`;
  });
  text += `\nTotal estimado: ${fmt.format(total())} MXN.`;
  if (wholesaleOn()) text += `\nModalidad: ${usesWholesale ? "mayoreo" : "menudeo"}.`;
  if (name) text += `\nNombre: ${name}`;
  if (zoneNote) text += `\nZona de entrega y nota: ${zoneNote}`;
  text += "\n\nMe gustaría confirmar disponibilidad y coordinar mi entrega.";
  return text;
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}

function openCart(open) {
  $("drawer").classList.toggle("open", open);
  $("scrim").classList.toggle("open", open);
  if (open) {
    renderCart();
    $("closeCart").focus();
  } else {
    $("openCart").focus();
  }
}

function refreshAll() {
  renderFilters();
  renderGrid();
  initBackdrops();
  renderOffers();
  renderCart();
}

// ===== Recomendador =====
// Usa las tres respuestas a la vez. Solo usa datos de config.js (fit, newest, precio).
// No atribuye funciones a los modelos.
const styleLabel = {
  almohadilla: "con almohadilla (ajuste sellado)",
  clasico: "sin almohadilla (estilo clásico)",
  nuevo: "de los más nuevos",
};
function recommend(device, style, modelId) {
  const deviceName = device === "android" ? "Android" : "iPhone";
  const compat = device === "android"
    ? "Como usas Android, confirmamos la compatibilidad de la unidad por WhatsApp antes de pagar."
    : "Confirmamos la compatibilidad de la unidad por WhatsApp antes de pagar.";
  const wantFit = style === "almohadilla" ? "almohadilla" : style === "clasico" ? "sin almohadilla" : null;
  const chosen = modelId ? productById(modelId) : null;

  let pick;
  if (chosen) pick = chosen;
  else if (style === "nuevo") pick = CONFIG.products.find((p) => p.newest) || CONFIG.products[0];
  else pick = CONFIG.products.find((p) => p.fit === wantFit) || CONFIG.products[0];

  let text = `Para tu ${deviceName} te recomendamos el ${pick.name} (${fmt.format(pick.price)}).`;
  if (chosen) text += " Es el modelo que elegiste.";
  else text += ` Lo elegimos por tu preferencia ${styleLabel[style]}.`;

  if (chosen && wantFit && chosen.fit !== wantFit) {
    const alt = CONFIG.products.find((p) => p.fit === wantFit && p.id !== chosen.id);
    text += ` Ojo: el ${chosen.name} no es ${styleLabel[style]}.`;
    if (alt) text += ` Si ese ajuste es el que buscas, el ${alt.name} (${fmt.format(alt.price)}) sí lo es.`;
  }
  return `${text} ${compat}`;
}

// ===== Eventos =====
$("filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-key]");
  if (!b) return;
  filter = b.dataset.key;
  refreshAll();
});

function addToCart(id) {
  const p = productById(id);
  if (!p || p.available === false) return;
  cart.set(id, (cart.get(id) || 0) + 1);
  refreshAll();
  toast(`${p.name} agregado al carrito`);
}

$("grid").addEventListener("click", (e) => {
  const dot = e.target.closest(".dot");
  if (dot) return showSlide(dot.closest(".slides"), Number(dot.dataset.i));
  const add = e.target.closest("[data-add]");
  if (add) addToCart(add.dataset.add);
});
$("offersGrid").addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) addToCart(add.dataset.add);
});

// Pausa el carrusel mientras el cursor está encima
$("grid").addEventListener("mouseover", (e) => {
  const s = e.target.closest(".slides");
  if (s) s.classList.add("paused");
});
$("grid").addEventListener("mouseout", (e) => {
  const s = e.target.closest(".slides");
  if (s && !s.contains(e.relatedTarget)) s.classList.remove("paused");
});

// Deslizar en celular
let swipe = null;
$("grid").addEventListener("touchstart", (e) => {
  const s = e.target.closest(".slides");
  swipe = s ? { el: s, x: e.touches[0].clientX } : null;
}, { passive: true });
$("grid").addEventListener("touchend", (e) => {
  if (!swipe) return;
  const dx = e.changedTouches[0].clientX - swipe.x;
  if (Math.abs(dx) > 40) stepSlide(swipe.el, dx < 0 ? 1 : -1);
  swipe = null;
});

$("lines").addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const rm = e.target.closest("[data-remove]");
  if (inc) cart.set(inc.dataset.inc, cart.get(inc.dataset.inc) + 1);
  if (dec) {
    const id = dec.dataset.dec;
    const qty = cart.get(id) - 1;
    if (qty > 0) cart.set(id, qty);
    else cart.delete(id);
  }
  if (rm) cart.delete(rm.dataset.remove);
  if (inc || dec || rm) refreshAll();
});

$("openCart").addEventListener("click", () => openCart(true));
$("closeCart").addEventListener("click", () => openCart(false));
$("scrim").addEventListener("click", () => openCart(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") openCart(false); });
["name", "note"].forEach((id) => $(id).addEventListener("input", renderCart));
$("sendWa").addEventListener("click", (e) => {
  if (itemCount() === 0) {
    e.preventDefault();
    toast("Agrega al menos un producto");
  }
});

$("verRecomendacion").addEventListener("click", () => {
  const device = $("q-device").value;
  const style = $("q-style").value;
  const model = $("q-model").value;
  if (!device || !style) {
    $("assistResult").textContent = "Elige tu celular y tu preferencia de ajuste para recomendarte.";
    return;
  }
  $("assistResult").textContent = recommend(device, style, model);
});

// Mayoreo: modalidad y cálculo
document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    $("modeMenudeo").hidden = mode !== "menudeo";
    $("modeMayoreo").hidden = mode !== "mayoreo";
  });
});
["wh-model", "wh-qty"].forEach((id) => $(id).addEventListener("input", updateWholesale));

// ===== Comunidad de WhatsApp: el botón solo aparece con un enlace real =====
const groupReady = !CONFIG.whatsappGroup.includes("REEMPLAZAR");
$("groupSoon").hidden = groupReady;
document.querySelectorAll("[data-group]").forEach((el) => {
  el.hidden = !groupReady;
  if (groupReady) el.href = CONFIG.whatsappGroup;
});

// ===== Suscripción (sin backend: no se simula ningún registro) =====
// Solo acepta correos que terminan exactamente en @gmail.com
const isGmail = (v) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(v.trim());
$("subForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("subEmail").value;
  const msg = $("subMsg");
  if (!isGmail(email)) {
    msg.textContent = "Por el momento, únicamente aceptamos correos de Gmail.";
    return;
  }
  if (!$("subConsent").checked) {
    msg.textContent = "Marca la casilla para aceptar recibir comunicaciones comerciales.";
    return;
  }
  msg.textContent = "Por ahora no podemos guardar tu correo: el sistema de suscripciones todavía no está conectado. No te suscribimos a nada.";
});

// ===== Datos fijos y pie de página =====
const phone = "+" + CONFIG.whatsapp.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3 $4");
const waDefault = waLink("Hola, Pods Store MX. Tengo una duda sobre los modelos.");
document.querySelectorAll("[data-phone]").forEach((el) => (el.textContent = phone));
document.querySelectorAll("[data-wa]").forEach((el) => (el.href = waDefault));
document.querySelectorAll("[data-min-price]").forEach((el) => (el.textContent = fmt.format(minPrice())));
$("year").textContent = new Date().getFullYear();

document.querySelectorAll("[data-social]").forEach((el) => {
  const url = CONFIG.social[el.dataset.social];
  el.hidden = !url;
  if (url) el.href = url;
});
document.querySelectorAll("[data-email]").forEach((el) => {
  el.hidden = !CONFIG.email;
  if (CONFIG.email) {
    el.href = `mailto:${CONFIG.email}`;
    el.textContent = CONFIG.email;
  }
});

// Menú hamburguesa en celular
document.querySelectorAll(".menu-btn").forEach((btn) => {
  const header = btn.closest("header");
  const setOpen = (open) => {
    header.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  btn.addEventListener("click", () => setOpen(!header.classList.contains("menu-open")));
  header.querySelectorAll(".links a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
});

// Aviso flotante de entregas: se cierra con la X
const notice = $("notice");
if (notice) $("noticeClose").addEventListener("click", () => (notice.hidden = true));

// Apartado de mejoras: arma el mensaje y lo envía por WhatsApp
$("mejorasForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const like = $("fb-like").value.trim();
  const dislike = $("fb-dislike").value.trim();
  const improve = $("fb-improve").value.trim();
  if (!like && !dislike && !improve) {
    $("fbResult").textContent = "Escribe al menos una opinión para enviarla.";
    return;
  }
  const name = $("fb-name").value.trim();
  let text = "Hola, quiero compartir una opinión sobre la web:\n";
  if (like) text += `\nMe gusta: ${like}`;
  if (dislike) text += `\nNo me gusta: ${dislike}`;
  if (improve) text += `\nCómo mejorar: ${improve}`;
  if (name) text += `\n\nNombre: ${name}`;
  window.open(waLink(text), "_blank", "noopener");
  $("fbResult").textContent = "Abrimos WhatsApp con tu mensaje listo para enviar.";
});

renderCompare();
renderRefs();
renderWholesale();
refreshAll();
