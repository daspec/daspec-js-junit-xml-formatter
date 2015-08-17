/*global module, require */
module.exports = function junitXmlFormatter(runner, config) {
	'use strict';
	runner.addEventListener('specEnded',  function (name, counts) {
	});
	runner.addEventListener('suiteEnded', function (counts) {
	});
};
