// ─── Module Produits — shell principal ────────────────────────────────────────
import { useState } from 'react'
import { useProductsGoogleSync }  from '../../hooks/useProductsGoogleSync'
import ProductsCatalog            from './ProductsCatalog'
import ProductDetailModal         from './ProductDetailModal'
import ProductForm                from './ProductForm'
import './products-tokens.css'
import './ProductsApp.css'

export default function ProductsApp({ productsCtx, showToast, getToken, isManager = false }) {
  useProductsGoogleSync({
    products:    productsCtx.products,
    getToken:    getToken ?? (() => null),
    setProducts: productsCtx.setProductsFromSync,
    onToast:     showToast,
  })

  // null = fermé | objet produit = détail | 'new' = création | produit = édition
  const [selected, setSelected] = useState(null)
  const [formTarget, setFormTarget] = useState(null)   // null | 'new' | product

  function handleOpenDetail(product) {
    setSelected(product)
    setFormTarget(null)
  }

  function handleOpenNew() {
    setFormTarget('new')
    setSelected(null)
  }

  function handleOpenEdit(product) {
    setFormTarget(product)
    setSelected(null)
  }

  function handleSave(data) {
    if (formTarget === 'new') {
      productsCtx.addProduct(data)
    } else {
      productsCtx.updateProduct(formTarget.id, data)
    }
    setFormTarget(null)
  }

  function handleDelete(id) {
    productsCtx.deleteProduct(id)
    setFormTarget(null)
  }

  function handleDeleteFromDetail(id) {
    productsCtx.deleteProduct(id)
    setSelected(null)
  }

  return (
    <div className="products-app">
      <ProductsCatalog
        products={productsCtx.products}
        categories={productsCtx.categories}
        onProductClick={handleOpenDetail}
        onAdd={isManager ? handleOpenNew : null}
      />

      {selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
          onEdit={isManager ? handleOpenEdit : null}
          onDelete={isManager ? handleDeleteFromDetail : null}
        />
      )}

      {isManager && formTarget && (
        <ProductForm
          product={formTarget === 'new' ? null : formTarget}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
