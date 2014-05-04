var http = require('http');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');


http.createServer(function (req, res) {

    var body = '';
    function writeln(text) {
        body = body + text + '\n';
    };
    function debug(text) {
        //writeln(text);
    }
    function hashText(text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }
    function hashFile(filename) {
        var s = fs.readFileSync(filename).toString();
        var returnVal = hashText(s);
        function debug() {
            writeln('##### START' + filename);
            writeln('contents: [' + s + ']');
            writeln('hash: [' + returnVal + ']');
            writeln('##### END' + filename);
        }
        //debug();
        return returnVal;
    }

    function getExcludedFiles() {
        var excludeFile = 'manifest_exclude.txt';
        var results = [];
        results.push(excludeFile);

        var contents = fs.readFileSync(excludeFile);
        if (contents) {
            //writeln(excludeFiles);
            var tmp = contents.toString().split('\r\n');
            if (tmp) {
                tmp.forEach(function (file) {
                    if (file !== '') {
                        results.push(file);
                    }
                });
            }
        }

        function debugExcluded() {
            results.forEach(function (file) {
                debug('"' + file + '"');
            });
        }
        //debugExcluded();

        results.contains = function (value) {
            var returnVal = false;
            this.forEach(function (file) {
                if (value == file) {
                    returnVal = true;
                }
            });
            return returnVal;
        }

        return results;
    }

    var excludedFiles = getExcludedFiles();

    var hashes = '';

    res.writeHead(200, { 'Content-Type': 'text/cache-manifest' });
    writeln('CACHE MANIFEST');

    // This SHOULD work using readdir (asynchronous) but it doesn't for some reason...
    function writeFiles(dir) {
        debug('#' + dir);
        var files = fs.readdirSync(dir);

        files.forEach(function (file) {
            var filepath = dir + '/' + file;
            var filepathOutput = filepath.slice(2);
            if (!excludedFiles.contains(filepathOutput)) {
                var stats = fs.statSync(filepath);
                if (stats.isDirectory(filepath)) {
                    writeFiles(filepath);
                }
                else {
                    hashes = hashes + hashFile(filepath);
                    writeln(filepathOutput);
                }
            } else {
                debug('# Excluded: ' + filepathOutput);
            }
        });
    }
    var dir = '.';
    writeFiles(dir);
    debug('hashes: [' + hashes + ']');
    var hash = hashText(hashes);
    writeln('# Hash: ' + hash);

    debug('# Done.');

    res.end(body);

}).listen(process.env.PORT || 8080);