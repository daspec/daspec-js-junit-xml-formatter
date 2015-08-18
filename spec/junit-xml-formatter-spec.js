/*global describe, it, expect, beforeEach, require, afterEach, process */
describe('Junit XML Formatter', function () {
	'use strict';
	var underTest = require('../src/junit-xml-formatter'),
		observable = require('daspec-core/src/observable'),
		libxmljs = require('libxmljs'),
		path = require('path'),
		fs = require('fs'),
		os = require('os'),
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
	});
	afterEach(function () {
		rmrf(outputDir);
	});
	describe('configuration', function () {
		var createSuite = function () {
			underTest(runner, config);
			runner.dispatchEvent('suiteEnded', {passed: 1, executed: 1});
		};
		it('throws an exception if output-dir is not set and the junit-xml-file-name is not provided', function () {
			expect(function () {
				config['output-dir'] = undefined;
				underTest(runner, config);
			}).toThrowError('output-dir not set');
		});
		it('throws an exception if output-dir is not set and the junit-xml-file-name does not contain a folder', function () {
			expect(function () {
				config['output-dir'] = undefined;
				config['junit-xml-file-name'] = 'test.xml';
				underTest(runner, config);
			}).toThrowError('output-dir not set');
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
	describe('content', function () {
		var readContents = function () {
			var xml = fs.readFileSync(path.join(outputDir, 'report.xml'), {encoding: 'utf8'}),
				parsed = libxmljs.parseXml(xml);
			return parsed.root();
		};
		beforeEach(function () {
			underTest(runner, config);
		});
		it('makes a testsuite root object with DaSpec as name', function () {
			runner.dispatchEvent('suiteEnded', {passed: 1, executed: 5, failed: 2, error: 3});
			var xmlRoot = readContents();
			expect(xmlRoot.name()).toEqual('testsuite');
			expect(xmlRoot.attr('name').value()).toEqual('DaSpec');
		});
		describe('total counts', function () {
			it('ignores the counts from the suiteEnded event, but instead counts entire specs', function () {
				runner.dispatchEvent('specEnded', 'specname', {passed: 5, executed: 5});
				runner.dispatchEvent('suiteEnded', {passed: 1, executed: 5, failed: 2, error: 3});
				var xmlRoot = readContents();
				expect(xmlRoot.attr('tests').value()).toEqual('1');
				expect(xmlRoot.attr('failures').value()).toEqual('0');
				expect(xmlRoot.attr('errors').value()).toEqual('0');
			});
			it('considers specs with at least one failure but no errors as failed', function () {
				runner.dispatchEvent('specEnded', 'specname', {passed: 3, executed: 5, failed: 2});
				runner.dispatchEvent('suiteEnded');
				var xmlRoot = readContents();
				expect(xmlRoot.attr('tests').value()).toEqual('1');
				expect(xmlRoot.attr('failures').value()).toEqual('1');
				expect(xmlRoot.attr('errors').value()).toEqual('0');
			});
			it('considers specs with at least one error as errors, regardless of if they have a failure', function () {
				runner.dispatchEvent('specEnded', 'specname', {passed: 3, executed: 4, failed: 0, error: 1});
				runner.dispatchEvent('specEnded', 'specname2', {passed: 3, executed: 6, failed: 2, error: 1});
				runner.dispatchEvent('suiteEnded');
				var xmlRoot = readContents();
				expect(xmlRoot.attr('failures').value()).toEqual('0');
				expect(xmlRoot.attr('errors').value()).toEqual('2');
			});
			it('considers specs without errors or failures as skipped if there are any skipped steps', function () {
				runner.dispatchEvent('specEnded', 'specname', {passed: 3, executed: 5, skipped: 1});
				runner.dispatchEvent('suiteEnded');
				var xmlRoot = readContents();
				expect(xmlRoot.attr('tests').value()).toEqual('1');
				expect(xmlRoot.attr('failures').value()).toEqual('0');
				expect(xmlRoot.attr('errors').value()).toEqual('0');
				expect(xmlRoot.attr('skipped').value()).toEqual('1');
			});
			it('considers specs without any executed steps as skipped', function () {
				runner.dispatchEvent('specEnded', 'specname', {executed: 0});
				runner.dispatchEvent('suiteEnded');
				var xmlRoot = readContents();
				expect(xmlRoot.attr('tests').value()).toEqual('1');
				expect(xmlRoot.attr('skipped').value()).toEqual('1');
			});
			it('considers specs with failures as failed even if there are any skipped steps', function () {
				runner.dispatchEvent('specEnded', 'specname', {passed: 3, executed: 5, skipped: 1, failed: 1});
				runner.dispatchEvent('suiteEnded');
				var xmlRoot = readContents();
				expect(xmlRoot.attr('tests').value()).toEqual('1');
				expect(xmlRoot.attr('failures').value()).toEqual('1');
				expect(xmlRoot.attr('errors').value()).toEqual('0');
			});
			it('aggregates totals across multiple specs', function () {
				runner.dispatchEvent('specEnded', 'specname', {passed: 4, executed: 4});
				runner.dispatchEvent('specEnded', 'specname2', {passed: 3, executed: 6, failed: 2});
				runner.dispatchEvent('specEnded', 'specname3', {passed: 3, executed: 6, failed: 2, error: 1});
				runner.dispatchEvent('suiteEnded');
				var xmlRoot = readContents();
				expect(xmlRoot.attr('failures').value()).toEqual('1');
				expect(xmlRoot.attr('errors').value()).toEqual('1');
				expect(xmlRoot.attr('tests').value()).toEqual('3');
			});
		});
		describe('individual spec results', function () {
			describe('naming', function () {
				var checkName = function (path, expectedName, expectedClassName) {
					runner.dispatchEvent('specEnded', path, {passed: 4, executed: 4});
					runner.dispatchEvent('suiteEnded');
					var xmlRoot = readContents(),
						specElement = xmlRoot.find('testcase')[0];
					expect(specElement.attr('name').value()).toEqual(expectedName);
					expect(specElement.attr('classname').value()).toEqual(expectedClassName);
				};
				it('uses the file name as the test name and the dir name as the class name', function () {
					checkName('folder/subfolder/specname.md', 'specname', 'folder.subfolder');
				});
				it('survives non .md file names', function () {
					checkName('folder/subfolder/specname.txt', 'specname', 'folder.subfolder');
				});
				it('survives names without extension', function () {
					checkName('folder/subfolder/specname', 'specname', 'folder.subfolder');
				});
				it('survives names with quotes (xml escaping test)', function () {
					checkName('fo"lder/subfold"er/sp"ecn"ame', 'specname', 'folder.subfolder');
				});
				it('uses daspec as the classname if no folders provided', function () {
					checkName('specname.md', 'specname', 'daspec');
				});
				it('removes starting / from absolute paths', function () {
					checkName('/folder/subfolder/specname.md', 'specname', 'folder.subfolder');
				});
				it('removes starting . and .. from relative paths', function () {
					checkName('./../folder/subfolder/specname.md', 'specname', 'folder.subfolder');
				});
				it('uses daspec as the class name if using .. and no subfolders', function () {
					checkName('../specname.md', 'specname', 'daspec');
				});
				it('uses daspec as the class name if using . and no subfolders', function () {
					checkName('./specname.md', 'specname', 'daspec');
				});
				it('uses daspec as the class name if using root files -- hopefully nobody is that stupid, but...', function () {
					checkName('/specname.md', 'specname', 'daspec');
				});
				it('uses the extension as the test name if using files without names -- hopefully nobody is that stupid, but...', function () {
					checkName('folder/.md', '.md', 'folder');
				});
			});
			describe('contents', function () {
				it('adds a skipped sub-element for skipped specs', function () {
					runner.dispatchEvent('specEnded', 'specname', {executed: 0});
					runner.dispatchEvent('suiteEnded');
					var xmlRoot = readContents(),
						specElement = xmlRoot.find('testcase')[0];
					expect(specElement.find('skipped').length).toBe(1);
					expect(specElement.find('error').length).toBe(0);
					expect(specElement.find('failure').length).toBe(0);
				});
				it('adds an error sub-element for specs with errors', function () {
					runner.dispatchEvent('specEnded', 'specname', {passed: 3, executed: 4, failed: 0, error: 1});
					runner.dispatchEvent('suiteEnded');
					var xmlRoot = readContents(),
						specElement = xmlRoot.find('testcase')[0];
					expect(specElement.find('skipped').length).toBe(0);
					expect(specElement.find('error').length).toBe(1);
					expect(specElement.find('failure').length).toBe(0);
				});
				it('adds a failure sub-element for specs with failures', function () {
					runner.dispatchEvent('specEnded', 'specname', {passed: 3, executed: 4, failed: 1});
					runner.dispatchEvent('suiteEnded');
					var xmlRoot = readContents(),
						specElement = xmlRoot.find('testcase')[0];
					expect(specElement.find('skipped').length).toBe(0);
					expect(specElement.find('error').length).toBe(0);
					expect(specElement.find('failure').length).toBe(1);
				});
				it('does not add subelements for passed tests', function () {
					runner.dispatchEvent('specEnded', 'specname', {passed: 3, executed: 3});
					runner.dispatchEvent('suiteEnded');
					var xmlRoot = readContents(),
						specElement = xmlRoot.find('testcase')[0];
					expect(specElement.find('skipped').length).toBe(0);
					expect(specElement.find('error').length).toBe(0);
					expect(specElement.find('failure').length).toBe(0);
				});
			});
			it('appends elements for each spec', function () {
				runner.dispatchEvent('specEnded', 'folder1/specname1', {passed: 3, executed: 3});
				runner.dispatchEvent('specEnded', 'folder2/specname2', {passed: 3, executed: 2, failed: 1});
				runner.dispatchEvent('suiteEnded');
				var xmlRoot = readContents(),
					firstSpec = xmlRoot.find('testcase')[0],
					secondSpec = xmlRoot.find('testcase')[1];
				expect(firstSpec.attr('name').value()).toEqual('specname1');
				expect(secondSpec.attr('name').value()).toEqual('specname2');
			});
		});

	});
	it('validates against XML expected by Jenkins', function () {
		underTest(runner, config);
		runner.dispatchEvent('specEnded', 'specname', {passed: 4, executed: 4});
		runner.dispatchEvent('specEnded', 'specname2', {passed: 3, executed: 6, failed: 2});
		runner.dispatchEvent('specEnded', 'specname3', {passed: 3, executed: 6, failed: 2, error: 1});
		runner.dispatchEvent('suiteEnded');

		// from https://svn.jenkins-ci.org/trunk/hudson/dtkit/dtkit-format/dtkit-junit-model/src/main/resources/com/thalesgroup/dtkit/junit/model/xsd/junit-4.xsd
		var xsd = libxmljs.parseXml(fs.readFileSync(path.join(process.cwd(), 'spec', 'junit-4.xsd'), {encoding: 'utf8'})),
			xml = libxmljs.parseXml(fs.readFileSync(path.join(outputDir, 'report.xml'), {encoding: 'utf8'}));
		expect(xml.validate(xsd)).toBeTruthy();
	});
});
