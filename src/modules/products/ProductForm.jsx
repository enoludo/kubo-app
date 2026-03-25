// ─── Formulaire produit — création et édition ────────────────────────────────
import { useState } from 'react'
import { ALLERGENS_EU } from './AllergenBadges'
import Modal from '../../design-system/components/Modal/Modal'

// ── Constantes ────────────────────────────────────────────────────────────────

const STANDARD_SIZES = [
  'Individuel', '4 personnes', '6 personnes',
  '8 personnes', '10 personnes', '12 personnes',
]

const UNITS = ['g', 'kg', 'ml', 'cl', 'L', 'pièce', 'c.à.s', 'c.à.c']

// ── État initial ──────────────────────────────────────────────────────────────

function initForm(product) {
  if (product) {
    return {
      name:                   product.name                   ?? '',
      category:               product.category               ?? '',
      photoUrl:               product.photoUrl               ?? '',
      description:            product.description            ?? '',
      active:                 product.active                 ?? true,
      sizes:                  product.sizes                  ?? [],
      ingredients:            product.ingredients            ?? [],
      recipeSteps:            product.recipeSteps            ?? [],
      totalProductionTimeMin: product.totalProductionTimeMin ?? '',
      restTimeMin:            product.restTimeMin            ?? '',
      advancePrepDays:        product.advancePrepDays        ?? 0,
      storageConditions:      product.storageConditions      ?? '',
      shelfLifeHours:         product.shelfLifeHours         ?? '',
      allergens:              product.allergens              ?? [],
      sanitaryNotes:          product.sanitaryNotes          ?? '',
      pregnancySafe:          product.pregnancySafe          ?? 'check',
      pregnancyNote:          product.pregnancyNote          ?? '',
      internalNotes:          product.internalNotes          ?? '',
    }
  }
  return {
    name: '', category: '', photoUrl: '', description: '',
    active: true,
    sizes: [], ingredients: [], recipeSteps: [],
    totalProductionTimeMin: '', restTimeMin: '', advancePrepDays: 0,
    storageConditions: '', shelfLifeHours: '',
    allergens: [], sanitaryNotes: '',
    pregnancySafe: 'check', pregnancyNote: '',
    internalNotes: '',
  }
}

function newId() { return `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}` }

// ── Sous-composants de section ────────────────────────────────────────────────

function SectionTitle({ children }) {
  return <h3 className="pf-section-title">{children}</h3>
}

