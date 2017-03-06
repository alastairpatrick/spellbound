const path = require('path');
const webpack = require('webpack');

const env = require('./env');

const DEFINE_PLUGIN = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify(env.NODE_ENV),
  },
});

const DEDUPE_PLUGIN = new webpack.optimize.DedupePlugin();
const OCCURENCE_ORDER_PLUGIN = new webpack.optimize.OccurenceOrderPlugin();

const UGLIFY_PLUGIN = new webpack.optimize.UglifyJsPlugin({
  compress: { warnings: false },
  mangle: true,
  sourcemap: false,
  beautify: false,
  dead_code: true
});

const COMMONS_CHUNK_PLUGIN = new webpack.optimize.CommonsChunkPlugin(
  "spellbound",
  "spellbound.js");

module.exports = {
  entry: {
    spellbound: [
      "babel-polyfill",
      path.join(__dirname, env.SRC_DIR, 'spellbound-core', 'index.js'),
      path.join(__dirname, env.SRC_DIR, 'spellbound-react', 'index.js'),
      path.join(__dirname, env.SRC_DIR, 'spellbound-serialize', 'index.js'),
      path.join(__dirname, env.SRC_DIR, 'spellbound-util', 'index.js'),
    ],
    todomvc: [path.join(__dirname, env.SRC_DIR, 'demo', 'todomvc', 'AppView.js')],
    'data-grid-demo': [path.join(__dirname, env.SRC_DIR, 'demo', 'data-grid', 'main.js')],
  },
  output: {
    path: path.join(__dirname, env.CLIENT_DIR),
    filename: '[name].js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      include: path.join(__dirname, env.SRC_DIR),
      loader: 'babel-loader',
      query: {
        presets: ['react', 'es2015'],
      },
    }],
  },
  devtool: "#cheap-module-source-map",
  plugins: env.IS_OPTIMIZED ? [
    DEFINE_PLUGIN,
    COMMONS_CHUNK_PLUGIN,
    DEDUPE_PLUGIN,
    OCCURENCE_ORDER_PLUGIN,
    UGLIFY_PLUGIN,
  ] : [
    DEFINE_PLUGIN,
    COMMONS_CHUNK_PLUGIN,
  ],
};