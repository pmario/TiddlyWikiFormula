/*\
title: $:/plugins/ebalster/formula/coerce.js
type: application/javascript
module-type: macro

Type coercion logic for formulas.
Supported types for coercion:

* text
* number
* boolean
* array
* date

Additional types that may be coerced:

* undefined
* regular expression

\*/
(function(){

"use strict";


// Utility function, converting an array to text.
function ArrayToText(arr,ctx) {
	var result = "";
	for (var i = 0; i < arr.length; ++i) {
		var part = exports.ToText(arr[i],ctx);
		if (i && part.length) result += " ";
		if (part.indexOf(/\s/g) >= 0) result += "[[" + part + "]]";
		else result += part;
	}
	return result;
}

// Value-to-text coercion.
var _ToText = {
	"undefined" : function(v,ctx) {return "undefined";},
	"string"    : function(v,ctx) {return v;},
	"number"    : function(v,ctx) {return (ctx.formats.number || String)(v);},
	"symbol"    : function(v,ctx) {return String(v);},
	"function"  : function(v,ctx) {return "function" + (v.formulaSrc || " [built-in]");},
	"boolean"   : function(v,ctx) {return (v ? "TRUE" : "FALSE");},
	"object"    : function(v,ctx) {
		if (v instanceof Date)   return (ctx.formats.date || String)(v);
		if (v instanceof Array)  return (ctx.formats.array || ArrayToText)(v,ctx);
		if (v instanceof RegExp) return String(v);
		if (v instanceof Error)  throw v;
		return JSON.stringify(v); // Last resort
	},
};

// Value-to-number coercion.
var _ToNum = {
	"undefined" : function(v,ctx) {throw "Cannot convert undefined value to number!";},
	"string"    : function(v,ctx) {
		var n = Number(v);
		if (isNaN(n)) throw "Cannot convert \""+v+"\" to number!";
		return n;
	},
	"number"    : function(v,ctx) {return v;},
	"symbol"    : function(v,ctx) {throw "Cannot convert symbol to number!";},
	"function"  : function(v,ctx) {throw "Cannot convert function to number!";},
	"boolean"   : function(v,ctx) {return (v ? 1 : 0);},
	"object"    : function(v,ctx) {throw "Cannot convert \"" + CoerceText.object(v,ctx) + "\" to number!";},
};

// Value-to-boolean coercion.
var _ToBool = {
	"undefined" : function(v,ctx) {return false;},
	"string"    : function(v,ctx) {return !(/^\s*(undefined|false|null|0+|0*\.0+|0+\.0*|)\s*$/i.test(v));},
	"number"    : function(v,ctx) {return Boolean(v);},
	"symbol"    : function(v,ctx) {return Boolean(v);},
	"function"  : function(v,ctx) {return true;},
	"boolean"   : function(v,ctx) {return v;},
	"object"    : function(v,ctx) {return Boolean(v);},
};

exports.ToSelf = function ToSelf(v,ctx) {return v;};
exports.ToText = function ToText(v,ctx) {return _ToText[typeof v](v,ctx);};
exports.ToNum  = function ToNum (v,ctx) {return _ToNum [typeof v](v,ctx);};
exports.ToBool = function ToBool(v,ctx) {return _ToBool[typeof v](v,ctx);};

exports.ToDate = function ToDate(v,ctx) {
	if (v instanceof Date) return v;
	throw "Cannot auto-convert \"" + ToText(v,ctx) + "\" to a date!";
};
exports.ToArray = function ToArray(v,ctx) {
	if (v instanceof Array) return v;
	throw "Cannot auto-convert \"" + ToText(v,ctx) + "\" to an array!";
};
exports.ToFunc = function ToFunc(v,ctx) {
	if (v instanceof Function) return v;
	throw "Cannot convert \"" + ToText(v,ctx) + "\" to a function!";
};
// Maybe add ToRegex


// Build a coerce rule from a source string.
var CoerceFuncs = {
	T: exports.ToText,
	N: exports.ToNum,
	B: exports.ToBool,
	A: exports.ToArray,
	D: exports.ToDate,
	F: exports.ToFunc,
	_: exports.ToSelf,
};

function BuildCoerceRule(src) {
	var rule = {
		main: [],
		extra: [],
	};
	var i = 0, func;
	// Main part
	while (i < src.length) {
		func = CoerceFuncs[src[i]]; ++i;
		if (func) {rule.main.push(func); continue;}
		if (src[i-1] == '+') break;
		throw "Unknown coerce rule: '"+src[i-1]+"'";
	}
	// Extra arguments (loops)
	while (i < src.length) {
		func = CoerceFuncs[src[i]]; ++i;
		if (func) {rule.extra.push(func); continue;}
		throw "Unknown coerce rule: '"+src[i-1]+"'";
	}
	return rule;
}

var NoCoerce = {rule: {main:[], extra:[]}, gen: []};
var CoerceCache = {'': NoCoerce};

function GetCoerceCache(src) {
	if (!CoerceCache[src]) {
		try {
			CoerceCache[src] = {rule: BuildCoerceRule(src), gen: []};
		}
		catch (err) {
			throw err + " in rule string '" + src + "'";
		}
	}
	return CoerceCache[src];
}

// Generate the coercing function array.
function GenCoerceFuncs(rule,len) {
	var result = [], i = 0, x = 0;
	result = rule.main;
	if (rule.extra.length) {
		while (result.length < len) result = result.concat(rule.extra);
	}
	return result;
}

// Get an array of coercing (ToXXX) functions based on the function.
exports.GetCoerceFuncs = function GetCoerceFuncs(func,args) {
	// Possibly set up coercion for this function.
	if (!func._coerce) {
		if (func.inCast) {
			try {
				func._coerce = GetCoerceCache(func.inCast);
			}
			catch (err) {
				throw err + " for function " + func.toString();
			}
		}
		else {
			func._coerce = NoCoerce;
		}
	}
	var gen = func._coerce.gen[args.length];
	if (gen) return gen;
	gen = GenCoerceFuncs(func._coerce.rule, args.length);
	func._coerce.gen[args.length] = gen;
	return gen;
};


// Coerce

})();
