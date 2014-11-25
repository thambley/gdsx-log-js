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
	
	// log category 
	// log level
	// log dateTime
	// log text
	function parseDebugLog( logText ) {
		var logLines = logText.split('\n');
		var logEntries = [];
		var logEntryNumber = -1;
		// example log entries:
		// {log info} -- <log level> -- log time -- log text
		// {InformationClassification} -- <Info> -- 12/26/13 23:51:04.870 -- This Log Contains Privileged Information.
		// <log level> -- log time -- log text
		// <Status> -- 12/26/13 23:51:06.321 -- Connected.
		var logEntryRegEx = /^(?:[\{]([^\}]+)[\}] -- )?(?:[\<]([A-Za-z]+)[\>] -- )(?:([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2}) ([0-9]{1,2}):([0-9]{2}):([0-9]{2}).([0-9]{3}) -- )(.+)/;
		for (var lineNumber = 0; lineNumber < logLines.length; lineNumber++) {
			if (logEntryRegEx.test(logLines[lineNumber])){
				logEntryNumber++;
				var logMatch = logEntryRegEx.exec(logLines[lineNumber]);
				logEntries[logEntryNumber] = {
						category : logMatch[1] || '',
						level    : logMatch[2],
						dateTime : new Date(Date.UTC(parseInt('20'+logMatch[5], 10), parseInt(logMatch[3], 10) - 1, parseInt(logMatch[4], 10), parseInt(logMatch[6], 10), parseInt(logMatch[7], 10), parseInt(logMatch[8], 10), parseInt(logMatch[9], 10))),
						text     : logMatch[10]
					}
			} else {
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
