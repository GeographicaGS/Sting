var fs = require('fs'),
	tmp = "build/tmp";

function combineFiles (files) {
	var content = '';
	for (var i = 0, len = files.length; i < len; i++) {
		content += fs.readFileSync(files[i], 'utf8') +"\n\n";		
	}
	return content;
}
exports.combineFiles = combineFiles;

function getFiles(deps) {
	var files = [];

	for (var i in deps.src) {
		files.push(deps.src[i]);
	}

	return files;
};
exports.getFiles = getFiles;

function getJSThirpartyCombined(deps){
    var filesThirdParty = getFiles(deps.JS.ThirdParty);
    return combineFiles(filesThirdParty)
};
exports.getJSThirpartyCombined = getJSThirpartyCombined;

function loadSilently(path) {
	try {
		return fs.readFileSync(path, 'utf8');
	} catch (e) {
		return null;
	}
};
exports.loadSilently = loadSilently;

function createDirIfNotExist(path)
{
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
}

exports.createDirIfNotExist=  createDirIfNotExist;

function createFileIfNotExist(path,content){
	if (!fs.existsSync(path)) {
		fs.writeFile(path, content, function(err) {
		    if(err) {
		        console.log("ERROR saving " + path +" " + err);
		    }
		});
	} 
}
exports.createFileIfNotExist=  createFileIfNotExist;


function getTmpFolder()
{
	return tmp;
}
exports.getTmpFolder = getTmpFolder;


exports.tmp = tmp;
