// Gera js/env.js a partir de variáveis do Vercel/GitHub
// Suporta SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL etc.
const fs=require('fs');
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.VITE_SUPABASE_URL||"";
const key=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||"";
if(url && key){
  fs.writeFileSync('js/env.js', `window.__ENV__={SUPABASE_URL:${JSON.stringify(url)},SUPABASE_ANON_KEY:${JSON.stringify(key)}};`);
  console.log("js/env.js gerado a partir de env");
} else {
  console.log("Sem SUPABASE env — mantendo demo (configure SUPABASE_URL e SUPABASE_ANON_KEY no Vercel)");
  if(!fs.existsSync('js/env.js')) fs.writeFileSync('js/env.js','window.__ENV__=window.__ENV__||{};');
}
