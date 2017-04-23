const path = require('path');

let NODE_ENV;
if (typeof process.env.NODE_ENV !== "string") {
  NODE_ENV = "development";
  console.log("NODE_ENV defaulting to '" + NODE_ENV + "'.");
} else {
  NODE_ENV = process.env.NODE_ENV;
  console.log("NODE_ENV set to '" + NODE_ENV + "'.");
}

const IS_OPTIMIZED = NODE_ENV === 'production';
const BUILD_DIR = 'build/';

module.exports = {
  NODE_ENV: NODE_ENV,
  IS_OPTIMIZED: IS_OPTIMIZED,
  SRC_DIR: './',
  BUILD_DIR: BUILD_DIR,
  CLIENT_DIR: path.join(BUILD_DIR, 'client/', NODE_ENV),
};
