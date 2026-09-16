// Supabase client — lê de window.__ENV__ ou meta tags. Não exponha service_role.
(function(){
  const env = (window.__ENV__||{});
  const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content || "";
  const metaKey = document.querySelector('meta[name="supabase-anon-key"]')?.content || "";
  const url = env.SUPABASE_URL || metaUrl || "";
  const key = env.SUPABASE_ANON_KEY || metaKey || "";
  window.SUPABASE_CONFIGURED = !!(url && key);
  if(!window.SUPABASE_CONFIGURED){
    console.info("Supabase não configurado — usando dados demo (configure js/env.js ou meta tags).");
    window.supabase = null;
    return;
  }
  // CDN global Supabase (via esm se disponível, fallback para bundle)
  const client = window.supabaseJs ? window.supabaseJs.createClient(url, key) : null;
  if(client) window.supabase = client;
})();
