// ─── Navigation globale — barre de modules ────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

function dotColor(statuses) {
  if (statuses.some(s => s === 'error' || s === 'expired')) return 'red'
  if (statuses.some(s => s === 'loading' || s === 'connecting' || s === 'syncing' || s === 'reconnecting')) return 'orange'
  if (statuses.every(s => s === 'synced' || s === 'connected' || s === 'idle')) return 'green'
  if (statuses.some(s => s === 'disconnected')) return 'red'
  return 'orange'
}

const DOT_COLORS = {
  green:  'var(--color-success)',
  orange: 'var(--color-warn)',
  red:    'var(--color-error)',
}

// ── Icônes ─────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19.078" height="19.078" viewBox="0 0 19.078 19.078" fill="currentcolor">
      <path d="M2246.133-2996.6a4.238,4.238,0,0,1,1.249-3.016,4.236,4.236,0,0,1,3.017-1.249,4.233,4.233,0,0,1,3.016,1.249,4.237,4.237,0,0,1,1.249,3.016,4.27,4.27,0,0,1-4.265,4.266A4.27,4.27,0,0,1,2246.133-2996.6Zm2.31-1.956a2.746,2.746,0,0,0-.81,1.956v0a2.768,2.768,0,0,0,2.766,2.762,2.77,2.77,0,0,0,2.766-2.766,2.747,2.747,0,0,0-.811-1.956,2.746,2.746,0,0,0-1.955-.81A2.748,2.748,0,0,0,2248.443-2998.553Zm-12.857,1.956a4.237,4.237,0,0,1,1.249-3.016,4.236,4.236,0,0,1,3.017-1.249,4.234,4.234,0,0,1,3.016,1.249,4.234,4.234,0,0,1,1.249,3.016,4.27,4.27,0,0,1-4.265,4.266A4.271,4.271,0,0,1,2235.586-2996.6Zm2.31-1.956a2.75,2.75,0,0,0-.81,1.956v0a2.769,2.769,0,0,0,2.766,2.762,2.77,2.77,0,0,0,2.766-2.766,2.75,2.75,0,0,0-.81-1.956,2.748,2.748,0,0,0-1.956-.81A2.748,2.748,0,0,0,2237.9-2998.553Zm8.237-8.591a4.238,4.238,0,0,1,1.249-3.016,4.24,4.24,0,0,1,3.017-1.249,4.237,4.237,0,0,1,3.016,1.249,4.237,4.237,0,0,1,1.249,3.016,4.27,4.27,0,0,1-4.265,4.266A4.27,4.27,0,0,1,2246.133-3007.145Zm2.31-1.955a2.744,2.744,0,0,0-.81,1.955v0a2.768,2.768,0,0,0,2.766,2.762,2.769,2.769,0,0,0,2.766-2.766,2.745,2.745,0,0,0-.811-1.955,2.743,2.743,0,0,0-1.955-.811A2.745,2.745,0,0,0,2248.443-3009.1Zm-12.857,1.955a4.237,4.237,0,0,1,1.249-3.016,4.24,4.24,0,0,1,3.017-1.249,4.238,4.238,0,0,1,3.016,1.249,4.234,4.234,0,0,1,1.249,3.016,4.27,4.27,0,0,1-4.265,4.266A4.271,4.271,0,0,1,2235.586-3007.145Zm2.31-1.955a2.748,2.748,0,0,0-.81,1.955v0a2.769,2.769,0,0,0,2.766,2.762,2.769,2.769,0,0,0,2.766-2.766,2.748,2.748,0,0,0-.81-1.955,2.745,2.745,0,0,0-1.956-.811A2.745,2.745,0,0,0,2237.9-3009.1Z" transform="translate(-2235.586 3011.41)"/>
    </svg>
  )
}

