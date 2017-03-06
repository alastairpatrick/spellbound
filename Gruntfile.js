const path = require('path');
const env = require('./env');

const webpackConfig = require('./webpack.config.js');

module.exports = function(grunt) {
  require("grunt-timer").init(grunt);

  grunt.initConfig({
    eslint: {
      server: {
        src: [path.join(env.SRC_DIR, '/**/*.js')],
        options: {
          configFile: path.join(__dirname, '.eslintrc.js'),
          silent: true,
          format: 'stylish',
          cache: true,
          cacheLocation: path.join(__dirname, '.eslintcache'),
        }
      },
    },

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
          script: path.join(env.SRC_DIR, 'server/main.js'),
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
  grunt.loadNpmTasks('gruntify-eslint');

  grunt.registerTask('build', ['mochaTest', 'touch', 'eslint']);
  grunt.registerTask('test', ['mochaTest', 'eslint']);
  grunt.registerTask('prepublish', ['webpack:build']);
  grunt.registerTask('serve', ['webpack:build', 'express', 'watch']);

  grunt.registerTask('default', ['test', 'prepublish']);  
};