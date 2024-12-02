const path = require('path');

module.exports = {
  mode: 'production',
  entry: './index.js', // Main entry point for your package
  output: {
    filename: 'index.js', // Output filename
    path: path.resolve(__dirname, 'lib'), // Output directory
    library: 'proofify', // Library name
    libraryTarget: 'umd', // Universal Module Definition for compatibility
  },
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'), // Polyfill for crypto
      os: require.resolve('os-browserify/browser'), // Polyfill for os
      buffer: require.resolve('buffer/'), // Polyfill for buffer
      stream: require.resolve('stream-browserify'), // Polyfill for stream
      vm: require.resolve('vm-browserify'), // Add this line for vm

      // Add other fallbacks if necessary
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Make sure you have babel-loader installed
          options: {
            presets: ['@babel/preset-env'], // Use Babel to compile ES6+ to ES5
          },
        },
      },
    ],
  },
};
