/* ============================================================
   Bebidas e Tabacaria — Catálogo (dados de EXEMPLO)
   ------------------------------------------------------------
   COMO TROCAR PELOS PRODUTOS REAIS:
   1) Coloque as fotos em:  /public/nome-do-produto.jpg
      Ex.: public/cerveja-pilsen-350ml.jpg
   2) Troque o campo "image" abaixo para o nome do arquivo.
   3) Troque "name", "price", "desc" e "category".
   4) "demo: true" marca o card como EXEMPLO. Quando for real,
      apague a linha ou coloque demo: false.
   5) Categorias válidas (ver CATEGORIES):
      bebidas, cervejas, destilados, energeticos,
      tabacaria, acessorios, combos, mais-vendidos
      - Um produto pode estar em 1 categoria principal.
      - Para aparecer também em "Mais vendidos", use badge.
   ============================================================ */

const WHATSAPP_NUMBER = "5581985408060";

const CATEGORIES = [
  { id: "todos",         label: "Todos" },
  { id: "mais-vendidos", label: "Mais vendidos" },
  { id: "cervejas",      label: "Cervejas" },
  { id: "bebidas",       label: "Bebidas" },
  { id: "destilados",    label: "Destilados" },
  { id: "energeticos",   label: "Energéticos" },
  { id: "tabacaria",     label: "Tabacaria" },
  { id: "acessorios",    label: "Acessórios" },
  { id: "combos",        label: "Combos" },
];

