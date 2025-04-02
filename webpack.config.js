const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = (env, argv) => {
  const targetBrowser = env.browser || 'firefox';
  
  return {
    mode: argv.mode || 'development',
    entry: {
      background: './background.js',
      content: './content.js',
      options: './options.js',
      popup: './popup.js'
    },
    output: {
      path: path.resolve(__dirname, `dist/${targetBrowser}`),
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false
      }),
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', 
            transform: (content) => {
              const manifest = JSON.parse(content.toString());

              // Chrome/Edge/Opera specific changes
              if (targetBrowser === 'chrome' || targetBrowser === 'edge' || targetBrowser === 'opera') {
                delete manifest.browser_specific_settings;
                // Chrome doesn't support the applications key either
                delete manifest.applications;
              } 
              
              // Safari specific changes
              else if (targetBrowser === 'safari') {
                delete manifest.browser_specific_settings;
                // Add Safari specific keys if needed
              }

              return JSON.stringify(manifest, null, 2);
            }
          },
          { from: 'icons', to: 'icons' },
          { from: '*.html' }
        ]
      }),
      // Create a zip file for each browser
      new ZipPlugin({
        path: path.resolve(__dirname, 'web-ext-artifacts'),
        filename: `benway-${targetBrowser}.zip`
      })
    ],
    resolve: {
      extensions: ['.js']
    },
    devtool: 'source-map'
  };
};