function IconPlanning() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19.078" height="19.078" viewBox="0 0 19.078 19.078" fill="currentcolor">
      <path d="M1938.509-3227.336a1.867,1.867,0,0,1-1.922-1.921v-12.891a1.867,1.867,0,0,1,1.922-1.921h2.766v-1.594a.75.75,0,0,1,.75-.75.75.75,0,0,1,.751.75v1.594h6.7v-1.594a.75.75,0,0,1,.75-.75.75.75,0,0,1,.75.75v1.594h2.766a1.867,1.867,0,0,1,1.922,1.921v12.891a1.868,1.868,0,0,1-1.922,1.921Zm-.422-1.921c0,.269.1.319.172.354a.774.774,0,0,0,.25.067h15.234c.269,0,.319-.1.355-.172a.778.778,0,0,0,.068-.25v-8.625h-16.078Zm16.078-10.125v-2.766c0-.269-.1-.319-.171-.354a.785.785,0,0,0-.251-.068h-2.766v1.008a.75.75,0,0,1-.75.75.75.75,0,0,1-.75-.75v-1.008h-6.7v1.008a.75.75,0,0,1-.751.75.75.75,0,0,1-.75-.75v-1.008h-2.766c-.269,0-.319.1-.355.172a.778.778,0,0,0-.068.25v2.766Z" transform="translate(-1936.588 3246.414)"/>
    </svg>
  )
}

function IconOrders() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.502" height="17.918" viewBox="0 0 21.502 17.918" fill="currentcolor">
      <g transform="translate(-0.416 -1.887)">
        <path d="M3.515,8.384a.75.75,0,0,1-.569-1.238l4.283-5a.75.75,0,0,1,1.139.976l-4.283,5A.748.748,0,0,1,3.515,8.384Z" transform="translate(0.513 0)"/>
        <path d="M16,8.384a.748.748,0,0,1-.57-.262l-4.283-5a.75.75,0,0,1,1.139-.976l4.283,5A.75.75,0,0,1,16,8.384Z" transform="translate(2.303 0)"/>
        <path d="M17.768,18.91H4.552a2.115,2.115,0,0,1-2.034-1.664L.486,8.695A2.162,2.162,0,0,1,2.5,5.989H19.829a2.162,2.162,0,0,1,2.018,2.706l-2.031,8.551a2.115,2.115,0,0,1-2.034,1.664ZM4.573,17.41H17.76a.62.62,0,0,0,.592-.49l0-.014L20.39,8.339l0-.019a.662.662,0,0,0-.607-.832H2.546a.662.662,0,0,0-.607.832l0,.019L3.979,16.9l0,.014A.62.62,0,0,0,4.573,17.41Z" transform="translate(0 0.895)"/>
        <path d="M5.859,15.543a.75.75,0,0,1-.75-.75V9.082a.75.75,0,0,1,1.5,0v5.711A.75.75,0,0,1,5.859,15.543Z" transform="translate(1.024 1.407)"/>
        <path d="M9.375,15.543a.75.75,0,0,1-.75-.75V9.082a.75.75,0,0,1,1.5,0v5.711A.75.75,0,0,1,9.375,15.543Z" transform="translate(1.792 1.407)"/>
        <path d="M12.891,15.543a.75.75,0,0,1-.75-.75V9.082a.75.75,0,0,1,1.5,0v5.711A.75.75,0,0,1,12.891,15.543Z" transform="translate(2.559 1.407)"/>
      </g>
    </svg>
  )
}

