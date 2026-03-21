// ─── Catalogue produits Kubo Pâtisserie ───────────────────────────────────────
// Source de vérité pour la liste des produits disponibles à la commande.
// Modifier uniquement ici pour ajouter / modifier des produits.

export const CATEGORIES = {
  entremets:     'Entremets',
  tartes:        'Tartes',
  viennoiseries: 'Viennoiseries',
  pieces:        'Pièces & petits gâteaux',
  brunch:        'Formules brunch',
}

const products = [
  // ── Entremets ────────────────────────────────────────────────────────────
  { id: 'p-01', name: 'Fraisier',                   price: 42,  category: 'entremets'     },
  { id: 'p-02', name: 'Charlotte aux framboises',   price: 38,  category: 'entremets'     },
  { id: 'p-03', name: 'Paris-Brest',                price: 36,  category: 'entremets'     },
  { id: 'p-04', name: 'Opéra',                      price: 40,  category: 'entremets'     },
  // ── Tartes ───────────────────────────────────────────────────────────────
  { id: 'p-05', name: 'Tarte aux fraises',          price: 28,  category: 'tartes'        },
  { id: 'p-06', name: 'Tarte citron meringuée',     price: 26,  category: 'tartes'        },
  { id: 'p-07', name: 'Tarte Tatin',                price: 24,  category: 'tartes'        },
  { id: 'p-08', name: 'Tarte au chocolat',          price: 26,  category: 'tartes'        },
  // ── Viennoiseries ────────────────────────────────────────────────────────
  { id: 'p-09', name: 'Croissant',                  price: 1.8, category: 'viennoiseries' },
  { id: 'p-10', name: 'Pain au chocolat',           price: 2.2, category: 'viennoiseries' },
  { id: 'p-11', name: 'Chausson aux pommes',        price: 2.4, category: 'viennoiseries' },
  // ── Pièces ───────────────────────────────────────────────────────────────
  { id: 'p-12', name: 'Macaron (à la pièce)',       price: 2.0, category: 'pieces'        },
  { id: 'p-13', name: 'Éclair chocolat / café',     price: 4.5, category: 'pieces'        },
  { id: 'p-14', name: 'Chou à la crème',            price: 3.8, category: 'pieces'        },
  // ── Brunch ───────────────────────────────────────────────────────────────
  { id: 'p-15', name: 'Formule brunch 2 pers.',     price: 38,  category: 'brunch'        },
  { id: 'p-16', name: 'Formule brunch 4 pers.',     price: 72,  category: 'brunch'        },
  { id: 'p-17', name: 'Assortiment viennoiseries 6', price: 12, category: 'brunch'        },
]

export default products
