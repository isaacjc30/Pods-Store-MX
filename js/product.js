const fmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: CONFIG.currency, maximumFractionDigits: 0 });
const $ = (id) => document.getElementById(id);
const waLink = (text) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const refShown = (p) => Boolean(p.referencePrice) && p.referenceVerified === true;
const priceHTML = (p) => (refShown(p)
  ? `<span class="price-wrap"><s class="price-old">${fmt.format(p.referencePrice)}</s><span class="price">${fmt.format(p.price)}</span></span>`
  : `<span class="price">${fmt.format(p.price)}</span>`);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const absUrl = (src) => new URL(src, document.baseURI).href;

const params = new URLSearchParams(location.search);
const product = CONFIG.products.find((p) => p.id === params.get("id")) || CONFIG.products[0];
document.title = `${product.name} | ${CONFIG.brand}`;
$("crumbName").textContent = product.name;

function availLabel(p) {
  return p.available === false
    ? `<span class="avail off"><i></i> Agotado</span>`
    : `<span class="avail"><i></i> Disponible</span>`;
}

function render() {
  const images = product.images || [];
  const thumbs = images
    .map((src, i) => `<button class="thumb ${i === 0 ? "on" : ""}" data-i="${i}" aria-label="Ver foto ${i + 1}"><img src="${src}" alt="" loading="lazy" onerror="this.parentElement.remove()"></button>`)
    .join("");

  $("product").innerHTML = `
    <div class="pdp">
      <div class="gallery">
        ${images[0] ? `<div class="main-img" style="--bg:url('${absUrl(images[0])}')"><img id="mainImg" src="${images[0]}" alt="${esc(product.name)}" onerror="this.closest('.gallery').remove()"></div>` : ""}
        ${images.length > 1 ? `<div class="thumbs" role="group" aria-label="Fotos del producto">${thumbs}</div>` : ""}
      </div>

      <div class="buy">
        <p class="tag">${esc(product.tag)}</p>
        <h1>${esc(product.name)}</h1>
        ${availLabel(product)}
        <p class="price-line">${priceHTML(product)}</p>
        <p class="muted">Precio en pesos mexicanos. Réplica OEM Premium de terceros, no es un producto original de Apple.</p>

        <div class="qty-row">
          <label for="qty">Cantidad</label>
          <div class="qty-box">
            <button id="minus" aria-label="Quitar uno">−</button>
            <input id="qty" type="number" min="1" max="10" value="1" readonly>
            <button id="plus" aria-label="Agregar uno">+</button>
          </div>
        </div>

        <a class="btn primary block" id="buyWa" href="#" target="_blank" rel="noopener">Consultar por WhatsApp</a>
        <button class="btn ghost block" id="copyLink" type="button">Copiar enlace del producto</button>
        <p class="note" id="copyNote" role="status" aria-live="polite"></p>

        <p class="desc">${esc(product.desc)}</p>

        <details class="acc" open>
          <summary>Qué incluye</summary>
          <p>Lo que incluye cada modelo se confirma por WhatsApp antes de tu compra.</p>
        </details>
        <details class="acc">
          <summary>Pagos y entregas</summary>
          <p>Los pagos no se procesan en esta página: se coordinan por WhatsApp. Efectivo en la entrega o transferencia previamente acordada.</p>
          <p>Entregas coordinadas por WhatsApp en ${CONFIG.zones.map(esc).join(", ")}. El punto, la fecha, el horario y el costo se acuerdan antes de confirmar.</p>
        </details>
        <details class="acc">
          <summary>Garantía y soporte</summary>
          <p>Garantía comercial de ${CONFIG.warrantyDays} días naturales. Para solicitar atención, consulta <a href="garantia.html">Garantía y soporte</a>.</p>
        </details>
      </div>
    </div>`;

  updateBuyLink();
}

function updateBuyLink() {
  const qty = Number($("qty").value);
  const text = `Hola, ${CONFIG.brand}. Quiero comprar ${qty} × ${product.name} (${fmt.format(product.price * qty)} MXN). ¿Hay disponibilidad?`;
  $("buyWa").href = waLink(text);
  if (product.available === false) $("buyWa").setAttribute("aria-disabled", "true");
}

function setMain(i) {
  const images = product.images || [];
  const idx = ((i % images.length) + images.length) % images.length;
  const main = $("mainImg");
  if (!main) return;
  main.src = images[idx];
  main.closest(".main-img").style.setProperty("--bg", `url("${absUrl(images[idx])}")`);
  document.querySelectorAll(".thumb").forEach((t, k) => t.classList.toggle("on", k === idx));
}

// Galería y cantidad
document.addEventListener("click", (e) => {
  const thumb = e.target.closest(".thumb");
  if (thumb) setMain(Number(thumb.dataset.i));

  if (e.target.id === "plus") {
    $("qty").value = Math.min(10, Number($("qty").value) + 1);
    updateBuyLink();
  }
  if (e.target.id === "minus") {
    $("qty").value = Math.max(1, Number($("qty").value) - 1);
    updateBuyLink();
  }
  if (e.target.id === "copyLink") {
    navigator.clipboard?.writeText(location.href)
      .then(() => ($("copyNote").textContent = "Enlace copiado."))
      .catch(() => ($("copyNote").textContent = "Selecciona la barra de direcciones para copiar el enlace."));
  }
});

// Otros modelos
function renderRelated() {
  const others = CONFIG.products.filter((p) => p.id !== product.id);
  $("related").innerHTML = others.map((p) => `
    <article class="card">
      ${(p.images || [])[0] ? `<div class="card-img" style="--bg:url('${absUrl(p.images[0])}')"><img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.remove()"></div>` : ""}
      <div class="card-meta">${availLabel(p)}<span class="tag">${esc(p.tag)}</span></div>
      <h3><a href="producto.html?id=${p.id}">${esc(p.name)}</a></h3>
      <div class="card-foot">
        ${priceHTML(p)}
        <a class="add" href="producto.html?id=${p.id}">Ver producto</a>
      </div>
    </article>`).join("");
}

// Pie de página
$("year").textContent = new Date().getFullYear();
document.querySelectorAll("[data-wa]").forEach((el) => (el.href = waLink(`Hola, ${CONFIG.brand}. Tengo una duda sobre los modelos.`)));
document.querySelectorAll("[data-phone]").forEach((el) => (el.textContent = "+" + CONFIG.whatsapp.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3 $4")));
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
const groupReady = !CONFIG.whatsappGroup.includes("REEMPLAZAR");
document.querySelectorAll("[data-group]").forEach((el) => {
  el.hidden = !groupReady;
  if (groupReady) el.href = CONFIG.whatsappGroup;
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

render();
renderRelated();
