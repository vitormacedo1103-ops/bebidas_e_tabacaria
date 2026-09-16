# Bebidas e Tabacaria — Catálogo Digital
Site catálogo premium com carrinho e checkout via WhatsApp. Bairro Kennedy — onde era a APAX. Aberto todos os dias 16h–00h.
Demo: https://vitormacedo1103-ops.github.io/bebidas_e_tabacaria/ (ative Pages em Settings → Pages → main)

## Loja pública
- `index.html` + `css/style.css` + `js/app.js` + `js/products.js` (demo) + `js/store.js` (Supabase)
- Carrinho lateral, variantes, WhatsApp `5581985408060`
- Quando Supabase configurado, produtos vêm do banco; senão usa demo

## Admin
Rota: `/admin` (não linkada na loja). Protegida por Supabase Auth.
- Login em `admin/index.html` — requer usuário criado em Supabase → Authentication → Users
- Dashboard: total/ativos/inativos/estoque baixo
- CRUD: nome, descrição, preço, promo, categoria, ativo, estoque, imagens (Storage `product-images`), variantes flexíveis

## Configuração Supabase (obrigatória para admin)
1. Crie projeto em https://supabase.com
2. SQL Editor → cole e rode `supabase/schema.sql` (cria `categories`, `products`, `product_images`, `product_variants`, RLS, bucket `product-images` público)
3. Authentication → Users → Add user (email/senha do admin)
4. Project Settings → API → copie `URL` e `anon key`
5. No deploy, defina env:
   - **Local:** copie `js/env.js.example` para `js/env.js` e preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY`
   - **GitHub Pages:** adicione no `index.html` e `admin/index.html` as metas:
     ```html
     <meta name="supabase-url" content="https://xxx.supabase.co"/>
     <meta name="supabase-anon-key" content="eyJ..."/>
     ```
     ou injete via build. Nunca exponha `service_role`.
6. Storage → Buckets → `product-images` deve estar público (schema já cria)

## ENV
Veja `.env.example` e `js/env.js.example`. Nunca commite `js/env.js`.
