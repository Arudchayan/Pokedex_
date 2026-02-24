import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'https://beta.pokeapi.co/graphql/v1beta',
  documents: 'src/graphql/*.graphql',
  generates: {
    'src/graphql/generated.ts': {
      plugins: ['typescript', 'typescript-operations'],
    },
  },
};

export default config;
