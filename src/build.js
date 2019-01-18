var fs = require('fs'),
		jshint = require('jshint'),
		UglifyCSS = require('uglifycss'),
		utils = require("./utils.js"),
		babel = require("babel-core"),
		// To split the files
		mainJsFile = 'main.min.js',
		thirdJsFile = 'third.min.js',
		tagMainBlock = '@finish-main-block';

function combineFilesTemplate(files,templateFolders) {
	var content = '';
	for (var i = 0, len = files.length; i < len; i++) {

		var f = files[i].slice(0,-5);

		for (var f2 in templateFolders){
			f = f.replace(templateFolders[f2]+"/","");
		}

		f = f.replace(/\//g,"-");

		content += "<script type='text/template' id='"+ f +"'>\n" + fs.readFileSync(files[i], 'utf8') +"</script>\n\n";
	}

	return content;
}

function bytesToKB(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB';
};

exports.buildJS = function (opts) {

	console.log("-------");
	console.log("Building javascript code");
	console.log("-------");

	var files = utils.getFiles(opts.files),
			mainFiles = [],
			thirdFiles = [],
			// Check out if exist a "main-block" in load files
			indexMainBlock = utils.getStringIndexIntoArray(files, tagMainBlock);

	// Set which are the files to will compose the JS files
	if (indexMainBlock > -1) {
		files[indexMainBlock] = files[indexMainBlock].replace(tagMainBlock, '');// Remove from files the tag value tagMainBlock
		mainFiles = files.slice(0, (indexMainBlock + 1)) // Files to "main.min.js" file
		thirdFiles = files.slice((indexMainBlock + 1)) // Files to "third.min.js" file
	} else {
		mainFiles = files // Files to "main.min.js" file
	}

	process.env.BABEL_ENV='production';

	// Create the different JS files
	if (mainFiles.length > 0) {
		createMinFile(mainFiles, mainJsFile)
	}

	if (thirdFiles.length > 0) {
		createMinFile(thirdFiles, thirdJsFile)
	}

	/**
	 * Create new JS minified file 
	 * @param {Array} files - files composes the minified file
	 * @param {String} name - name file
	 */
	function createMinFile(files, name) {
		var code = utils.combineFiles(files);
		var result = babel.transform(code, {
			"presets": ["env"],
			"env": {
				"production": {
					"presets": ["babili"]
				}
			}
		});
		var path = opts.outputPath + '/' + name;
		fs.writeFileSync(path, result.code);
	}

	console.log("Building javascript code completed successfully");
};


exports.buildLESS = function (opts){

	var less = require('less'),
 		parser = new(less.Parser);

 	var	inputfile,
    outputfile = opts.outputfile,
    next = opts.next,
    fileSrc,
    multipleFiles = Array.isArray(opts.inputfile);

  if (multipleFiles) {
    inputfile = opts.inputfile[0];
  } else {
    inputfile = opts.inputfile;
  }

  fileSrc = utils.loadSilently(inputfile);

 // 	less.logger.addListener({
	//     debug: function(msg) {
	//     	console.log(msg);
	//     },
	//     info: function(msg) {
	//     	console.log(msg);
	//     },
	//     warn: function(msg) {
	//     	console.log(msg);
	//     },
	//     error: function(msg) {
	//     	console.log(msg);
	//     }
	// });

 	console.log("-------");
	console.log("Building styles");
	console.log("-------");

	console.log("Input file: "+ inputfile);

	var LessPluginCleanCSS = require('less-plugin-clean-css'),
    	cleanCSSPlugin = new LessPluginCleanCSS({advanced: true}),
    	LessPluginAutoPrefix = require('less-plugin-autoprefix'),
    	autoprefixPlugin = new LessPluginAutoPrefix({browsers: ["last 2 versions"]});

  if (multipleFiles) {
    for(let i=1; i<opts.inputfile.length; i++){
      console.log(`    - Adding "${opts.inputfile[i]}"`);
      fileSrc += `\n@import "${opts.inputfile[i]}";`;
    }
  }

 	less.render(fileSrc, {
			//compress: true,
			'paths': ['./css','.','./src'],
			'plugins': [cleanCSSPlugin,autoprefixPlugin]

 		})
	    .then(function(output) {
	    	console.log("Writing render result to "+ outputfile);
	    	fs.writeFileSync(outputfile, output.css);

	    	console.log("Building styles completed successfully ("+ outputfile + ")");
			// output.css = string of css
	        // output.map = string of sourcemap
	        // output.imports = array of string filenames of the imports referenced
	        if (next){
	        	next();
	        }

	    },
	    function(error) {
	    	var msg = "";

	    	if (error.message){
	    		msg += error.message;
	    	}
	    	if (error.filename){
	    		msg += ' [ File: ' + error.filename + ']';
	    	}
	    	if (error.line){
	    		msg += ' [ Line: ' + error.line + ']';
	    	}
	    	if (error.column){
	    		msg += ' [ Col: ' + error.column + ']';
	    	}
	    	console.log(msg);

	    });

}

function getTemplateFiles(tplFolder) {
	var file = require("file");
	response = [];

	for (var f in tplFolder){

		file.walkSync(tplFolder[f], function(dirPath, dirs, files){
			for (var i=0;i<files.length;i++) {
				if (["index.html",".DS_Store"].indexOf(files[i])==-1) {
					response.push(dirPath + "/" + files[i]);
				}
			}
		});

	}

	return response;
}

function getConfigFiles(inputFile) {
  var fileSrc = utils.loadSilently(inputFile);
  var replpat = /(@{)([A-Za-z0-9\-_]+)(})/g;
  var match = fileSrc.match(replpat);

  if(match){
    var envpat = /[A-Za-z0-9\-_]+/;
    match.forEach(function(el){
      var envvarname = envpat.exec(el);
      var envvar = process.env[envvarname] || '';
      fileSrc = fileSrc.replace(el,envvar);
    });
  }
	return fileSrc;
}

function loadEnvVarsFile(inputFile) {
  var fileSrc = utils.loadSilently(inputFile);
	var pattern = /([A-Za-z0-9\-/@\()\!\.\:_])+=[ ]*([A-Za-z0-9\-/@\()\!\.\:_])+/g;
	var match = fileSrc.match(pattern);
	var pattern2 = /([A-Za-z0-9\-/@\()\!\.\:_]+)=[ ]*([A-Za-z0-9\-/@\()\!\.\:_]+)/;
	match.forEach(function(el){
		var data = pattern2.exec(el);
		process.env[data[1]] = data[2];
	});
}

/**
 * Get the "script" tag with the correct "type" and "src" attributte
 * @param {String} file - name file
 * @param {Boolean} isBlocked - this file will be blocked in initial load?
 * @return {String} - string tag
 */
function getScriptTag(file, isBlocked){
	var currentType = isBlocked
		? 'javascript/blocked'
		: 'text/javascript';

	return "<script type='" + currentType + "' src='" + file + "'></script>";
}

exports.buildHTML = function (opts){

	var templateFiles = getTemplateFiles(opts.templateFolder),
		jsFiles = opts.jsFiles,
		lang = opts.lang,
		debug = opts.debug,
    compress = opts.compress===false ? false: true,
		templateString = combineFilesTemplate(templateFiles,opts.templateFolder);
		index = fs.readFileSync(opts.templateFolder[0] +"/index.html", "utf8"),
		// Check out if exist a "main-block" in load files
		indexMainBlock = utils.getStringIndexIntoArray(jsFiles, tagMainBlock),
		hasMainBlock = (indexMainBlock > -1);

	if (lang){
		var translate = require("./translate.js")(opts.i18n);
		templateString = translate.translate(templateString,lang);
		index = translate.translate(index,lang);
	}

	// Small compression remove \t\n
	if (compress){
		templateString = templateString.replace(/\n/g,"");
		templateString = templateString.replace(/\t/g,"");
	}

	index = index.replace("</body>", templateString + "</body>" );

  if(opts.envFile){
    loadEnvVarsFile(opts.envFile);
  }

  if(opts.config){
    var config = getConfigFiles(opts.config);
    index = index.replace("</body>", "<script type='text/javascript'>\n" + config + "\n</script>\n</body>");
  }

	var js = "";

	if (debug){
		// Remove from files the tag value tagMainBlock
		if (hasMainBlock) {
			jsFiles[indexMainBlock] = jsFiles[indexMainBlock].replace(tagMainBlock, '')
		}

		for (var i=0; i < jsFiles.length; i++){
			var prefix = opts.relativePath ? opts.relativePath : '';
			js += getScriptTag(prefix + "/src/" + jsFiles[i], (hasMainBlock && indexMainBlock < i)) + "\n";
		}
	} else{
		var prefix = opts.relativePath ? opts.relativePath : '';
		js += getScriptTag(prefix + '/js/' + mainJsFile, false);
		if (hasMainBlock) {
			js += getScriptTag(prefix + '/js/' + thirdJsFile, true);
		}
	}

	index = index.replace("</body>",js + "</body>");

	var path = opts.outputPath + "/index.html";
	fs.writeFileSync(path, index);
	console.log("Build " +path);

}
