// @ts-check
import fs from 'node:fs/promises';
import path from 'node:path';

const projectFolder = process.cwd();
const sourcesFolder = path.join(projectFolder, 'target/build/source');

const packageRoots = {
    main: {
        js: 'index.js',
        declarationFile: 'index.d.ts'
    },
    wallClock: {
        js: 'wall-clock.js',
        declarationFile: 'wall-clock.d.ts'
    },
    deterministicWallClock: {
        js: 'deterministic-wall-clock.js',
        declarationFile: 'deterministic-wall-clock.d.ts'
    }
};

const packageInterface = {
    modules: [
        { root: 'main', export: '.' },
        { root: 'wallClock', export: './wall-clock' },
        { root: 'deterministicWallClock', export: './deterministic-wall-clock' }
    ]
};

/** @returns {Promise<import('@packtory/cli').PacktoryConfig>} */
export async function buildConfig() {
    const packageJsonContent = await fs.readFile(path.join(projectFolder, 'package.json'), { encoding: 'utf8' });
    const packageJson = JSON.parse(packageJsonContent);

    return {
        commonPackageSettings: {
            sourcesFolder,
            mainPackageJson: packageJson,
            includeSourceMapFiles: true,
            publishSettings: {
                access: 'public',
                provenance: { type: 'auto' }
            },
            additionalPackageJsonAttributes: {
                author: packageJson.author,
                license: packageJson.license,
                repository: packageJson.repository
            },
            additionalFiles: [
                {
                    sourceFilePath: path.join(projectFolder, 'LICENSE'),
                    targetFilePath: 'LICENSE'
                },
                {
                    sourceFilePath: path.join(projectFolder, 'README.md'),
                    targetFilePath: 'README.md'
                }
            ]
        },
        packages: [
            {
                name: packageJson.name,
                roots: packageRoots,
                packageInterface
            }
        ]
    };
}
