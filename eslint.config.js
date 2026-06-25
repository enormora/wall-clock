import { baseConfig } from '@enormora/eslint-config-base';
import { nodeConfig } from '@enormora/eslint-config-node';
import { mochaConfig } from '@enormora/eslint-config-mocha';
import { typescriptConfig } from '@enormora/eslint-config-typescript';

// cspell:ignore sonarjs

export default [
    {
        ignores: ['coverage/**', 'target/**', 'mocha.config.json']
    },
    {
        ...baseConfig,
        rules: {
            ...baseConfig.rules,
            'import/no-unused-modules': [
                'error',
                {
                    unusedExports: true,
                    suppressMissingFileEnumeratorAPIWarning: true
                }
            ]
        }
    },
    nodeConfig,
    {
        ...typescriptConfig,
        files: ['**/*.ts'],
        rules: {
            ...typescriptConfig.rules,
            'import/extensions': [
                'error',
                'always',
                {
                    ignorePackages: true
                }
            ]
        }
    },
    {
        ...mochaConfig,
        files: ['**/*.test.ts'],
        rules: {
            ...mochaConfig.rules,
            'sonarjs/no-empty-group': 'off',
            complexity: 'off',
            'mocha/no-global-tests': 'off',
            'mocha/no-mocha-arrows': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-magic-numbers': 'off',
            'functional/no-this-expressions': 'off',
            'functional/prefer-immutable-types': 'off',
            'max-statements': 'off',
            'no-magic-numbers': 'off',
            'node/prefer-global/timers': 'off'
        }
    },
    {
        files: ['source/wall-clock.ts'],
        rules: {
            'node/prefer-global/timers': 'off'
        }
    },
    {
        files: ['source/index.ts'],
        rules: {
            'no-barrel-files/no-barrel-files': 'off'
        }
    },
    {
        rules: {
            '@typescript-eslint/method-signature-style': 'off',
            '@typescript-eslint/no-unsafe-type-assertion': 'off',
            '@stylistic/operator-linebreak': 'off',
            'import/no-named-as-default': 'off',
            'import/no-named-as-default-member': 'off',
            'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }]
        }
    },
    {
        files: ['eslint.config.js', 'mocha.config.json', 'prettier.config.js'],
        rules: {
            'import/no-default-export': 'off'
        }
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'max-lines-per-function': 'off'
        }
    }
];
