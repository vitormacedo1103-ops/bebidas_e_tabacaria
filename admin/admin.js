// Admin — auth + CRUD (vanilla). Depende de window.supabase (js/supabase.js) e supabase-js CDN.
(function(){
  const $ = (s,c=document)=>c.querySelector(s);
  const byId = (id)=>document.getElementById(id);
  if(!window.SUPABASE_CONFIGURED || !window.supabase){
    $("#loginError").hidden=false; $("#loginError").textContent="Supabase não configurado. Configure js/env.js com SUPABASE_URL e SUPABASE_ANON_KEY (veja .env.example) e rode supabase/schema.sql e crie o usuário em Auth.";
    $("#loginBtn").disabled=true; return;
  }
  const sb = window.supabase;
  let session=null;
  let categories=[];
  let editingImages=[]; // {file?, url, is_main, position}
  // Tabs
  function showTab(name){
    document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t.dataset.tab===name));
    document.querySelectorAll(".panel").forEach(p=>p.hidden = p.id!==name);
  }
  document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>showTab(t.dataset.tab)));
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.go)));

  // Auth
  async function refreshSession(){
    const {data:{session:s}} = await sb.auth.getSession();
    session=s;
    if(s){ $("#loginView").hidden=true; $("#appView").hidden=false; $("#userEmail").textContent=s.user.email; await loadCategories(); await loadDashboard(); await loadProducts(); }
    else { $("#loginView").hidden=false; $("#appView").hidden=true; }
  }
  sb.auth.onAuthStateChange((_e,s)=>{ session=s; refreshSession(); });

  byId("loginForm").addEventListener("submit", async (e)=>{
    e.preventDefault(); $("#loginError").hidden=true; $("#loginBtn").disabled=true; $("#loginBtn").textContent="Entrando...";
    const email=byId("email").value.trim(), password=byId("password").value;
    const {error}= await sb.auth.signInWithPassword({email,password});
    if(error){ $("#loginError").hidden=false; $("#loginError").textContent= error.message.includes("Invalid")?"E-mail ou senha inválidos.": error.message; }
    $("#loginBtn").disabled=false; $("#loginBtn").textContent="Entrar";
  });
  byId("logoutBtn").addEventListener("click", async()=>{ await sb.auth.signOut(); byId("userPopup").hidden=true; byId("logoMenuBtn").setAttribute("aria-expanded","false"); });
  // Logo popup
  const logoBtn=byId("logoMenuBtn"), popup=byId("userPopup");
  logoBtn.addEventListener("click", (e)=>{ e.stopPropagation(); const willShow=popup.hidden; popup.hidden=!willShow; logoBtn.setAttribute("aria-expanded", String(willShow)); });
  document.addEventListener("click", (e)=>{ if(!popup.hidden && !popup.contains(e.target) && e.target!==logoBtn && !logoBtn.contains(e.target)){ popup.hidden=true; logoBtn.setAttribute("aria-expanded","false"); } });
  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && !popup.hidden){ popup.hidden=true; logoBtn.setAttribute("aria-expanded","false"); } });

  // Categories
  async function loadCategories(){
    const {data,error}= await sb.from("categories").select("*").order("name");
    if(error) return;
    categories=data;
    const opts = data.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
    byId("fCategory").innerHTML = opts;
    byId("filterCat").innerHTML = `<option value="">Todas categorias</option>`+opts;
  }

  // Dashboard
  async function loadDashboard(){
    const {data:products}= await sb.from("products").select("id,is_active,stock");
    if(!products) return;
    const total=products.length, active=products.filter(p=>p.is_active).length, inactive=total-active, low=products.filter(p=>p.stock<=3).length;
    byId("stTotal").textContent=total; byId("stActive").textContent=active; byId("stInactive").textContent=inactive; byId("stLow").textContent=low;
    const {data:list}= await sb.from("products").select("id,name,price,stock,is_active,category_id").order("created_at",{ascending:false}).limit(5);
    byId("dashList").innerHTML = (list||[]).map(p=>`<div class="item"><div class="item-head"><strong>${p.name}</strong><span class="muted">${p.is_active?"Ativo":"Inativo"} · estoque ${p.stock}</span></div></div>`).join("") || '<p class="muted">Nenhum produto ainda.</p>';
  }

  // Products list
  let allProducts=[];
  async function loadProducts(){
    const {data,error}= await sb.from("products").select("*, categories(name), product_images(url,is_main,position), product_variants(id,title,price,stock)").order("created_at",{ascending:false});
    if(error){ byId("productList").innerHTML=`<p class="error">${error.message}</p>`; return; }
    allProducts=data||[]; renderProducts();
  }
  function renderProducts(){
    const q=byId("search").value.trim().toLowerCase();
    const cat=byId("filterCat").value; const st=byId("filterStatus").value;
    let list=allProducts;
    if(q) list=list.filter(p=>p.name.toLowerCase().includes(q));
    if(cat) list=list.filter(p=>p.category_id===cat);
    if(st==="active") list=list.filter(p=>p.is_active); if(st==="inactive") list=list.filter(p=>!p.is_active);
    byId("productList").innerHTML = list.map(p=>{
      const img = (p.product_images||[]).sort((a,b)=>a.position-b.position)[0]?.url || "";
      return `<div class="item">
        <div class="item-head">
          <div style="display:flex;gap:10px;align-items:center">
            ${img?`<img class="thumb" src="${img}" alt=""/>`:`<span class="thumb" style="display:grid;place-items:center">—</span>`}
            <div><strong>${p.name}</strong><div class="muted small">${p.categories?.name||""} · R$ ${Number(p.price).toFixed(2)}${p.promo_price?" (promo R$ "+Number(p.promo_price).toFixed(2)+")":""} · estoque ${p.stock}</div></div>
          </div>
          <span class="muted small">${p.is_active?"Ativo":"Inativo"}</span>
        </div>
        <div class="muted small">${p.description||""}</div>
        <div class="muted small">Variantes: ${(p.product_variants||[]).map(v=>`${v.title} (R$ ${v.price??p.price} · ${v.stock})`).join(", ")||"—"}</div>
        <div class="item-actions">
          <button class="btn ghost" data-edit="${p.id}">Editar</button>
          <button class="btn ghost" data-toggle="${p.id}">${p.is_active?"Desativar":"Ativar"}</button>
          <button class="btn ghost" data-del="${p.id}">Excluir</button>
        </div>
      </div>`;
    }).join("") || '<p class="muted">Nenhum produto.</p>';
    byId("productList").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>startEdit(b.dataset.edit)));
    byId("productList").querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click",()=>toggleActive(b.dataset.toggle)));
    byId("productList").querySelectorAll("[data-del]").forEach(b=>b.addEventListener("click",()=>removeProduct(b.dataset.del)));
  }
  byId("search").addEventListener("input", renderProducts);
  byId("filterCat").addEventListener("change", renderProducts);
  byId("filterStatus").addEventListener("change", renderProducts);

  async function toggleActive(id){
    const p=allProducts.find(x=>x.id===id); if(!p) return;
    await sb.from("products").update({is_active:!p.is_active}).eq("id",id); await loadDashboard(); await loadProducts();
  }
  async function removeProduct(id){
    if(!confirm("Excluir este produto? Esta ação não pode ser desfeita.")) return;
    await sb.from("product_images").delete().eq("product_id",id);
    await sb.from("product_variants").delete().eq("product_id",id);
    const {error}= await sb.from("products").delete().eq("id",id);
    if(error) alert(error.message); await loadDashboard(); await loadProducts();
  }

  // Form — images preview
  byId("fImages").addEventListener("change", (e)=>{
    const files=Array.from(e.target.files||[]);
    files.forEach((f,i)=>{
      const url=URL.createObjectURL(f);
      editingImages.push({file:f, url, is_main: editingImages.length===0, position: editingImages.length});
    });
    renderPreview(); e.target.value="";
  });
  function renderPreview(){
    byId("preview").innerHTML = editingImages.map((it,idx)=>`
      <div class="ph">
        <img src="${it.url}" alt=""/>
        <button type="button" data-rm="${idx}">×</button>
        <button type="button" data-main="${idx}" style="left:4px;right:auto;background:${it.is_main?"var(--accent)":"rgba(0,0,0,.6)"};color:${it.is_main?"#0C0E0B":"#fff"};font-size:.7rem">★</button>
      </div>`).join("");
    byId("preview").querySelectorAll("[data-rm]").forEach(b=>b.addEventListener("click",()=>{ editingImages.splice(Number(b.dataset.rm),1); editingImages.forEach((it,i)=>it.position=i); if(!editingImages.some(x=>x.is_main) && editingImages[0]) editingImages[0].is_main=true; renderPreview(); }));
    byId("preview").querySelectorAll("[data-main]").forEach(b=>b.addEventListener("click",()=>{ editingImages.forEach((it,i)=>it.is_main=i===Number(b.dataset.main)); renderPreview(); }));
  }

  // Variants
  function variantRow(v={title:"",price:"",stock:0}){
    const d=document.createElement("div"); d.className="variant";
    d.innerHTML=`<div class="row"><label>Título <input class="vTitle" value="${v.title}"/></label><label>Preço (opcional) <input class="vPrice" type="number" step="0.01" value="${v.price??""}"/></label><label>Estoque <input class="vStock" type="number" value="${v.stock??0}"/></label><button type="button" class="btn ghost vRm">Remover</button></div>`;
    d.querySelector(".vRm").addEventListener("click",()=>d.remove());
    return d;
  }
  byId("addVariant").addEventListener("click",()=>byId("variants").appendChild(variantRow()));
  function getVariantsFromForm(){
    return Array.from(byId("variants").children).map(row=>({
      title: row.querySelector(".vTitle").value.trim(),
      price: row.querySelector(".vPrice").value ? Number(row.querySelector(".vPrice").value) : null,
      stock: Number(row.querySelector(".vStock").value||0)
    })).filter(v=>v.title);
  }

  function resetForm(){
    byId("editId").value=""; byId("formTitle").textContent="Novo produto";
    byId("productForm").reset(); editingImages=[]; renderPreview(); byId("variants").innerHTML=""; byId("formError").hidden=true; byId("formOk").hidden=true;
  }
  byId("cancelEdit").addEventListener("click",()=>{ resetForm(); showTab("products"); });

  async function startEdit(id){
    const p=allProducts.find(x=>x.id===id); if(!p) return;
    resetForm(); byId("editId").value=p.id; byId("formTitle").textContent="Editar produto";
    byId("fName").value=p.name; byId("fDesc").value=p.description||""; byId("fPrice").value=p.price; byId("fPromo").value=p.promo_price||"";
    byId("fCategory").value=p.category_id||""; byId("fActive").value=String(!!p.is_active); byId("fStock").value=p.stock||0;
    // images existentes
    editingImages = (p.product_images||[]).sort((a,b)=>a.position-b.position).map((im,i)=>({url:im.url, is_main:!!im.is_main, position:i, existing:true, id:im.id}));
    if(editingImages.length && !editingImages.some(x=>x.is_main)) editingImages[0].is_main=true;
    renderPreview();
    (p.product_variants||[]).forEach(v=>byId("variants").appendChild(variantRow(v)));
    showTab("form"); window.scrollTo(0,0);
  }

  // Submit
  byId("productForm").addEventListener("submit", async (e)=>{
    e.preventDefault(); byId("formError").hidden=true; byId("formOk").hidden=true;
    const id=byId("editId").value||null;
    const payload={
      name: byId("fName").value.trim(),
      description: byId("fDesc").value.trim(),
      price: Number(byId("fPrice").value),
      promo_price: byId("fPromo").value ? Number(byId("fPromo").value) : null,
      category_id: byId("fCategory").value || null,
      is_active: byId("fActive").value==="true",
      stock: Number(byId("fStock").value||0)
    };
    if(!payload.name || isNaN(payload.price)){ byId("formError").hidden=false; byId("formError").textContent="Nome e preço obrigatórios."; return; }
    let productId=id;
    if(!id){
      const {data,error}= await sb.from("products").insert(payload).select("id").single();
      if(error){ byId("formError").hidden=false; byId("formError").textContent=error.message; return; }
      productId=data.id;
    } else {
      const {error}= await sb.from("products").update(payload).eq("id",id);
      if(error){ byId("formError").hidden=false; byId("formError").textContent=error.message; return; }
      // limpar imagens e variantes antigas para recriar (simples)
      await sb.from("product_images").delete().eq("product_id",id);
      await sb.from("product_variants").delete().eq("product_id",id);
    }
    // upload novas imagens
    for(let i=0;i<editingImages.length;i++){
      const it=editingImages[i];
      let url=it.url;
      if(it.file){
        const ext=it.file.name.split(".").pop()||"jpg";
        const path=`${productId}/${Date.now()}_${i}.${ext}`;
        const {error:upErr}= await sb.storage.from("product-images").upload(path, it.file, {upsert:true});
        if(upErr){ byId("formError").hidden=false; byId("formError").textContent="Erro upload: "+upErr.message; return; }
        const {data:pub}= sb.storage.from("product-images").getPublicUrl(path);
        url=pub.publicUrl;
      }
      // se for existente sem file, url já é a pública
      await sb.from("product_images").insert({product_id:productId, url, position:i, is_main: !!it.is_main});
    }
    const vars=getVariantsFromForm();
    for(const v of vars){
      await sb.from("product_variants").insert({product_id:productId, title:v.title, price:v.price, stock:v.stock});
    }
    byId("formOk").hidden=false; byId("formOk").textContent="Salvo com sucesso!";
    await loadDashboard(); await loadProducts(); setTimeout(()=>{ resetForm(); showTab("products"); }, 600);
  });

  refreshSession();
})();
