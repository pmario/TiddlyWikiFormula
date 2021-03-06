/*\
title: $:/plugins/ebalster/modloader/utils.js
type: application/javascript
module-type: library

Utility functions and data storage for the modloader.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: true */
"use strict";


var DiffLib = require("$:/plugins/ebalster/modloader/diff_patch_match.js");
exports.diff = new DiffLib.diff_match_patch();

// Pretty liberal timeout
exports.diff.Diff_Timeout = 10.0;

// Plenty of context on patches
exports.diff.Patch_Margin = 8;

/*
	Find the shadow tiddler in the given plugin and return it.
		If no pluginTitle is provided, attempt to guess it.
		Result (if non-null) is a new object {source: <plugin title>, fields: {<original fields>}} 
*/
exports.findOriginalShadow = function findOriginalShadow(title, pluginTitle) {
	// Direct search if pluginTitle is specified.
	if (pluginTitle) {
		var plugInfo = $tw.wiki.getPluginInfo(pluginTitle);
		if (plugInfo && plugInfo.tiddlers && plugInfo.tiddlers[title]) return {
			fields: plugInfo.tiddlers[title],
			source: pluginTitle,
		};
		return null;
	}

	// No pluginTitle: first try core (most likely mod target)
	var found = findOriginalShadow(title, "$:/core");
	if (found) return found;

	// Then try all other tiddlers in the wiki.
	//   TODO would be nice to do this in load order somehow
	$tw.wiki.each(function(searchTiddler, searchTitle) {
		// Do NOT consider temp tiddlers, which are usually generated.
		if (searchTitle.substr(0,7) == "$:/temp") return;
		if (!found) found = findOriginalShadow(title, searchTitle);
	});
	return found;
};

exports.modBackupTiddlers = {};


// Alert display path
exports.PATH_ALERT_TEMPLATE = "$:/plugins/ebalster/modloader/alert";

exports.PATH_MOD_PLUGIN = "$:/temp/mod-plugin";
exports.PATH_MOD_STATUS = "$:/temp/mod-plugin/status";
exports.PATH_ALERT_PREFIX = "$:/temp/mod-plugin/alert";

var ALERT_COUNTER = 1;

//var ALERT_PREFIX = "$:/temp/"


exports.showModAlertEx = function(template, fields) {
	var tiddler;
	var affix = {
		title: exports.PATH_ALERT_PREFIX + "/" + exports.ALERT_COUNTER++,
		tags: "[[$:/tags/Alert]]",
		component: "Modloader Plugin"
	};
	if (template) {
		tiddler = new $tw.Tiddler($tw.wiki.getTiddler(template), fields, affix);
	}
	else {
		tiddler = new $tw.Tiddler(fields, affix);
	}
	$tw.wiki.addTiddler(tiddler);
};

exports.showModLoaderAlert = function(fields) {
	exports.showModAlertEx(exports.PATH_ALERT_TEMPLATE, fields);
};

exports.showGenericAlert = function(text) {
	exports.showModAlertEx(null, {text: text});
};


})();