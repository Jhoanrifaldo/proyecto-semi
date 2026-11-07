# Sistema Automatizado de Documentación de Código (JSDoc) con IA

Proyecto final del Seminario de IA Aplicada al Ciclo de Vida del Software.

El sistema recibe un bloque de código JavaScript sin comentarios, lo envía a un modelo de IA (por ejemplo Gemini) con un prompt estricto y devuelve el **mismo código** con comentarios JSDoc encima (`@param`, `@returns`), sin texto extra. La idea es que VS Code muestre la documentación al pasar el ratón sobre la función sin tener que corregir nada.

## Estructura

```
jsdoc-ia/
├── src/documentador.js        # Funcionalidad de la semana 5
├── tests/documentador.test.js # Pruebas (Jest)
├── bitacora_ia.md             # Bitácora de uso de IA
├── .env.example               # Plantilla de variables de entorno (sin claves)
└── package.json
```

## Funcionalidad de la semana 5

### Historia de usuario

**HU-01 — Documentar un bloque de código con JSDoc** (prioridad Must)

> Como desarrollador, quiero enviar un bloque de código sin comentarios y recibirlo de vuelta documentado con JSDoc, sin texto adicional, para poder pegarlo directamente en mi editor.

**Criterio de aceptación**

- **Dado** un bloque de código JavaScript válido (no vacío y de máximo 10.000 caracteres),
  **cuando** lo envío al documentador,
  **entonces** recibo el código con al menos un bloque `/** ... */` y sin cercas de Markdown (```` ``` ````) ni texto de charla.
- **Escenario de error:** si el código está vacío, no es texto o supera los 10.000 caracteres, el sistema lo rechaza con un error claro **sin llamar a la IA**. Si la IA responde sin ningún bloque JSDoc, el sistema lanza un error en lugar de devolver una respuesta inválida.

### Contrato

```js
/**
 * @param {string} codigo       Bloque de código JavaScript a documentar.
 * @param {{ generar: (prompt: string) => Promise<string> }} clienteIA
 *        Cliente de IA. Recibe el prompt y devuelve el texto de la IA.
 * @returns {Promise<string>}   El código documentado con JSDoc, limpio.
 * @throws {TypeError}          Si `codigo` no es string.
 * @throws {Error}              Si `codigo` está vacío, supera 10.000 caracteres,
 *                              o la IA no devuelve un bloque JSDoc.
 */
async function documentarCodigo(codigo, clienteIA)
```

**Qué recibe**

- `codigo`: texto con el código a documentar. Se ignoran espacios al inicio y al final.
- `clienteIA`: objeto con un método `generar(prompt)`. En producción envuelve la API de Gemini; en las pruebas es un cliente falso, así las pruebas no gastan cuota ni necesitan clave.

**Qué devuelve**

- Una promesa con el código documentado: sin cercas ```` ```js ```` / ```` ``` ````, sin espacios sobrantes al inicio o al final, y que contiene al menos un bloque `/** ... */`.

**Supuestos**

- El código de entrada es JavaScript (o TypeScript sencillo).
- El prompt que se envía a la IA siempre incluye el código y la instrucción de usar JSDoc y no agregar texto extra.
- La clave de la API vive en una variable de entorno (`GEMINI_API_KEY`), nunca en el código.

**Casos límite**

| Caso | Resultado |
|---|---|
| Código con exactamente 10.000 caracteres | Se acepta |
| Código con 10.001 caracteres | Error, no se llama a la IA |
| Código vacío o solo espacios | Error, no se llama a la IA |
| La IA envuelve la respuesta en ```` ```javascript ```` | Se quitan las cercas |
| La IA responde sin `/**` | Error «La IA no devolvió documentación JSDoc» |

**Ejemplos de entrada y salida**

| # | Entrada `codigo` | Respuesta de la IA | Salida |
|---|---|---|---|
| 1 | `function sumar(a, b) { return a + b; }` | `/**\n * Suma dos números.\n * @param {number} a\n * @param {number} b\n * @returns {number}\n */\nfunction sumar(a, b) { return a + b; }` | La misma respuesta (ya está limpia) |
| 2 | `const doble = n => n * 2;` | ```` ```javascript\n/** Duplica n. @param {number} n @returns {number} */\nconst doble = n => n * 2;\n``` ```` | `/** Duplica n. @param {number} n @returns {number} */\nconst doble = n => n * 2;` |
| 3 | `"   "` | (no se llama) | Error: «El código no puede estar vacío» |
| 4 | `123` | (no se llama) | `TypeError`: «El código debe ser un texto (string)» |

### Cómo ejecutar las pruebas

Requisitos: Node.js 18 o superior.

```bash
npm install
npm test
```

Todas las pruebas corren con ese único comando y no necesitan clave de API ni conexión a internet.
