import { exec } from 'child_process';
import * as esbuild from 'esbuild';
import fs from 'fs';

const isWatch = process.argv.includes('--watch');

const isProd = process.argv.includes('--prod');

if (!isWatch && fs.existsSync('dist')) {
  console.log(warn('\nОчистка папки dist...'));

  fs.rmSync('dist', { recursive: true, force: true });

  console.log(success('Готово'));
}

const common = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: !isWatch,
  treeShaking: !isWatch,
  drop: !isWatch ? ['console', 'debugger'] : undefined,
  pure: ['myLogger.log'], // Пример для выкашивания чистых без вызовов(без записи результата)
  sourcemap: !isProd,
  resolveExtensions: ['.ts', '.js'],
  minifyIdentifiers: isProd,
  //mangleProps: /.*/,
  mangleCache: {
    push: false,
    createElement: false,
    add: false,
    classList: false,
    style: false,
    whiteSpace: false,
    append: false,
    insertBefore: false,
    addEventListener: false,
    getContext: false,
    observe: false,
    height: false,
    width: false,
    contentRect: false,
    split: false,
    name: false,
    text: false,
    forEach: false,
    map: false,
    filter: false,
    call: false,
    set: false,
    get: false,
    delete: false,
    remove: false,
    log: false,
    substring: false,
    length: false,
    clearRect: false,
    values: false,
  },
};

async function build() {
  const configs = [
    {
      outfile: 'dist/browser.js',
      format: 'iife',
      globalName: 'app',
      platform: 'browser',
      target: 'es2022',
      define: { IS_BROWSER: 'true', IS_PROD: isProd ? 'true' : 'false' },
    },
    {
      outfile: 'dist/node.js',
      format: 'esm',
      platform: 'node',
      target: 'node18',
      define: { IS_BROWSER: 'false', IS_PROD: isProd ? 'true' : 'false' },
    },
    {
      outfile: 'dist/node.cjs',
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      define: { IS_BROWSER: 'false', IS_PROD: isProd ? 'true' : 'false' },
    },
  ];

  if (isWatch) {
    for (const conf of configs) {
      const ctx = await esbuild.context({ ...common, ...conf });
      await ctx.watch();
    }

    console.log(warn('Watching for changes...\n'));

    const tscWatch = exec(
      'npx tsc -p tsconfig.json --watch --preserveWatchOutput'
    );

    tscWatch.stdout.on('data', (data) => {
      const fn = /\.\.\.$/.test(data.trim())
        ? warn
        : /(error TS|[^0] (errors|error))/.test(data)
          ? error
          : success;

      console.log(`\n${fn('[TS]')}: ${fn(data.trim())}`);
    });
  } else {
    console.log(warn('\nСборка бандлов:'));

    for (const conf of configs) {
      console.log(warn(`\nСборка [${conf.outfile}]...`));

      await esbuild.build({ ...common, ...conf });

      console.log(success('Готово'));
    }

    console.log(warn('\nГенерация типов...'));

    const types = exec(
      'npx tsc -p tsconfig.browser.json && npx tsc -p tsconfig.node.json'
    );

    types.on('exit', () => console.log(success('\nСборка завершена')));
  }
}

build().catch(console.error);

function success(str) {
  return `\x1b[32m${str}\x1b[0m`;
}
function error(str) {
  return `\x1b[31m${str}\x1b[0m`;
}
function warn(str) {
  return `\x1b[33m${str}\x1b[0m`;
}
