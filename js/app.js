/* Bebidas e Tabacaria — App (vanilla, sem dependências)
   Componentes: Header, CategoryNavigation, ProductCard, ProductGrid,
   Search, CartButton, CartDrawer, CartItem, OrderSummary, WhatsAppCheckout, Footer */

(function () {
  "use strict";
  // Corrige bug mobile: recarregar mantinha posição anterior. Força topo sem mudar layout.
  try { if('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e){}
  const toTop = () => { window.scrollTo(0,0); document.documentElement.scrollTop=0; document.body.scrollTop=0; };
  window.addEventListener('load', () => { toTop(); setTimeout(toTop, 50); setTimeout(toTop, 200); });
  window.addEventListener('pageshow', (e) => { if(e.persisted) toTop(); });
  document.addEventListener('DOMContentLoaded', toTop);
  window.addEventListener('store:ready', () => { if(!location.hash) toTop(); });

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const money = (v) => BRL.format(v);

  const state = {
    cat: "todos",
    query: "",
    sort: "rel",
    cart: new Map(), // key -> qty (key = id or id::variantId)
    name: "",
  };

  // Helpers que precisam estar antes da persistência
  const getProducts = () => (window.STORE && window.STORE.products) || (typeof PRODUCTS!=="undefined"?PRODUCTS:[]);
  const getCategories = () => (window.STORE && window.STORE.categories) || (typeof CATEGORIES!=="undefined"?CATEGORIES:[]);
  const cartKey = (id, variantId) => variantId ? `${id}::${variantId}` : String(id);
  const parseCartKey = (k) => { const [id,vid]=String(k).split("::"); return {id, variantId: vid||null}; };

  // ---------- Persistência ----------
  try {
    const saved = JSON.parse(localStorage.getItem("bt_cart_v1") || "{}");
    Object.entries(saved).forEach(([k, q]) => {
      const {id}=parseCartKey(k);
      if (getProducts().some((p) => String(p.id)===String(id)) && q > 0 && q <= 99) state.cart.set(k, q);
    });
    state.name = localStorage.getItem("bt_name_v1") || "";
  } catch (e) {}

  const persist = () => {
    try {
      localStorage.setItem("bt_cart_v1", JSON.stringify(Object.fromEntries(state.cart)));
      localStorage.setItem("bt_name_v1", state.name);
    } catch (e) {}
  };
  const byId = (id) => getProducts().find((p) => String(p.id) === String(id));
  const cartCount = () => Array.from(state.cart.values()).reduce((a, b) => a + b, 0);
  const cartTotal = () =>
    Array.from(state.cart.entries()).reduce((sum, [k, q]) => {
      const {id, variantId}=parseCartKey(k); const p=byId(id); if(!p) return sum;
      let price=p.price; if(variantId){ const v=(p.variants||[]).find(x=>String(x.id)===String(variantId)); if(v && v.price!=null) price=Number(v.price); }
      return sum + price * q;
    }, 0);

  // ---------- Status aberto/fechado ----------
  function renderStatus() {
    const h = new Date().getHours();
    const open = h >= 16; // 16h às 00h
    $("#statusDot").classList.toggle("closed", !open);
    $("#statusText").textContent = open
      ? "Aberto agora · até 00h"
      : "Fechado agora · abrimos às 16h";
  }

  // ---------- CategoryNavigation ----------
  function catCount(id) {
    const prods=getProducts();
    if (id === "todos") return prods.length;
    if (id === "mais-vendidos")
      return prods.filter((p) => p.badge === "mais-vendido" || p.category === "mais-vendidos").length;
    return prods.filter((p) => p.category === id).length;
  }

  function renderCats() {
    const nav = $("#catNav");
    nav.innerHTML = "";
    getCategories().forEach((c) => {
      const b = document.createElement("button");
      b.className = "cat-pill";
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.cat === c.id));
      b.innerHTML = `${c.label} <span class="n">${catCount(c.id)}</span>`;
      b.addEventListener("click", () => {
        state.cat = c.id;
        renderCats();
        renderGrid();
      });
      nav.appendChild(b);
    });
  }

  // ---------- Filtro + ordenação ----------
  function filtered() {
    const q = state.query.trim().toLowerCase();
    let list = getProducts().filter((p) => {
      const inCat =
        state.cat === "todos" ? true
        : state.cat === "mais-vendidos"
          ? p.badge === "mais-vendido"
          : p.category === state.cat;
      if (!inCat) return false;
      if (!q) return true;
      return `${p.name} ${p.desc} ${p.category}`.toLowerCase().includes(q);
    });
    if (state.sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
    if (state.sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return list;
  }

  const initials = (name) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // Selos de canto desativados: só a informação central do produto é exibida.
  // (Para reativar, retorne ["hot", "Mais vendido"] ou ["combo", "Combo"].)
  const badgeLabel = (p) => {
    return null;
  };

  // ---------- ProductCard + ProductGrid ----------
  function cardEl(p) {
    const art = document.createElement("article");
    art.className = "card";
    const b = badgeLabel(p);
    art.innerHTML = `
      <div class="card-media">
        <div class="card-fallback" aria-hidden="true">
          <strong>${initials(p.name)}</strong><span>Foto em /public</span>
        </div>
      </div>
      <div class="card-body">
        ${b ? `<span class="badge ${b[0]}">${b[1]}</span>` : ``}
        <p class="card-cat">${(getCategories().find((c) => c.id === p.category)?.label || p.category)}${p.demo ? " · exemplo" : ""}${p.originalPrice?` <s class="muted" style="font-weight:400;text-transform:none;letter-spacing:0">de ${money(p.originalPrice)}</s>`:""}</p>
        <h3 class="card-name">${p.name}</h3>
        <p class="card-desc">${p.desc}</p>
        ${p.variants && p.variants.length ? `<label class="variant-select" style="display:grid;gap:6px;margin:6px 0"><span class="small" style="font-weight:600">Opção</span><select class="variant-picker" aria-label="Escolher variante de ${p.name}">${p.variants.map(v=>`<option value="${v.id}">${v.title}${v.price!=null?` — ${money(v.price)}`:""}${v.stock===0?" (esgotado)":""}</option>`).join("")}</select></label>` : ""}
        <div class="card-foot">
          <span class="price"><strong class="price-val">${money(p.price)}</strong><small>/ ${p.unit||"un"}</small></span>
          <button class="add-btn" type="button" aria-label="Adicionar ${p.name} ao carrinho">Adicionar</button>
        </div>
      </div>`;

    // imagem real — esconde fallback quando carrega
    const media = $(".card-media", art);
    const fallback = $(".card-fallback", art);
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = p.name;
    img.decoding = "async";
    img.src = p.image;
    img.onload = () => { if(fallback) fallback.style.display="none"; };
    img.onerror = () => img.remove();
    media.appendChild(img);
    // se imagem for data: ou cache já carregada
    if(img.complete && img.naturalWidth) fallback.style.display="none";
    if (p.demo) {
      const d = document.createElement("span");
      d.className = "badge demo-b";
      d.textContent = "Demo";
      media.appendChild(d);
    }

    const btn = $(".add-btn", art);
    const picker = $(".variant-picker", art);
    const priceVal = $(".price-val", art);
    function variantPrice(){
      if(!picker) return p.price;
      const vid=picker.value; const v=(p.variants||[]).find(x=>String(x.id)===String(vid));
      return v && v.price!=null ? Number(v.price) : p.price;
    }
    if(picker){
      picker.addEventListener("change", ()=>{ priceVal.textContent = money(variantPrice()); });
      priceVal.textContent = money(variantPrice());
    }
    btn.addEventListener("click", () => {
      if(picker){
        const v=(p.variants||[]).find(x=>String(x.id)===String(picker.value));
        if(v && v.stock===0){ toast("Variante esgotada"); return; }
      }
      addToCart(p.id, btn, picker ? picker.value : null);
    });
    return art;
  }

  function renderGrid() {
    const grid = $("#productGrid");
    const list = filtered();
    grid.innerHTML = "";
    list.forEach((p) => grid.appendChild(cardEl(p)));
    $("#emptyState").hidden = list.length > 0;
    $("#resultsCount").textContent =
      list.length === 1 ? "1 produto" : `${list.length} produtos`;
  }

  // ---------- Search ----------
  function bindSearch() {
    const d = $("#searchDesktop"), m = $("#searchMobile");
    const sync = (v, other) => {
      state.query = v;
      if (other.value !== v) other.value = v;
      renderGrid();
    };
    d.addEventListener("input", () => sync(d.value, m));
    m.addEventListener("input", () => sync(m.value, d));
    $("#sortSelect").addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderGrid();
    });
    $("#clearFilters").addEventListener("click", () => {
      state.query = ""; d.value = ""; m.value = "";
      state.cat = "todos"; state.sort = "rel"; $("#sortSelect").value = "rel";
      renderCats(); renderGrid();
    });
  }

  // ---------- Toast ----------
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastT);
    toastT = setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => (t.hidden = true), 220);
    }, 1800);
  }

  // ---------- CartButton ----------
  function renderCartButton() {
    const n = cartCount(), total = cartTotal();
    const badge = $("#cartCount");
    badge.textContent = n;
    badge.setAttribute("aria-label", `${n} ${n === 1 ? "item" : "itens"} no carrinho`);
    badge.classList.remove("pop");
    void badge.offsetWidth;
    if (n > 0) badge.classList.add("pop");

    const bar = $("#mobileCartBar");
    if (n > 0) {
      bar.hidden = false;
      $("#mobileCartTotal").textContent = money(total);
      $("#mobileCartN").textContent = n;
    } else {
      bar.hidden = true;
    }
  }

  function addToCart(id, btn, variantId=null) {
    const key=cartKey(id, variantId);
    state.cart.set(key, Math.min(99, (state.cart.get(key) || 0) + 1));
    persist();
    renderCartButton();
    renderCart();
    const p=byId(id); const v= variantId ? (p.variants||[]).find(x=>String(x.id)===String(variantId)) : null;
    toast(`${p.name}${v?" ("+v.title+")":""} adicionado ✓`);
    if (btn) {
      const old = btn.textContent;
      btn.classList.add("added");
      btn.textContent = "Adicionado ✓";
      setTimeout(() => { btn.classList.remove("added"); btn.textContent = old; }, 1100);
    }
  }

  // ---------- CartDrawer ----------
  const drawer = () => $("#cartDrawer");
  let lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    $("#overlay").hidden = false;
    requestAnimationFrame(() => $("#overlay").classList.add("show"));
    const d = drawer();
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
    d.removeAttribute("inert");
    document.body.style.overflow = "hidden";
    renderCart();
    setTimeout(() => $("#cartCloseBtn").focus(), 60);
  }

  function closeCart() {
    $("#overlay").classList.remove("show");
    setTimeout(() => ($("#overlay").hidden = true), 240);
    const d = drawer();
    d.classList.remove("open");
    d.setAttribute("aria-hidden", "true");
    d.setAttribute("inert", "");
    document.body.style.overflow = "";
    if (lastFocus?.focus) lastFocus.focus();
  }

  // ---------- CartItem + OrderSummary ----------
  function renderCart() {
    const list = $("#cartList");
    list.innerHTML = "";
    const entries = Array.from(state.cart.entries());
    const empty = entries.length === 0;
    $("#cartEmpty").style.display = empty ? "" : "none";
    $("#checkoutBox").hidden = empty;
    $("#drawerSub").textContent = empty
      ? "Confira e finalize no WhatsApp"
      : `${cartCount()} ${cartCount() === 1 ? "item" : "itens"} · ${money(cartTotal())}`;

    entries.forEach(([key, qty]) => {
      const {id, variantId}=parseCartKey(key);
      const p = byId(id);
      if (!p) return;
      const v = variantId ? (p.variants||[]).find(x=>String(x.id)===String(variantId)) : null;
      const unitPrice = v && v.price!=null ? Number(v.price) : p.price;
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML = `
        <span class="cart-thumb" aria-hidden="true">${initials(p.name)}</span>
        <div class="cart-item-info">
          <strong>${p.name}${v?` <span class="muted" style="font-weight:400">— ${v.title}</span>`:""}</strong>
          <small>${money(unitPrice)} / ${p.unit||"un"} · <b>${money(unitPrice * qty)}</b></small>
          <div class="qty">
            <button type="button" data-a="dec" aria-label="Diminuir quantidade de ${p.name}">−</button>
            <output aria-label="Quantidade">${qty}</output>
            <button type="button" data-a="inc" aria-label="Aumentar quantidade de ${p.name}">+</button>
          </div>
        </div>
        <div class="cart-item-side">
          <strong>${money(unitPrice * qty)}</strong>
          <button type="button" class="remove" data-a="rm">Remover</button>
        </div>`;
      const thumb = $(".cart-thumb", li);
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.src = p.image;
      img.onerror = () => img.remove();
      thumb.appendChild(img);

      li.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-a]");
        if (!btn) return;
        const a = btn.dataset.a;
        const cur = state.cart.get(key) || 0;
        if (a === "inc") state.cart.set(key, Math.min(99, cur + 1));
        if (a === "dec") (cur <= 1) ? state.cart.delete(key) : state.cart.set(key, cur - 1);
        if (a === "rm") { state.cart.delete(key); toast("Item removido"); }
        persist(); renderCartButton(); renderCart();
      });
      list.appendChild(li);
    });

    $("#sumCount").textContent = cartCount();
    $("#sumTotal").textContent = money(cartTotal());
    $("#grandTotal").textContent = money(cartTotal());
    if (!$("#customerName").value && state.name) $("#customerName").value = state.name;
  }

  // ---------- WhatsAppCheckout ----------
  function buildMessage() {
    const name = ($("#customerName").value || "").trim();
    const lines = [];
    lines.push(`Olá! Sou ${name || "{nome}"}, quero fazer um pedido:`);
    lines.push(`— Bebidas e Tabacaria —`);
    lines.push(``);
    let i = 1;
    for (const [key, qty] of state.cart.entries()) {
      const {id, variantId}=parseCartKey(key);
      const p = byId(id);
      if (!p) continue;
      const v = variantId ? (p.variants||[]).find(x=>String(x.id)===String(variantId)) : null;
      const unitPrice = v && v.price!=null ? Number(v.price) : p.price;
      lines.push(`${i}) ${qty}x ${p.name}${v?" ("+v.title+")":""} — ${money(unitPrice)} cada = ${money(unitPrice * qty)}`);
      i++;
    }
    lines.push(``);
    lines.push(`Total: ${money(cartTotal())}`);
    lines.push(`Entrega a combinar. Obrigado!`);
    return lines.join("\n");
  }

  function checkout() {
    if (cartCount() === 0) { toast("Carrinho vazio"); return; }
    const input = $("#customerName");
    state.name = input.value.trim();
    persist();
    if (!state.name) {
      $("#nameError").hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.focus();
      toast("Informe seu nome para finalizar");
      return;
    }
    $("#nameError").hidden = true;
    input.removeAttribute("aria-invalid");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, "_blank", "noopener");
  }

  // ---------- Init ----------
  function syncHeaderH() {
    const h = $(".header")?.offsetHeight || 68;
    document.documentElement.style.setProperty("--header-h", h + "px");
  }

  function init() {
    renderStatus();
    setInterval(renderStatus, 60000);
    syncHeaderH();
    window.addEventListener("resize", syncHeaderH);
    setTimeout(syncHeaderH, 300);
    const boot = () => { renderCats(); renderGrid(); renderCartButton(); renderCart(); };
    window.addEventListener("store:ready", boot);
    // render demo immediately, then re-render when Supabase loads
    boot();
    bindSearch();
    if (state.name) $("#customerName").value = state.name;

    $("#cartOpenBtn").addEventListener("click", openCart);
    $("#mobileCartBar").addEventListener("click", openCart);
    $("#cartCloseBtn").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);
    $("#emptyGoCatalog").addEventListener("click", () => {
      closeCart();
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    });
    $("#clearCart").addEventListener("click", () => {
      state.cart.clear(); persist(); renderCartButton(); renderCart(); toast("Carrinho esvaziado");
    });
    $("#checkoutBtn").addEventListener("click", checkout);
    $("#customerName").addEventListener("input", (e) => {
      state.name = e.target.value; persist();
      if (state.name.trim()) { $("#nameError").hidden = true; e.target.removeAttribute("aria-invalid"); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer().classList.contains("open")) closeCart();
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
