// Equivalencias de corticoides y esquema de descenso. ESTOS VALORES DEBEN
// SER REVISADOS POR EL MÉDICO ANTES DE USAR LA HERRAMIENTA CON PACIENTES.

// mg de cada droga equivalentes a 5 mg de prednisona (potencia antiinflamatoria).
export const CORTICOIDES = [
  { id: "prednisona", nombre: "Prednisona", equivalente: 5 },
  { id: "meprednisona", nombre: "Meprednisona", equivalente: 4 },
  { id: "prednisolona", nombre: "Prednisolona", equivalente: 5 },
  { id: "metilprednisolona", nombre: "Metilprednisolona", equivalente: 4 },
  { id: "deflazacort", nombre: "Deflazacort", equivalente: 6 },
  { id: "triamcinolona", nombre: "Triamcinolona", equivalente: 4 },
  { id: "dexametasona", nombre: "Dexametasona", equivalente: 0.75 },
  { id: "betametasona", nombre: "Betametasona", equivalente: 0.6 },
  { id: "hidrocortisona", nombre: "Hidrocortisona", equivalente: 20 },
];

const porId = (id) => {
  const c = CORTICOIDES.find((x) => x.id === id);
  if (!c) throw new Error(`Corticoide desconocido: ${id}`);
  return c;
};

const redondear = (x, paso = 0.01) => Math.round(x / paso) * paso;

// Convierte una dosis entre dos corticoides.
export function convertir(dosis, de, a) {
  return redondear((dosis / porId(de).equivalente) * porId(a).equivalente);
}

// Dosis equivalente en todas las drogas de la lista.
export function equivalencias(dosis, de) {
  return CORTICOIDES.map((c) => ({ ...c, dosis: convertir(dosis, de, c.id) }));
}

// Superficie corporal (Mosteller), en m².
export function superficieCorporal(pesoKg, tallaCm) {
  return Math.sqrt((pesoKg * tallaCm) / 3600);
}

// Dosis fisiológica aproximada: hidrocortisona 8 mg/m²/día, expresada en la droga pedida.
export function dosisFisiologica(sc, droga) {
  return convertir(8 * sc, "hidrocortisona", droga);
}

// Tramos por defecto, en mg/día de la droga elegida. Mientras la dosis sea
// mayor que "mayorA", se baja "baja" mg cada "cada" días.
export const TRAMOS = [
  { mayorA: 40, baja: 10, cada: 7 },
  { mayorA: 20, baja: 5, cada: 7 },
  { mayorA: 10, baja: 2.5, cada: 14 },
  { mayorA: 0, baja: 1, cada: 14 },
];

const MAX_PASOS = 200;

// Arma el esquema de descenso desde dosisInicial hasta dosisFinal (0 = suspender).
// Cada paso: { dosis, dias, desde, hasta } con fechas como Date (hora local).
// Al bajar nunca se saltea el límite de un tramo: se para en él y sigue con
// el ritmo del tramo siguiente.
export function planDescenso({ dosisInicial, fechaInicio, tramos = TRAMOS, dosisFinal = 0, diasIniciales }) {
  if (!(dosisInicial > 0)) return [];
  const orden = [...tramos].filter((t) => t.baja > 0 && t.cada > 0).sort((a, b) => b.mayorA - a.mayorA);
  const pasos = [];
  let dosis = redondear(dosisInicial);
  let fecha = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
  const agregar = (d, dias) => {
    const hasta = new Date(fecha);
    hasta.setDate(hasta.getDate() + dias - 1);
    pasos.push({ dosis: d, dias, desde: new Date(fecha), hasta });
    fecha = new Date(hasta);
    fecha.setDate(fecha.getDate() + 1);
  };
  while (dosis > dosisFinal && pasos.length < MAX_PASOS) {
    const tramo = orden.find((t) => dosis > t.mayorA);
    if (!tramo) break;
    agregar(dosis, pasos.length === 0 && diasIniciales > 0 ? diasIniciales : tramo.cada);
    dosis = redondear(Math.max(dosis - tramo.baja, tramo.mayorA, dosisFinal));
  }
  if (dosisFinal > 0) pasos.push({ dosis: redondear(dosisFinal), dias: null, desde: new Date(fecha), hasta: null });
  return pasos;
}

const fmtFecha = (d) => d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDosis = (n) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

// Texto del plan para copiar, compartir o imprimir.
export function textoPlan(pasos, droga) {
  const nombre = porId(droga).nombre;
  const lineas = pasos.map((p) => {
    if (p.hasta === null) return `Desde el ${fmtFecha(p.desde)}: ${fmtDosis(p.dosis)} mg por día y seguir así hasta el próximo control.`;
    return `Del ${fmtFecha(p.desde)} al ${fmtFecha(p.hasta)}: ${fmtDosis(p.dosis)} mg por día.`;
  });
  const ultimo = pasos.at(-1);
  if (ultimo && ultimo.hasta !== null) {
    const fin = new Date(ultimo.hasta);
    fin.setDate(fin.getDate() + 1);
    lineas.push(`Desde el ${fmtFecha(fin)}: no tomar más ${nombre.toLowerCase()}.`);
  }
  return [`Plan de descenso de ${nombre}`, "Tomar la dosis una vez por día, a la mañana, con comida.", "", ...lineas, "", "No suspender de golpe. Ante fiebre, vómitos, decaimiento o una cirugía, consultar."].join("\n");
}

export { fmtFecha, fmtDosis };
