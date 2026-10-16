import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (archivo) => readFileSync(new URL(`../${archivo}`, import.meta.url), "utf8");

test("la versión coincide en CHANGELOG.md, package.json y el pie de la página", () => {
  const [, version, fecha] = leer("CHANGELOG.md").match(/^## (\d+\.\d+\.\d+) · (.+)$/m);
  assert.equal(JSON.parse(leer("package.json")).version, version);
  assert.ok(leer("index.html").includes(`>v${version} · ${fecha}<`), "index.html no muestra la versión del CHANGELOG");
});
