import { CORTICOIDES, TRAMOS, equivalencias, planDescenso, superficieCorporal, dosisFisiologica, convertir, textoPlan, fmtFecha, fmtDosis } from "./corticoides.js";

const $ = (id) => document.getElementById(id);
const opciones = CORTICOIDES.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join("");
$("eqDroga").innerHTML = opciones;
$("droga").innerHTML = opciones;
$("droga").value = "meprednisona";

const hoy = new Date();
$("inicio").value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

function numero(id) {
  const v = $(id).value.trim().replace(",", ".");
  return v === "" ? null : Number(v);
}

// ------------------------------------------------------------ Equivalencias
function actualizarEquivalencias() {
  const dosis = numero("eqDosis");
  const droga = $("eqDroga").value;
  if (!(dosis > 0)) {
    $("equivalencias").innerHTML = "";
    return;
  }
  $("equivalencias").innerHTML = equivalencias(dosis, droga).map((c) =>
    `<tr${c.id === droga ? ' class="actual"' : ""}><td>${c.nombre}</td><td>${fmtDosis(c.dosis)} mg</td></tr>`).join("");
}
$("eqDosis").addEventListener("input", actualizarEquivalencias);
$("eqDroga").addEventListener("change", actualizarEquivalencias);
actualizarEquivalencias();

// ------------------------------------------------------------------- Plan
function pintarTramos(tramos) {
  $("tramos").innerHTML = tramos.map((t, i) => `<tr>
    <td><input type="number" data-i="${i}" data-k="mayorA" value="${t.mayorA}" min="0" step="any" aria-label="Mayor a (mg)"> mg</td>
    <td><input type="number" data-i="${i}" data-k="baja" value="${t.baja}" min="0" step="any" aria-label="Bajar (mg)"> mg</td>
    <td><input type="number" data-i="${i}" data-k="cada" value="${t.cada}" min="1" step="1" aria-label="Cada (días)"> días</td>
  </tr>`).join("");
}
function leerTramos() {
  const tramos = TRAMOS.map((t) => ({ ...t }));
  for (const el of $("tramos").querySelectorAll("input")) {
    const v = Number(el.value.replace(",", "."));
    if (Number.isFinite(v)) tramos[el.dataset.i][el.dataset.k] = v;
  }
  return tramos;
}
pintarTramos(TRAMOS);
$("restaurar").addEventListener("click", () => {
  pintarTramos(TRAMOS);
  actualizarPlan();
});

function actualizarPlan() {
  const droga = $("droga").value;
  const dosis = numero("dosis");
  const [a, m, d] = ($("inicio").value || "").split("-").map(Number);
  const fechaInicio = a ? new Date(a, m - 1, d) : new Date();
  const pasos = planDescenso({
    dosisInicial: dosis,
    fechaInicio,
    tramos: leerTramos(),
    dosisFinal: numero("final") ?? 0,
    diasIniciales: numero("diasIniciales") ?? undefined,
  });

  const peso = numero("peso");
  const talla = numero("talla");
  const sc = peso > 0 && talla > 0 ? superficieCorporal(peso, talla) : null;
  const fisio = sc ? dosisFisiologica(sc, droga) : null;
  const resumen = [];
  if (dosis > 0 && peso > 0) {
    resumen.push(`Dosis actual: ${fmtDosis(convertir(dosis, droga, "prednisona") / peso)} mg/kg/día de prednisona equivalente.`);
  }
  if (fisio) resumen.push(`Dosis fisiológica aproximada: ${fmtDosis(fisio)} mg/día (hidrocortisona 8 mg/m²/día). Por debajo de ese valor, considerar el riesgo de insuficiencia suprarrenal si recibió corticoides por más de 2 a 4 semanas.`);
  if (pasos.length) {
    const ultimo = pasos.at(-1);
    const fin = ultimo.hasta ?? ultimo.desde;
    resumen.push(`${pasos.length} pasos, hasta el ${fmtFecha(fin)}.`);
  }
  $("resumen").innerHTML = resumen.map((r) => `<p class="nota">${r}</p>`).join("");

  $("pasos").innerHTML = pasos.map((p) => {
    const bajoFisio = fisio && p.dosis <= fisio ? ' <span class="marca">≤ fisiológica</span>' : "";
    const cuando = p.hasta ? `${fmtFecha(p.desde)} al ${fmtFecha(p.hasta)}` : `desde ${fmtFecha(p.desde)}`;
    return `<li><b>${fmtDosis(p.dosis)} mg/día</b>${bajoFisio}<span>${cuando}${p.dias ? ` · ${p.dias} días` : ""}</span></li>`;
  }).join("");

  $("salida").hidden = !pasos.length;
  $("texto").value = pasos.length ? textoPlan(pasos, droga) : "";
  $("estado").textContent = "";
}
$("form").addEventListener("input", actualizarPlan);
$("form").addEventListener("change", actualizarPlan);
actualizarPlan();

// --------------------------------------------------------------- Acciones
$("copiar").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("texto").value);
    $("estado").textContent = "Plan copiado.";
  } catch {
    $("estado").textContent = "No se pudo copiar.";
  }
});
$("compartir").addEventListener("click", async () => {
  if (!navigator.share) {
    $("estado").textContent = "Este navegador no permite compartir: usar Copiar.";
    return;
  }
  try {
    await navigator.share({ text: $("texto").value });
  } catch {
    // Compartir cancelado.
  }
});
$("imprimir").addEventListener("click", () => {
  $("impresion").textContent = $("texto").value;
  window.print();
});