function IconProducts() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="23.98" height="23.967" viewBox="0 0 23.98 23.967" fill="currentcolor">
      <g transform="translate(-0.01 -0.017)">
        <path d="M11.544.017a.75.75,0,0,1,.689,1.046A2.987,2.987,0,0,0,16.784,4.63a.75.75,0,0,1,1.207.6,3,3,0,0,0,3,3.015h0A2.97,2.97,0,0,0,22.352,7.9a.75.75,0,0,1,1.064.435A11.988,11.988,0,1,1,11.514.018Zm3.433,6.727A4.5,4.5,0,0,1,10.534,1.61,10.488,10.488,0,1,0,22.2,9.571,4.468,4.468,0,0,1,21,9.745H20.99a4.49,4.49,0,0,1-4.342-3.327A4.481,4.481,0,0,1,14.977,6.744Z"/>
        <path d="M7.473,13.489a3,3,0,1,1,3-3A3,3,0,0,1,7.473,13.489Zm0-4.5a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,7.473,8.989Z"/>
        <path d="M14.223,19.489a2.25,2.25,0,1,1,2.25-2.25A2.253,2.253,0,0,1,14.223,19.489Zm0-3a.75.75,0,1,0,.75.75A.751.751,0,0,0,14.223,16.489Z"/>
        <path d="M7.1,17.989a1.125,1.125,0,0,1,0-2.25Z"/>
        <path d="M7.1,17.989v-2.25a1.125,1.125,0,0,1,0,2.25Z"/>
        <path d="M13.1,11.239a1.125,1.125,0,0,1,0-2.25Z"/>
        <path d="M13.1,11.239V8.989a1.125,1.125,0,0,1,0,2.25Z"/>
        <g>
          <path d="M19.1,14.24a1.125,1.125,0,1,1,0-2.25Z"/>
          <path d="M19.1,14.24V11.99a1.125,1.125,0,0,1,0,2.25Z"/>
        </g>
      </g>
    </svg>
  )
}

function IconTemperatures() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16.153" height="21.5" viewBox="0 0 16.153 21.5" fill="currentcolor">
      <g transform="translate(-3.116 0.164)">
        <path d="M7.863,21.336a4.746,4.746,0,0,1-3.414-8.043V3.25a3.414,3.414,0,0,1,6.828,0V13.293a4.746,4.746,0,0,1-3.414,8.043Zm0-20A1.916,1.916,0,0,0,5.949,3.25V13.611a.75.75,0,0,1-.25.559,3.246,3.246,0,1,0,4.328,0,.75.75,0,0,1-.25-.559V3.25A1.916,1.916,0,0,0,7.863,1.336Z"/>
        <path d="M7.383,14.467a.75.75,0,0,1-.75-.75v-2a.75.75,0,0,1,1.5,0v2A.75.75,0,0,1,7.383,14.467Z" transform="translate(0.48 1.521)"/>
        <path d="M7.543,16.891a2.082,2.082,0,1,1,2.082-2.082A2.084,2.084,0,0,1,7.543,16.891Zm0-2.664a.582.582,0,1,0,.582.582A.583.583,0,0,0,7.543,14.227Z" transform="translate(0.32 1.762)"/>
        <path d="M17.318,3.68H12.656a.75.75,0,0,1,0-1.5h4.662a.75.75,0,0,1,0,1.5Z" transform="translate(1.201 0.32)"/>
        <path d="M14.654,7.2h-2a.75.75,0,0,1,0-1.5h2a.75.75,0,0,1,0,1.5Z" transform="translate(1.201 0.801)"/>
        <path d="M17.318,10.711H12.656a.75.75,0,0,1,0-1.5h4.662a.75.75,0,0,1,0,1.5Z" transform="translate(1.201 1.281)"/>
      </g>
    </svg>
  )
}

