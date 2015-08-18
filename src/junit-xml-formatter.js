/*global module, require */
var path = require('path'),
	fs = require('fs'),
	mkdirp = require('mkdirp');
module.exports = function junitXmlFormatter(runner, config) {
	'use strict';
	var ERROR = 'error', FAILED = 'failed', SKIPPED = 'skipped', PASSED = 'passed',
		lines = [],
		fileName,
		executedSpecs = 0,
		failedSpecs = 0,
		errorSpecs = 0,
		skippedSpecs = 0,
		parseConfig = function () {
			fileName = config['junit-xml-file-name'] || 'report.xml';
			if (Array.isArray(fileName)) {
				fileName = fileName[0];
			}
			if (fileName.indexOf(path.sep) < 0) {
				if (!config['output-dir']) {
					throw new Error('output-dir not set');
				}
				fileName = path.join(config['output-dir'], fileName);
			}
		},
		saveSuiteFile = function () {
			mkdirp.sync(path.dirname(fileName));
			lines.unshift('<?xml version="1.0" encoding="UTF-8"?>');
			fs.writeFileSync(fileName, lines.join('\n'));
		},
		testName = function (filePath) {
			filePath = filePath.replace(/"/g, '');
			return path.basename(filePath, path.extname(filePath));
		},
		className = function (filePath) {
			filePath = path.normalize(filePath);
			filePath = filePath.replace(/^\.+/, '').replace(/"/g, '');
			if (path.isAbsolute(filePath)) {
				filePath = filePath.substring(filePath.indexOf(path.sep) + 1);
			}
			if (filePath.indexOf(path.sep) < 0) {
				return 'daspec';
			}
			return path.dirname(filePath).replace(path.sep, '.');
		},
		specStatus = function (counts) {
			if (counts.error) {
				return ERROR;
			} else if (counts.failed > 0) {
				return FAILED;
			} else if (counts.skipped > 0 || !counts.executed) {
				return SKIPPED;
			} else {
				return PASSED;
			}
		};
	parseConfig();
	runner.addEventListener('specEnded',  function (name, counts) {
		executedSpecs++;
		var summary = specStatus(counts);
		lines.push('<testcase name="' + testName(name) + '" classname="' + className(name) + '">');
		if (summary === ERROR) {
			errorSpecs++;
			lines.push('<error/>');
		} else if (summary === FAILED) {
			failedSpecs++;
			lines.push('<failure/>');
		} else if (summary === SKIPPED) {
			skippedSpecs++;
			lines.push('<skipped/>');
		}
		lines.push('</testcase>');
	});
	runner.addEventListener('suiteEnded', function () {
		lines.unshift('<testsuite name="DaSpec" tests="' + executedSpecs + '"' +
			' failures="' + failedSpecs + '" errors="' + errorSpecs + '"' +
			' skipped="' + skippedSpecs + '">');
		lines.push('</testsuite>');
		saveSuiteFile();
	});
};
