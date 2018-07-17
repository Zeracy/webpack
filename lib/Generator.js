/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

/** @typedef {import("./Module")} Module */
/** @typedef {import("./RuntimeTemplate")} RuntimeTemplate */
/** @typedef {import("webpack-sources").Source} Source */
/** @typedef {import("./DependencyTemplates")} DependencyTemplates */
/** @typedef {import("./ModuleGraph")} ModuleGraph */

/**
 *
 */
class Generator {
	static byType(map) {
		return new ByTypeGenerator(map);
	}

	/**
	 * @abstract
	 * @param {Module} module module for which the code should be generated
	 * @param {Object} generateContext context for generate
	 * @param {DependencyTemplates} generateContext.dependencyTemplates mapping from dependencies to templates
	 * @param {RuntimeTemplate} generateContext.runtimeTemplate the runtime template
	 * @param {ModuleGraph} generateContext.moduleGraph the module graph
	 * @param {string} type which kind of code should be generated
	 * @returns {Source} generated code
	 */
	generate(
		module,
		{ dependencyTemplates, runtimeTemplate, moduleGraph },
		type
	) {
		throw new Error("Generator.generate: must be overridden");
	}
}

class ByTypeGenerator extends Generator {
	constructor(map) {
		super();
		this.map = map;
	}

	generate(module, ctx) {
		const type = ctx.type;
		const generator = this.map[type];
		if (!generator) {
			throw new Error(`Generator.byType: no generator specified for ${type}`);
		}
		return generator.generate(module, ctx);
	}
}

module.exports = Generator;
