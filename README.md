Sting
===========

It's a deprecated project. Plese, consider using https://github.com/GeographicaGS/genesis

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

# Split application (web) loading process 

If you wish to split the application (web) loading process in one __main block__ ('main.js'), which it load the main libraries (files) and, after some conditions, to load one __third block__, with the other libraries (files) of your application?, you must follow the next steps:

### 1. You must indicate where the main block ends ('main.js')

Edit the file **deps.js** and you must put the tag "@finish-main-block" next to the name of the file that we want to be the last one to be included in the __block main__ ('main.js'), from here, the rest of the files will belong to the __block of third__ ('third.js)

```
deps.JS = [
  ...
  // Namespace
  srcJS + 'Namespace.js',

  // app
  srcJS + 'App.js',

  // Utils
  srcJS + 'Utils.js@finish-main-block'
  ...
];
```

### 2. Load the remaining libraries ('third.js')

After the previous point, our application will correctly load the __block main__, but the __block of third__ will require an additional function to load the remaining libraries (files).

```
function loadScripts() {
 if (document) {
    var blockedScripts = Array.from(document.getElementsByTagName('SCRIPT'))
      .filter( function(script) {
        return script.getAttribute('src') && script.getAttribute('type') === 'javascript/blocked'
      });

    for (var i = 0; i < blockedScripts.length; i++) {
        var currentScript = document.createElement('script');

        currentScript.src = blockedScripts[i].getAttribute('src');
        currentScript.type = 'text/javascript';
        document.head.appendChild(currentScript);
      }
    }
  }
};

```
Deberá implementar la función anterior (o una con igual fin) en algún lugar de su aplicación y ejecutarla en el punto en el que se desee cargar el resto de sus librerias (ficheros).

You must implement the previous function (or one with the same purpose) somewhere in your application and execute it at the point where you want to load the remaining libraries (files).

# More information

For more info check the samples folder.

We need to improve the doc and the samples, in the meantime, if you want more information email us at developers@geographica.gs












