var deps = {};

deps.templateFolder = "js/template";

// Custom environment files (using var=value format, compatible with docker-compose custom environment vars)
deps.envFile = "custom_environment_vars.yml";

// Config file
deps.config = "config.js";

deps.JS = [
	{"src":"js/lib/jquery-2.1.3.min.js", "compiled":true},
	{"src":"js/lib/underscore-1.8.2.min.js", "compiled":true},
	{"src":"js/lib/backbone-1.1.2.min.js", "compiled":true},
	// Namespace
	"js/namespace.js",

	// --------------------
	// ------  Views ------
	// --------------------
	"js/view/error_view.js",
	"js/view/notfound_view.js",
	"js/view/home_view.js",

	// router
	"js/router.js",
	// app
	"js/app.js"
];

deps.CSS = [
	"css/lib/WWW-Styles/reset.less",
	"css/lib/WWW-Styles/base.less",
	"css/styles.less",
	"css/home.less"
];

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}
