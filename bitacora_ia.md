# Bitácora de uso de IA

Proyecto: Sistema Automatizado de Documentación de Código (JSDoc) con IA
Estudiante: Jhoan [apellido]
Funcionalidad: HU-01 Documentar un bloque de código con JSDoc (`documentarCodigo`)
Asistente usado: Claude (Anthropic), modo chat/agente

## Entradas

### Entrada 1

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** El asistente propuso que `documentarCodigo` reciba el cliente de IA como parámetro (`clienteIA.generar(prompt)`) en lugar de llamar a la API de Gemini dentro de la función, y usar un cliente falso en las pruebas.
- **Decisión:** Aceptada
- **Por qué:** Las pruebas no necesitan clave de API ni internet, son rápidas y no gastan cuota. Además evita tener claves cerca del código, como pide la regla de uso responsable.
- **Verificación:** `npm test` corre las 8 pruebas sin `.env` ni conexión. Con el cliente falso pude revisar que el prompt enviado contiene el código y la palabra «JSDoc».
- **Commit relacionado:** `9079106` Pruebas de HU-01 documentarCodigo (en rojo)

### Entrada 2

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** Para el commit en rojo, la primera versión subía solo el archivo de pruebas, sin `src/documentador.js`. Jest fallaba con «Cannot find module» y mostraba `0 total` pruebas.
- **Decisión:** Aceptada con cambios
- **Por qué:** Así no se veía cuáles pruebas fallaban. Agregué un esqueleto de la función que solo lanza `Error('No implementado')`, para que el historial muestre las 8 pruebas en rojo una por una.
- **Verificación:** `npx jest` mostró `Tests: 8 failed, 8 total` antes de implementar.
- **Commit relacionado:** `9079106` Pruebas de HU-01 documentarCodigo (en rojo)

### Entrada 3

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «Implementa `documentarCodigo` según el contrato del README para que pasen las pruebas de `tests/documentador.test.js`». El asistente generó la validación, el prompt estricto, la limpieza de cercas ```` ``` ```` y la comprobación de `/**`.
- **Decisión:** Aceptada con cambios
- **Por qué:** La validación de longitud usaba `codigo.length >= 10000`, que rechaza un código de exactamente 10.000 caracteres. El contrato dice que el umbral se acepta. Lo cambié a `> 10000`.
- **Verificación:** La prueba «acepta un código de exactamente 10.000 caracteres» falló (7 de 8 en verde). Tras el cambio pasaron las 8. No modifiqué ninguna prueba.
- **Commit relacionado:** `8fb27ec` Implementa documentarCodigo para HU-01 (pruebas en verde); corrige umbral > 10000

### Entrada 4

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** Opción de importar el SDK de Gemini y leer `process.env.GEMINI_API_KEY` directamente dentro de `documentarCodigo`.
- **Decisión:** Rechazada
- **Por qué:** Mezcla la lógica de la historia (validar, limpiar, comprobar JSDoc) con la conexión externa. Las pruebas necesitarían una clave real y dependerían de la respuesta de la IA, que cambia cada vez. La conexión con Gemini irá en un módulo aparte que implemente `generar(prompt)`.
- **Verificación:** Revisé que `src/` no tiene ninguna clave ni lectura de `.env`, y que `.env` está en `.gitignore` (solo se sube `.env.example` vacío).
- **Commit relacionado:** `46e4a27` Estructura inicial del proyecto y contrato de HU-01 en el README

### Entrada 5

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** «Refactoriza `documentarCodigo` sin cambiar su comportamiento: quita valores mágicos y divide la función». El asistente propuso las constantes `MAX_CARACTERES`, `INSTRUCCION_JSDOC`, `CERCA_INICIO`, `CERCA_FIN` y las funciones `validarCodigo`, `construirPrompt` y `limpiarRespuesta`.
- **Decisión:** Aceptada
- **Por qué:** El 10000 aparecía dos veces (en la condición y en el mensaje) y ahora está en un solo lugar. La función principal quedó en 6 líneas que se leen como los pasos de la historia.
- **Verificación:** `npm test` sigue en 8 de 8 y `git diff --stat tests` no muestra cambios en las pruebas.
- **Commit relacionado:** `c7e7e59` Refactor: extrae MAX_CARACTERES e INSTRUCCION_JSDOC…

### Entrada 6

- **Fecha:** 2026-11-07
- **Prompt o sugerencia:** Agregar una comprobación de que la respuesta de la IA contenga el código original exacto, para asegurar que la IA no lo modificó.
- **Decisión:** Rechazada
- **Por qué:** La IA a veces cambia espacios, saltos de línea o punto y coma sin cambiar el comportamiento, y esa regla rechazaría respuestas buenas. El contrato de HU-01 solo exige que haya un bloque `/** ... */` y que no haya cercas ni charla. Lo dejo anotado como posible historia futura.
- **Verificación:** Revisé el criterio de aceptación del README; las pruebas actuales cubren lo que pide el contrato.
- **Commit relacionado:** No aplica (no se implementó)

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas | 2 |
| Aceptadas con cambios | 2 |
| Rechazadas | 2 |

## Errores que atraparon las pruebas

La prueba `acepta un código de exactamente 10.000 caracteres (igual al umbral)` falló con la primera implementación del asistente. El código usaba `codigo.length >= 10000`, así que un código de 10.000 caracteres se rechazaba aunque el contrato dice que se acepta. Es el error típico de «uno de más» en un umbral. Lo corregí cambiando la condición a `> 10000`, sin tocar la prueba. La prueba vecina (10.001 caracteres se rechaza) siguió pasando, lo que confirma que el límite quedó justo donde dice el contrato.

## Reflexión final

El asistente me ayudó sobre todo a separar la lógica de la llamada a la IA: inyectar el cliente hizo que las pruebas fueran rápidas y sin claves.
También me ahorró tiempo en la limpieza de las cercas de Markdown y en el refactor.
Mis pruebas atraparon un error de umbral (`>=` en lugar de `>`) que a simple vista parecía correcto.
Si no hubiera escrito la prueba del caso límite exacto, ese error habría pasado a producción.
Aprendí que el asistente acierta en lo general pero falla en los detalles que el contrato define con precisión.
En la próxima funcionalidad escribiría también una prueba de integración con la API real de Gemini, aparte y opcional, y empezaría el commit en rojo con el esqueleto desde el inicio.
