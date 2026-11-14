const { crearClienteGemini } = require('../src/clienteGemini');

/**
 * Crea un fetch falso que guarda las peticiones y responde lo indicado.
 * @param {{ ok?: boolean, status?: number, cuerpo?: * }} respuesta Respuesta simulada.
 * @returns {Function & { llamadas: Array<[string, object]> }}
 */
function crearFetchFalso({ ok = true, status = 200, cuerpo = {} } = {}) {
  const llamadas = [];
  const fetchFalso = async (url, opciones) => {
    llamadas.push([url, opciones]);
    return { ok, status, json: async () => cuerpo };
  };
  fetchFalso.llamadas = llamadas;
  return fetchFalso;
}

const CUERPO_OK = { candidates: [{ content: { parts: [{ text: '/** hola */' }] } }] };

describe('crearClienteGemini', () => {
  test('lanza error si no hay clave de API', () => {
    expect(() => crearClienteGemini({ apiKey: '', fetch: crearFetchFalso() })).toThrow(
      /GEMINI_API_KEY/
    );
  });

  test('envía la clave en la cabecera y no en la URL', async () => {
    const fetchFalso = crearFetchFalso({ cuerpo: CUERPO_OK });
    const cliente = crearClienteGemini({ apiKey: 'CLAVE_PRUEBA', modelo: 'gemini-x', fetch: fetchFalso });

    await cliente.generar('prompt');

    const [url, opciones] = fetchFalso.llamadas[0];
    expect(url).not.toContain('CLAVE_PRUEBA');
    expect(url).toContain('/gemini-x:generateContent');
    expect(opciones.headers['x-goog-api-key']).toBe('CLAVE_PRUEBA');
    expect(JSON.parse(opciones.body).contents[0].parts[0].text).toBe('prompt');
  });

  test('devuelve el texto generado por el modelo', async () => {
    const cliente = crearClienteGemini({ apiKey: 'k', fetch: crearFetchFalso({ cuerpo: CUERPO_OK }) });

    await expect(cliente.generar('p')).resolves.toBe('/** hola */');
  });

  test('si la API responde con error HTTP, el mensaje no incluye la clave', async () => {
    const cliente = crearClienteGemini({
      apiKey: 'CLAVE_PRUEBA',
      fetch: crearFetchFalso({ ok: false, status: 403 }),
    });

    const promesa = cliente.generar('p');
    await expect(promesa).rejects.toThrow('Gemini respondió con el estado HTTP 403');
    await expect(promesa).rejects.not.toThrow(/CLAVE_PRUEBA/);
  });

  test('lanza error si la respuesta no tiene el formato esperado', async () => {
    const cliente = crearClienteGemini({ apiKey: 'k', fetch: crearFetchFalso({ cuerpo: {} }) });

    await expect(cliente.generar('p')).rejects.toThrow('Respuesta de Gemini con formato inesperado');
  });

  test('rechaza un nombre de modelo que intenta alterar la URL (abuso)', () => {
    expect(() =>
      crearClienteGemini({ apiKey: 'k', modelo: '../../otra-ruta?x=', fetch: crearFetchFalso() })
    ).toThrow('El nombre del modelo de Gemini no es válido');
  });
});
