/** URL base de la API REST de Gemini (Google AI). */
const URL_BASE_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Modelo que se usa si no se define GEMINI_MODELO. */
const MODELO_POR_DEFECTO = 'gemini-2.5-flash';

/** Solo letras, números, punto, guion y guion bajo: evita alterar la ruta de la URL. */
const PATRON_MODELO = /^[\w.-]+$/;

/**
 * Extrae el texto de la respuesta JSON de Gemini.
 * @param {*} datos Cuerpo JSON devuelto por la API.
 * @returns {string} Texto generado por el modelo.
 * @throws {Error} Si la respuesta no tiene el formato esperado.
 */
function extraerTexto(datos) {
  const partes = datos?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(partes)) {
    throw new Error('Respuesta de Gemini con formato inesperado');
  }
  return partes.map((parte) => parte.text ?? '').join('');
}

/**
 * Crea un cliente de IA que cumple el contrato `generar(prompt)` usando Gemini.
 * La clave se envía en la cabecera `x-goog-api-key` y no en la URL, para que
 * no quede en registros ni en mensajes de error que muestren la URL.
 * @param {object} [config] Configuración. Por defecto se lee de variables de entorno.
 * @param {string} [config.apiKey] Clave de la API (por defecto `GEMINI_API_KEY`).
 * @param {string} [config.modelo] Modelo (por defecto `GEMINI_MODELO` o MODELO_POR_DEFECTO).
 * @param {typeof fetch} [config.fetch] Implementación de fetch (se inyecta en las pruebas).
 * @returns {{ generar: (prompt: string) => Promise<string> }} Cliente de IA.
 * @throws {Error} Si no hay clave o el nombre del modelo no es válido.
 */
function crearClienteGemini({
  apiKey = process.env.GEMINI_API_KEY,
  modelo = process.env.GEMINI_MODELO || MODELO_POR_DEFECTO,
  fetch: fetchHttp = globalThis.fetch,
} = {}) {
  if (!apiKey) {
    throw new Error('Falta la variable de entorno GEMINI_API_KEY (copia .env.example como .env)');
  }
  if (!PATRON_MODELO.test(modelo)) {
    throw new Error('El nombre del modelo de Gemini no es válido');
  }

  return {
    /**
     * Envía el prompt a Gemini y devuelve el texto generado.
     * @param {string} prompt Prompt completo.
     * @returns {Promise<string>} Texto del modelo.
     * @throws {Error} Si la API responde con un código HTTP de error o un formato inesperado.
     */
    async generar(prompt) {
      const respuesta = await fetchHttp(`${URL_BASE_GEMINI}/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!respuesta.ok) {
        throw new Error(`Gemini respondió con el estado HTTP ${respuesta.status}`);
      }
      return extraerTexto(await respuesta.json());
    },
  };
}

module.exports = { crearClienteGemini, MODELO_POR_DEFECTO };
