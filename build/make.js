var build = require("./build.js");
var translate = require("./translate.js");
var resource = require("./resource.js");
var utils = require("./utils.js"),
	config = require("./config.js").config;



function make(opts){
	console.log(opts)
	if (!opts){
		console.log("Error no options");
		return;
	}
	
	if (!opts.cdnPath){
		console.log("Error no cdnPath specified");
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

	if (opts.deps.templateFolder.substr(opts.deps.templateFolder.length - 1) != "/"){
		opts.deps.templateFolder += "/";
	}

	// let's create tmp folder
	utils.createDirIfNotExist("build");
	utils.createDirIfNotExist(utils.tmp);

	// Let's create the cdn folder if not exists
	utils.createDirIfNotExist(opts.cdnPath);
	utils.createDirIfNotExist(opts.cdnPath + "/img");
	utils.createDirIfNotExist(opts.cdnPath + "/css");
	utils.createDirIfNotExist(opts.cdnPath + "/fonts");

	var htaccess = "RewriteEngine On\n" +
					"RewriteCond %{REQUEST_FILENAME} !-f\n" +
					"RewriteCond %{REQUEST_FILENAME} !-d\n" +
					"RewriteCond %{REQUEST_URI} !index\n" +
					"RewriteRule (.*) index.html [L]\n";

	for (var i=0;i< config.langs.length;i++){
		utils.createDirIfNotExist(opts.cdnPath +"/"+ config.langs[i]);	
		utils.createFileIfNotExist(opts.cdnPath +"/"+ config.langs[i] + "/.htaccess",htaccess);
	}

	
	var debug = opts && opts.debug===true ? true : false;

	console.log("--------------------------------------");
	console.log("---------- BUILDING  -------------");
	console.log("--------------------------------------");
	build.buildJS(opts.deps);
	build.buildCSS(opts.deps);
	build.buildTemplate(opts.deps);

	var s = "Translating";

	s += debug ? " DEBUG" : "";

	console.log("\n----------------------------------------");
	console.log("---------- " + s + " ---------");
	console.log("----------------------------------------");
	translate.translate(opts.deps,function(){
		console.log("\n-----------------------------------------------");
		console.log("---------- BUILDING  RESOURCES ---------");
		console.log("-----------------------------------------------");
		resource.create(opts.deps,opts.cdnPath,debug);
		if (debug){
			console.log("\n\nDEBUG BUILD COMPLETE SUCCESSFULLY\n\n");
		}
		else{
			console.log("\n\nBUILD COMPLETE SUCCESSFULLY\n\n");
		}
	},debug);

}

exports.make = make;

