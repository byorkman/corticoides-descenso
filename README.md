# Corticoides

Herramienta web para trabajar con corticoides en reumatología pediátrica. Pensada para usar desde el celular durante la consulta.

- **Equivalencias:** convierte una dosis entre prednisona, meprednisona, prednisolona, metilprednisolona, deflazacort, triamcinolona, dexametasona, betametasona e hidrocortisona.
- **Plan de descenso:** a partir de la dosis actual arma los pasos con fechas hasta suspender o hasta una dosis de mantenimiento. El texto se puede copiar, compartir por WhatsApp o imprimir para la familia.
- Con peso y talla muestra la dosis en mg/kg de prednisona equivalente y la dosis fisiológica aproximada (hidrocortisona 8 mg/m²/día), y marca los pasos que quedan por debajo.

**No guarda ni envía datos.** Todo se hace en el navegador.

> ⚠️ **Las equivalencias y los ritmos de descenso tienen que ser revisados por un médico antes de usarse con pacientes.**

## Ritmo de descenso sugerido

Se puede cambiar en la app para cada paciente. Los valores por defecto, en mg/día de la droga elegida:

| Si la dosis es mayor a | Bajar | Cada |
|---|---|---|
| 40 mg | 10 mg | 7 días |
| 20 mg | 5 mg | 7 días |
| 10 mg | 2,5 mg | 14 días |
| 0 mg | 1 mg | 14 días |

Al bajar, el plan no saltea el límite de un tramo: se detiene en él y sigue con el ritmo del tramo siguiente.

Las equivalencias y los tramos están en `src/corticoides.js`.

## Desarrollo

Sitio estático, sin dependencias ni compilación.

```sh
npm test               # pruebas
npx serve .            # o cualquier servidor estático para verlo localmente
```

## Versión

La versión se ve al pie de la página. En cada cambio:

1. Agregar arriba en [`CHANGELOG.md`](CHANGELOG.md) una entrada `## X.Y.Z · día mes año` con lo que cambió.
2. Poner el mismo número en `package.json` y el mismo texto (`vX.Y.Z · día mes año`) en el pie de `index.html`.

Se sube el último número para arreglos y textos, el del medio para funciones nuevas y el primero para cambios grandes. `npm test` avisa si los tres lugares no coinciden.

## Publicar en Vercel

En Vercel: **Add New → Project → Import** este repositorio, con Framework Preset **Other** y sin comando de build. Cada cambio que entre a `main` se publica solo.
