// Store — carrega produtos do Supabase quando configurado, senão fallback para PRODUCTS demo.
// Expõe window.STORE com helpers e dispara evento store:ready.
(function(){
  const fallback = typeof PRODUCTS!=="undefined" ? PRODUCTS : [];
  const fallbackCats = typeof CATEGORIES!=="undefined" ? CATEGORIES : [];
  window.STORE = {
    products: fallback,
    categories: fallbackCats,
    loadedFrom: "demo",
    async load(){
      if(!window.SUPABASE_CONFIGURED || !window.supabase){
        window.STORE.products = fallback;
        window.STORE.categories = fallbackCats;
        window.STORE.loadedFrom="demo";
        window.dispatchEvent(new CustomEvent("store:ready"));
        return;
      }
      try{
        const sb=window.supabase;
        const {data:cats}= await sb.from("categories").select("*").order("name");
        if(cats && cats.length) window.STORE.categories = [{id:"todos",label:"Todos"}, ...cats.map(c=>({id:c.slug,label:c.name}))];
        const {data:prods, error}= await sb.from("products").select("*, categories(slug,name), product_images(url,is_main,position), product_variants(id,title,price,stock)").eq("is_active",true).order("created_at",{ascending:false});
        if(error) throw error;
        if(prods){
          window.STORE.products = prods.map(p=>{
            const imgs=(p.product_images||[]).sort((a,b)=>a.position-b.position);
            const main=imgs.find(i=>i.is_main)||imgs[0];
            const priceNum=Number(p.price), promoNum=p.promo_price!=null ? Number(p.promo_price) : null;
            const hasPromo=promoNum!=null && !isNaN(promoNum) && promoNum !== priceNum;
            const finalPrice= hasPromo ? Math.min(priceNum, promoNum) : priceNum;
            const originalPrice= hasPromo ? Math.max(priceNum, promoNum) : null;
            return {
              id: p.id,
              name: p.name,
              desc: p.description||"",
              price: finalPrice,
              originalPrice: originalPrice,
              category: p.categories?.slug || "outros",
              unit: "un",
              badge: null,
              demo:false,
              image: main?.url || "public/logo.png",
              images: imgs.map(i=>i.url),
              variants: (p.product_variants||[]).map(v=>({id:v.id,title:v.title,price: v.price!=null?Number(v.price):null, stock:v.stock})),
              stock: p.stock
            };
          });
          window.STORE.loadedFrom="supabase";
        }
      }catch(e){
        console.warn("Falha ao carregar do Supabase, usando demo:", e.message);
        window.STORE.products=fallback; window.STORE.categories=fallbackCats; window.STORE.loadedFrom="demo";
      }
      window.dispatchEvent(new CustomEvent("store:ready"));
    }
  };
  // auto-load ASAP
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ()=>window.STORE.load());
  else window.STORE.load();
})();
