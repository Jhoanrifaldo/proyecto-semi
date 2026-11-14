# Revisión de código y seguridad — Semana 6

Proyecto: Sistema Automatizado de Documentación de Código (JSDoc) con IA
Estudiante: Jhoan Rifaldo
Código revisado: estado de la semana 5 (commit `b29674a`), archivos `src/documentador.js`, `tests/`, `package.json`, `.env.example`, `.gitignore`.
Fecha: 2026-11-14

## 1. Herramientas y criterios usados

| Herramienta | Uso | Resultado |
|---|---|---|
| **ESLint 9** + `@eslint/js` (recommended) + **eslint-plugin-security** (recommended) | Equivalente en JavaScript a `ruff --select E,F,B,S`: errores, errores probables y patrones inseguros de Node.js. Configuración en `eslint.config.js` (el proyecto es Node, no Python, así que no usa `pyproject.toml`). Se ejecuta con `npm run lint`. | 0 avisos en `src/` y `tests/`. |
| `npm audit` | Equivalente de `pip-audit` para dependencias npm. | 6 avisos *low* solo en dependencias de desarrollo (ver H-10); 0 en producción (`npm audit --omit=dev`). |
| `git log -p --all \| grep -nE "AIza…\|sk-…\|GEMINI_API_KEY=.+"` | Buscar claves en todo el historial de Git. | Sin coincidencias. |
| Jest | Todas las pruebas antes y después de cada corrección. | Semana 5: 8/8. Ahora: 25/25 (17 nuevas, ninguna prueba anterior modificada). |
| Segunda revisión con IA (Claude) | Prompt de revisión de la semana (sección 3). | 8 hallazgos: 5 reales, 3 falsos positivos. |

**Avisos del linter justificados (no corregidos):**

- `security/detect-non-literal-fs-filename` en `src/cli.js` (lectura del archivo a documentar): la ruta la escribe el propio usuario en su consola y no llega de la red; además se valida que exista, sea archivo y no supere el tamaño máximo. Se desactivó solo en esas dos líneas con un comentario que explica el porqué.
- La carpeta `ejemplos/` se excluye del linter porque son archivos de entrada para documentar (funciones de ejemplo que nadie llama), no código del proyecto.

**Lista de revisión de seguridad (5 puntos):**

| Punto | ¿Aplica? | Resultado |
|---|---|---|
| Inyección | Sí, pero no SQL: el proyecto **no tiene base de datos**. El equivalente es la **inyección de prompt**: el código del usuario se pegaba directamente después de la instrucción. | Corregido (H-01). |
| Secretos | Sí (`GEMINI_API_KEY`). | No hay claves en el código ni en el historial. `.env` y `.env.*` están en `.gitignore`, excepto `.env.example`, que solo tiene variables vacías. La clave nunca se subió, así que no hubo que rotarla. Además, la clave ahora viaja en una cabecera y no en la URL, y los errores no la exponen (H-05). |
| Contraseñas | **No aplica**: el sistema no tiene usuarios ni guarda contraseñas. | — |
| Control de acceso | **No aplica por ahora**: es una herramienta local (CLI y módulo) sin usuarios ni roles; quien la ejecuta usa su propia clave. Se agregaron *pruebas de abuso* para las entradas que sí controla un atacante: código que intenta escapar de las marcas del prompt y nombre de modelo que intenta alterar la URL. | Pendiente cuando exista la API HTTP (sección 4). |
| Dependencias | Sí. | Todas existen en npm, son necesarias (jest, eslint y sus plugins) y ahora tienen versión exacta. `npm audit`: ver H-10. |

## 2. Tabla de hallazgos

Las líneas se refieren al código de la semana 5 (`b29674a`). Origen: L = linter/auditoría, C = lista de revisión, IA = segunda revisión con IA.

