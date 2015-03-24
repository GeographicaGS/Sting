var fs = require('fs'),
    jshint = require('jshint'),
    UglifyJS = require('uglify-js'),
	UglifyCSS = require('uglifycss'),       
	utils = require("./utils.js");

function combineFilesTemplate(files) {
	var content = '';
	for (var i = 0, len = files.length; i < len; i++) {
		var id = files[i].slice(0,-5).replace("js/template/","").replace(/\//g,"-");
		
		content += "<script type='text/template' id='"+ id +"'>\n" + fs.readFileSync(files[i], 'utf8') +"</script>\n\n";		
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
		targetStr = "";

	var localopts = {
		"warnings" : true,
	};

	if (opts.outSourceMap){
		localopts["outSourceMap"] = opts.outSourceMap;
		localopts["sourceRoot"] = "/src";
	}

	if (opts.sourceRoot) {
		localopts["sourceRoot"] = opts.sourceRoot;
	}

	var result = UglifyJS.minify(files, localopts);

	console.log("Writing main.min.js");
	var path = opts.outputPath + "/main.min.js";
	fs.writeFileSync(path, result.code);

	if (opts.outSourceMap){
		console.log("Writing " + localopts["outSourceMap"]);
		var path = opts.outputPath + "/" + localopts["outSourceMap"];
		fs.writeFileSync(path, result.map);
	}



	console.log("Building javascript code completed successfully");

};

// exports.buildCSS = function (opts){

// 	var files = opts.files,
// 		targetStr = "",
// 		less = require('less'),
// 		parser = new(less.Parser);
	
// 	for (var i=0;i<files.length;i++){
// 		var fileCompiled;
// 		if (typeof files[i] === "object"){

// 			if (!files[i].hasOwnProperty("src")){
// 				throw("Not found src for "+ files[i]);
// 			}

// 			fileSrc = files[i].src;
// 		}

// 		else{
// 			fileSrc = files[i];
// 		}

// 		if (typeof files[i] === "object" && files[i].compiled==true){
// 			console.log("Attaching file " + fileSrc);
// 			// not compile this file
// 			fileCompiled = utils.loadSilently(fileSrc);
// 		}
// 		else{
// 			console.log("Compiling file " + fileSrc);
// 			var newSrc = utils.loadSilently(fileSrc),
// 				path = require('path'),
// 				extension = path.extname(fileSrc);

// 			if (extension == ".less"){
// 				less.render(newSrc,
// 					{
// 						compress: true,
// 						paths: ['./css', './lib']
// 					}, function (e, output) {

// 						if (e){
// 							console.error("Error found at line: " + e.line + ", column: " + e.column);
// 							console.error("Error says: " + e.message);
// 							throw ("Error building "+ fileSrc);
// 						}
// 						fileCompiled = output.css;
// 						console.log("hola");
// 				});	
// 			}
// 			else if (extension == ".css") {
// 				fileCompiled = UglifyCSS.processString( 
// 					newSrc, {
// 					maxLineLen : 500,
// 					expandVars : true 
// 				});
// 			}
// 			// else ... Maybe support for Sass in the future 
// 		}
// 		console.log("hola2");
		
// 		targetStr += fileCompiled;
// 	}

// 	var fpath = opts.outputPath + "/styles.min.css";
// 	console.log("Build successfully styles.min.css");
// 	fs.writeFileSync(fpath, targetStr);
	
// }

exports.buildLESS = function (opts){

	var less = require('less'),
 		parser = new(less.Parser),
 		inputfile = opts.inputfile,
 		outputfile = opts.outputfile,
 		next = opts.next,
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
    	cleanCSSPlugin = new LessPluginCleanCSS({advanced: true});

 	less.render(fileSrc, {
			//compress: true,
			'paths': ['./css'],
			'plugins': [cleanCSSPlugin]
			
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
	    	console.log(error.message);
	    });

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

exports.buildHTML = function (opts){

	var templateFiles = getTemplateFiles(opts.templateFolder),
		jsFiles = opts.jsFiles,
		lang = opts.lang,
		debug = opts.debug,
		templateString = combineFilesTemplate(templateFiles);
		index = fs.readFileSync(opts.templateFolder +"/index.html", "utf8");

	if (lang){
		var translate = require("./translate.js")(opts.i18n);
		templateString = translate.translate(templateString,lang);
		index = translate.translate(index,lang);
	}

	// Small compression remove \t\n
	if (!opts.debug){
		templateString = templateString.replace(/\n/g,"");
		templateString = templateString.replace(/\t/g,"");	
	}
	

	index = index.replace("</body>", templateString + "</body>" );
	
	var js = "";

	if (debug){
		for (var i=0;i<jsFiles.length;i++){
			//var f = typeof jsFiles[i]=="object" ? jsFiles[i].src : jsFiles[i];
			js += getScriptTag("/src/" + jsFiles[i]) + "\n";
		}
	}
	else{
		js += getScriptTag((lang ? "../" : "") + "js/main.min.js");
	}

	index = index.replace("</body>",js + "</body>");

	var path = opts.outputPath + "/index.html";
	fs.writeFileSync(path, index);
	console.log("Build " +path);

}
