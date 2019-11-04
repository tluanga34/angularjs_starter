let fs = require("fs");
let http = require("http");
let path = require("path");
let mime = require('mime');
let chokidar = require('chokidar');
let opn = require('opn');
let sass = require('node-sass');

let dependency = require("./modules/dependency_module.js");
let port = 8080;
let directoryPath = "./";

let cssFiles;
let jsFiles;
let server;


dependency.getDependencyUrls(function (responseObj) {
  dependency.appendHtmlTags(responseObj, function (responseObj) {
    cssFiles = responseObj.cssFiles;
    jsFiles = responseObj.jsFiles;

    // console.log(responseObj);
    createServer();
  });
});



function createServer() {
  server = http.createServer(requestListener);
  checkPort(8080, function (port) {
    server.listen(port, function () {
      opn("http://localhost:" + port);
      watchFiles(function () {
      });
    });
  });
}


function requestListener(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  
  var url = req.url.split('?')[0]

  // Attaches path prefix with --path option
  var possibleFilename = resolveUrl(url.slice(1)) || "dummy";
  var safeFileName = path.normalize(possibleFilename).replace(/^(\.\.[\/\\])+/, '');
  // Insert "." to ensure file is read relatively (Security)
  var safeFullFileName = path.join(".", safeFileName);
  safeFullFileName = safeFullFileName.replace(/\\/g, '/');

  var safeFileNameSplited = safeFullFileName.split("/");

  var extName = path.extname(safeFullFileName);

  // console.log("extName");
  // console.log("safeFileNameSplited[0]");
  // console.log(safeFileNameSplited[0]);

  if (extName == '.html' || safeFileNameSplited[0] == "shared") {
    safeFullFileName = 'www/' + safeFullFileName;
  }


  // console.log("safeFullFileName");
  // console.log(safeFullFileName);


  if (safeFullFileName == undefined) {
    write404(res);
    return;
  }
  else if (req.url == '/' || !extName) {
    sendIndexPage(res);
  }
  else if (extName == ".scss") {
    sass.render({
      file: safeFullFileName,
      outputStyle : "expanded",
      includePaths: [
        `www/config/`,
      ]
    }, function (err, result) {
      // console.log("err");
      // console.log(err);
      if (!err) {
        res.writeHead(200, {
          'Content-Type': 'text/css'
        });
        res.write(result.css);
        res.end();
      } else {
        write404(res, `/*${err}*/`);
      }
    });

  }
  else {
    fs.stat(safeFullFileName, function (err, stats) {
      if (!err && stats.isFile()) {
        fs.readFile(safeFullFileName, function (err, fileBuffer) {
          let ct = mime.getType(safeFullFileName);
          res.writeHead(200, {
            'Content-Type': ct
          });
          res.write(fileBuffer);
          res.end();
        })
      }
      //FILE IS NOT FOUND
      else {
        write404(res);
      }
    });
  }
}

function sendIndexPage(res) {

  var buildScriptExtra = [];
  var sourceFiles = cssFiles.concat(buildScriptExtra, jsFiles);


  indexFile = fs.readFileSync(`www/index.html`, "utf8");
  indexFile = indexFile.replace("<!-- sourceFileMacro -->", sourceFiles.join("\n"));

  // console.log(indexFile);


  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.write(indexFile);
  res.end();
}

function resolveUrl(filename) {
  // basic santizing to prevent attempts to read files outside of directory set
  if (filename.includes("..")) {
    return null;
  }
  if (filename && directoryPath) {
    return path.join(directoryPath, filename);
  } else {
    return filename;
  }
}




function write404(res, body) {
  res.writeHead(404, {
    "Content-Type": "text/html"
  });
  let fileBuffer = body || "<h4 style='color: red'>This file does not exist</h4>";
  res.write(fileBuffer);
  res.end();
}


function watchFiles(callback) {
  // console.log("watchFiles");

  var commonFilesToWatch = [
    "www",
  ]

  const allWatch = chokidar.watch(commonFilesToWatch, {
    // ignored: `merchant/${argv.merchant}/bower_components/*`,
    persistent: true
  });

  var timeout;

  allWatch.on('add', path => {
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      // log(`File ${path} has been added`);

      dependency.getDependencyUrls(function (responseObj) {
        dependency.appendHtmlTags(responseObj, function (responseObj) {
          cssFiles = responseObj.cssFiles;
          jsFiles = responseObj.jsFiles;
        });
      });


    }, 200)
  });

  allWatch
    .on('change', path => {
      // log(`File ${path} has been changed`);
      // reloadClient();
    });
}




function checkPort(port, callback) {
  isPortTaken(port, function (response) {
    if (response == true) {
      console.log("Port " + port + "is busy. Incremeting port");
      checkPort(++port, callback);
    } else {
      callback(port);
    }
  });
}


function isPortTaken(port, fn) {
  var net = require('net');
  var tester = net.createServer()
    .once('error', function (err) {
      if (err.code != 'EADDRINUSE') return fn(err)
      fn(true)
    })
    .once('listening', function () {
      tester.once('close', function () {
        fn(false)
      })
        .close()
    })
    .listen(port)
}