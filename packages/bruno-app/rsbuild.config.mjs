import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill'

export default defineConfig({
  plugins: [
    pluginNodePolyfill(),
    pluginReact(),
    // NOTE: pluginStyledComponents causes SWC Wasm compatibility error with Rspack 1.6.x
    // Using babel-plugin-styled-components via Babel loader instead
    pluginSass(),
    pluginBabel({
      include: /\.(?:js|jsx|tsx)$/,
      babelLoaderOptions(opts) {
        // Add styled-components babel plugin for proper SSR and better debugging
        opts.plugins = opts.plugins || [];
        opts.plugins.push(['babel-plugin-styled-components', {
          displayName: true,
          fileName: true,
          ssr: false
        }]);
        // NOTE: React compiler disabled for now - can be re-enabled when needed
        // opts.plugins.unshift('babel-plugin-react-compiler');
      }
    })
  ],
  source: {
    tsconfigPath: './jsconfig.json', // Specifies the path to the JavaScript/TypeScript configuration file,
    exclude: [
      '**/test-utils/**',
      '**/*.test.*',
      '**/*.spec.*'
    ]
  },
  html: {
    title: 'Bruno'
  },
  tools: {
    rspack: {
      module: {
        parser: {
          javascript: {
            // This loads the JavaScript contents from a library along with the main JavaScript bundle.
            dynamicImportMode: "eager",
          },
        },
      },
      ignoreWarnings: [
        (warning) =>  warning.message.includes('Critical dependency: the request of a dependency is an expression') && warning?.moduleDescriptor?.name?.includes('flow-parser')
      ],
      // Add externals configuration to exclude Node.js libraries
      externals: {
        // List specific Node.js modules you want to exclude
        // Format: 'module-name': 'commonjs module-name'
        'worker_threads': 'commonjs worker_threads',
        'node:worker_threads': 'commonjs worker_threads',
        'node:path': 'commonjs path',
        'node:os': 'commonjs os',
        'node:fs': 'commonjs fs',
        // 'path': 'commonjs path'
      }
    },
  }
});
