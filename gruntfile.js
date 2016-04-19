module.exports = function (grunt) {
  'use strict';

  // Load all of the grunt tasks (matching the `grunt-*` pattern) in package.json::devDependencies
  require('load-grunt-tasks')(grunt);

  // Configure Tasks.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Define paths.
    project: {
      app: 'app',
      dist: 'dist',
      docs: 'docs',
      test: 'test',
      report: 'test/report',
      tmp: 'tmp',
      tmp_html: '<%= project.tmp %>/html',
      tmp_html_min: '<%= project.tmp %>/html-min'
    },

    // Unit testing.
    karma: {
      unit: {
        configFile: '<%= project.test %>/karma.phantomjs.conf.js',

        // Shut down the Karma server when testing is complete.
        singleRun: true
      }
    },

    // Test coverage (using Istanbul).
    coverage: {
      default: {
        options: {
          thresholds: {
            'statements': 80,
            'branches': 80,
            'lines': 80,
            'functions': 80
          },
          dir: 'coverage',
          root: '<%= project.report %>',
          report: true
        }
      }
    },

    // Documentation.
    ngdocs: {
      all: ['<%= project.app %>/**/*.js'],
      options: {
        title: 'Angular Example Application'
      }
    },

    // Linting.
    eslint: {
      target: ['<%= project.app %>/**/!(*spec|*test).js'],
      options: {
        configFile: '.eslintrc.js'
      }
    },

    clean: {
      // Build: X. Delete the Build folder.
      build: ['<%= project.tmp %>'],

      // Build: X. Remove HTML files from .tmp
      build_html: [
        '<%= project.tmp_html %>',
        '<%= project.tmp_html_min %>'
      ],

      // Report task, for code coverage.
      coverage: '<%= project.report %>/coverage/*',
      docs: '<%= project.docs %>'
    },

    copy: {
      // Build: X. Create .tmp/html/ and copy html files into it.
      // Requires grunt-contrib-copy.
      build_html: {
        options: {
          process: function (content, srcpath) {

            // Replace 3 or more whitespaces.
            content = content.replace(/(\s){3,}/ig, ' ');

            // Process each opening tag and singleton tag.
            content = content.replace(/<[^\/>]+\/??>/ig, processTags);

            return content;

            function processTags (tag) {

              // Process attributes.
              tag = tag.replace(/(=")([^"]+?)(")/ig, processAttributes);

              return tag;
            }

            function processAttributes (match, p1, p2, p3) {

              // Remove space from around single pipes in attributes.
              p2 = p2.replace(/\s\|\s/ig, '|');

              // Remove space from around OR double pipes in attributes.
              p2 = p2.replace(/\s\|\|\s/ig, '||');

              // Remove space from around AND ampersands in attributes.
              p2 = p2.replace(/\s&&\s/ig, '&&');

              // Remove space from around !==, === and ==
              p2 = p2.replace(/\s!==\s/ig, '!==');
              p2 = p2.replace(/\s===\s/ig, '===');
              p2 = p2.replace(/\s==\s/ig, '==');

              p2 = p2.replace(/\s\?\s/ig, '?');
              p2 = p2.replace(/\s:\s/ig, ':');

              // Remove space from after a single quote and colon within attributes.
              // p2 = p2.replace(/':\s+/ig, "':");
              p2 = p2.replace(/':\s+/ig, '\':');

              return p1 + p2 + p3;
            }
          }
        },
        files: [
          {
            // Recreate the full path to each file.
            expand: true,

            // Flatten the directory structure.
            flatten: false,

            dot: false,
            cwd: '<%= project.app %>',
            src: [
              'main/**/*.html'
            ],
            dest: '<%= project.tmp_html %>'
          }
        ]
      }
    },

    htmlmin: {
      // Build: X. Minify HTML template files. Place them in .tmp/html-min.
      // Requires: grunt-contrib-htmlmin.
      build_html: {
        options: {
          // Remove insignificant white space
          collapseWhitespace: true,

          // Collapse <tag disabled="disabled"> to <tag disabled>
          collapseBooleanAttributes: false,

          removeComments: true,
          removeCommentsFromCDATA: false,
          removeOptionalTags: false,
          removeAttributeQuotes: false
        },
        files: [
          {
            expand: true,
            cwd: '<%= project.tmp_html %>',
            src: [
              '**/*.html',
              '!**/__*'
            ],
            dest: '<%= project.tmp_html_min %>'
          }
        ]
      }
    },

    ngtemplates: {
      // Build: X. Create a templates.js file from the HTML templates inside
      // AngularJS's $templateCache.
      // Requires: grunt-angular-templates.
      // Should be given the name of the app’s base module, i.e. 'app'.
      app: {
        cwd: '<%= project.tmp_html_min %>',
        src: '**/*.html',
        dest: '<%= project.tmp %>/js/templates.js',
        options: {
          htmlmin: {
            collapseBooleanAttributes:      false,
            collapseWhitespace:             true,

            // Always collapse to 1 space
            conservativeCollapse:           false,

            // Keep the trailing slash on singleton elements.
            keepClosingSlash:               true,

            caseSensitive:                  true,
            maxLineLength:                  10240,
            customAttrCollapse:             /ng\-class/,

            // Only do this if you don't use comment directives!
            removeComments:                 true,

            removeCommentsFromCDATA:        false,
            removeOptionalTags:             false
          }
        }
      }
    }
  });

  // Default.
  grunt.registerTask('default', ['karma', 'eslint']);

  // Generate documentation.
  grunt.registerTask('docs', [
    'clean:docs',
    'ngdocs'
  ]);

  // Report generator.
  grunt.registerTask('report', [
    'clean:coverage',
    'eslint',
    'karma',
    'coverage'
  ]);

  // Build a single app file.
  grunt.registerTask('build', [
    // 0. Run Karma Unit tests & Coverage report
    // 'report',

    // 1. Delete the temporary build folder.
    'clean:build',

    // 2. Create .tmp/build_html/ and copy html files into it.
    'copy:build_html',

    // 3. Minify HTML template files (into .tmp/html-min).
    'htmlmin:build_html',

    // 4. Create a templates.js file from the HTML templates.
    'ngtemplates:app',

    // 5. Remove HTML files from .tmp.
    'clean:build_html'
  ]);
};
