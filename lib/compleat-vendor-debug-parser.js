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
;(function () {
  "use strict";

  // only run when the substr() function is broken
  if ('ab'.substr(-1) != 'b') {
    /**
     *  Get the substring of a string
     *  @param  {integer}  start   where to start the substring
     *  @param  {integer}  length  how many characters to return
     *  @return {string}
     */
    String.prototype.substr = function (substr) {
      return function (start, length) {
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
  function parseDebugLog(logText) {
    var logLines = logText.split('\n');
    var logEntries = [];
    var logEntryNumber = -1;
    // example log entries:
    // [W#3799 (60) WRK1] -- {Request} -- <Debug> -- 11/21/14 15:37:57.914 -- Q/7VA/26*C7
    // {log info} -- <log level> -- log time -- log text
    // {InformationClassification} -- <Info> -- 12/26/13 23:51:04.870 -- This Log Contains Privileged Information.
    // <log level> -- log time -- log text
    // <Status> -- 12/26/13 23:51:06.321 -- Connected.
    var currentWorkflow = '';
    var currentProcess = '';
    var currentRoutine = '';
    var currentLocator = '';
    var currentCustomer = '';
    var currentBusinessUnit = '';

    var logEntryRegEx = /^(?:[\[]W#([0-9]+) [\(]([0-9]+)[\)] [A-Z\d]*?WRK([0-9]+)[\]] -- )?(?:[\{]([^\}]*)[\}] -- )?(?:[\<]([A-Za-z]+)[\>] -- )(?:([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{2}) ([0-9]{1,2}):([0-9]{2}):([0-9]{2}).([0-9]{3}) -- )(.*)/;
    var logSeparatorRegEx = /^[\-]{20}([\d]+)\/([\d]+)\/([\d]+) ([\d]+):([\d]+):([\d]+) ([AP]M) [\(]UTC[\)][\-]{20}/;
    var routineNameRegEx = /Routine ([A-Za-z0-9_]+)/;
    var nameRegEx = /"([^"]+)"/;
    var pnrSetupRegex = /PNR located at (?:Intersection of '(.+?)' and the )?'(.+?)' Business Unit/;
    for (var lineNumber = 0; lineNumber < logLines.length; lineNumber++) {
      if (logEntryRegEx.test(logLines[lineNumber])) {
        logEntryNumber++;
        var logMatch = logEntryRegEx.exec(logLines[lineNumber]);
        var currentLogEntry = currentLogEntry = {
          lineNumber: lineNumber + 1,
          worker: parseInt(logMatch[1] || '-1'),
          agency: parseInt(logMatch[2] || '-1'),
          workstation: parseInt(logMatch[3] || '-1'),
          category: logMatch[4] || '',
          level: logMatch[5],
          dateTime: new Date(Date.UTC(parseInt('20' + logMatch[8], 10), parseInt(logMatch[6], 10) - 1, parseInt(logMatch[7], 10), parseInt(logMatch[9], 10), parseInt(logMatch[10], 10), parseInt(logMatch[11], 10), parseInt(logMatch[12], 10))),
          dateTimeText: '20' + logMatch[8] + '-' + rightAlignZeroPadding(logMatch[6]) + '-' + rightAlignZeroPadding(logMatch[7]) + ' ' + rightAlignZeroPadding(logMatch[9]) + ':' + logMatch[10] + ':' + logMatch[11] + '.' + logMatch[12],
          text: logMatch[13].replace(/  /g, " &nbsp;").replace(/\u{0087}/gu, "‡"),
          workflow: currentWorkflow,
          process: currentProcess,
          routine: currentRoutine,
          pnrLocator: currentLocator,
          customer: currentCustomer,
          businessUnit: currentBusinessUnit
        }
        logEntries[logEntryNumber] = currentLogEntry;
        switch (currentLogEntry.category) {
          case 'QueueProcess':
            if (nameRegEx.test(currentLogEntry.text)) {
              var nameMatch = nameRegEx.exec(currentLogEntry.text);
              // set workflow
              currentLogEntry.workflow = currentWorkflow = nameMatch[1];
              // clear process and routine
              currentLogEntry.process = currentProcess = '';
              currentLogEntry.routine = currentRoutine = '';
            } else {
              if (currentLogEntry.text.includes('SimultaneousChangesException')) {
                console.log('QueueProcess entry contains SimultaneousChangesException');
              } else {
                alert('workflow name not found:' + currentLogEntry.text);
              }
            }
            break;
          case 'ProcessExecute':
            if (nameRegEx.test(currentLogEntry.text)) {
              var nameMatch = nameRegEx.exec(currentLogEntry.text);
              // set process
              currentLogEntry.process = currentProcess = nameMatch[1];
              // clear routine
              currentLogEntry.routine = currentRoutine = '';
            } else {
              alert('process name not found:' + currentLogEntry.text);
            }
            break;
          case 'PnrTestsExecute':
            // routine
            if (currentLogEntry.text === 'All routines finished.') {
              // clear
              currentLogEntry.routine = currentRoutine = '';
            } else {
              if (routineNameRegEx.test(currentLogEntry.text)) {
                var nameMatch = routineNameRegEx.exec(currentLogEntry.text);
                currentLogEntry.routine = currentRoutine = nameMatch[1];
              } else if (nameRegEx.test(currentLogEntry.text)) {
                var nameMatch = nameRegEx.exec(currentLogEntry.text);
                currentLogEntry.routine = currentRoutine = nameMatch[1];
              } else {
                alert('routine name not found:' + currentLogEntry.text);
              }
            }
            break;
          case 'PnrSetup':
            if (pnrSetupRegex.test(currentLogEntry.text)) {
              var pnrSetupMatch = pnrSetupRegex.exec(currentLogEntry.text);
              if (pnrSetupMatch[1]) {
                currentLogEntry.customer = currentCustomer = pnrSetupMatch[1];
              } else {
                currentLogEntry.customer = currentCustomer = '';
              }
              currentLogEntry.businessUnit = currentBusinessUnit = pnrSetupMatch[2];
            } else {
              alert('PnrSetup regex does not match. text: ' + currentLogEntry.text);
            }
          case '':
            // check for level = 'debug' and presence of "encountered" in text
            if ((currentLogEntry.level === 'Debug') && (currentLogEntry.text.substr(0, 11) === 'Encountered')) {
              // set locator
              currentLogEntry.pnrLocator = currentLocator = currentLogEntry.text.substr(12);
              // clear workflow, process and routine
              // currentLogEntry.workflow = currentWorkflow = '';
              currentLogEntry.process = currentProcess = '';
              currentLogEntry.routine = currentRoutine = '';
            }
            break;
        }

      } else if (logEntryNumber > -1) {
        // --------------------11/21/2014 3:37:57 PM (UTC)--------------------
        if (logSeparatorRegEx.test(logLines[lineNumber])) {
          currentWorkflow = '';
          currentProcess = '';
          currentRoutine = '';
          currentLocator = '';

          var logMatch = logSeparatorRegEx.exec(logLines[lineNumber]);
          //^[\-]{20}([\d]+)\/([\d]+)\/([\d]+) ([\d]+):([\d]+):([\d]+) ([AP]M) [\(]UTC[\)][\-]{20}
          logEntryNumber++;
          logEntries[logEntryNumber] = {
            lineNumber: lineNumber + 1,
            worker: -1,
            agency: -1,
            workstation: -1,
            category: 'Separator',
            level: '',
            dateTime: new Date(Date.UTC(parseInt(logMatch[3], 10), parseInt(logMatch[1], 10) - 1, parseInt(logMatch[2], 10), (parseInt(logMatch[4], 10) + ((logMatch[7] == 'PM') ? 12 : 0)), parseInt(logMatch[5], 10), parseInt(logMatch[6], 10), 0)),
            dateTimeText: logMatch[3] + '-' + rightAlignZeroPadding(logMatch[1]) + '-' + rightAlignZeroPadding(logMatch[2]) + ' ' + rightAlignZeroPadding((parseInt(logMatch[4], 10) + ((logMatch[7] == 'PM') ? 12 : 0)).toString()) + ':' + logMatch[5] + ':' + logMatch[6] + '.000',
            text: logLines[lineNumber],
            workflow: currentWorkflow,
            process: currentProcess,
            routine: currentRoutine,
            pnrLocator: currentLocator
          }
        } else {
          logEntries[logEntryNumber].text += '\n' + logLines[lineNumber];
        }
      }
    }
    return logEntries;
  }

  var compleatVendorDebug = {
    parseLog: parseDebugLog
  };

  /* exposed */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = compleatVendorDebug;
  } else {
    this.compleatVendorDebug = compleatVendorDebug;
  }

}).call(function () {
  return this || (typeof window !== 'undefined' ? window : global);
}());
