const path = require('path');

const NODE_ENV = process.env.NODE_ENV || 'production';
const IS_OPTIMIZED = NODE_ENV === 'production';
const BUILD_DIR = 'build/';

module.exports = {
  NODE_ENV: NODE_ENV,
  IS_OPTIMIZED: IS_OPTIMIZED,
  SRC_DIR: 'src/',
  BUILD_DIR: BUILD_DIR,
  CLIENT_DIR: path.join(BUILD_DIR, 'client/', NODE_ENV),
  SERVER_DIR: path.join('src'),
};
