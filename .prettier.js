/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  bracketSameLine: false,
  singleQuote: true,
  endOfLine: 'lf',
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^@store',
    '^@entry',
    '^@entities/(.*)',
    '^@features/(.*)',
    '^@layouts/(.*)',
    '^@processes/(.*)',
    '^@pages/(.*)',
    '^@shared/(.*)',
    '^\\./(.*)',
    '^\\.\\./(.*)',
  ],
  importOrderSeparation: true,
};

export default config;
