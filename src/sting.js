var build = require("./build.js"),
	utils = require("./utils.js"),
	exec = require("child_process").exec;

function make(opts){
	if (!opts){
		console.log("Error no options");
		return;
	}

	if (!opts.outputPath){
		console.log("Error no outputPath specified");
		return;
	}

	if (!opts.deps){
		console.log("Error no deps");
		return;
	}

	if (!opts.deps.templateFolder ){
		console.log("Error no templateFolder in deps");
		return;
	}

	if (typeof opts.deps.templateFolder == "string"){
		opts.deps.templateFolder = [opts.deps.templateFolder];
		for(var i in opts.deps.templateFolder){
			if (opts.deps.templateFolder[i].substr(opts.deps.templateFolder[i].length - 1) != "/"){
				opts.deps.templateFolder[i] += "/";
			}
		}
	}

	// let's create tmp folder
	utils.createDirIfNotExist("build");

	if (opts.relativePath){
		opts.outputPath = opts.outputPath + opts.relativePath;
	}

	// Let's create the cdn folder if not exists
	utils.createDirIfNotExist(opts.outputPath);
	utils.createDirIfNotExist(opts.outputPath + "/img");
	utils.createDirIfNotExist(opts.outputPath + "/css");
	utils.createDirIfNotExist(opts.outputPath + "/js");
	utils.createDirIfNotExist(opts.outputPath + "/fonts");

	var htaccess = "RewriteEngine On\n" +
					"RewriteCond %{REQUEST_FILENAME} !-f\n" +
					"RewriteCond %{REQUEST_FILENAME} !-d\n" +
					"RewriteCond %{REQUEST_URI} !index\n" +
					"RewriteRule (.*) index.html [L]\n";

	var debug = opts && opts.debug===true ? true : false;

	if (!debug){
		build.buildJS({
			"files": opts.deps.JS,
			"outputPath" : opts.outputPath + "/js",
			"outSourceMap" :  opts.outSourceMap
		});
	}

	if (!opts.langs){
		utils.createDirIfNotExist(opts.outputPath );
		utils.createFileIfNotExist(opts.outputPath + "/.htaccess",htaccess);
		build.buildHTML({
			"templateFolder": opts.deps.templateFolder,
			"jsFiles" :  opts.deps.JS,
			"lang": null,
			"outputPath" : opts.outputPath,
			"debug" : debug,
			"relativePath" : opts.relativePath,
			"envFile": opts.deps.envFile,
			"config": opts.deps.config
		});
	}
	else{

		var i18n = require("i18n");
		i18n.configure({
		    locales:opts.langs,
		    directory: opts.outputPath + "/locales"
		});

		for (var i=0;i< opts.langs.length;i++){
			utils.createDirIfNotExist(opts.outputPath +"/"+ opts.langs[i]);
			utils.createFileIfNotExist(opts.outputPath +"/"+ opts.langs[i] + "/.htaccess",htaccess);

			console.log("\n--------------------");
			console.log("Building HTML [" + opts.langs[i] + "]");
			console.log("--------------------");

			build.buildHTML({
				"templateFolder": opts.deps.templateFolder,
				"jsFiles" :  opts.deps.JS,
				"i18n" : i18n,
				"lang": opts.langs[i],
				"outputPath" : opts.outputPath + "/" + opts.langs[i],
				"debug" : debug,
				"relativePath" : opts.relativePath,
				"envFile": opts.deps.envFile,
				"config": opts.deps.config
			});
		}
	}

	build.buildLESS({
		"inputfile": opts.deps.lessFile,
		"outputfile" : opts.outputPath + "/css/styles.min.css",
		next: function(){
			extraResources(opts);
		}
	});


}

function extraResources(opts){

	var error = 0;
	if (opts.extraResources){

		var fs = require('fs-extra');
		var counter = opts.extraResources.length;

		for (var i in opts.extraResources){
			var f = opts.extraResources[i];

			if (!opts.debug || !f.onDebugIgnore){

				try{
					fs.copySync(f.srcFolder, opts.outputPath + "/" + f.dstFolder);
				}
				catch (err) {
					error++;
				  console.error(err.message)
				}
			}
		}

	}
	if (!error)
		console.log("Build process completed");

	// Clean build folder
	utils.deleteBuildFolder();


}

exports.make = make;
