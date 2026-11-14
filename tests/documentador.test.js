const { documentarCodigo } = require('../src/documentador');

/**
 * Crea un cliente de IA falso que siempre responde el texto indicado
 * y guarda los prompts que recibe, para revisar qué se le envió.
 * @param {string} respuesta Texto que devolverá la "IA".
 * @returns {{ generar: Function, prompts: string[] }}
 */
function crearClienteFalso(respuesta) {
  const prompts = [];
  return {
    prompts,
    generar: async (prompt) => {
      prompts.push(prompt);
      return respuesta;
    },
  };
}

const CODIGO_SUMAR = 'function sumar(a, b) { return a + b; }';
const SUMAR_DOCUMENTADO = [
  '/**',
  ' * Suma dos números.',
  ' * @param {number} a Primer sumando.',
  ' * @param {number} b Segundo sumando.',
  ' * @returns {number} La suma de a y b.',
  ' */',
  CODIGO_SUMAR,
].join('\n');

describe('documentarCodigo — casos normales', () => {
  test('devuelve el código con su bloque JSDoc cuando la IA responde limpio', async () => {
    const cliente = crearClienteFalso(SUMAR_DOCUMENTADO);

    const resultado = await documentarCodigo(CODIGO_SUMAR, cliente);

    expect(resultado).toBe(SUMAR_DOCUMENTADO);
    expect(resultado).toContain('@param {number} a');
    expect(resultado).toContain('@returns {number}');
  });

  test('quita las cercas de Markdown ```javascript que agrega la IA', async () => {
    const cliente = crearClienteFalso('```javascript\n' + SUMAR_DOCUMENTADO + '\n```');

    const resultado = await documentarCodigo(CODIGO_SUMAR, cliente);

    expect(resultado).toBe(SUMAR_DOCUMENTADO);
    expect(resultado).not.toContain('```');
  });

  test('envía a la IA un prompt con el código y la instrucción de usar JSDoc', async () => {
    const cliente = crearClienteFalso(SUMAR_DOCUMENTADO);

    await documentarCodigo(CODIGO_SUMAR, cliente);

    expect(cliente.prompts).toHaveLength(1);
    expect(cliente.prompts[0]).toContain(CODIGO_SUMAR);
    expect(cliente.prompts[0]).toContain('JSDoc');
  });
});

describe('documentarCodigo — casos límite', () => {
  test('acepta un código de exactamente 10.000 caracteres (igual al umbral)', async () => {
    const codigoEnElLimite = 'x'.repeat(10000);
    const cliente = crearClienteFalso('/** Variable x. */\n' + codigoEnElLimite);

    await expect(documentarCodigo(codigoEnElLimite, cliente)).resolves.toContain('/**');
    expect(cliente.prompts).toHaveLength(1);
  });

  test('rechaza un código de 10.001 caracteres sin llamar a la IA', async () => {
    const codigoMuyLargo = 'x'.repeat(10001);
    const cliente = crearClienteFalso(SUMAR_DOCUMENTADO);

    await expect(documentarCodigo(codigoMuyLargo, cliente)).rejects.toThrow(/10000 caracteres/);
    expect(cliente.prompts).toHaveLength(0);
  });

  test('rechaza un código que solo tiene espacios sin llamar a la IA', async () => {
    const cliente = crearClienteFalso(SUMAR_DOCUMENTADO);

    await expect(documentarCodigo('   \n\t ', cliente)).rejects.toThrow('El código no puede estar vacío');
    expect(cliente.prompts).toHaveLength(0);
  });
});

describe('documentarCodigo — casos de error', () => {
  test('lanza TypeError si el código no es un texto', async () => {
    const cliente = crearClienteFalso(SUMAR_DOCUMENTADO);

    await expect(documentarCodigo(123, cliente)).rejects.toThrow(TypeError);
    await expect(documentarCodigo(null, cliente)).rejects.toThrow('El código debe ser un texto (string)');
  });

  test('lanza error si la IA responde sin ningún bloque JSDoc', async () => {
    const cliente = crearClienteFalso('¡Claro! Aquí tienes tu función explicada: suma dos números.');

    await expect(documentarCodigo(CODIGO_SUMAR, cliente)).rejects.toThrow('La IA no devolvió documentación JSDoc');
  });
});

describe('documentarCodigo — revisión de seguridad semana 6', () => {
  test('lanza TypeError claro si el cliente de IA no tiene el método generar', async () => {
    await expect(documentarCodigo(CODIGO_SUMAR, undefined)).rejects.toThrow(
      'El cliente de IA debe tener un método generar(prompt)'
    );
    await expect(documentarCodigo(CODIGO_SUMAR, { generar: 'no es función' })).rejects.toThrow(TypeError);
  });

  test('lanza error claro si la IA devuelve algo que no es texto o está vacío', async () => {
    await expect(documentarCodigo(CODIGO_SUMAR, crearClienteFalso(undefined))).rejects.toThrow(
      'La IA devolvió una respuesta vacía o inválida'
    );
    await expect(documentarCodigo(CODIGO_SUMAR, crearClienteFalso('   '))).rejects.toThrow(
      'La IA devolvió una respuesta vacía o inválida'
    );
  });

  test('quita las cercas de Markdown aunque la IA use saltos de línea de Windows (\\r\\n)', async () => {
    const cliente = crearClienteFalso('```js\r\n' + SUMAR_DOCUMENTADO + '\r\n```');

    const resultado = await documentarCodigo(CODIGO_SUMAR, cliente);

    expect(resultado).toBe(SUMAR_DOCUMENTADO);
  });
});
