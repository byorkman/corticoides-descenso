import { test } from "node:test";
import assert from "node:assert/strict";
import { CORTICOIDES, TRAMOS, convertir, equivalencias, planDescenso, superficieCorporal, dosisFisiologica, textoPlan } from "../src/corticoides.js";

test("equivalencias clásicas con prednisona", () => {
  assert.equal(convertir(5, "prednisona", "metilprednisolona"), 4);
  assert.equal(convertir(5, "prednisona", "dexametasona"), 0.75);
  assert.equal(convertir(40, "prednisona", "meprednisona"), 32);
  assert.equal(convertir(20, "hidrocortisona", "prednisona"), 5);
  assert.equal(convertir(6, "deflazacort", "prednisona"), 5);
});

test("equivalencias devuelve una fila por droga", () => {
  const r = equivalencias(10, "prednisona");
  assert.equal(r.length, CORTICOIDES.length);
  assert.equal(r.find((c) => c.id === "prednisona").dosis, 10);
});

test("el descenso sigue los tramos y termina en cero", () => {
  const pasos = planDescenso({ dosisInicial: 60, fechaInicio: new Date(2026, 9, 16) });
  const dosis = pasos.map((p) => p.dosis);
  assert.deepEqual(dosis.slice(0, 6), [60, 50, 40, 35, 30, 25]);
  assert.ok(dosis.includes(20) && dosis.includes(10));
  assert.equal(dosis.at(-1), 1);
  assert.equal(pasos[0].dias, 7);
  assert.equal(pasos.at(-1).dias, 14);
});

test("no saltea el límite de un tramo", () => {
  const dosis = planDescenso({ dosisInicial: 45, fechaInicio: new Date(2026, 0, 1) }).map((p) => p.dosis);
  assert.deepEqual(dosis.slice(0, 3), [45, 40, 35]);
});

test("las fechas son consecutivas y sin huecos", () => {
  const pasos = planDescenso({ dosisInicial: 20, fechaInicio: new Date(2026, 9, 25) });
  assert.equal(pasos[0].desde.getDate(), 25);
  for (let i = 1; i < pasos.length; i++) {
    const esperado = new Date(pasos[i - 1].hasta);
    esperado.setDate(esperado.getDate() + 1);
    assert.equal(pasos[i].desde.getTime(), esperado.getTime());
  }
});

test("los días iniciales cambian solo el primer paso", () => {
  const pasos = planDescenso({ dosisInicial: 30, fechaInicio: new Date(2026, 9, 16), diasIniciales: 28 });
  assert.equal(pasos[0].dias, 28);
  assert.equal(pasos[1].dias, 7);
});

test("con dosis final de mantenimiento el último paso no tiene fin", () => {
  const pasos = planDescenso({ dosisInicial: 20, fechaInicio: new Date(2026, 9, 16), dosisFinal: 5 });
  const ultimo = pasos.at(-1);
  assert.equal(ultimo.dosis, 5);
  assert.equal(ultimo.hasta, null);
  assert.ok(pasos.slice(0, -1).every((p) => p.dosis > 5));
});

test("tramos personalizados", () => {
  const pasos = planDescenso({ dosisInicial: 10, fechaInicio: new Date(2026, 9, 16), tramos: [{ mayorA: 0, baja: 5, cada: 3 }] });
  assert.deepEqual(pasos.map((p) => p.dosis), [10, 5]);
});

test("sin dosis no hay plan y los tramos por defecto son válidos", () => {
  assert.deepEqual(planDescenso({ dosisInicial: 0, fechaInicio: new Date() }), []);
  assert.ok(TRAMOS.some((t) => t.mayorA === 0));
});

test("superficie corporal y dosis fisiológica", () => {
  const sc = superficieCorporal(30, 130);
  assert.ok(Math.abs(sc - 1.04) < 0.01);
  assert.equal(dosisFisiologica(1, "prednisona"), 2);
});

test("el texto del plan termina indicando la suspensión", () => {
  const pasos = planDescenso({ dosisInicial: 2, fechaInicio: new Date(2026, 9, 16) });
  const t = textoPlan(pasos, "meprednisona");
  assert.match(t, /^Plan de descenso de Meprednisona/);
  assert.match(t, /no tomar más meprednisona/);
});
