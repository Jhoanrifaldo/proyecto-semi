/** Cantidad máxima de caracteres que se aceptan para documentar. */
const MAX_CARACTERES = 10000;

/** Instrucción fija (prompt estricto) que se envía a la IA antes del código. */
const INSTRUCCION_JSDOC =
  'Eres un generador de documentación. Analiza el siguiente código y agrega ' +
  'comentarios técnicos usando el estándar JSDoc (@param, @returns). ' +
  'Devuelve únicamente el código documentado, sin explicaciones ni texto extra.';

/** Cerca de Markdown al inicio (``` o ```js / ```javascript) y al final. */
const CERCA_INICIO = /^```\w*\n/;
const CERCA_FIN = /\n```$/;

/**
 * Comprueba que el código sea un texto no vacío y dentro del límite.
 * @param {*} codigo Valor recibido.
 * @throws {TypeError} Si no es string.
 * @throws {Error} Si está vacío o supera MAX_CARACTERES.
 */
function validarCodigo(codigo) {
  if (typeof codigo !== 'string') {
    throw new TypeError('El código debe ser un texto (string)');
  }
  if (codigo.trim().length === 0) {
    throw new Error('El código no puede estar vacío');
  }
  if (codigo.length > MAX_CARACTERES) {
    throw new Error(`El código supera el máximo de ${MAX_CARACTERES} caracteres`);
  }
}

/**
 * Comprueba que el cliente de IA tenga un método `generar(prompt)`.
 * @param {*} clienteIA Valor recibido como cliente de IA.
 * @throws {TypeError} Si no es un objeto con el método `generar`.
 */
function validarClienteIA(clienteIA) {
  if (!clienteIA || typeof clienteIA.generar !== 'function') {
    throw new TypeError('El cliente de IA debe tener un método generar(prompt)');
  }
}

/**
 * Arma el prompt que se envía a la IA.
 * @param {string} codigo Código a documentar.
 * @returns {string} Instrucción fija seguida del código.
 */
function construirPrompt(codigo) {
  return `${INSTRUCCION_JSDOC}\n\n${codigo}`;
}

/**
 * Comprueba que la IA haya devuelto un texto no vacío.
 * @param {*} respuesta Valor devuelto por `clienteIA.generar`.
 * @throws {Error} Si la respuesta no es un string o está vacía.
 */
function validarRespuesta(respuesta) {
  if (typeof respuesta !== 'string' || respuesta.trim().length === 0) {
    throw new Error('La IA devolvió una respuesta vacía o inválida');
  }
}

/**
 * Quita espacios sobrantes y las cercas de Markdown que a veces agrega la IA.
 * @param {string} respuesta Texto devuelto por la IA.
 * @returns {string} Respuesta limpia.
 */
function limpiarRespuesta(respuesta) {
  return respuesta.trim().replace(CERCA_INICIO, '').replace(CERCA_FIN, '').trim();
}

/**
 * Documenta un bloque de código con JSDoc usando un cliente de IA.
 * @param {string} codigo Bloque de código JavaScript a documentar.
 * @param {{ generar: (prompt: string) => Promise<string> }} clienteIA Cliente de IA.
 * @returns {Promise<string>} El código documentado con JSDoc, sin texto extra.
 * @throws {TypeError} Si `codigo` no es string.
 * @throws {Error} Si `codigo` está vacío, es muy largo o la IA no devuelve JSDoc.
 */
async function documentarCodigo(codigo, clienteIA) {
  validarCodigo(codigo);
  validarClienteIA(clienteIA);

  const respuesta = await clienteIA.generar(construirPrompt(codigo));
  validarRespuesta(respuesta);
  const documentado = limpiarRespuesta(respuesta);

  if (!documentado.includes('/**')) {
    throw new Error('La IA no devolvió documentación JSDoc');
  }
  return documentado;
}

module.exports = { documentarCodigo, MAX_CARACTERES };
