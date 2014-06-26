var fs = require('fs'),    
    config = require("./config.js").config,
    langs = config.langs,         
	utils = require("./utils.js");
    
    
function getScriptTag(file){
	return "<script type='text/javascript' src='" + file + "'></script>";	
}

function generateIndex(deps,cdnPath,lang,templates,debug){
	
	var	tmp = utils.getTmpFolder(),
		index = fs.readFileSync(tmp +"/index-"+lang + ".html", "utf8");
	
	index = index.replace("<body>","<body>" + templates);
	
	if (!debug) {
		index = index.replace("</body>",getScriptTag("/"+lang+"/js/main.min.js") + "</body>").replace(/\n/g,"");
	}
	else{
		var jsThird = deps.JS.ThirdParty.src;
			jsCore =  deps.JS.Core.src;
		
		var js = "";
		
		for (i in jsThird) {
			js += getScriptTag("/src/" + jsThird[i]) +"\n\n";
		}
		
		for (i in jsCore) {
			js += getScriptTag("/src/" + jsCore[i]) +"\n\n";
		}
		
		index = index.replace("</body>",js + "</body>");
	}
    
   
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

function copyFileIsNew(oldPath,newPath) {
    var oldStream = utils.loadSilently(oldPath)
        newStream = fs.readFileSync(newPath, 'utf8');
        
    // read file silently
    if (oldStream != newStream) {
        // file has changed
        fs.writeFileSync(oldPath, newStream);
        console.log("\tSaved "+oldPath);
    }
    else{
        // File has not changed
        console.log("\t"+oldPath + " (unchanged)");
    }
    
}

exports.create = function(deps,cdnPath,debug){
    console.log("Creating resources files" + (debug ? " (debug enable)" : ""));
	
	var tmp = utils.getTmpFolder();
		
    for (i in langs){
        var lng = langs[i],
			cdnLangPath = cdnPath + "/" + lng,
			jsLangPath = cdnPath + "/" + lng +"/js";
		
		utils.createDirIfNotExist(cdnLangPath);
		utils.createDirIfNotExist(jsLangPath);
        // Recreate index.html
        templates = fs.readFileSync(tmp +"/template-"+lng+".html", "utf8");
        generateIndex(deps,cdnPath,lng,templates,debug);
        
        // Refresh js main file
		if (!debug) {
			var jsNewPath = tmp +"/main-" + lng + ".min.js",
				jsOldPath = jsLangPath + "/main.min.js";
			copyFileIsNew(jsOldPath,jsNewPath);
		}
       
    }
    
    // Refresh css main file.
    var cssNewPath =  tmp +"/main.min.css",
        cssOldPath = cdnPath + "/css/main.min.css";
        copyFileIsNew(cssOldPath,cssNewPath);
		
    
};