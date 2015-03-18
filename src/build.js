var fs = require('fs'),
    jshint = require('jshint'),
    UglifyJS = require('uglify-js'),
	UglifyCSS = require('uglifycss'),       
	utils = require("./utils.js");

function getSizeDelta(newContent, oldContent, fixCRLF) {
	if (!oldContent) {
		return ' (new)';
	}
	if (newContent === oldContent) {
		return ' (unchanged)';
	}
	if (fixCRLF) {
		newContent = newContent.replace(/\r\n?/g, '\n');
		oldContent = oldContent.replace(/\r\n?/g, '\n');
	}
	var delta = newContent.length - oldContent.length;

	return delta === 0 ? '' : ' (' + (delta > 0 ? '+' : '') + delta + ' bytes)';
}

function combineFilesTemplate(files) {
	var content = '';
	for (var i = 0, len = files.length; i < len; i++) {
		
		content += "<script type='text/template' id='"+files[i].slice(0,-5) +"'>\n" + fs.readFileSync(files[i], 'utf8') +"</script>\n\n";		
	}
	return content;
}

function bytesToKB(bytes) {
    return (bytes / 1024).toFixed(2) + ' KB';
};


exports.buildJS = function (opts) {

	var files = opts.files,
		i18n = opts.i18n,
		lang = opts.lang,
		targetStr = "";

	for (var i=0;i<files.length;i++){
		var fileCompiled;
		if (typeof files[i] === "object"){
			//console.log(files[i]);
			if (!files[i].hasOwnProperty("src")){
				throw("Not found src for "+ files[i]);
			}
			fileSrc = files[i].src;
		}

		else{
			fileSrc = files[i];
		}

		var fileString = utils.loadSilently(fileSrc);

		if (lang){
			var translate = require("./translate.js")(i18n);
			fileString = translate.translate(fileString,lang);
		}

		if (typeof files[i] === "object" && files[i].compiled==true){
			console.log("Attaching file " + fileSrc);
			// not compile this file
			fileCompiled = fileString;
		}
		else{
			console.log("Compiling file " + fileSrc);
			fileCompiled = UglifyJS.minify(fileString, {
				warnings: true,
				fromString: true
			}).code;
		}

		targetStr += fileCompiled;
	}

	var path = opts.outputPath + "/main.min.js";
	fs.writeFileSync(path, targetStr);
	
};

exports.buildCSS = function (opts){

	var files = opts.files,
		targetStr = "",
		less = require('less'),
		parser = new(less.Parser);
	
	for (var i=0;i<files.length;i++){
		var fileCompiled;
		if (typeof files[i] === "object"){

			if (!files[i].hasOwnProperty("src")){
				throw("Not found src for "+ files[i]);
			}

			fileSrc = files[i].src;
		}

		else{
			fileSrc = files[i];
		}

		if (typeof files[i] === "object" && files[i].compiled==true){
			console.log("Attaching file " + fileSrc);
			// not compile this file
			fileCompiled = utils.loadSilently(fileSrc);
		}
		else{
			console.log("Compiling file " + fileSrc);
			var newSrc = utils.loadSilently(fileSrc),
				path = require('path'),
				extension = path.extname(fileSrc);

			if (extension == ".less"){
				less.render(newSrc,{compress: true }, function (e, output) {
					if (e){
						console.error("Error found at line: " + e.line + ", column: " + e.column);
						console.error("Error says: " + e.message);
						throw ("Error building "+ fileSrc);
					}
					fileCompiled = output.css;
				});	
			}
			else if (extension == ".css") {
				fileCompiled = UglifyCSS.processString( 
					newSrc, {
					maxLineLen : 500,
					expandVars : true 
				});
			}
			// else ... Maybe support for Sass in the future 
		}
		targetStr += fileCompiled;
	}

	var fpath = opts.outputPath + "/css/styles.min.css";
	console.log("Build successfully styles.min.css");
	fs.writeFileSync(fpath, targetStr);
	
}

function getTemplateFiles(tplFolder) {
	var file = require("file");
	response = [];

	file.walkSync(tplFolder, function(dirPath, dirs, files){
		
		for (var i=0;i<files.length;i++) {
			
			if (files[i] != "index.html") {
				response.push(dirPath + "/" + files[i]);
			}
		}
	});

	return response;
}


function getScriptTag(file){
	return "<script type='text/javascript' src='" + file + "'></script>";	
}

function generateIndex(version,deps,cdnPath,lang,templates,debug){
	
	var	tmp = utils.getTmpFolder(),
		index = fs.readFileSync(tmp +"/index-"+lang + ".html", "utf8");
	
	index = index.replace("<body>","<body>" + templates);
	index = index.replace("main.min.css","main.min.css?"+version);
	
	if (!debug) {
		index = index.replace("</body>",getScriptTag("/" + lang +"/js/main.min.js?" + version) + "</body>").replace(/\n/g,"");
	}
	else{
		var jsThird = deps.JS.ThirdParty.src;
			jsCore =  deps.JS.Core.src;
		
		var js = "";
		
		for (i in jsThird) {
			js += getScriptTag("/src/" + jsThird[i] + "?" + version) +"\n\n";
		}
		
		for (i in jsCore) {
			js += getScriptTag("/src/" + jsCore[i] +"?" + version) + "\n\n";
		}
		
		index = index.replace("</body>",js + "</body>");
	}

	var jsVersion = "<script type='text/javascript'>app.version='"+ version+"'</script>";
    index = index.replace("</body>",jsVersion + "</body>");
   
	var newPath = cdnPath + "/" + lang + "/index.html",
		oldStream = utils.loadSilently(newPath)
    
	if (oldStream != index) {
		// index has been modified
		fs.writeFileSync(newPath, index);
		console.log("\tSaved "+ newPath);
	}
	else{
		// index has not been modified
		console.log("\t"+newPath + " (unchanged)");
	}
	
};

exports.buildHTML = function (opts){

	var templateFiles = getTemplateFiles(opts.templateFolder),
		jsFiles = opts.jsFiles,
		lang = opts.lang,
		templateString = combineFilesTemplate(templateFiles);

	if (lang){
		var translate = require("./translate.js")(opts.i18n);
		templateString = translate.translate(templateString,lang);
	}

	// Small compression remove \t\n
	templateString = templateString.replace(/\n/g,"");
	templateString = templateString.replace(/\t/g,"");

	var index = fs.readFileSync(opts.templateFolder +"/index.html", "utf8");

	index = index.replace("<body>","<body>" + templateString);

	var js = "";

	var jsPathPrefix = opts.debug ? "/src" : lang + "/";

	for (var i=0;i<jsFiles.length;i++){
		var f = typeof jsFiles[i]=="object" ? jsFiles[i].src : jsFiles[i];
		js += getScriptTag(jsPathPrefix + f);
	}
	
	index = index.replace("</body>",js + "</body>");
	var path = opts.outputPath + "/index.html";
	fs.writeFileSync(path, index);
	console.log("Build " +path);

}
