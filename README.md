WWW-Builder
===========

#About 

WWW-Builder is a multilanguage builder for Web Applicactions.

Input : A bunch of underscore templates, JS files and CSS files.

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

# Dependecies

This builder uses node-js and several modules. 

Install Node js and run:

```
sudo npm install -g uglifyjs
sudo npm install -g uglifycss
sudo npm install -g jshint
sudo npm install -g pg
sudo npm install -g less
# necesario para el builder-watcher 
sudo npm install -g node-watch

export NODE_PATH=/usr/local/lib/node_modules
```












