import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {ignores:['dist/**','node_modules/**','tmp/**','*.tsbuildinfo']},
  {files:['**/*.{js,ts,tsx}'],extends:[js.configs.recommended,...tseslint.configs.recommended],languageOptions:{globals:{...globals.browser,...globals.node}},rules:{'@typescript-eslint/no-explicit-any':'off','@typescript-eslint/no-empty-object-type':'off','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}]}},
);