function IconCleaning() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.5" height="21.5" viewBox="0 0 21.5 21.5" fill="currentcolor">
      <g transform="translate(-0.37 -0.38)">
        <path d="M20.631,2.91a.75.75,0,0,1-.386-1.394L21.963.487a.75.75,0,1,1,.771,1.287L21.015,2.8A.747.747,0,0,1,20.631,2.91Z" transform="translate(-1.578 0)"/>
        <path d="M22.348,9.289a.746.746,0,0,1-.387-.108L20.242,8.142a.75.75,0,1,1,.776-1.284L22.737,7.9a.75.75,0,0,1-.389,1.392Z" transform="translate(-1.578 -0.515)"/>
        <path d="M22.7,5.63H20.63a.75.75,0,0,1,0-1.5H22.7a.75.75,0,0,1,0,1.5Z" transform="translate(-1.578 -0.303)"/>
        <path d="M10.034,11.012a.75.75,0,0,1-.75-.75V6.016a.75.75,0,0,1,.75-.75h2.926V2.63H7.516a3.374,3.374,0,0,0-3.3,2.636H6.358a.75.75,0,0,1,.75.75v4.246a.75.75,0,0,1-1.5,0v-3.5H3.38a.75.75,0,0,1-.75-.748A4.877,4.877,0,0,1,7.518,1.13h6.193a.75.75,0,0,1,.75.75V6.016a.75.75,0,0,1-.75.75H10.784v3.5A.75.75,0,0,1,10.034,11.012Z" transform="translate(-0.183 -0.061)"/>
        <path d="M15.455,10.568c-3.144,0-5.383-3.644-5.476-3.8a.75.75,0,1,1,1.284-.776c.041.066,1.91,3.075,4.193,3.075a.75.75,0,1,1,0,1.5Z" transform="translate(-0.768 -0.425)"/>
        <path d="M6.635,10.13H9.392a2.131,2.131,0,0,1,2.129,2.129v.681a4.328,4.328,0,0,1,2.655,1.4,7,7,0,0,1,1.481,4.81,3.511,3.511,0,0,1-3.507,3.507H3.877A3.511,3.511,0,0,1,.37,19.152a6.99,6.99,0,0,1,1.489-4.811,4.334,4.334,0,0,1,2.647-1.4v-.682A2.131,2.131,0,0,1,6.635,10.13Zm5.515,11.029a2.01,2.01,0,0,0,2.007-2.007,5.6,5.6,0,0,0-1.1-3.807,3,3,0,0,0-2.289-.958.75.75,0,0,1-.75-.75V12.259a.629.629,0,0,0-.629-.629H6.635a.629.629,0,0,0-.629.629v1.379a.75.75,0,0,1-.75.75,3,3,0,0,0-2.283.958,5.586,5.586,0,0,0-1.1,3.806,2.01,2.01,0,0,0,2.007,2.007Z" transform="translate(0 -0.789)"/>
        <path d="M17.63,6.2a.75.75,0,0,1-.75-.75V3.38a.75.75,0,1,1,1.5,0V5.448A.75.75,0,0,1,17.63,6.2Z" transform="translate(-1.335 -0.182)"/>
      </g>
    </svg>
  )
}

function IconTracability() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="21.5" height="19.5" viewBox="0 0 21.5 19.5" fill="currentcolor">
  <path id="Union_4" data-name="Union 4" d="M1990.252-4326.416a.75.75,0,0,1-.75-.75.75.75,0,0,1,.75-.75h3.281v-16.5h-3.281a.75.75,0,0,1-.75-.749.75.75,0,0,1,.75-.75h4.031a.75.75,0,0,1,.749.75v18a.75.75,0,0,1-.749.75Zm-15.969,0a.75.75,0,0,1-.75-.75v-18a.75.75,0,0,1,.75-.75h4.03a.75.75,0,0,1,.75.75.75.75,0,0,1-.75.749h-3.281v16.5h3.281a.75.75,0,0,1,.75.75.75.75,0,0,1-.75.75Zm15.218-6.021v-7.46a.75.75,0,0,1,.75-.75.749.749,0,0,1,.749.75v7.46a.749.749,0,0,1-.749.75A.75.75,0,0,1,1989.5-4332.437Zm-8.2.75a.75.75,0,0,1-.75-.749.75.75,0,0,1,.75-.75h5.968a.75.75,0,0,1,.75.75.75.75,0,0,1-.75.749Zm-3.734-.75v-7.46a.75.75,0,0,1,.749-.75.75.75,0,0,1,.75.75v7.46a.75.75,0,0,1-.75.75A.75.75,0,0,1,1977.564-4332.437Zm8.953-2.984v-4.476a.75.75,0,0,1,.749-.75.75.75,0,0,1,.75.75v4.476a.75.75,0,0,1-.75.75A.75.75,0,0,1,1986.518-4335.421Zm-2.985,0v-4.476a.75.75,0,0,1,.75-.75.75.75,0,0,1,.75.75v4.476a.75.75,0,0,1-.75.75A.75.75,0,0,1,1983.533-4335.421Zm-2.984,0v-4.476a.75.75,0,0,1,.75-.75.749.749,0,0,1,.749.75v4.476a.749.749,0,0,1-.749.75A.75.75,0,0,1,1980.548-4335.421Z" transform="translate(-1973.533 4345.917)"/>
