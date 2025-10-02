import {defineConfig, UserConfig} from 'vite';
import obfuscator from 'vite-plugin-javascript-obfuscator';
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }): UserConfig => {
    if (mode === 'script') {
        return {
            plugins: [
                obfuscator({
                    options: {
                        compact: true,
                        controlFlowFlattening: true,
                        deadCodeInjection: true,
                        // debugProtection: true,
                        // debugProtectionInterval: true, fixme
                        // disableConsoleOutput: true,
                    },
                }),
            ],
            build: {
                emptyOutDir: true,
                minify: 'terser',
                lib: {
                    name: 'telegramAnalytics',
                    formats: ['iife'],
                    entry: 'src/index.ts',
                    fileName(format) {
                        return 'index.js';
                    },
                },
            },
            publicDir: false,
        }
    } else if (mode === 'package') {
        return {
            plugins: [
                obfuscator({
                    options: {
                        compact: true,
                        controlFlowFlattening: true,
                        deadCodeInjection: true,
                        // debugProtection: true,
                        // debugProtectionInterval: true, fixme
                        // disableConsoleOutput: true,
                    },
                }),
                tsconfigPaths(),
                dts({
                    include: ['src/index.ts', 'src/declarations'],
                    outDir: 'lib/types',
                    insertTypesEntry: true,
                }),
            ],
            build: {
                outDir: 'lib',
                emptyOutDir: true,
                minify: 'terser',
                lib: {
                    name: 'telegramAnalytics',
                    formats: ['es', 'cjs'],
                    entry: 'src/index.ts',
                    fileName(format) {
                        if (format === 'es') {
                            return 'es/index.js'
                        } else if (format === 'cjs') {
                            return 'cjs/index.cjs';
                        }
                    },
                },
            },
            publicDir: false,
        }
    }
});
