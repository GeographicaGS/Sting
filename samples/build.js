var sting = require("../src/sting.js"),
    deps = require("./deps.js").deps;

var debug = (process.argv.length == 3 && process.argv[2]=="debug") ? true : false;
    
sting.make({
    "debug" : debug,
    "deps" : deps,
    "outputPath" : "../www",
    // Languages
    "langs" : ["es","en","fr"],
    //"langs" : null ,
    "localesPath" : "../locales"
});