</svg>


  )
}

function IconSettings() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="19.069" height="19.068" fill="currentcolor" viewBox="0 0 19.069 19.068">
      <g transform="translate(0.159 0.161)" >
        <path d="M12.386-.161a2.281,2.281,0,0,1,2.277,2.4l-.055,1.094a.78.78,0,0,0,.817.818l1.092-.055.114,0a2.28,2.28,0,0,1,1.529,3.972l-.815.735a.781.781,0,0,0,0,1.159l.814.734a2.28,2.28,0,0,1-1.644,3.97L15.421,14.6H15.38a.78.78,0,0,0-.779.82l.056,1.094a2.28,2.28,0,0,1-3.96,1.646l-.738-.817a.78.78,0,0,0-1.159,0l-.74.815a2.28,2.28,0,0,1-3.965-1.638l.056-1.1a.78.78,0,0,0-.819-.819l-1.094.056c-.039,0-.079,0-.118,0A2.28,2.28,0,0,1,.59,10.694L1.4,9.959A.781.781,0,0,0,1.4,8.8L.59,8.06A2.28,2.28,0,0,1,2.23,4.095l1.1.056h.042a.78.78,0,0,0,.778-.821l-.053-1.1A2.28,2.28,0,0,1,8.059.589l.735.812a.779.779,0,0,0,1.159,0L10.7.589A2.283,2.283,0,0,1,12.386-.161Zm3,5.809A2.28,2.28,0,0,1,13.11,3.254l.055-1.094A.78.78,0,0,0,11.806,1.6l-.741.813a2.279,2.279,0,0,1-3.383,0L6.949,1.6a.78.78,0,0,0-1.356.563l.052,1.094a2.28,2.28,0,0,1-2.4,2.394L2.157,5.593H2.121A.78.78,0,0,0,1.6,6.949l.813.738a2.281,2.281,0,0,1,0,3.385l-.813.734a.78.78,0,0,0,.565,1.356l1.095-.056.117,0a2.28,2.28,0,0,1,2.277,2.4l-.056,1.094a.78.78,0,0,0,1.357.557l.738-.813a2.28,2.28,0,0,1,3.384,0l.735.813a.78.78,0,0,0,1.352-.565L13.1,15.5A2.28,2.28,0,0,1,15.5,13.106l1.093.055h.04a.78.78,0,0,0,.523-1.36l-.814-.734a2.281,2.281,0,0,1,0-3.386l.814-.735a.78.78,0,0,0-.562-1.358L15.5,5.645Z"/>
        <path d="M9.375,13.641a4.266,4.266,0,0,1,0-8.531h0a4.266,4.266,0,1,1,0,8.531ZM6.609,9.373s0,0,0,0a2.766,2.766,0,1,0,.81-1.956A2.769,2.769,0,0,0,6.609,9.376Z"/>
      </g>
    </svg>
  )
}

