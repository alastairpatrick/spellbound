const path = require('path');
const webpack = require('webpack');

const env = require('./env');

const SRC_DIR = path.join(__dirname, env.SRC_DIR);

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
  context: SRC_DIR,
  entry: {
    spellbound: [
      'babel-polyfill',
      './spellbound-core',
      './spellbound-react',
      './spellbound-serialize',
      './spellbound-util',
    ],
    todomvc: [
      './demo/todomvc/AppView',
    ],
    'data-grid-demo': [
      './demo/data-grid/main',
    ],
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
      query: env.IS_OPTIMIZED ? {
        presets: ['react', 'es2015'],
      } : {
        presets: ['react'],
        plugins: ['transform-es2015-modules-commonjs'],
      },
    }],
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  devtool: env.IS_OPTIMIZED ? "#source-map" : "#eval",
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