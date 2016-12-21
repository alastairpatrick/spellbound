const path = require('path');
const env = require('./env');

const webpackConfig = require('./webpack.config.js');

module.exports = function(grunt) {
  grunt.initConfig({
    eslint: {
      server: {
        src: [path.join(env.SRC_DIR, '/**/*.js')],
        options: {
          configFile: path.join(__dirname, '.eslintrc.js'),
          silent: true,
          format: 'stylish',
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
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('gruntify-eslint');


  grunt.registerTask('build', ['mochaTest', 'eslint']);
  grunt.registerTask('test', ['mochaTest', 'eslint']);
  grunt.registerTask('prepublish', ['webpack:build']);

  grunt.registerTask('default', ['test', 'prepublish']);  
};