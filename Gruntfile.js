const path = require('path');
const env = require('./env');

const webpackConfig = require('./webpack.config.js');

module.exports = function(grunt) {
  require("grunt-timer").init(grunt);

  grunt.initConfig({
    mochaTest: {
      server: {
        options: {
          reporter: 'min',
          require: ['babel-core/register'],
        },
        files: [{
          expand: true,
          cwd: env.SRC_DIR,
          src: ['**/*.spec.js'],
        }],
      },
    },
    
    webpack: {
      build: webpackConfig,
    },

    touch: ['restart'],

    express: {
      server: {
        options: {
          script: path.join(env.SRC_DIR, 'demo/server.js'),
          node_env: env.NODE_ENV,
          opts: ['--require', 'babel-core/register'],
        },
      },
    },

    watch: {
      express: {
        files: ['restart'],
        tasks: ['express:server:stop', 'webpack:build', 'express:server'],
        options: {
          spawn: false,
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-touch');
  grunt.loadNpmTasks('grunt-webpack');

  grunt.registerTask('build', ['mochaTest', 'touch']);
  grunt.registerTask('serve', ['webpack:build', 'express', 'watch']);
  grunt.registerTask('default', ['serve']);  
};