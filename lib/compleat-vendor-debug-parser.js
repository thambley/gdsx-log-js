/***
 * Compleat Vendor Debug parser for JavaScript
 *
 * Copyright (c) 2014 Todd Hambley (MIT License).
 *
 */
/*jshint
  laxcomma:true
  laxbreak:true
  eqnull:true
  loopfunc:true
  sub:true
*/
;(function(){
"use strict";

	// only run when the substr() function is broken
	if ('ab'.substr(-1) != 'b') {
		/**
		 *  Get the substring of a string
		 *  @param  {integer}  start   where to start the substring
		 *  @param  {integer}  length  how many characters to return
		 *  @return {string}
		 */
		String.prototype.substr = function(substr) {
			return function(start, length) {
				// did we get a negative start, calculate how much it is
				// from the beginning of the string
				if (start < 0) {
					start = this.length + start;
				}

				// call the original function
				return substr.call(this, start, length);
			}
		}(String.prototype.substr);
	}

	function rightAlignZeroPadding(inputString) {
		return ('00' + inputString).substr(-2);
	}
	
	// log category 
	// log level
	// log dateTime
	// log text
	function parseDebugLog( logText ) {
		var logLines = logText.split('\n');
		var logEntries = [];
		var logEntryNumber = -1;
		// example log entries:
		// [W#3799 (60) WRK1] -- {Request} -- <Debug> -- 11/21/14 15:37:57.914 -- Q/7VA/26*C7
		// {log info} -- <log level> -- log time -- log text
		// {InformationClassification} -- <Info> -- 12/26/13 23:51:04.870 -- This Log Contains Privileged Information.
		// <log level> -- log time -- log text
		// <Status> -- 12/26/13 23:51:06.321 -- Connected.
		var logEntryRegEx = /^(?:[\[]W#([0-9]+) [\(]([0-9]+)[\)] WRK([0-9]+)[\]] -- )?(?:[\{]([^\}]+)[\}] -- )?(?:[\<]([A-Za-z]+)[\>] -- )(?:([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2}) ([0-9]{1,2}):([0-9]{2}):([0-9]{2}).([0-9]{3}) -- )(.+)/;
		for (var lineNumber = 0; lineNumber < logLines.length; lineNumber++) {
			if (logEntryRegEx.test(logLines[lineNumber])){
				logEntryNumber++;
				var logMatch = logEntryRegEx.exec(logLines[lineNumber]);
				logEntries[logEntryNumber] = {
						worker      : parseInt(logMatch[1] || '-1'),
						agency      : parseInt(logMatch[2] || '-1'),
						workstation : parseInt(logMatch[3] || '-1'),
						category    : logMatch[4] || '',
						level       : logMatch[5],
						dateTime    : new Date(Date.UTC(parseInt('20'+logMatch[8], 10), parseInt(logMatch[6], 10) - 1, parseInt(logMatch[7], 10), parseInt(logMatch[9], 10), parseInt(logMatch[10], 10), parseInt(logMatch[11], 10), parseInt(logMatch[12], 10))),
						dateTimeText: '20' + logMatch[8] + '-' + rightAlignZeroPadding(logMatch[6]) + '-' + rightAlignZeroPadding(logMatch[7]) + ' ' + rightAlignZeroPadding(logMatch[9]) + ':' + logMatch[10] + ':' +logMatch[11] + '.' + logMatch[12],
						text        : logMatch[13].replace(/  /g, " &nbsp;")
					}
			} else if (logEntryNumber > -1) {
				logEntries[logEntryNumber].text    += '\n' + logLines[lineNumber];
			}
		}
		return logEntries;
	}
	
	var compleatVendorDebug = {
		parseLog: parseDebugLog
	};

  /* exposed */
  if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = compleatVendorDebug;
  }
  else {
    this.compleatVendorDebug = compleatVendorDebug;
  }

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());
