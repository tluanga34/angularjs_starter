const dependency = require("./tools/modules/dependency_module.js");
const fs = require("fs");
const path = require("path");
const sass = require('node-sass');

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-aws-s3');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-sass');


  let cssFiles;
  let scssFiles;
  let jsFiles;


  dependency.getDependencyUrls(function (responseObj) {
    cssFiles = responseObj.cssFiles;
    jsFiles = responseObj.jsFiles;
    scssFiles = [];

    for (var i = 0; i < cssFiles.length; i++) {
      if (path.extname(cssFiles[i]) == ".scss") {
        scssFiles.push(cssFiles[i]);
        cssFiles.splice(i, 1);
        i--;
      }
    }

    writeIndexPage(function () {
      registerTask();
    });
  });


  function writeIndexPage(callback) {
    var indexPageInjects = [];

    indexPageInjects.push(`<link href="styles.min.css" rel="stylesheet">`);
    indexPageInjects.push(`<script src="app.min.js"></script>`);


    var htmlContent = fs.readFileSync(`www/index.html`, "utf8");
    htmlContent = htmlContent.replace("<!-- sourceFileMacro -->", indexPageInjects.join("\n"));


    if (!fs.existsSync("builds/output")) {
      fs.mkdirSync("builds/output",{ recursive: true });
    }

    fs.writeFileSync('builds/output/index.html', htmlContent, function (err) {
      if (err) throw err;
    });

    callback && callback();

  }


  function registerTask() {

    var outputFolder = "builds/output";

    grunt.initConfig({
      sass: {
        options: {
          implementation: sass,
          // sourceMap: true,
          outputStyle : "expanded",
          includePaths: [
            `www/config/`,
          ]
        },
        dist: {
          src : "builds/scss_styles.scss",
          dest : "builds/scss_styles.css"
        }
      },
      concat: {
        js: {
          src: jsFiles,
          dest: "builds/app.js",
        },
        sass: {
          src: scssFiles,
          dest: "builds/scss_styles.scss"
        },
        css: {
          src: cssFiles.concat("builds/scss_styles.css"),
          dest: "builds/styles.css"
        }
      },
      copy: {
        main: {
          files: [
            {
              expand: true,
              cwd: "www/shared/assets/",
              src: ["*.*", '!**/css/**', "**/*.*"],
              dest: outputFolder + "/shared/assets/"
            },
            {
              expand: true,
              cwd: "www/shared/components/",
              src: ["*.html", "**/*.html"],
              dest: outputFolder + "/shared/components/"
            },
            {
              expand: true,
              cwd: "www/pages/",
              src: ["*.html", "**/*.html"],
              dest: outputFolder + "/pages/"
            },
          ]
        }
      },
      uglify: {
        local: {
          options: {
            sourceMap: true,
            sourceMapName: "builds/output/main.min.js.map"
          },
          files: {
            ["builds/output/app.min.js"]: ["builds/app.js"],
          }
        }
      },
      cssmin: {
        local: {
          options: {
            mergeIntoShorthands: false,
            roundingPrecision: -1,
            // sourceMap: true,
            // sourceMapName: "builds/output/styles.min.css.map"
          },
          files: {
            ["builds/output/styles.min.css"]: ["builds/styles.css"]
          }
        }
      },
      aws_s3: {
        all: {
          options: {
            "accessKeyId": "AKIAJEYYWL5EKT4G23PA",
            "secretAccessKey": "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",
            "bucket": "channelsmart",
            "access": "public-read",
            "region": "ap-south-1",
            "differential": false,
            "params": {
              "CacheControl": "max-age:0"
            }
          },
          files: [{
            expand: true,
            cwd: "builds/output/",
            action: 'upload',
            src: [
              "**",
            ],
            dest: ""
          }]
        },
      }
    });

    grunt.registerTask("sas", ["sass"]);
    grunt.registerTask("concatsas", ["concat:sass", "sass"]);
    grunt.registerTask("default", ["concat:sass", "sass", "concat:js", "concat:css", "copy", "uglify", "cssmin"]);
    grunt.registerTask("staging", ["concat:sass", "sass", "concat:js", "concat:css", "copy", "uglify", "cssmin", "aws_s3"]);
    grunt.registerTask("upload", ["aws_s3"]);
  }
}