const path = require('path');
const wasmExtensionRegExp = /\.wasm$/;

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Emscripten uses import.meta
      webpackConfig.module.rules.push({
        test: /\.js$/,
        loader: require.resolve('@open-wc/webpack-import-meta-loader'),
      });

      webpackConfig.module.rules.forEach(rule => {
        (rule.oneOf || []).forEach(oneOf => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            // make default file-loader ignore WASM files
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      // We want to provide "require('somefile.wasm')" as Emscripten locateFile.
      // This makes sure files required this way are not altered.
      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: 'javascript/auto',
        include: path.resolve(__dirname, 'src'),
        loaders: 'file-loader',
        options: {
          name: '[name].[hash:8].[ext]',
        },
      });

      return webpackConfig;
    },
  },
  eslint: {
    configure: {
      "ignorePatterns": ["src/wasm/*"],
    },
  },
}