function IconProfile() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16.734" height="19.078" fill="currentcolor" viewBox="0 0 16.734 19.078">
      <g transform="translate(-1.008 0.164)" >
        <path d="M9.375,9.539a4.852,4.852,0,1,1,4.852-4.852A4.857,4.857,0,0,1,9.375,9.539ZM6.023,4.687a3.352,3.352,0,1,0,.982-2.37A3.355,3.355,0,0,0,6.023,4.687Z"/>
        <path d="M10.745,5.438h0A7.593,7.593,0,0,1,5.3,3.125a.75.75,0,0,1,1.08-1.041,6.082,6.082,0,0,0,4.361,1.853,6.015,6.015,0,0,0,2.4-.494.75.75,0,1,1,.594,1.378A7.512,7.512,0,0,1,10.745,5.438Z"/>
        <path d="M16.992,18.914a.75.75,0,0,1-.75-.75,6.867,6.867,0,1,0-13.734,0,.75.75,0,0,1-1.5,0,8.367,8.367,0,0,1,16.734,0A.75.75,0,0,1,16.992,18.914Z"/>
        <path d="M9.375,15.4a3.68,3.68,0,0,1-3.68-3.68v-.587a.75.75,0,0,1,1.5,0v.587a2.18,2.18,0,0,0,4.359,0v-.587a.75.75,0,0,1,1.5,0v.587A3.684,3.684,0,0,1,9.375,15.4Z"/>
      </g>
    </svg>
  )
}

// ── Structure des groupes ──────────────────────────────────────────────────────

const DASHBOARD = { id: 'dashboard', label: 'Dashboard', icon: IconDashboard, available: false }

const GROUP_METIER = [
  { id: 'planning',  label: 'Planning',  icon: IconPlanning, available: true },
  { id: 'orders',    label: 'Commandes', icon: IconOrders,   available: true },
  { id: 'products',  label: 'Produits',  icon: IconProducts, available: true },
]

const GROUP_HACCP = [
  { id: 'temperatures', label: 'Températures', icon: IconTemperatures, available: true  },
  { id: 'cleaning',     label: 'Nettoyage',    icon: IconCleaning,     available: true  },
  { id: 'tracability',  label: 'Traçabilité',  icon: IconTracability,  available: true  },
]

// ── Composant ──────────────────────────────────────────────────────────────────

