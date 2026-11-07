/**
 * Documenta un bloque de código con JSDoc usando un cliente de IA.
 * @param {string} codigo Bloque de código JavaScript a documentar.
 * @param {{ generar: (prompt: string) => Promise<string> }} clienteIA Cliente de IA.
 * @returns {Promise<string>} El código documentado con JSDoc, sin texto extra.
 * @throws {TypeError} Si `codigo` no es string.
 * @throws {Error} Si `codigo` está vacío, es muy largo o la IA no devuelve JSDoc.
 */
async function documentarCodigo(codigo, clienteIA) {
  if (typeof codigo !== 'string') {
    throw new TypeError('El código debe ser un texto (string)');
  }
  if (codigo.trim().length === 0) {
    throw new Error('El código no puede estar vacío');
  }
  if (codigo.length > 10000) {
    throw new Error('El código supera el máximo de 10000 caracteres');
  }

  const prompt =
    'Eres un generador de documentación. Analiza el siguiente código y agrega ' +
    'comentarios técnicos usando el estándar JSDoc (@param, @returns). ' +
    'Devuelve únicamente el código documentado, sin explicaciones ni texto extra.\n\n' +
    codigo;

  let respuesta = await clienteIA.generar(prompt);

  respuesta = respuesta.trim();
  if (respuesta.startsWith('```')) {
    respuesta = respuesta.replace(/^```\w*\n/, '').replace(/\n```$/, '');
  }
  respuesta = respuesta.trim();

  if (!respuesta.includes('/**')) {
    throw new Error('La IA no devolvió documentación JSDoc');
  }

  return respuesta;
}

module.exports = { documentarCodigo };
