#!/usr/bin/env node
/*
 * Línea de comandos: documenta un archivo JavaScript con JSDoc.
 *   node src/cli.js <archivo.js>          usa Gemini (necesita GEMINI_API_KEY)
 *   node src/cli.js <archivo.js> --demo   usa un cliente simulado, sin clave ni internet
 * El resultado se escribe en la salida estándar.
 */
const fs = require('node:fs');
const path = require('node:path');
const { documentarCodigo, MAX_CARACTERES } = require('./documentador');
const { crearClienteGemini } = require('./clienteGemini');

const USO = 'Uso: node src/cli.js <archivo.js> [--demo]';

/**
 * Cliente simulado para probar el flujo sin clave: devuelve el mismo código
 * (lo que hay entre las marcas del prompt) con un bloque JSDoc de ejemplo.
 * @returns {{ generar: (prompt: string) => Promise<string> }} Cliente de IA falso.
 */
function crearClienteDemo() {
  return {
    async generar(prompt) {
      const codigo = prompt.split('<<<INICIO_CODIGO>>>\n')[1].split('\n<<<FIN_CODIGO>>>')[0];
      return '```javascript\n/**\n * (Modo demo) Documentación de ejemplo, sin IA real.\n */\n' + codigo + '\n```';
    },
  };
}

/**
 * Lee el archivo indicado comprobando que exista y no sea demasiado grande.
 * @param {string} ruta Ruta del archivo que el usuario pasó por consola.
 * @returns {string} Contenido del archivo en UTF-8.
 * @throws {Error} Si no existe, no es un archivo o supera MAX_CARACTERES.
 */
function leerArchivo(ruta) {
  const rutaAbsoluta = path.resolve(ruta);
  // La ruta la elige el propio usuario en su equipo (no llega de la red), por eso se permite.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const info = fs.statSync(rutaAbsoluta, { throwIfNoEntry: false });
  if (!info || !info.isFile()) {
    throw new Error(`No existe el archivo: ${ruta}`);
  }
  // Un carácter UTF-8 ocupa hasta 4 bytes: si pesa más, seguro supera el límite.
  if (info.size > MAX_CARACTERES * 4) {
    throw new Error(`El archivo supera el máximo de ${MAX_CARACTERES} caracteres`);
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(rutaAbsoluta, 'utf8');
}

/**
 * Carga `.env` si existe y la versión de Node lo permite (Node 20.12 o superior).
 */
function cargarEnv() {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
}

/**
 * Punto de entrada: procesa los argumentos, documenta el archivo e imprime el resultado.
 * @param {string[]} argumentos Argumentos de consola (sin `node` ni el script).
 * @returns {Promise<number>} Código de salida: 0 si todo salió bien, 1 si hubo error.
 */
async function main(argumentos) {
  const modoDemo = argumentos.includes('--demo');
  const [ruta] = argumentos.filter((arg) => arg !== '--demo');
  if (!ruta) {
    console.error(USO);
    return 1;
  }
  try {
    cargarEnv();
    const cliente = modoDemo ? crearClienteDemo() : crearClienteGemini();
    const documentado = await documentarCodigo(leerArchivo(ruta), cliente);
    process.stdout.write(documentado + '\n');
    return 0;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).then((codigo) => {
    process.exitCode = codigo;
  });
}

module.exports = { main };
