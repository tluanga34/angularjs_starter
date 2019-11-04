let fs = require("fs");

function getDependencyUrls(callback) {
  var cssFiles = [];
  var jsFiles = [];


  var jsPaths = readFilesInFolder("www/shared/libraries");
  jsPaths = pushFilesFullUrlInArray(jsPaths, "www/shared/libraries/");
  jsFiles = jsFiles.concat(jsPaths);

  jsFiles.push("www/module.js");
  jsFiles.push("www/config/config.js");


  var jsPaths = readFilesInFolder("www/shared/directives");
  jsPaths = pushFilesFullUrlInArray(jsPaths, "www/shared/directives/");
  jsFiles = jsFiles.concat(jsPaths);

  var jsPaths = readFilesInFolder("www/shared/services");
  jsPaths = pushFilesFullUrlInArray(jsPaths, "www/shared/services/");
  jsFiles = jsFiles.concat(jsPaths);

  var jsPaths = readFilesInFolder("www/shared/filters");
  jsPaths = pushFilesFullUrlInArray(jsPaths, "www/shared/filters/");
  jsFiles = jsFiles.concat(jsPaths);


  var cssPaths = readFilesInFolder("www/shared/assets/css");
  cssPaths = pushFilesFullUrlInArray(cssPaths, "www/shared/assets/css/");
  cssFiles = cssFiles.concat(cssPaths);


  var pages = readFilesInFolder("www/pages");
  pages.forEach(function (folderName) {
    var jsPaths = readFilesInFolder(`www/pages/${folderName}/js`);
    jsPaths = pushFilesFullUrlInArray(jsPaths, `www/pages/${folderName}/js/`);
    jsFiles = jsFiles.concat(jsPaths);

    var cssPaths = readFilesInFolder(`www/pages/${folderName}/css`);
    cssPaths = pushFilesFullUrlInArray(cssPaths, `www/pages/${folderName}/css/`);
    cssFiles = cssFiles.concat(cssPaths);
  });

  var components = readFilesInFolder("www/shared/components");
  components.forEach(function (folderName) {
    var jsPaths = readFilesInFolder(`www/shared/components/${folderName}/js`);
    jsPaths = pushFilesFullUrlInArray(jsPaths, `www/shared/components/${folderName}/js/`);
    jsFiles = jsFiles.concat(jsPaths);

    var cssPaths = readFilesInFolder(`www/shared/components/${folderName}/css`);
    cssPaths = pushFilesFullUrlInArray(cssPaths, `www/shared/components/${folderName}/css/`);
    cssFiles = cssFiles.concat(cssPaths);
  });


  // console.log(cssFiles);
  // console.log(jsFiles);

  var returnObj = {
    cssFiles: cssFiles,
    jsFiles: jsFiles
  }

  callback && callback(returnObj);


  return returnObj

}


function pushFilesFullUrlInArray(array, path) {
  var arr = [];
  array.forEach(function (arrItem) {
    arr.push(path + arrItem);
  });

  return arr;
}

function readFilesInFolder(folderPath) {
  try {
    var files = fs.readdirSync(folderPath);
    return files;
  }
  catch (err) {
    // console.log(err);
    return [];
  }
}



function appendHtmlTags(urlObjs, callback) {
  var cssFileWithTags = [];
  var jsFileWithTags = [];
  urlObjs.cssFiles.forEach(function (url) {
    cssFileWithTags.push(`<link rel="stylesheet" href="${url}">`);
  });

  urlObjs.jsFiles.forEach(function (url) {
    jsFileWithTags.push(`<script src="${url}"></script>`);
  });

  var returnObj = {
    cssFiles: cssFileWithTags,
    jsFiles: jsFileWithTags,
  }

  callback && callback(returnObj);

  return returnObj;

}

module.exports = {
  appendHtmlTags : appendHtmlTags,
  getDependencyUrls: getDependencyUrls
}