/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const { RawSource, ReplaceSource } = require("webpack-sources");

/** @typedef {import("./Dependency")} Dependency */
/** @typedef {import("./Dependency").DependencyTemplate} DependencyTemplate */
/** @typedef {import("./RuntimeTemplate")} RuntimeTemplate */
/** @typedef {import("./ModuleGraph")} ModuleGraph */
/** @typedef {import("./util/createHash").Hash} Hash */
/** @typedef {(d: Dependency) => boolean} DependencyFilterFunction */
/** @typedef {import("./DependencyTemplates")} DependencyTemplates */

class DependenciesBlockVariable {
	/**
	 * Creates an instance of DependenciesBlockVariable.
	 * @param {string} name name of DependenciesBlockVariable
	 * @param {string} expression expression string
	 * @param {Dependency[]=} dependencies dependencies tied to this varaiable
	 */
	constructor(name, expression, dependencies) {
		this.name = name;
		this.expression = expression;
		this.dependencies = dependencies || [];
	}

	/**
	 * @param {Hash} hash hash for instance to update
	 * @param {ModuleGraph} moduleGraph module graph
	 * @returns {void}
	 */
	updateHash(hash, moduleGraph) {
		hash.update(this.name);
		hash.update(this.expression);
		for (const d of this.dependencies) {
			d.updateHash(hash, moduleGraph);
		}
	}

	/**
	 * @param {Object} ctx context
	 * @param {DependencyTemplates} ctx.dependencyTemplates Dependency constructors and templates Map.
	 * @param {RuntimeTemplate} ctx.runtimeTemplate runtimeTemplate to generate expression souce
	 * @param {ModuleGraph} ctx.moduleGraph module graph
	 * @returns {ReplaceSource} returns constructed source for expression via templates
	 */
	expressionSource({ dependencyTemplates, runtimeTemplate, moduleGraph }) {
		const source = new ReplaceSource(new RawSource(this.expression));
		for (const dep of this.dependencies) {
			const constructor =
				/** @type {new (...args: any[]) => Dependency} */ (dep.constructor);
			const template = dependencyTemplates.get(constructor);
			if (!template) {
				throw new Error(`No template for dependency: ${dep.constructor.name}`);
			}
			template.apply(dep, source, { runtimeTemplate, dependencyTemplates, moduleGraph });
		}
		return source;
	}

	hasDependencies(filter) {
		if (filter) {
			return this.dependencies.some(filter);
		}
		return this.dependencies.length > 0;
	}
}

Object.defineProperty(DependenciesBlockVariable, "disconnect", {
	get() {
		throw new Error(
			"disconnect was removed from DependenciesBlockVariable (it's no longer needed)"
		);
	}
});

module.exports = DependenciesBlockVariable;
