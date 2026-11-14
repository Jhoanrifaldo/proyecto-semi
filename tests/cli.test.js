const { spawnSync } = require('node:child_process');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');

/**
 * Ejecuta la CLI como lo haría un usuario, sin clave de API.
 * @param {string[]} argumentos Argumentos para src/cli.js.
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function ejecutarCli(argumentos) {
  const env = { ...process.env };
  delete env.GEMINI_API_KEY;
  return spawnSync(process.execPath, ['src/cli.js', ...argumentos], { cwd: RAIZ, env, encoding: 'utf8' });
}

describe('cli', () => {
  test('en modo demo documenta el archivo de ejemplo sin clave ni internet', () => {
    const resultado = ejecutarCli(['ejemplos/sumar.js', '--demo']);

    expect(resultado.status).toBe(0);
    expect(resultado.stdout).toContain('/**');
    expect(resultado.stdout).toContain('function sumar(a, b)');
    expect(resultado.stdout).not.toContain('```');
  });

  test('sin --demo y sin GEMINI_API_KEY termina con error claro', () => {
    const resultado = ejecutarCli(['ejemplos/sumar.js']);

    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain('Falta la variable de entorno GEMINI_API_KEY');
  });

  test('con un archivo que no existe termina con error', () => {
    const resultado = ejecutarCli(['no-existe.js', '--demo']);

    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain('No existe el archivo');
  });

  test('sin argumentos muestra cómo se usa', () => {
    const resultado = ejecutarCli([]);

    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain('Uso:');
  });
});
