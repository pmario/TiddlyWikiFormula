/*\
title: $:/plugins/ebalster/modloader/parsers/patch.js
type: application/javascript
module-type: parser

Render tiddlers of type "text/x-patch" like other plaintext tiddlers.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var modutil = require("$:/plugins/ebalster/modloader/utils.js");
var diff    = modutil.diff;

var TextParser = function(type,text,options) {

	var patches = diff.patch_fromText(text || "");

	//var src = 

	//var diff = diff.diff_main()

	// Render the patch's insertions, deletions and preservations...
	var html = [];
	for (var i = 0; i < patches.length; i++) {

		// Render patch location note
		var patch = patches[i];
		html.push({
			type:"element",
			tag: "h3",
			children: [{
				type: "text",
				text: "@@ -" + (patch.start1+1) + "," + patch.length1 +
					" +" + (patch.start2+1) + "," + patch.length2 + " @@"
			}]
		});
		html.push({type:"element", tag: "hr"});

		// Render the diffs
		for (var j = 0; j < patch.diffs.length; ++j) {
			var curdiff = patch.diffs[j];
				var tag = "span";
			switch (curdiff[0]) {
				case +1: tag = "ins";  break;
				case -1: tag = "del";  break;
				case  0: tag = "span"; break;
			}
			html.push({
				type:"element",
				tag: tag,
				children: [{type: "text", text: curdiff[1]}]
			});
		}
		html.push({type:"element", tag: "hr"});
	}

	// DEBUG
	//var html = [{type:"text", text: text}]; //text: JSON.stringify(patch,null,' ')}];

	this.tree = [{
		type: "element", tag: "pre",
		attributes: {class: {type: "string", value: "modloader-patch"}},
		children: [{type: "element", tag: "code", children: html}]
	}];
};

exports["text/x-patch"] = TextParser;

})();

