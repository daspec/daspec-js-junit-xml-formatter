/*global describe, it, expect, beforeEach, os, require, afterEach */
describe('Junit XML Formatter', function () {
	'use strict';
	var underTest = require('../junit-xml-formatter'),
		observable = require('daspec-core/src/observable'),
		path = require('path'),
		fs = require('fs'),
		config,
		outputDir,
		runner,
		rmrf = function (dirPath) {
			if (fs.existsSync(dirPath)) {
				var files = fs.readdirSync(dirPath);
				files.forEach(function (fileName) {
					var filePath = path.join(dirPath, fileName);
					if (fs.statSync(filePath).isDirectory()) {
						rmrf(filePath);
					} else {
						fs.unlinkSync(filePath);
					}
				});
				fs.rmdirSync(dirPath);
			}
		};
	beforeEach(function () {
		outputDir = path.join(os.tmpdir(), 'test-output-dir');
		config = {
			'output-dir': outputDir
		};
		runner = observable({});
		underTest(runner, config);
	});
	afterEach(function () {
		rmrf(outputDir);
	});
	describe('configuration', function () {
		var createSuite = function () {
			runner.dispatchEvent('suiteEnded', {passed: 1, executed: 1});
		};
		it('throws an exception if output-dir is not set and the junit-xml-file-name is not provided', function () {
			expect(function () {
				config['output-dir'] = undefined;
				createSuite();
			}).toThrow('output-dir not set');
		});
		it('throws an exception if output-dir is not set and the junit-xml-file-name does not contain a folder', function () {
			expect(function () {
				config['output-dir'] = undefined;
				config['junit-xml-file-name'] = 'test.xml';
				createSuite();
			}).toThrow('output-dir not set');
		});
		it('creates folders and the report.xml file if the junit-xml-file-name is not provided', function () {
			createSuite();
			expect(fs.existsSync(path.join(outputDir, 'report.xml'))).toBeTruthy();

		});
		it('ignores the output dir if the junit-xml-file-name contains a path separator', function () {
			outputDir = path.join(os.tmpdir(), 'alternate-output-dir');
			config['junit-xml-file-name'] = path.join(outputDir, 'full.xml');
			createSuite();
			expect(fs.existsSync(config['output-dir'])).toBeFalsy();
			expect(fs.existsSync(config['junit-xml-file-name'])).toBeTruthy();
		});
		it('works even without the output-dir config if the junit-xml-file-name contains a path separator', function () {
			outputDir = path.join(os.tmpdir(), 'alternate-output-dir');
			config['junit-xml-file-name'] = path.join(outputDir, 'full.xml');
			config['output-dir'] = undefined;
			createSuite();
			expect(fs.existsSync(config['junit-xml-file-name'])).toBeTruthy();
		});

		it('uses the junit-xml-file-name argument if provided', function () {
			config['junit-xml-file-name'] = 'test.xml';
			createSuite();
			expect(fs.existsSync(path.join(outputDir, 'report.xml'))).toBeFalsy();
			expect(fs.existsSync(path.join(outputDir, 'test.xml'))).toBeTruthy();
		});
		it('uses the first element of the junit-xml-file-name argument array if the argument is an array (for compat with command line args)', function () {
			config['junit-xml-file-name'] = ['test.xml'];
			createSuite();
			expect(fs.existsSync(path.join(outputDir, 'report.xml'))).toBeFalsy();
			expect(fs.existsSync(path.join(outputDir, 'test.xml'))).toBeTruthy();
		});

	});

});
