/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const DependencyReference = require("./DependencyReference");
const ModuleDependency = require("./ModuleDependency");
const Template = require("../Template");

/** @typedef {import("../ModuleGraph")} ModuleGraph */
/** @typedef {import("../RuntimeTemplate")} RuntimeTemplate */
/** @typedef {import("../Dependency").DependencyTemplateContext} DependencyTemplateContext */
/** @typedef {import("webpack-sources").Source} Source */

class HarmonyImportDependency extends ModuleDependency {
	constructor(request, originModule, sourceOrder, parserScope) {
		super(request);
		this.originModule = originModule;
		this.sourceOrder = sourceOrder;
		this.parserScope = parserScope;
	}

	/**
	 * @param {ModuleGraph} moduleGraph the module graph
	 * @returns {DependencyReference | null} reference
	 */
	getReference(moduleGraph) {
		if (!moduleGraph.getModule(this)) return null;
		return new DependencyReference(
			moduleGraph.getModule(this),
			false,
			this.weak,
			this.sourceOrder
		);
	}

	/**
	 * @param {ModuleGraph} moduleGraph the module graph
	 * @returns {string} name of the variable for the import
	 */
	getImportVar(moduleGraph) {
		let importVarMap = this.parserScope.importVarMap;
		if (!importVarMap) this.parserScope.importVarMap = importVarMap = new Map();
		let importVar = importVarMap.get(moduleGraph.getModule(this));
		if (importVar) return importVar;
		importVar = `${Template.toIdentifier(
			`${this.userRequest}`
		)}__WEBPACK_IMPORTED_MODULE_${importVarMap.size}__`;
		importVarMap.set(moduleGraph.getModule(this), importVar);
		return importVar;
	}

	/**
	 * @param {boolean} update create new variables or update existing one
	 * @param {Object} ctx context
	 * @param {RuntimeTemplate} ctx.runtimeTemplate the module graph
	 * @param {ModuleGraph} ctx.moduleGraph the module graph
	 * @returns {string} name of the variable for the import
	 */
	getImportStatement(update, { runtimeTemplate: runtime, moduleGraph }) {
		return runtime.importStatement({
			update,
			module: moduleGraph.getModule(this),
			importVar: this.getImportVar(moduleGraph),
			request: this.request,
			originModule: this.originModule
		});
	}

	updateHash(hash, moduleGraph) {
		super.updateHash(hash, moduleGraph);
		const importedModule = moduleGraph.getModule(this);
		hash.update(
			(importedModule &&
				(!importedModule.buildMeta || importedModule.buildMeta.exportsType)) +
				""
		);
		hash.update((importedModule && importedModule.id) + "");
	}
}

module.exports = HarmonyImportDependency;

const importEmittedMap = new WeakMap();

HarmonyImportDependency.Template = class HarmonyImportDependencyTemplate {
	apply(dep, source, { runtimeTemplate: runtime }) {
		// no-op
	}

	getHarmonyInitOrder(dep, ctx) {
		return dep.sourceOrder;
	}

	/**
	 * @param {HarmonyImportDependency} dep the dependency
	 * @param {Source} source the source
	 * @param {DependencyTemplateContext} ctx the context
	 */
	static isImportEmitted(dep, source, { moduleGraph }) {
		let sourceInfo = importEmittedMap.get(source);
		if (!sourceInfo) return false;
		const key = moduleGraph.getModule(dep) || dep.request;
		return key && sourceInfo.emittedImports.get(key);
	}

	harmonyInit(
		dep,
		source,
		{ runtimeTemplate, dependencyTemplates, moduleGraph }
	) {
		let sourceInfo = importEmittedMap.get(source);
		if (!sourceInfo) {
			importEmittedMap.set(
				source,
				(sourceInfo = {
					emittedImports: new Map()
				})
			);
		}
		const key = moduleGraph.getModule(dep) || dep.request;
		if (key && sourceInfo.emittedImports.get(key)) return;
		sourceInfo.emittedImports.set(key, true);
		const content = dep.getImportStatement(false, {
			runtimeTemplate,
			moduleGraph
		});
		source.insert(-1, content);
	}
};