const PRODUCTS = [
  // ---- MAIS VENDIDOS (exemplos) ----
  { id: "p01", name: "Cerveja Pilsen 350ml (exemplo)", category: "cervejas", price: 4.99, unit: "un", badge: "mais-vendido", demo: true, image: "public/cerveja-pilsen-350ml.jpg", desc: "Refrescante e leve. Produto demonstrativo — substitua por item real." },
  { id: "p02", name: "Energético 473ml (exemplo)", category: "energeticos", price: 12.90, unit: "un", badge: "mais-vendido", demo: true, image: "public/energetico-473ml.jpg", desc: "Para a noite render. Produto demonstrativo." },
  { id: "p03", name: "Combo Noite c/ 6 + Gelo (exemplo)", category: "combos", price: 39.90, unit: "combo", badge: "combo", demo: true, image: "public/combo-noite.jpg", desc: "Combo demonstrativo para validar preço e foto." },
  { id: "p04", name: "Essência Mint 50g (exemplo)", category: "tabacaria", price: 19.90, unit: "un", badge: "mais-vendido", demo: true, image: "public/essencia-mint.jpg", desc: "Sabor refrescante. Item de exemplo." },

  // ---- CERVEJAS ----
  { id: "p05", name: "Cerveja Lager Lata 473ml (exemplo)", category: "cervejas", price: 6.49, unit: "un", badge: null, demo: true, image: "public/cerveja-lager-473ml.jpg", desc: "Lata grande, gelada. Demonstração." },
  { id: "p06", name: "Pack c/ 12 Pilsen 350ml (exemplo)", category: "cervejas", price: 54.90, unit: "pack", badge: null, demo: true, image: "public/pack-12-pilsen.jpg", desc: "Para reunir a turma. Preço exemplo." },
  { id: "p07", name: "Cerveja Zero Álcool 350ml (exemplo)", category: "cervejas", price: 5.49, unit: "un", badge: null, demo: true, image: "public/cerveja-zero.jpg", desc: "Mesmo sabor, sem álcool. Exemplo." },

  // ---- BEBIDAS ----
  { id: "p08", name: "Refrigerante 2L (exemplo)", category: "bebidas", price: 10.90, unit: "un", badge: null, demo: true, image: "public/refrigerante-2l.jpg", desc: "Para acompanhar. Produto exemplo." },
  { id: "p09", name: "Suco Natural 1L (exemplo)", category: "bebidas", price: 9.90, unit: "un", badge: null, demo: true, image: "public/suco-1l.jpg", desc: "Opção leve. Demonstração." },
  { id: "p10", name: "Água Mineral 500ml (exemplo)", category: "bebidas", price: 3.00, unit: "un", badge: null, demo: true, image: "public/agua-500ml.jpg", desc: "Hidratação. Item exemplo." },
  { id: "p11", name: "Gelo 2kg (exemplo)", category: "bebidas", price: 12.00, unit: "pct", badge: null, demo: true, image: "public/gelo-2kg.jpg", desc: "Essencial pro rolê. Exemplo." },

  // ---- DESTILADOS ----
  { id: "p12", name: "Vodka 750ml (exemplo)", category: "destilados", price: 32.90, unit: "un", badge: null, demo: true, image: "public/vodka-750ml.jpg", desc: "Clássica. Produto demonstrativo." },
  { id: "p13", name: "Whisky 1L (exemplo)", category: "destilados", price: 89.90, unit: "un", badge: null, demo: true, image: "public/whisky-1l.jpg", desc: "Para ocasiões. Preço exemplo." },
  { id: "p14", name: "Gin 750ml (exemplo)", category: "destilados", price: 59.90, unit: "un", badge: null, demo: true, image: "public/gin-750ml.jpg", desc: "Botânicos. Item exemplo." },

  // ---- ENERGÉTICOS ----
  { id: "p15", name: "Energético 2L (exemplo)", category: "energeticos", price: 22.90, unit: "un", badge: null, demo: true, image: "public/energetico-2l.jpg", desc: "Rende mais. Demonstração." },
  { id: "p16", name: "Energético Zero 473ml (exemplo)", category: "energeticos", price: 13.90, unit: "un", badge: null, demo: true, image: "public/energetico-zero.jpg", desc: "Sem açúcar. Exemplo." },

  // ---- TABACARIA ----
  { id: "p17", name: "Carvão 1kg (exemplo)", category: "tabacaria", price: 18.90, unit: "un", badge: null, demo: true, image: "public/carvao-1kg.jpg", desc: "Acendimento rápido. Exemplo." },
  { id: "p18", name: "Essência Frutas Vermelhas 50g (exemplo)", category: "tabacaria", price: 19.90, unit: "un", badge: null, demo: true, image: "public/essencia-frutas.jpg", desc: "Doce na medida. Demonstração." },
  { id: "p19", name: "Alumínio Rolo (exemplo)", category: "tabacaria", price: 9.90, unit: "un", badge: null, demo: true, image: "public/aluminio.jpg", desc: "Acessório essencial. Exemplo." },

  // ---- ACESSÓRIOS ----
  { id: "p20", name: "Isqueiro (exemplo)", category: "acessorios", price: 6.00, unit: "un", badge: null, demo: true, image: "public/isqueiro.jpg", desc: "Compacto. Produto exemplo." },
  { id: "p21", name: "Seda c/ 32 (exemplo)", category: "acessorios", price: 7.50, unit: "un", badge: null, demo: true, image: "public/seda.jpg", desc: "Fina. Demonstração." },
  { id: "p22", name: "Dichavador Metal (exemplo)", category: "acessorios", price: 24.90, unit: "un", badge: null, demo: true, image: "public/dichavador.jpg", desc: "Resistente. Item exemplo." },

  // ---- COMBOS ----
  { id: "p23", name: "Combo Churrasco (exemplo)", category: "combos", price: 79.90, unit: "combo", badge: "combo", demo: true, image: "public/combo-churrasco.jpg", desc: "Bebidas + gelo. Preço demonstrativo." },
  { id: "p24", name: "Combo Sessão Completa (exemplo)", category: "combos", price: 69.90, unit: "combo", badge: "combo", demo: true, image: "public/combo-sessao.jpg", desc: "Tabacaria completa. Exemplo." },
];
