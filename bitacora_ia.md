# Bitácora de uso de IA

Proyecto: Sistema Automatizado de Documentación de Código (JSDoc) con IA
Estudiante: Jhoan rifaldo
Funcionalidad: HU-01 Documentar un bloque de código con JSDoc (`documentarCodigo`); semana 6: revisión de calidad y seguridad
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

### Entrada 7 — Semana 6: segunda revisión con IA

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Actúa como revisor de código y seguridad… entrega una tabla con archivo, línea, problema, categoría, severidad y corrección; separa problemas seguros de sospechas» (prompt completo en `revision_seguridad.md`, sección 3), sobre el código de la semana 5.
- **Decisión:** Aceptada con cambios
- **Por qué:** De 8 hallazgos, 5 eran reales (inyección de prompt, respuesta sin validar, sin tiempo límite, `clienteIA` sin validar y validación de salida débil) y 3 eran falsos positivos: ReDoS en las cercas, «clave expuesta» en `.env.example` (está vacío) y longitud medida antes de `trim()`. Además, la IA no encontró que los errores del cliente podían mostrar la URL con la clave.
- **Verificación:** Reproduje cada hallazgo real con una entrada concreta antes de corregirlo. Medí las expresiones regulares con 5 millones de caracteres (8 ms y 3 ms) para descartar el ReDoS, y busqué claves en todo el historial con `git log -p --all | grep`.
- **Commit relacionado:** `1b6712a`, `8946ac7`, `94a07a1`, `42fe683`, `1aefc85`

### Entrada 8 — Semana 6: corrección de inyección de prompt

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** El asistente propuso encerrar el código del usuario entre las marcas `<<<INICIO_CODIGO>>>` y `<<<FIN_CODIGO>>>` y decirle a la IA que trate ese contenido solo como datos.
- **Decisión:** Aceptada
- **Por qué:** Antes, un comentario como «Ignora las instrucciones anteriores» quedaba pegado a la instrucción. Con las marcas, la IA puede distinguir la orden de los datos. También se rechaza el código que trae las marcas, porque si no, el usuario podría «cerrar» el bloque y escribir instrucciones fuera de él.
- **Verificación:** 2 pruebas de abuso nuevas: el prompt tiene la instrucción antes de la marca de inicio y el código malicioso entre las marcas, y un código con `<<<FIN_CODIGO>>>` se rechaza sin llamar a la IA. Las 8 pruebas anteriores no se modificaron.
- **Commit relacionado:** `94a07a1`

### Entrada 9 — Semana 6: tiempo límite de la IA

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** «Agrega un tiempo límite a la llamada a la IA sin romper las pruebas». La primera versión distinguía el error de tiempo comparando el texto: `error.message.startsWith('La IA tardó más de')`.
- **Decisión:** Aceptada con cambios
- **Por qué:** Comparar el texto del mensaje es frágil: si cambio la redacción, el error de tiempo se convierte en «No se pudo obtener respuesta». Además falla si el cliente lanza algo que no es un `Error`. Lo cambié por una clase `TiempoAgotadoError` y `instanceof`.
- **Verificación:** La prueba con un cliente que nunca responde (`tiempoMaximoMs: 20`) da «La IA tardó más de 20 ms en responder». `npx jest --detectOpenHandles` no reporta temporizadores abiertos.
- **Commit relacionado:** `1aefc85`, `9c89b71`

### Entrada 10 — Semana 6: `npm audit fix --force`

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** `npm audit` reportó 6 avisos *low* por `deepmerge` (dentro de Jest) y sugirió `npm audit fix --force`.
- **Decisión:** Rechazada
- **Por qué:** Ese comando instala Jest 25.1.0, un cambio de versión mayor hacia atrás. `deepmerge` solo se usa en desarrollo para mezclar la configuración de Jest, que escribo yo, no un usuario. `npm audit --omit=dev` da 0 vulnerabilidades. Quedó justificado y como pendiente en el informe (H-10).
- **Verificación:** `npm ls --depth=0` muestra Jest 29.7.0 fijado y `npm audit --omit=dev` → `found 0 vulnerabilities`.
- **Commit relacionado:** `aa644b9` (fija versiones); no se aplicó el `--force`

### Entrada 11 — Semana 6: trabajo del agente de código

- **Fecha:** 2026-11-14
- **Prompt o sugerencia:** Le pedí a un agente de código (Claude) una tarea delimitada: «En una rama `semana6-revision`, configura ESLint con reglas de seguridad, corrige los hallazgos reales de la revisión (uno por commit, con prueba nueva para cada cambio de comportamiento), sin modificar las pruebas existentes, y escribe README, docstrings e informe».
- **Decisión:** Aceptada, después de revisar el diff
- **Por qué:** El agente trabajó solo en la rama. Revisé `git log main..semana6-revision` y el diff de cada commit antes de integrar. Comprobé que `git diff main -- tests/documentador.test.js` solo agrega pruebas al final y no cambia ninguna de las 8 originales.
- **Verificación:** En una carpeta limpia (`git clone` + `npm ci`): `npm test` → 25/25, `npm run lint` → 0 avisos, `npm run demo` funciona, y sin clave la CLI muestra un error claro. Con una clave falsa, el error no muestra la clave.
- **Commit relacionado:** merge de `semana6-revision` en `main`

## Resumen

| Decisión | Cantidad |
|---|---|
| Aceptadas | 4 |
| Aceptadas con cambios | 4 |
| Rechazadas | 3 |

(Semana 5: entradas 1–6. Semana 6: entradas 7–11.)

## Errores que atraparon las pruebas

La prueba `acepta un código de exactamente 10.000 caracteres (igual al umbral)` falló con la primera implementación del asistente. El código usaba `codigo.length >= 10000`, así que un código de 10.000 caracteres se rechazaba aunque el contrato dice que se acepta. Es el error típico de «uno de más» en un umbral. Lo corregí cambiando la condición a `> 10000`, sin tocar la prueba. La prueba vecina (10.001 caracteres se rechaza) siguió pasando, lo que confirma que el límite quedó justo donde dice el contrato.

## Reflexión final

El asistente me ayudó sobre todo a separar la lógica de la llamada a la IA: inyectar el cliente hizo que las pruebas fueran rápidas y sin claves.
También me ahorró tiempo en la limpieza de las cercas de Markdown y en el refactor.
Mis pruebas atraparon un error de umbral (`>=` en lugar de `>`) que a simple vista parecía correcto.
Si no hubiera escrito la prueba del caso límite exacto, ese error habría pasado a producción.
Aprendí que el asistente acierta en lo general pero falla en los detalles que el contrato define con precisión.
En la próxima funcionalidad escribiría también una prueba de integración con la API real de Gemini, aparte y opcional, y empezaría el commit en rojo con el esqueleto desde el inicio.

### Reflexión semana 6

La revisión con IA fue útil para encontrar problemas rápido, pero 3 de sus 8 hallazgos eran falsos positivos y no vio la fuga de la clave por los mensajes de error. Si hubiera copiado su tabla sin verificar, el informe habría tenido errores. Trabajar con el agente en una rama aparte y revisar su diff commit por commit me permitió aceptar los cambios sabiendo qué hacía cada uno.
