Sting
===========

#About 

Sting is a multilanguage builder for Backbone Applicactions. 

Input : A bunch of underscore templates, JS files and CSS/LESS files.

Output:  

```
	/css/main.min.css
	/en
		index.html 
		js/main.min.js

	/es 	
		index.html 
		js/main.min.js
```

# Install

```
npm install sting-builder
```

# Getting started
```
var sting = require('sting-builder'),
    deps = require('./deps.js').deps;

var debug = (process.argv.length == 3 && process.argv[2]=='debug') ? true : false;
    
sting.make({
  'debug' : debug,
  'deps' : deps,
  'outputPath' : '/usr/share/nginx/html',
  // Languages
  'langs' : [],    
  'outSourceMap' :  debug ? 'main.min.map' : null
});



```

For more info check the samples folder.

We need to improve the doc and the samples, in the meantime, if you want more information email us at developers@geographica.gs












