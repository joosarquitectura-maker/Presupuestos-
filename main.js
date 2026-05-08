/**
 * main.js  —  PISOCALC Conector (Estático / GitHub Pages)
 * ─────────────────────────────────────────────────────────────
 * Lee el DOM, llama directamente a window.PisocalcEngine
 * (definido en calculos-motor.js) y escribe los resultados.
 * Sin fetch, sin backend, sin API key.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

// ════════════════════════════════════════════════════════════
//  HELPERS DOM
// ════════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const num = id => parseFloat($(`${id}`)?.value) || 0;
const mon = () => $('g_moneda')?.value || 'COP';
const fmt = n => `${mon()} ${Math.round(n).toLocaleString('es-CO')}`;
const fmtN = (n, u = '') => n > 0
  ? `${n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${u ? ' ' + u : ''}`
  : '—';

// ════════════════════════════════════════════════════════════
//  RECOLECTAR DATOS DE LA INTERFAZ
// ════════════════════════════════════════════════════════════

function leerGlobals() {
  return {
    espesor:    num('c_espesor'),
    merma:      num('c_merma'),
    precioConc: num('c_precio'),
    dosisFm:    num('fm_dosis'),
    precioFm:   num('fm_precio'),
    dosisMf:    num('mf_dosis'),
    precioMf:   num('mf_precio'),
    dosisEn:    num('en_dosis'),
    precioEn:   num('en_precio_kg'),
    precioMo:   num('mo_precio_m2'),
    precioLv:   num('lv_precio_m2'),
    precioOt:   num('ot_precio_m2'),
  };
}

function leerZonas() {
  if (window.mz_zones && window.mz_zones.length > 0 && window.mz_calcResult) {
    return window.mz_zones.map(z => {
      const r = window.mz_calcResult?.results?.[z.id] || {};
      return {
        id:          z.id,
        nombre:      z.name || `Zona ${z.id}`,
        area:        r.area || 0,
        perimetro:   r.perimeter || 0,
        cols:        r.cols,
        rows:        r.rows,
        matCustom:   !!z.matCustom,
        espesor:     z.espesor,
        merma:       z.merma,
        precioConc:  z.precioConc,
        dosisFm:     z.dosisFm,   precioFm:  z.precioFm,
        dosisMf:     z.dosisMf,   precioMf:  z.precioMf,
        mfEnabled:   z.mfEnabled,
        dosisEn:     z.dosisEn,   precioEn:  z.precioEn,
        precioMo:    z.precioMo,
        precioLv:    z.precioLv,  lvEnabled: z.lvEnabled,
        precioOt:    z.precioOt,  otEnabled: z.otEnabled,
        protTipo:    $(`z${z.id}_prot_tipo`)?.value || 'ninguna',
        hasRefuerzo: !!$(`z${z.id}_has_refuerzo`)?.checked,
      };
    });
  }
  return [{
    id:          0,
    nombre:      'Zona Global',
    area:        num('g_area'),
    perimetro:   num('ref_perimetro') || 0,
    matCustom:   false,
    protTipo:    $('prot_tipo')?.value || 'ninguna',
    hasRefuerzo: false,
  }];
}

function leerTiposJC() {
  if (window.jcTipoPrecios && Array.isArray(window.jcTipoPrecios)) {
    return window.jcTipoPrecios;
  }
  return [
    { tipo: 1, espesorMin: 0,  espesorMax: 12, precio: num('jc_precio_tipo1') || 0 },
    { tipo: 2, espesorMin: 13, espesorMax: 20, precio: num('jc_precio_tipo2') || 0 },
    { tipo: 3, espesorMin: 21, espesorMax: 99, precio: num('jc_precio_tipo3') || 0 },
  ];
}

function construirPayload() {
  const zonas   = leerZonas();
  const globals = leerGlobals();
  const iva     = num('g_iva');
  const waste   = num('g_waste');

  return {
    zonas,
    globals,
    iva,
    waste_pct:  waste,
    enPct:      num('en_pct'),
    moPct:      num('mo_pct'),
    juntaMet: {
      mlNeto:    parseFloat($('jm_ml_neto')?.value) || 0,
      waste_pct: num('jm_waste'),
      precioMl:  num('jm_precio'),
    },
    juntaConst: {
      perimetroMl: parseFloat($('jc_perimetro_manual')?.value) || 0,
      waste_pct:   num('jc_waste_pct'),
      espesorLosa: globals.espesor,
      tiposJC:     leerTiposJC(),
    },
    jai: {
      perimetroMl: parseFloat($('jai_perimetro_neto')?.value) || 0,
      waste_pct:   num('jai_waste_pct'),
      precioMl:    num('jai_precio_ml'),
    },
    corteJco: {
      mlNeto:    parseFloat($('jco_ml_neto_synced')?.value) || 0,
      waste_pct: num('jco_waste_pct'),
      precioMl:  num('jco_precio_ml'),
    },
    proteccion: {
      precioKgPE:  num('prot_precio_kg'),
      precioKgGeo: num('prot_precio_kg_geo'),
    },
    refuerzo: {
      precioKg: num('ref_precio_kg'),
    },
    aiu: {
      adminPct:  num('admin_pct'),
      utPct:     num('ut_pct'),
      esForaneo: !!$('admin_foraneo')?.checked,
    },
  };
}

// ════════════════════════════════════════════════════════════
//  ESCRIBIR RESULTADOS EN EL DOM
// ════════════════════════════════════════════════════════════

function aplicarResultados(r) {
  const R = r.resultados;

  if (R.concreto) {
    const c = R.concreto;
    if ($('c_m3'))        $('c_m3').value         = fmtN(c.totalM3, 'm³');
    if ($('c_m3merma'))   $('c_m3merma').value     = fmtN(c.totalM3merma, 'm³');
    if ($('c_vol'))       $('c_vol').innerHTML     = `${c.totalM3merma.toFixed(2)}<span>m³</span>`;
    if ($('c_cost'))      $('c_cost').textContent  = fmt(c.totalCosto);
    if ($('mini_concreto')) $('mini_concreto').textContent = fmt(c.totalCosto);
    if ($('s_c_qty'))     $('s_c_qty').textContent = fmtN(c.totalM3merma, 'm³');
    if ($('s_c_cost'))    $('s_c_cost').textContent = fmt(c.totalCosto);
  }

  if (R.fibra) {
    const f = R.fibra;
    if ($('fm_kg'))       $('fm_kg').value          = fmtN(f.totalKgNeto, 'kg');
    if ($('fm_kgw'))      $('fm_kgw').value         = fmtN(f.totalKgWaste, 'kg');
    if ($('fm_total'))    $('fm_total').innerHTML   = `${f.totalKgWaste.toFixed(1)}<span>kg</span>`;
    if ($('fm_cost'))     $('fm_cost').textContent  = fmt(f.totalCosto);
    if ($('mini_fibra'))  $('mini_fibra').textContent = fmt(f.totalCosto);
    if ($('s_fm_qty'))    $('s_fm_qty').textContent = fmtN(f.totalKgWaste, 'kg');
    if ($('s_fm_cost'))   $('s_fm_cost').textContent = fmt(f.totalCosto);
  }

  if (R.micro) {
    const m = R.micro;
    if ($('mf_gr'))       $('mf_gr').value           = fmtN(m.totalGrNeto, 'gr');
    if ($('mf_grw'))      $('mf_grw').value          = fmtN(m.totalGrWaste, 'gr');
    if ($('mf_total'))    $('mf_total').innerHTML    = `${Math.round(m.totalGrWaste).toLocaleString('es-CO')}<span>gr</span>`;
    if ($('mf_cost'))     $('mf_cost').textContent   = fmt(m.totalCosto);
    if ($('mini_micro'))  $('mini_micro').textContent = fmt(m.totalCosto);
    if ($('s_mf_qty'))    $('s_mf_qty').textContent  = fmtN(m.totalGrWaste, 'gr');
    if ($('s_mf_cost'))   $('s_mf_cost').textContent = fmt(m.totalCosto);
  }

  if (R.proteccion) {
    const p = R.proteccion;
    const visible = p.totalKg > 0;
    if ($('prot_qty'))         $('prot_qty').value              = visible ? `${p.totalKg.toFixed(2)} kg` : '';
    if ($('prot_total'))       $('prot_total').innerHTML        = visible ? `${p.totalKg.toFixed(2)}<span>kg</span>` : '—';
    if ($('prot_cost'))        $('prot_cost').textContent       = visible ? fmt(p.totalCosto) : '—';
    if ($('mini_proteccion'))  $('mini_proteccion').textContent = visible ? fmt(p.totalCosto) : '—';
    if ($('s_prot_qty'))       $('s_prot_qty').textContent      = visible ? `${p.totalKg.toFixed(2)} kg` : '—';
    if ($('s_prot_cost'))      $('s_prot_cost').textContent     = visible ? fmt(p.totalCosto) : '—';
  }

  if (R.refuerzo) {
    const rf = R.refuerzo;
    const visible = rf.totalKg > 0;
    if ($('ref_kg_nodos_total'))  $('ref_kg_nodos_total').value  = rf.kgNodos?.toFixed(0) || '';
    if ($('ref_kg_perim_total'))  $('ref_kg_perim_total').value  = rf.kgPerimetro?.toFixed(1) || '';
    if ($('ref_kg_esquinas_total')) $('ref_kg_esquinas_total').value = rf.kgEsquinas?.toFixed(0) || '';
    if ($('ref_total'))       $('ref_total').innerHTML   = visible ? `${rf.totalKg.toFixed(1)}<span>kg · ${rf.totalPuntos || 0} pts</span>` : '—';
    if ($('ref_cost'))        $('ref_cost').textContent  = visible ? fmt(rf.totalCosto) : '—';
    if ($('mini_refuerzo'))   $('mini_refuerzo').textContent = visible ? fmt(rf.totalCosto) : '—';
    if ($('s_ref_qty'))       $('s_ref_qty').textContent  = visible ? `${rf.totalKg.toFixed(1)} kg` : '—';
    if ($('s_ref_cost'))      $('s_ref_cost').textContent = visible ? fmt(rf.totalCosto) : '—';
  }

  if (R.endurecedor) {
    const e = R.endurecedor;
    if ($('en_kg'))          $('en_kg').value             = fmtN(e.totalKgNeto, 'kg');
    if ($('en_kgw'))         $('en_kgw').value            = fmtN(e.totalKgWaste, 'kg');
    if ($('en_total'))       $('en_total').innerHTML      = `${e.totalKgWaste.toFixed(1)}<span>kg</span>`;
    if ($('en_cost'))        $('en_cost').textContent     = fmt(e.totalCosto);
    if ($('mini_endurecedor')) $('mini_endurecedor').textContent = fmt(e.totalCosto);
    if ($('s_en_qty'))       $('s_en_qty').textContent    = fmtN(e.totalKgWaste, 'kg');
    if ($('s_en_cost'))      $('s_en_cost').textContent   = fmt(e.totalCosto);
  }

  if (R.juntaMet) {
    const jm = R.juntaMet;
    if ($('jm_ml_total'))    $('jm_ml_total').value       = jm.mlTotal > 0 ? `${jm.mlTotal.toFixed(2)} ml` : '—';
    if ($('jm_totalval'))    $('jm_totalval').innerHTML   = `${jm.mlTotal.toFixed(1)}<span>ml</span>`;
    if ($('jm_cost'))        $('jm_cost').textContent     = jm.totalCosto > 0 ? fmt(jm.totalCosto) : '—';
    if ($('mini_juntamet'))  $('mini_juntamet').textContent = jm.totalCosto > 0 ? fmt(jm.totalCosto) : '—';
    if ($('s_jm_qty'))       $('s_jm_qty').textContent    = `${jm.mlTotal.toFixed(2)} ml`;
    if ($('s_jm_cost'))      $('s_jm_cost').textContent   = fmt(jm.totalCosto);
  }

  if (R.juntaConst) {
    const jc = R.juntaConst;
    if ($('jc_ml'))          $('jc_ml').value             = jc.mlTotal > 0 ? `${jc.mlTotal.toFixed(2)} ml` : '—';
    if ($('jc_totalml'))     $('jc_totalml').innerHTML    = `${jc.mlTotal.toFixed(1)}<span>ml</span>`;
    if ($('jc_cost'))        $('jc_cost').textContent     = jc.totalCosto > 0 ? fmt(jc.totalCosto) : '—';
    if ($('mini_juntaconst')) $('mini_juntaconst').textContent = jc.totalCosto > 0 ? fmt(jc.totalCosto) : '—';
    if ($('s_jc_qty'))       $('s_jc_qty').textContent    = jc.mlTotal > 0 ? `${jc.mlTotal.toFixed(2)} ml` : '—';
    if ($('s_jc_cost'))      $('s_jc_cost').textContent   = jc.totalCosto > 0 ? fmt(jc.totalCosto) : '—';
    if ($('jc_precio_activo_display') && jc.tipoAsignado) {
      $('jc_precio_activo_display').value = jc.precioUnitario
        ? `${Math.round(jc.precioUnitario).toLocaleString('es-CO')} $/ml — Tipo ${jc.tipoAsignado}`
        : 'Sin tipo asignado';
    }
  }

  if (R.jai) {
    const j = R.jai;
    if ($('jai_ml_total'))   $('jai_ml_total').value      = j.mlTotal > 0 ? `${j.mlTotal.toFixed(2)} ml` : '—';
    if ($('jai_totalml'))    $('jai_totalml').innerHTML   = `${j.mlTotal.toFixed(1)}<span>ml</span>`;
    if ($('jai_cost'))       $('jai_cost').textContent    = j.totalCosto > 0 ? fmt(j.totalCosto) : '—';
    if ($('mini_jai'))       $('mini_jai').textContent    = j.totalCosto > 0 ? fmt(j.totalCosto) : '—';
    if ($('s_jai_qty'))      $('s_jai_qty').textContent   = j.mlTotal > 0 ? `${j.mlTotal.toFixed(2)} ml` : '—';
    if ($('s_jai_cost'))     $('s_jai_cost').textContent  = j.totalCosto > 0 ? fmt(j.totalCosto) : '—';
  }

  if (R.corteJco) {
    const jco = R.corteJco;
    if ($('jco_ml_total_display')) $('jco_ml_total_display').value = jco.mlTotal > 0 ? `${jco.mlTotal.toFixed(2)} ml` : '—';
    if ($('jco_totalml'))    $('jco_totalml').innerHTML   = `${jco.mlTotal.toFixed(1)}<span>ml</span>`;
    if ($('jco_cost'))       $('jco_cost').textContent    = jco.totalCosto > 0 ? fmt(jco.totalCosto) : '—';
    if ($('mini_cortejco'))  $('mini_cortejco').textContent = jco.totalCosto > 0 ? fmt(jco.totalCosto) : '—';
    if ($('s_jco_qty'))      $('s_jco_qty').textContent   = jco.mlTotal > 0 ? `${jco.mlTotal.toFixed(2)} ml` : '—';
    if ($('s_jco_cost'))     $('s_jco_cost').textContent  = jco.totalCosto > 0 ? fmt(jco.totalCosto) : '—';
  }

  if (R.manoObra) {
    const mo = R.manoObra;
    if ($('mo_area'))        $('mo_area').value           = fmtN(mo.totalAreaAplicada, 'm²');
    if ($('mo_area_val'))    $('mo_area_val').innerHTML   = `${mo.totalAreaAplicada.toFixed(1)}<span>m²</span>`;
    if ($('mo_cost'))        $('mo_cost').textContent     = fmt(mo.totalCosto);
    if ($('mini_manoobra'))  $('mini_manoobra').textContent = fmt(mo.totalCosto);
    if ($('s_mo_qty'))       $('s_mo_qty').textContent    = fmtN(mo.totalAreaAplicada, 'm²');
    if ($('s_mo_cost'))      $('s_mo_cost').textContent   = fmt(mo.totalCosto);
  }

  if (R.lavado) {
    const lv = R.lavado;
    if ($('lv_area'))        $('lv_area').value           = lv.totalArea > 0 ? `${lv.totalArea.toFixed(1)} m²` : '';
    if ($('lv_area_val'))    $('lv_area_val').innerHTML   = lv.totalArea > 0 ? `${lv.totalArea.toFixed(1)}<span>m²</span>` : '—<span>m²</span>';
    if ($('lv_cost'))        $('lv_cost').textContent     = lv.totalCosto > 0 ? fmt(lv.totalCosto) : '—';
    if ($('mini_lavado'))    $('mini_lavado').textContent = lv.totalCosto > 0 ? fmt(lv.totalCosto) : '—';
    if ($('s_lv_qty'))       $('s_lv_qty').textContent    = lv.totalArea > 0 ? `${lv.totalArea.toFixed(1)} m²` : '—';
    if ($('s_lv_cost'))      $('s_lv_cost').textContent   = lv.totalCosto > 0 ? fmt(lv.totalCosto) : '—';
  }

  if (R.otros) {
    const ot = R.otros;
    if ($('ot_area_val'))    $('ot_area_val').innerHTML   = ot.totalArea > 0 ? `${ot.totalArea.toFixed(1)}<span>m²</span>` : '—<span>m²</span>';
    if ($('ot_cost'))        $('ot_cost').textContent     = ot.totalCosto > 0 ? fmt(ot.totalCosto) : '—';
    if ($('mini_otros'))     $('mini_otros').textContent  = ot.totalCosto > 0 ? fmt(ot.totalCosto) : '—';
    if ($('s_ot_qty'))       $('s_ot_qty').textContent    = ot.totalArea > 0 ? `${ot.totalArea.toFixed(1)} m²` : '—';
    if ($('s_ot_cost'))      $('s_ot_cost').textContent   = ot.totalCosto > 0 ? fmt(ot.totalCosto) : '—';
  }

  if (R.aiu) {
    const aiu = R.aiu;
    if ($('s_admin_cost'))   $('s_admin_cost').textContent  = fmt(aiu.adminCosto);
    if ($('s_ut_cost'))      $('s_ut_cost').textContent     = fmt(aiu.utilidadCosto);
    if ($('s_total_final'))  $('s_total_final').textContent = fmt(aiu.totalConAIU);
  }

  if (typeof window.updateSummary === 'function') window.updateSummary();
}

// ════════════════════════════════════════════════════════════
//  CÁLCULO LOCAL (sin backend)
// ════════════════════════════════════════════════════════════

let _debounceTimer = null;

function recalcular() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    if (!window.PisocalcEngine || typeof window.PisocalcEngine.calcularTodo !== 'function') {
      console.error('[PISOCALC] PisocalcEngine no está cargado. Verifica que calculos-motor.js se incluya antes de main.js.');
      return;
    }
    const payload = construirPayload();
    const data = window.PisocalcEngine.calcularTodo(payload);
    if (data.ok) {
      aplicarResultados(data);
    } else {
      console.warn('[PISOCALC]', data.error);
    }
  }, 50);
}

// Alias para compatibilidad con código existente
const recalcularConBackend = recalcular;

// ════════════════════════════════════════════════════════════
//  ENGANCHE DE EVENTOS
// ════════════════════════════════════════════════════════════

function engancharEventos() {
  const fnsAReemplazar = [
    'calcConcretoD', 'calcFibraD', 'calcMicroD', 'calcProteccionD',
    'calcRefuerzoD', 'calcJuntaMetD', 'calcJuntaConstD', 'calcJAID',
    'calcCorteJcoD', 'calcEndurecedorD', 'calcManoObraD', 'calcOtrosD',
    'calcLavadoD', 'calcAdminD', 'calcUtilidadD', 'calcExteriorD',
    'recalcAll',
  ];
  fnsAReemplazar.forEach(fn => { window[fn] = recalcular; });

  document.addEventListener('input',  recalcular, { passive: true });
  document.addEventListener('change', recalcular, { passive: true });

  console.log('[PISOCALC] Modo estático activo — cálculos 100% en navegador');
}

// ════════════════════════════════════════════════════════════
//  INICIO
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  engancharEventos();
  recalcular();
});
