/**
 * Szigorúbb lint config a `npm publish` előtt. A community-package-* szabályok
 * megakadályozzák, hogy default placeholder értékekkel kerüljön ki csomag (pl.
 * `n8n-nodes-base` keyword, üres description, default node név). A fejlesztés
 * közbeni `.eslintrc.js`-ben ezek lazábbak.
 */
module.exports = {
  extends: './.eslintrc.js',
  overrides: [
    {
      files: ['package.json'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      rules: {
        'n8n-nodes-base/community-package-json-name-still-default': 'error',
      },
    },
  ],
};