function Field({ label, children, hint }) {
  return (
    <div className="pf-field">
      <label className="pf-label field-label">{label}</label>
      {children}
      {hint && <span className="pf-hint">{hint}</span>}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      className={`pf-toggle${checked ? ' pf-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="pf-toggle-track">
        <span className="pf-toggle-thumb" />
      </span>
      <span className="pf-toggle-label">{label}</span>
    </button>
  )
}

// ── Section Général ───────────────────────────────────────────────────────────

function SectionGeneral({ data, set }) {
  return (
    <div className="pf-section">
      <SectionTitle>Général</SectionTitle>

      <div className="pf-row pf-row--2">
        <Field label="Nom du produit *">
          <input
            className="pf-input field-input"
            type="text"
            placeholder="ex : Tarte Citron Meringuée"
            value={data.name}
            onChange={e => set('name', e.target.value)}
          />
        </Field>
        <Field label="Catégorie">
          <input
            className="pf-input field-input"
            type="text"
            placeholder="ex : Tartes, Entremets, Viennoiseries…"
            value={data.category}
            onChange={e => set('category', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Description courte">
        <textarea
          className="pf-input pf-textarea field-input"
          placeholder="1 à 2 lignes visibles dans le catalogue…"
          value={data.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
        />
      </Field>

      <Field label="Photo (URL Google Drive ou externe)">
        <input
          className="pf-input field-input"
          type="url"
          placeholder="https://…"
          value={data.photoUrl}
          onChange={e => set('photoUrl', e.target.value)}
        />
      </Field>

      <div className="pf-toggles-row">
        <Toggle label="Produit actif" checked={data.active} onChange={v => set('active', v)} />
      </div>
    </div>
  )
}

// ── Section Tailles & Prix ────────────────────────────────────────────────────

function SectionSizes({ sizes, setSizes }) {
  function addSize(label) {
    if (sizes.some(s => s.label === label)) return
    setSizes(prev => [...prev, {
      id: newId(), label,
      price: '', costPerUnit: '', weightG: '', productionTimeMin: '', minOrderQty: 1,
    }])
  }

  function addCustom() {
    setSizes(prev => [...prev, {
      id: newId(), label: '',
      price: '', costPerUnit: '', weightG: '', productionTimeMin: '', minOrderQty: 1,
    }])
  }

  function updateSize(id, key, val) {
    setSizes(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s))
  }

  function removeSize(id) {
    setSizes(prev => prev.filter(s => s.id !== id))
  }

  const addedLabels = new Set(sizes.map(s => s.label))

  return (
    <div className="pf-section">
      <SectionTitle>Tailles & Prix</SectionTitle>

      {/* Boutons tailles standard */}
      <div className="pf-size-presets">
        {STANDARD_SIZES.map(label => (
          <button
            key={label}
            type="button"
            className={`pf-size-preset${addedLabels.has(label) ? ' pf-size-preset--added' : ''}`}
            onClick={() => addSize(label)}
            disabled={addedLabels.has(label)}
          >
            {label}
          </button>
        ))}
        <button type="button" className="pf-size-preset pf-size-preset--custom" onClick={addCustom}>
          + Taille libre
        </button>
      </div>

      {sizes.length > 0 && (
        <div className="pf-sizes-list">
          {/* Entêtes colonnes */}
          <div className="pf-size-row pf-size-row--header">
            <span>Taille</span>
            <span>Prix (€)</span>
            <span>Coût mat. (€)</span>
            <span>Poids (g)</span>
            <span>Temps prod.</span>
            <span>Qté min</span>
            <span />
          </div>
          {sizes.map(s => (
            <div key={s.id} className="pf-size-row">
              <input
                className="pf-input field-input pf-size-input"
                type="text"
                placeholder="Label"
                value={s.label}
                onChange={e => updateSize(s.id, 'label', e.target.value)}
              />
              <input
                className="pf-input field-input pf-size-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={s.price}
                onChange={e => updateSize(s.id, 'price', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <input
                className="pf-input field-input pf-size-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={s.costPerUnit}
                onChange={e => updateSize(s.id, 'costPerUnit', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <input
                className="pf-input field-input pf-size-input"
                type="number"
                min="0"
                placeholder="—"
                value={s.weightG}
                onChange={e => updateSize(s.id, 'weightG', e.target.value === '' ? '' : parseInt(e.target.value))}
              />
              <input
                className="pf-input field-input pf-size-input"
                type="number"
                min="0"
                placeholder="min"
                value={s.productionTimeMin}
                onChange={e => updateSize(s.id, 'productionTimeMin', e.target.value === '' ? '' : parseInt(e.target.value))}
              />
              <input
                className="pf-input field-input pf-size-input"
                type="number"
                min="1"
                value={s.minOrderQty}
                onChange={e => updateSize(s.id, 'minOrderQty', e.target.value === '' ? '' : parseInt(e.target.value))}
              />
              <button
                type="button"
                className="pf-remove-btn"
                onClick={() => removeSize(s.id)}
                aria-label="Supprimer cette taille"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section Ingrédients ───────────────────────────────────────────────────────

function SectionIngredients({ ingredients, setIngredients }) {
  function add() {
    setIngredients(prev => [...prev, { id: newId(), name: '', quantity: '', unit: 'g' }])
  }

  function update(id, key, val) {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [key]: val } : i))
  }

  function remove(id) {
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="pf-section">
      <SectionTitle>Ingrédients</SectionTitle>

      {ingredients.length > 0 && (
        <div className="pf-ingredient-list">
          {ingredients.map(ing => (
            <div key={ing.id} className="pf-ingredient-row">
              <input
                className="pf-input field-input pf-ing-name"
                type="text"
                placeholder="Nom de l'ingrédient"
                value={ing.name}
                onChange={e => update(ing.id, 'name', e.target.value)}
              />
              <input
                className="pf-input field-input pf-ing-qty"
                type="number"
                min="0"
                step="0.1"
                placeholder="Qté"
                value={ing.quantity}
                onChange={e => update(ing.id, 'quantity', e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <select
                className="pf-input field-input pf-ing-unit"
                value={ing.unit}
                onChange={e => update(ing.id, 'unit', e.target.value)}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <button
                type="button"
                className="pf-remove-btn"
                onClick={() => remove(ing.id)}
                aria-label="Supprimer cet ingrédient"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="pf-add-row-btn add-trigger add-trigger--labeled" onClick={add}>
        + Ajouter un ingrédient
      </button>
    </div>
  )
}

// ── Section Recette ───────────────────────────────────────────────────────────

function SectionRecette({ steps, setSteps }) {
  function add() {
    const nextOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order)) + 1 : 1
    setSteps(prev => [...prev, {
      id: newId(), order: nextOrder,
      description: '', temperatureC: '', durationMin: '', equipment: '',
    }])
  }

  function update(id, key, val) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s))
  }

  function remove(id) {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== id)
      return filtered.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  function move(id, dir) {
    setSteps(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(s => s.id === id)
      const target = idx + dir
      if (target < 0 || target >= sorted.length) return prev
      const next = [...sorted]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const sorted = [...steps].sort((a, b) => a.order - b.order)

  return (
    <div className="pf-section">
      <SectionTitle>Recette</SectionTitle>

      {sorted.length > 0 && (
        <div className="pf-step-list">
          {sorted.map((step, idx) => (
            <div key={step.id} className="pf-step">
              <div className="pf-step-num">{step.order}</div>
              <div className="pf-step-fields">
                <textarea
                  className="pf-input pf-textarea field-input"
                  placeholder="Description de l'étape…"
                  value={step.description}
                  onChange={e => update(step.id, 'description', e.target.value)}
                  rows={2}
                />
                <div className="pf-step-meta-row">
                  <div className="pf-step-meta-field">
                    <label className="pf-label-mini field-label">Température (°C)</label>
                    <input
                      className="pf-input field-input"
                      type="number"
                      placeholder="—"
                      value={step.temperatureC}
                      onChange={e => update(step.id, 'temperatureC', e.target.value === '' ? '' : parseInt(e.target.value))}
                    />
                  </div>
                  <div className="pf-step-meta-field">
                    <label className="pf-label-mini field-label">Durée (min)</label>
                    <input
                      className="pf-input field-input"
                      type="number"
                      placeholder="—"
                      value={step.durationMin}
                      onChange={e => update(step.id, 'durationMin', e.target.value === '' ? '' : parseInt(e.target.value))}
                    />
                  </div>
                  <div className="pf-step-meta-field pf-step-meta-field--wide">
                    <label className="pf-label-mini field-label">Matériel</label>
                    <input
                      className="pf-input field-input"
                      type="text"
                      placeholder="ex : Four, batteur, cercle 20 cm"
                      value={step.equipment}
                      onChange={e => update(step.id, 'equipment', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="pf-step-controls">
                <button
                  type="button"
                  className="pf-step-move"
                  onClick={() => move(step.id, -1)}
                  disabled={idx === 0}
                  aria-label="Monter l'étape"
                >▲</button>
                <button
                  type="button"
                  className="pf-step-move"
                  onClick={() => move(step.id, 1)}
                  disabled={idx === sorted.length - 1}
                  aria-label="Descendre l'étape"
                >▼</button>
                <button
                  type="button"
                  className="pf-remove-btn"
                  onClick={() => remove(step.id)}
                  aria-label="Supprimer cette étape"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="pf-add-row-btn add-trigger add-trigger--labeled" onClick={add}>
        + Ajouter une étape
      </button>
    </div>
  )
}

// ── Section Production ────────────────────────────────────────────────────────

function SectionProduction({ data, set }) {
  return (
    <div className="pf-section">
      <SectionTitle>Production</SectionTitle>

      <div className="pf-row pf-row--2">
        <Field label="Temps total de fabrication (min)">
          <input
            className="pf-input field-input"
            type="number"
            min="0"
            placeholder="ex : 120"
            value={data.totalProductionTimeMin}
            onChange={e => set('totalProductionTimeMin', e.target.value === '' ? '' : parseInt(e.target.value))}
          />
        </Field>
        <Field label="Temps de repos (min)">
          <input
            className="pf-input field-input"
            type="number"
            min="0"
            placeholder="ex : 240"
            value={data.restTimeMin}
            onChange={e => set('restTimeMin', e.target.value === '' ? '' : parseInt(e.target.value))}
          />
        </Field>
      </div>

      <div className="pf-row pf-row--2">
        <Field label="Préparation anticipée">
          <select
            className="pf-input field-input"
            value={data.advancePrepDays}
            onChange={e => set('advancePrepDays', parseInt(e.target.value))}
          >
            <option value={0}>Jour J</option>
            <option value={1}>Veille (J-1)</option>
            <option value={2}>2 jours avant (J-2)</option>
            <option value={3}>3 jours avant (J-3)</option>
          </select>
        </Field>
        <Field label="DLC après fabrication (heures)">
          <input
            className="pf-input field-input"
            type="number"
            min="0"
            placeholder="ex : 48"
            value={data.shelfLifeHours}
            onChange={e => set('shelfLifeHours', e.target.value === '' ? '' : parseInt(e.target.value))}
          />
        </Field>
      </div>

      <Field label="Conditions de stockage">
        <input
          className="pf-input field-input"
          type="text"
          placeholder="ex : Réfrigéré à 4 °C"
          value={data.storageConditions}
          onChange={e => set('storageConditions', e.target.value)}
        />
      </Field>
    </div>
  )
}

// ── Section Hygiène & Allergènes ──────────────────────────────────────────────

function SectionHygiene({ data, set }) {
  function toggleAllergen(id) {
    set('allergens', data.allergens.includes(id)
      ? data.allergens.filter(a => a !== id)
      : [...data.allergens, id]
    )
  }

  return (
    <div className="pf-section">
      <SectionTitle>Hygiène & Allergènes</SectionTitle>

      <div className="pf-allergen-grid">
        {ALLERGENS_EU.map(a => (
          <button
            key={a.id}
            type="button"
            className={`pf-allergen-btn${data.allergens.includes(a.id) ? ' pf-allergen-btn--active' : ''}`}
            onClick={() => toggleAllergen(a.id)}
            aria-pressed={data.allergens.includes(a.id)}
          >
            <span className="pf-allergen-emoji">{a.emoji}</span>
            <span className="pf-allergen-label">{a.label}</span>
          </button>
        ))}
      </div>

      <Field label="Notes sanitaires" hint="Traçabilité, précautions particulières…">
        <textarea
          className="pf-input pf-textarea field-input"
          placeholder="ex : Vérifier traçabilité beurre AOC — DLC 48 h."
          value={data.sanitaryNotes}
          onChange={e => set('sanitaryNotes', e.target.value)}
          rows={2}
        />
      </Field>

      <Field
        label="Femmes enceintes"
        hint="Alcool, œufs crus, lait cru, poisson cru/fumé à froid → Déconseillé. Crèmes cuites, meringue italienne → À vérifier selon préparation."
      >
        <div className="pf-pregnancy-selector">
          {[
            { value: 'yes',   icon: '✅', label: 'Compatible'   },
            { value: 'check', icon: '⚠️', label: 'À vérifier'   },
            { value: 'no',    icon: '❌', label: 'Déconseillé'  },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`pf-pregnancy-btn pf-pregnancy-btn--${opt.value}${data.pregnancySafe === opt.value ? ' pf-pregnancy-btn--active' : ''}`}
              onClick={() => set('pregnancySafe', opt.value)}
              aria-pressed={data.pregnancySafe === opt.value}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </Field>

      {(data.pregnancySafe === 'no' || data.pregnancySafe === 'check') && (
        <Field label="Précision (optionnel)" hint="ex : Contient du rhum, blancs d'œufs crus, crème anglaise peu cuite…">
          <textarea
            className="pf-input pf-textarea field-input"
            placeholder="Précisez la raison ou les conditions de compatibilité…"
            value={data.pregnancyNote}
            onChange={e => set('pregnancyNote', e.target.value)}
            rows={2}
          />
        </Field>
      )}
    </div>
  )
}

// ── Section Notes internes ────────────────────────────────────────────────────

function SectionMeta({ data, set }) {
  return (
    <div className="pf-section">
      <SectionTitle>Notes internes</SectionTitle>

      <Field label="Notes internes">
        <textarea
          className="pf-input pf-textarea field-input"
          placeholder="Conseils de production, fournisseurs préférés…"
          value={data.internalNotes}
          onChange={e => set('internalNotes', e.target.value)}
          rows={2}
        />
      </Field>
    </div>
  )
}

// ── Modal principale ──────────────────────────────────────────────────────────

export default function ProductForm({ product, onSave, onClose, onDelete }) {
  const isEdit = !!product
  const [data,        setData]        = useState(() => initForm(product))
  const [sizes,       setSizes]       = useState(() => product?.sizes       ?? [])
  const [ingredients, setIngredients] = useState(() => product?.ingredients ?? [])
  const [steps,       setSteps]       = useState(() => product?.recipeSteps ?? [])
  const [confirmDel,  setConfirmDel]  = useState(false)

  function set(key, val) {
    setData(prev => ({ ...prev, [key]: val }))
  }

  function handleSave() {
    if (!data.name.trim()) return
    const payload = {
      ...data,
      sizes,
      ingredients,
      recipeSteps: steps,
      // Normalise les champs numériques vides → null
      totalProductionTimeMin: data.totalProductionTimeMin === '' ? null : Number(data.totalProductionTimeMin),
      restTimeMin:            data.restTimeMin            === '' ? null : Number(data.restTimeMin),
      shelfLifeHours:         data.shelfLifeHours         === '' ? null : Number(data.shelfLifeHours),
      photoUrl:               data.photoUrl.trim() || null,
      description:            data.description.trim() || null,
      storageConditions:      data.storageConditions.trim() || null,
      sanitaryNotes:          data.sanitaryNotes.trim() || null,
      pregnancyNote:          data.pregnancyNote.trim()  || null,
      internalNotes:          data.internalNotes.trim()  || null,
    }
    onSave(payload)
  }

  const canSave = data.name.trim().length > 0

  const modal = (
    <Modal onClose={onClose} align="bottom" className="product-form-modal">
        {/* En-tête */}
        <div className="product-form-header">
          <h2 className="product-form-title">
            {isEdit ? `Modifier — ${product.name}` : 'Nouveau produit'}
          </h2>
          <button className="product-detail-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {/* Corps scrollable */}
        <div className="product-form-body">
          <SectionGeneral     data={data} set={set} />
          <div className="pf-sep" />
          <SectionSizes       sizes={sizes} setSizes={setSizes} />
          <div className="pf-sep" />
          <SectionIngredients ingredients={ingredients} setIngredients={setIngredients} />
          <div className="pf-sep" />
          <SectionRecette     steps={steps} setSteps={setSteps} />
          <div className="pf-sep" />
          <SectionProduction  data={data} set={set} />
          <div className="pf-sep" />
          <SectionHygiene     data={data} set={set} />
          <div className="pf-sep" />
          <SectionMeta        data={data} set={set} />
        </div>

        {/* Pied */}
        <div className="product-form-footer">
          {isEdit && !product.webflowProductId && !confirmDel && (
            <button
              type="button"
              className="btn-danger product-form-delete"
              onClick={() => setConfirmDel(true)}
            >
              Supprimer
            </button>
          )}
          {isEdit && !product.webflowProductId && confirmDel && (
            <div className="product-form-confirm-del">
              <span>Supprimer définitivement ?</span>
              <button type="button" className="btn-secondary" onClick={() => setConfirmDel(false)}>Annuler</button>
              <button type="button" className="btn-danger" onClick={() => onDelete(product.id)}>Confirmer</button>
            </div>
          )}
          {!confirmDel && (
            <>
              <button type="button" className="btn-secondary product-form-cancel" onClick={onClose}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary product-form-save"
                onClick={handleSave}
                disabled={!canSave}
              >
                {isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
              </button>
            </>
          )}
        </div>
    </Modal>
  )

  return modal
}
