#!/usr/bin/env node
/**
 * Lokális 1:1 reprodukció a `npx @n8n/scan-community-package` viselkedésére:
 *   1. `npm run build`
 *   2. `npm pack` egy temp dirbe
 *   3. tarball kicsomagolása
 *   4. ESLint futtatása a `**​/*.js`-en (ugyanazokkal a szabályokkal mint a
 *      hivatalos scan + `no-console: error`)
 *   5. Hibák kijelzése — exit code 1 ha bármilyen hiba
 *
 * Így a CI / lokál ellenőrzés pontosan azt teszteli, amit az n8n verification
 * is tesztelni fog a publishált csomagon.
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint-flat';
// @ts-expect-error — a glob package nincs explicit típusozva
import glob from 'fast-glob';
import n8nPlugin from '@n8n/eslint-plugin-community-nodes';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TEMP = mkdtempSync(path.join(tmpdir(), 'n8n-scan-'));

console.log(`📦 Building...`);
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

console.log(`📦 Packing into ${TEMP}...`);
const packOutput = execSync(`npm pack --pack-destination "${TEMP}" --json`, {
  cwd: ROOT,
  encoding: 'utf-8',
});
const tarballName = JSON.parse(packOutput)[0].filename;
const tarballPath = path.join(TEMP, tarballName);

console.log(`📦 Extracting ${tarballName}...`);
execSync(`tar -xzf "${tarballPath}" -C "${TEMP}"`, { stdio: 'inherit' });
const pkgDir = path.join(TEMP, 'package');

console.log(`🔍 Running ESLint on **/*.js (n8n community-node rules)...`);
const eslint = new ESLint({
  cwd: pkgDir,
  allowInlineConfig: false,
  overrideConfigFile: true,
  overrideConfig: [
    {
      plugins: n8nPlugin.configs.recommended.plugins,
      rules: {
        ...n8nPlugin.configs.recommended.rules,
        'no-console': 'error',
      },
    },
  ],
});

const jsFiles = glob.sync('**/*.js', {
  cwd: pkgDir,
  absolute: true,
  ignore: ['node_modules/**'],
});

if (jsFiles.length === 0) {
  console.log('⚠ No JavaScript files found to analyze');
  process.exit(0);
}

const results = await eslint.lintFiles(jsFiles);
const hasErrors = results.some((r) => r.errorCount > 0);

if (hasErrors) {
  const formatter = await eslint.loadFormatter('stylish');
  const output = await formatter.format(results);
  console.log(output);
  console.log(`❌ Package failed n8n scan — fix the violations above before publishing.`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));
console.log(
  `✅ Package ${pkg.name}@${pkg.version} passes the n8n community-node scan ` +
    `(${jsFiles.length} JS files checked).`,
);
