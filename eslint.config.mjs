import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierConfig,
  {
    ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'hackathon-prep/**'],
  },
];

export default eslintConfig;