| ID | Archivo:línea | Problema | Categoría | Severidad | Origen | Corrección | Commit |
|---|---|---|---|---|---|---|---|
| H-01 | `src/documentador.js:38` | El código del usuario se concatena al prompt sin separación: un comentario como «Ignora las instrucciones anteriores…» puede cambiar lo que hace la IA. | Inyección (prompt) | Alta | C, IA | El código va entre `<<<INICIO_CODIGO>>>` y `<<<FIN_CODIGO>>>`, la instrucción le dice a la IA que lo trate como datos, y se rechaza un código que contenga las marcas. 2 pruebas de abuso. | `94a07a1` |
| H-02 | `src/documentador.js:47` | Si la IA devuelve `undefined`, un objeto o texto vacío, falla con `respuesta.trim is not a function`. | Validación de entrada | Media | IA | `validarRespuesta`: error claro «La IA devolvió una respuesta vacía o inválida». | `8946ac7` |
| H-03 | `src/documentador.js:61` | Llamada a la IA sin tiempo límite: si la API se cuelga, el programa espera para siempre. | Disponibilidad | Media | IA | `TIEMPO_MAXIMO_MS = 30000` (configurable) con `Promise.race` y `TiempoAgotadoError`. | `1aefc85`, `9c89b71` |
| H-04 | `src/documentador.js:61` | No se valida `clienteIA`; sin `generar` el error es `Cannot read properties of undefined`. | Validación de entrada | Baja | IA | `validarClienteIA` lanza `TypeError` claro. | `1b6712a` |
| H-05 | `src/documentador.js:61` | Los errores del cliente de IA llegan crudos al usuario. Con la API REST de Gemini la clave puede ir en la URL (`?key=…`), y un error de red puede mostrar esa URL. | Fuga de información / secretos | Media | C (la IA no lo encontró) | `pedirRespuestaIA` lanza «No se pudo obtener respuesta de la IA» y guarda el original en `error.cause`. El nuevo cliente de Gemini envía la clave en la cabecera `x-goog-api-key`. | `42fe683`, `4b59c1f` |
| H-06 | `src/documentador.js:11-12` | Las cercas con saltos de Windows (`\r\n`) o con espacio tras el lenguaje no se quitan: la salida quedaba con ```` ```js ```` al inicio. Se reprodujo antes de corregir. | Corrección funcional | Baja | C (prueba manual) | Expresiones `^```[\w-]*[ \t]*\r?\n` y `\r?\n```$`. | `30c67a5` |
| H-07 | `src/documentador.js:20-30, 64` | Refactor pedido por la revisión: se comparaba el texto de un mensaje para distinguir el error de tiempo; el `'/**'` era un valor mágico; la función principal crecía. | Mantenibilidad | Baja | C | Clase `TiempoAgotadoError`, constante `INICIO_JSDOC`, función `validarJSDoc`. `documentarCodigo` queda como lista de pasos. | `9c89b71` |
| H-08 | (proyecto) | No había linter configurado. | Calidad | Baja | L | ESLint 9 + eslint-plugin-security, script `npm run lint`. | `fc25efd` |
| H-09 | `package.json:12` | `jest` con rango `^29.7.0`: una instalación nueva puede traer otra versión. | Dependencias | Baja | C | Versión exacta `29.7.0`; las nuevas dependencias también se fijaron exactas. | `aa644b9` |
| H-10 | `package-lock.json` | `npm audit`: `deepmerge` (GHSA-gcqx-w48m-w2h4, *prototype pollution*), dependencia interna de Jest. | Dependencias | Baja | L | **No corregido, justificado:** solo está en desarrollo (no llega a producción), mezcla la configuración de Jest, que escribo yo y no viene de usuarios, y el arreglo automático baja Jest a la 25 (cambio mayor). Se revisará al actualizar Jest. | — |

## 3. Revisión con IA

**Prompt usado** (sobre `src/documentador.js`, `package.json` y `.env.example` de la semana 5):

> Actúa como revisor de código y seguridad. Revisa el código adjunto con estos criterios: inyección (incluida la inyección de prompt), secretos, validación de entradas y salidas, manejo de errores, dependencias y legibilidad. Entrega una tabla con: archivo, línea, problema, categoría, severidad (alta/media/baja) y corrección sugerida. Separa en dos tablas los **problemas seguros** (los puedes demostrar con una entrada concreta) y las **sospechas** (necesitan verificación). No inventes líneas: si no estás seguro, ponlo como sospecha.

**Hallazgos de la IA y verificación:**

| # | Hallazgo de la IA (línea) | Tipo según la IA | Cómo lo verifiqué | Clasificación |
|---|---|---|---|---|
| IA-1 | Inyección de prompt en `construirPrompt` (38) | Seguro | Prueba con un comentario «Ignora las instrucciones anteriores…»: llegaba pegado a la instrucción sin separación. | **Real** → H-01 |
| IA-2 | `respuesta.trim()` sin validar tipo (47) | Seguro | Cliente falso que devuelve `undefined` → `TypeError: respuesta.trim is not a function`. | **Real** → H-02 |
| IA-3 | Sin tiempo límite en `generar` (61) | Seguro | Cliente que nunca responde: la promesa nunca se resolvía. | **Real** → H-03 |
| IA-4 | `clienteIA` sin validar (61) | Seguro | `documentarCodigo(cod, undefined)` → `Cannot read properties of undefined`. | **Real** → H-04 |
| IA-5 | ReDoS en `CERCA_INICIO` y `CERCA_FIN` (11-12) | Sospecha | Son expresiones ancladas con un solo cuantificador, sin anidar, así que no hay retroceso exponencial. Medido con 5 millones de caracteres: 8 ms y 3 ms. | **Falso positivo** |
| IA-6 | «Clave de API expuesta» en `.env.example` (2) | Sospecha | `GEMINI_API_KEY=` está vacío, y la búsqueda en el historial no encontró ninguna clave. | **Falso positivo** |
| IA-7 | `codigo.length` se mide antes de `trim()` (27) | Sospecha | El límite se aplica al texto que se envía a la IA, que incluye los espacios. Es coherente con el contrato y con las pruebas de 10.000 y 10.001 caracteres. | **Falso positivo** |
| IA-8 | La salida solo se valida con `includes('/**')` (64): la IA podría cambiar el código además de documentarlo | Sospecha | Es cierto: la IA podría devolver código distinto. Comparar el código exacto rechaza respuestas válidas (ver bitácora, entrada 6). | **Real, no corregido** → pendiente |

**Lo que la IA no encontró:** la **fuga de información por errores crudos** (H-05). La IA revisó la función como si el cliente fuera de confianza y no pensó en qué contiene el mensaje de error de una petición HTTP real. Tampoco vio el fallo de las cercas con `\r\n` (H-06), que salió de una prueba manual con una respuesta tipo Windows, ni el rango `^` de Jest (H-09).

## 4. Pendientes

1. **Validar que la IA no cambió el código (IA-8):** comparar el código sin comentarios ni espacios de la entrada y de la salida (por ejemplo, con un tokenizador como `acorn`) en lugar de comparar el texto exacto. Mientras tanto, el usuario revisa el diff en su editor antes de aceptar.
2. **API HTTP centralizada:** cuando el módulo se exponga como API, se necesitará autenticación (token por usuario), límite de peticiones por usuario (cada llamada gasta cuota de Gemini) y pruebas de abuso de acceso sin token.
3. **`deepmerge` (H-10):** volver a correr `npm audit` al actualizar Jest a una versión que lo corrija.
4. **Prueba de integración opcional con Gemini real**, separada de `npm test`, para comprobar el modelo por defecto (`gemini-2.5-flash`), que puede cambiar con el tiempo (se configura con `GEMINI_MODELO`).
