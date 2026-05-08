/**
 * calculos-motor.js  —  PISOCALC Engine (Vanilla JS / Static)
 * ─────────────────────────────────────────────────────────────
 * Versión estática para GitHub Pages.
 * Expone las funciones de cálculo en window.PisocalcEngine
 * para que main.js las invoque directamente (sin backend).
 * ─────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════

  const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

  function getZoneMat(zona, globals) {
    if (zona.matCustom) {
      return {
        espesor:    zona.espesor    ?? globals.espesor,
        merma:      zona.merma      ?? globals.merma,
        precioConc: zona.precioConc ?? globals.precioConc,
        dosisFm:    zona.dosisFm    ?? globals.dosisFm,
        precioFm:   zona.precioFm   ?? globals.precioFm,
        dosisMf:    zona.dosisMf    ?? globals.dosisMf,
        precioMf:   zona.precioMf   ?? globals.precioMf,
        mfEnabled:  zona.mfEnabled  !== false,
        dosisEn:    zona.dosisEn    ?? globals.dosisEn,
        precioEn:   zona.precioEn   ?? globals.precioEn,
        precioMo:   zona.precioMo   ?? globals.precioMo,
        precioLv:   zona.precioLv   ?? globals.precioLv,
        lvEnabled:  zona.lvEnabled  !== false,
        precioOt:   zona.precioOt   ?? globals.precioOt,
        otEnabled:  zona.otEnabled  === true,
      };
    }
    return {
      espesor:    globals.espesor,
      merma:      globals.merma,
      precioConc: globals.precioConc,
      dosisFm:    globals.dosisFm,
      precioFm:   globals.precioFm,
      dosisMf:    globals.dosisMf,
      precioMf:   globals.precioMf,
      mfEnabled:  zona.mfEnabled !== false,
      dosisEn:    globals.dosisEn,
      precioEn:   globals.precioEn,
      precioMo:   globals.precioMo,
      precioLv:   globals.precioLv,
      lvEnabled:  zona.lvEnabled !== false,
      precioOt:   globals.precioOt,
      otEnabled:  zona.otEnabled === true,
    };
  }

  // ════════════════════════════════════════════════════════════
  //  FÓRMULAS DE CÁLCULO
  // ════════════════════════════════════════════════════════════

  function calcConcreto({ zonas, globals, iva }) {
    const iv = iva / 100;
    let totalM3 = 0, totalM3m = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const m    = getZoneMat(z, globals);
      const m3   = z.area * (m.espesor / 100);
      const m3m  = m3 * (1 + m.merma / 100);
      const cost = m3m * m.precioConc * (1 + iv);
      totalM3 += m3; totalM3m += m3m; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, m3: round(m3), m3merma: round(m3m), costo: round(cost) });
    }
    return { totalM3: round(totalM3), totalM3merma: round(totalM3m), totalCosto: round(totalCosto), detalle };
  }

  function calcFibra({ zonas, globals, waste_pct }) {
    const w = 1 + waste_pct / 100;
    let totalKg = 0, totalKgW = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const m    = getZoneMat(z, globals);
      const m3   = z.area * m.espesor / 100;
      const kg   = m3 * m.dosisFm;
      const kgW  = kg * w;
      const cost = kgW * m.precioFm;
      totalKg += kg; totalKgW += kgW; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, m3: round(m3), kgNeto: round(kg), kgWaste: round(kgW), costo: round(cost) });
    }
    return { totalKgNeto: round(totalKg), totalKgWaste: round(totalKgW), totalCosto: round(totalCosto), detalle };
  }

  function calcMicro({ zonas, globals, waste_pct }) {
    const w = 1 + waste_pct / 100;
    let totalGr = 0, totalGrW = 0, totalBolsas = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const m = getZoneMat(z, globals);
      if (m.mfEnabled === false) continue;
      const m3     = z.area * m.espesor / 100;
      const gr     = m3 * m.dosisMf;
      const grW    = gr * w;
      const bolsas = (grW > 0 && m.precioMf > 0) ? Math.ceil(grW / 600) : 0;
      const cost   = bolsas * m.precioMf;
      totalGr += gr; totalGrW += grW; totalBolsas += bolsas; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, grNeto: round(gr), grWaste: round(grW), bolsas, costo: round(cost) });
    }
    return { totalGrNeto: round(totalGr), totalGrWaste: round(totalGrW), totalBolsas, totalCosto: round(totalCosto), detalle };
  }

  function calcProteccion({ zonas, globals, precioKgPE, precioKgGeo, iva }) {
    const iv = iva / 100;
    let totalKg = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const tipo = z.protTipo || 'ninguna';
      if (tipo === 'ninguna') continue;
      const areaT = z.area * 1.10;
      let qty = 0, precio = 0;
      if      (tipo === 'polietileno_sencillo') { qty = areaT * 0.15; precio = precioKgPE;  }
      else if (tipo === 'polietileno_doble')    { qty = areaT * 0.30; precio = precioKgPE;  }
      else if (tipo === 'geotextil')            { qty = areaT * 0.20; precio = precioKgGeo; }
      const cost = qty * precio * (1 + iv);
      totalKg += qty; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, tipo, cantidadKg: round(qty), costo: round(cost) });
    }
    return { totalKg: round(totalKg), totalCosto: round(totalCosto), detalle };
  }

  function calcRefuerzo({ zonas, precioKg, iva }) {
    const iv = iva / 100;
    let totalNodos = 0, totalPerim = 0, totalEsq = 0;
    const detalle = [];
    for (const z of zonas) {
      if (!z.hasRefuerzo) continue;
      const nodos    = (z.cols != null && z.rows != null) ? (z.cols - 1) * (z.rows - 1) : 0;
      const esquinas = 4;
      const perim    = z.perimetro || 0;
      const kgZ      = nodos * 28 + (perim / 9) * 7 + esquinas * 14;
      totalNodos += nodos; totalPerim += perim; totalEsq += esquinas;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, nodos, perimetroMl: round(perim), esquinas, kgZona: round(kgZ) });
    }
    const kgNodos  = totalNodos * 28;
    const kgPerim  = (totalPerim / 9) * 7;
    const kgEsq    = totalEsq * 14;
    const totalKg  = kgNodos + kgPerim + kgEsq;
    const costo    = totalKg * precioKg * (1 + iv);
    return {
      totalKg: round(totalKg),
      kgNodos: round(kgNodos), kgPerimetro: round(kgPerim), kgEsquinas: round(kgEsq),
      totalPuntos: totalNodos + totalEsq,
      totalCosto: round(costo),
      detalle,
    };
  }

  function calcEndurecedor({ zonas, globals, enPct, waste_pct }) {
    const w   = 1 + waste_pct / 100;
    const pct = enPct / 100;
    let totalKgN = 0, totalKgW = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const m    = getZoneMat(z, globals);
      const kgN  = z.area * pct * m.dosisEn;
      const kgW  = kgN * w;
      const cost = kgW * m.precioEn;
      totalKgN += kgN; totalKgW += kgW; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, kgNeto: round(kgN), kgWaste: round(kgW), costo: round(cost) });
    }
    return { totalKgNeto: round(totalKgN), totalKgWaste: round(totalKgW), totalCosto: round(totalCosto), detalle };
  }

  function calcJuntaMet({ mlNeto, waste_pct, precioMl, iva }) {
    if (!mlNeto || mlNeto <= 0) return { mlNeto: 0, mlTotal: 0, totalCosto: 0 };
    const mlTotal = mlNeto * (1 + waste_pct / 100);
    return { mlNeto: round(mlNeto), mlTotal: round(mlTotal), totalCosto: round(mlTotal * precioMl * (1 + iva / 100)) };
  }

  function calcJuntaConst({ perimetroMl, waste_pct, espesorLosa, tiposJC, iva }) {
    if (!perimetroMl || perimetroMl <= 0) return { mlNeto: 0, mlTotal: 0, totalCosto: 0, tipoAsignado: null };
    const jcMatch = (tiposJC || []).find(t => espesorLosa >= t.espesorMin && espesorLosa <= t.espesorMax) || null;
    if (!jcMatch || jcMatch.precio <= 0)
      return { mlNeto: round(perimetroMl), mlTotal: 0, totalCosto: 0, tipoAsignado: null, aviso: 'Sin tipo JC para ese espesor' };
    const mlTotal = perimetroMl * (1 + waste_pct / 100);
    return {
      mlNeto: round(perimetroMl), mlTotal: round(mlTotal),
      totalCosto: round(mlTotal * jcMatch.precio * (1 + iva / 100)),
      tipoAsignado: jcMatch.tipo, precioUnitario: jcMatch.precio,
    };
  }

  function calcJAI({ perimetroMl, waste_pct, precioMl, iva }) {
    if (!perimetroMl || perimetroMl <= 0) return { mlNeto: 0, mlTotal: 0, totalCosto: 0 };
    const mlTotal = perimetroMl * (1 + waste_pct / 100);
    return { mlNeto: round(perimetroMl), mlTotal: round(mlTotal), totalCosto: round(mlTotal * precioMl * (1 + iva / 100)) };
  }

  function calcCorteJco({ mlNeto, waste_pct, precioMl, iva }) {
    if (!mlNeto || mlNeto <= 0) return { mlNeto: 0, mlTotal: 0, totalCosto: 0 };
    const mlTotal = mlNeto * (1 + waste_pct / 100);
    return { mlNeto: round(mlNeto), mlTotal: round(mlTotal), totalCosto: round(mlTotal * precioMl * (1 + iva / 100)) };
  }

  function calcManoObra({ zonas, globals, moPct }) {
    const pct = moPct / 100;
    let totalArea = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const m    = getZoneMat(z, globals);
      const apl  = z.area * pct;
      const cost = apl * m.precioMo;
      totalArea += apl; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, areaAplicada: round(apl), costo: round(cost) });
    }
    return { totalAreaAplicada: round(totalArea), totalCosto: round(totalCosto), detalle };
  }

  function calcLavado({ zonas, globals }) {
    let totalArea = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const m = getZoneMat(z, globals);
      if (!m.lvEnabled) continue;
      const cost = z.area * m.precioLv;
      totalArea += z.area; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, area: round(z.area), costo: round(cost) });
    }
    return { totalArea: round(totalArea), totalCosto: round(totalCosto), detalle };
  }

  function calcOtros({ zonas, globals }) {
    let totalArea = 0, totalCosto = 0;
    const detalle = [];
    for (const z of zonas) {
      const m = getZoneMat(z, globals);
      if (!m.otEnabled) continue;
      const cost = z.area * m.precioOt;
      totalArea += z.area; totalCosto += cost;
      detalle.push({ zonaId: z.id, zonaNombre: z.nombre, area: round(z.area), costo: round(cost) });
    }
    return { totalArea: round(totalArea), totalCosto: round(totalCosto), detalle };
  }

  function calcAIU({ costoDirecto, adminPct, utPct, esForaneo }) {
    const pctA  = esForaneo ? 14 : (adminPct || 10);
    const admin = costoDirecto * (pctA / 100);
    const util  = (costoDirecto + admin) * ((utPct || 0) / 100);
    return {
      costoDirecto: round(costoDirecto),
      adminPct: pctA, adminCosto: round(admin),
      utPct: utPct || 0, utilidadCosto: round(util),
      totalConAIU: round(costoDirecto + admin + util),
    };
  }

  // ════════════════════════════════════════════════════════════
  //  FUNCIÓN ORQUESTADORA — equivalente al endpoint /api/calcular
  // ════════════════════════════════════════════════════════════

  function calcularTodo(payload) {
    const {
      zonas       = [],
      globals     = {},
      iva         = 0,
      waste_pct   = 5,
      enPct       = 100,
      moPct       = 100,
      juntaMet    = {},
      juntaConst  = {},
      jai         = {},
      corteJco    = {},
      proteccion  = {},
      refuerzo    = {},
      aiu         = {},
    } = payload || {};

    if (!Array.isArray(zonas) || zonas.length === 0) {
      return { ok: false, error: 'Se requiere al menos una zona con área > 0' };
    }

    try {
      const rConcreto    = calcConcreto   ({ zonas, globals, iva });
      const rFibra       = calcFibra      ({ zonas, globals, waste_pct });
      const rMicro       = calcMicro      ({ zonas, globals, waste_pct });
      const rProteccion  = calcProteccion ({ zonas, globals, precioKgPE: proteccion.precioKgPE || 0, precioKgGeo: proteccion.precioKgGeo || 0, iva });
      const rRefuerzo    = calcRefuerzo   ({ zonas, precioKg: refuerzo.precioKg || 0, iva });
      const rEndurecedor = calcEndurecedor({ zonas, globals, enPct, waste_pct });
      const rJuntaMet    = calcJuntaMet   ({ ...juntaMet, iva });
      const rJuntaConst  = calcJuntaConst ({ ...juntaConst, iva });
      const rJAI         = calcJAI        ({ ...jai, iva });
      const rCorteJco    = calcCorteJco   ({ ...corteJco, iva });
      const rManoObra    = calcManoObra   ({ zonas, globals, moPct });
      const rLavado      = calcLavado     ({ zonas, globals });
      const rOtros       = calcOtros      ({ zonas, globals });

      const costoDirecto =
        rConcreto.totalCosto   + rFibra.totalCosto      + rMicro.totalCosto    +
        rProteccion.totalCosto + rRefuerzo.totalCosto   + rEndurecedor.totalCosto +
        rJuntaMet.totalCosto   + rJuntaConst.totalCosto + rJAI.totalCosto      +
        rCorteJco.totalCosto   + rManoObra.totalCosto   + rLavado.totalCosto   +
        rOtros.totalCosto;

      const rAIU = calcAIU({ costoDirecto, ...aiu });

      return {
        ok: true,
        resultados: {
          concreto: rConcreto, fibra: rFibra, micro: rMicro,
          proteccion: rProteccion, refuerzo: rRefuerzo, endurecedor: rEndurecedor,
          juntaMet: rJuntaMet, juntaConst: rJuntaConst, jai: rJAI, corteJco: rCorteJco,
          manoObra: rManoObra, lavado: rLavado, otros: rOtros,
          aiu: rAIU,
        }
      };
    } catch (err) {
      console.error('[PISOCALC] Error en motor:', err);
      return { ok: false, error: 'Error interno del motor de cálculo: ' + err.message };
    }
  }

  // Exponer API pública
  global.PisocalcEngine = {
    calcularTodo,
    calcConcreto, calcFibra, calcMicro, calcProteccion, calcRefuerzo,
    calcEndurecedor, calcJuntaMet, calcJuntaConst, calcJAI, calcCorteJco,
    calcManoObra, calcLavado, calcOtros, calcAIU,
  };

})(typeof window !== 'undefined' ? window : this);