export default function NavSidebar({ activeModule = 'planning', onModuleChange, badges = {}, connections = [] }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [popPos,       setPopPos]       = useState({ top: 0, left: 0 })
  const settingsBtnRef = useRef(null)
  const settingsPopRef = useRef(null)

  const connColor = connections.length > 0
    ? dotColor(connections.map(c => c.status))
    : 'green'

  function toggleSettings() {
    if (settingsOpen) { setSettingsOpen(false); return }
    const rect = settingsBtnRef.current.getBoundingClientRect()
    setPopPos({ top: rect.top, left: rect.right + 8 })
    setSettingsOpen(true)
  }

  useEffect(() => {
    if (!settingsOpen) return
    function onDown(e) {
      if (settingsPopRef.current?.contains(e.target) || settingsBtnRef.current?.contains(e.target)) return
      setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [settingsOpen])

  function renderNavItem(mod, inGroup = false) {
    const Icon     = mod.icon
    const isActive = mod.id === activeModule
    const badge    = badges[mod.id]
    return (
      <button
        key={mod.id}
        className={[
          'nav-item',
          inGroup         ? 'nav-item--group'   : '',
          isActive        ? 'nav-item--active'  : '',
          !mod.available  ? 'nav-item--disabled': '',
        ].filter(Boolean).join(' ')}
        title={mod.label}
        onClick={() => mod.available && onModuleChange?.(mod.id)}
      >
        <Icon />
        {badge > 0 && <span className="nav-badge">{badge}</span>}
      </button>
    )
  }

  const settingsPopover = settingsOpen && connections.length > 0 && createPortal(
    <div
      ref={settingsPopRef}
      className="conn-popover"
      style={{ top: popPos.top, left: popPos.left }}
    >
      {connections.map((c, i) => (
        <div key={i} className="conn-popover-row">
          <span
            className="conn-popover-dot"
            style={{ background: DOT_COLORS[dotColor([c.status])] }}
          />
          <div className="conn-popover-info">
            <span className="conn-popover-label">{c.label}</span>
            {c.detail && <span className="conn-popover-detail">{c.detail}</span>}
          </div>
          {(c.status === 'error' || c.status === 'expired') && c.onRetry && (
            <button className="conn-popover-action" onClick={() => { c.onRetry(); setSettingsOpen(false) }}>
              Réessayer
            </button>
          )}
          {c.status === 'disconnected' && c.onConnect && (
            <button className="conn-popover-action" onClick={() => { c.onConnect(); setSettingsOpen(false) }}>
              Connecter
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body
  )

  return (
    <>
    <nav className="nav-sidebar">

      {/* Haut — logo + dashboard */}
      <div className="nav-top">
        <div className="nav-logo">
          <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="48px" height="48px" viewBox="0 0 48 47.999" fill="currentColor">
            <defs><clipPath id="clip-path"><rect width="48px" height="48px"/></clipPath></defs>
            <g transform="translate(0 0.004)">
              <path d="M320.276,279.849l1.649-1.648,4.237,5.562h2.589l-5.349-7.038,5.273-5.273h-1.155l-7.248,7.248v-7.248h-2.065v12.31h2.067Z" transform="translate(-306.901 -261.809)"/>
              <g transform="translate(0 -0.004)">
                <g transform="translate(0 0)" clipPath="url(#clip-path)">
                  <path d="M17.8,677.692h0a3.424,3.424,0,0,0,1.366-6.563,3.131,3.131,0,0,0-1.73-5.741H11.694v8.639L.566,662.9l-.566.56L23.883,687.34l.564-.561-9.086-9.087Zm-1.614-6.86H13.757v-4.626h2.429a2.313,2.313,0,0,1,0,4.626m-2.428.81h2.8a2.618,2.618,0,1,1,0,5.237H14.547l-.789-.789Z" transform="translate(0 -639.341)"/>
                  <path d="M663.43,0l-.563.563L674.1,11.793v4.986a3.617,3.617,0,0,1-6.977,1.343l0-.009a2.973,2.973,0,0,1-.265-1.223V9.643h-2.066v7.25a5.071,5.071,0,0,0,5.063,5h.059a5.064,5.064,0,0,0,5-5.006V12.607L686.75,24.441l.561-.564Z" transform="translate(-639.312 0.004)"/>
                  <path d="M692.54,732.86v-.005h-.232a6.183,6.183,0,1,0,.232.005m-4.312,6.824,0-.112v-1.057c0-2.668,1.837-4.842,4.087-4.845s4.085,2.179,4.089,4.845v.419a.342.342,0,0,0,0,.075v.679a5.269,5.269,0,0,1-1.256,3.318,3.632,3.632,0,0,1-5.655,0,5.27,5.27,0,0,1-1.256-3.322" transform="translate(-661.77 -706.812)"/>
                </g>
              </g>
            </g>
          </svg>
        </div>
        {renderNavItem(DASHBOARD)}
      </div>

      {/* Centre — groupes de modules */}
      <div className="nav-center">

        <div className="nav-group">
          {GROUP_METIER.map(mod => renderNavItem(mod, true))}
        </div>

        <div className="nav-group">
          {GROUP_HACCP.map(mod => renderNavItem(mod, true))}
        </div>

      </div>

      {/* Actions globales */}
      <div className="nav-bottom">
        <button
          ref={settingsBtnRef}
          className="nav-item nav-item--sm"
          title="Paramètres"
          onClick={toggleSettings}
        >
          <IconSettings />
          {connections.length > 0 && (
            <span
              className="nav-badge nav-badge--dot"
              style={{ background: DOT_COLORS[connColor] }}
            />
          )}
        </button>
        <button className="nav-item nav-item--sm nav-item--disabled" title="Profil">
          <IconProfile />
        </button>
      </div>

    </nav>
    {settingsPopover}
    </>
  )
}
