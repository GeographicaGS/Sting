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

	for (var i=0;i<deps.length;i++) {
		if (typeof deps[i] === "object"){
			files.push(deps[i].src);
		}
		else{
			// if no object dep is compiled
			files.push(deps[i]);
		}
	}

	return files;
};

exports.getFiles = getFiles;

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

exports.deleteBuildFolder = function(){
	if (fs.existsSync('build')) {
		fs.rmdirSync('build')
	} 
}

/**
 * Search into an array one string and return the index
 * @param {Array} files - array files
 * @param {String} stringToMatch - string to find
 * @return {Number} - index where param "stringToMatch" is
 */
function getStringIndexIntoArray(items, stringToMatch){
	return items.findIndex(function(item) {
		return item.indexOf(stringToMatch) > -1
	})
}

exports.getStringIndexIntoArray = getStringIndexIntoArray;

/**
 * Generate the "script" tag from different files to load them dynamically
 * 
 * IMPORTANT - This function must be implemented (or copy it from here) where
 * we want to use the option to load the "blocked scripts"
 *
 * @param {String} type - <optional> string to identify the script to load
 */
function loadBlockedScripts(type) {
	var currentType = typeof type === 'string'
		? type
		: 'javascript/blocked'

	if (document) {
		var scripts = document.getElementsByTagName('SCRIPT');
		var scriptsToLoad = [];

		for (var i = 0; i < scripts.length; i++) {
			if (scripts[i].getAttribute('src') && scripts[i].getAttribute('type') === currentType) {
				var currentScript = document.createElement('script');

				currentScript.src = scripts[i].getAttribute('src');
				currentScript.type = 'application/javascript';
				scriptsToLoad.push(currentScript)
			}
		}

		for (var i = 0; i < scriptsToLoad.length; i++) {
			document.head.appendChild(scriptsToLoad[i]);
		}
	}
};

exports.loadBlockedScripts = loadBlockedScripts;
