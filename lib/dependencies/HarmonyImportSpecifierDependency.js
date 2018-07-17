/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const DependencyReference = require("./DependencyReference");
const HarmonyImportDependency = require("./HarmonyImportDependency");
const HarmonyLinkingError = require("../HarmonyLinkingError");

/** @typedef {import("../ModuleGraph")} ModuleGraph */

class HarmonyImportSpecifierDependency extends HarmonyImportDependency {
	constructor(
		request,
		originModule,
		sourceOrder,
		parserScope,
		id,
		name,
		range,
		strictExportPresence
	) {
		super(request, originModule, sourceOrder, parserScope);
		this.id = id === null ? null : `${id}`;
		this.name = name;
		this.range = range;
		this.strictExportPresence = strictExportPresence;
		this.namespaceObjectAsContext = false;
		this.callArgs = undefined;
		this.call = undefined;
		this.directImport = undefined;
		this.shorthand = undefined;
	}

	get type() {
		return "harmony import specifier";
	}

	/**
	 * @param {ModuleGraph} moduleGraph the module graph
	 * @returns {string} the imported id
	 */
	getId(moduleGraph) {
		return moduleGraph.getMeta(this).id || this.id;
	}

	getReference(moduleGraph) {
		const module = moduleGraph.getModule(this);
		if (!module) return null;
		return new DependencyReference(
			module,
			this.getId(moduleGraph) && !this.namespaceObjectAsContext
				? [this.getId(moduleGraph)]
				: true,
			false,
			this.sourceOrder
		);
	}

	getWarnings(moduleGraph) {
		if (
			this.strictExportPresence ||
			this.originModule.buildMeta.strictHarmonyModule
		) {
			return [];
		}
		return this._getErrors(moduleGraph);
	}

	getErrors(moduleGraph) {
		if (
			this.strictExportPresence ||
			this.originModule.buildMeta.strictHarmonyModule
		) {
			return this._getErrors(moduleGraph);
		}
		return [];
	}

	_getErrors(moduleGraph) {
		const importedModule = moduleGraph.getModule(this);
		if (!importedModule) {
			return;
		}

		if (!importedModule.buildMeta || !importedModule.buildMeta.exportsType) {
			// It's not an harmony module
			if (
				this.originModule.buildMeta.strictHarmonyModule &&
				this.getId(moduleGraph) !== "default"
			) {
				// In strict harmony modules we only support the default export
				const exportName = this.getId(moduleGraph)
					? `the named export '${this.getId(moduleGraph)}'`
					: "the namespace object";
				return [
					new HarmonyLinkingError(
						`Can't import ${exportName} from non EcmaScript module (only default export is available)`
					)
				];
			}
			return;
		}

		if (!this.getId(moduleGraph)) {
			return;
		}

		if (importedModule.isProvided(this.getId(moduleGraph)) !== false) {
			// It's provided or we are not sure
			return;
		}

		// We are sure that it's not provided
		const idIsNotNameMessage =
			this.getId(moduleGraph) !== this.name
				? ` (imported as '${this.name}')`
				: "";
		const errorMessage = `"export '${this.getId(
			moduleGraph
		)}'${idIsNotNameMessage} was not found in '${this.userRequest}'`;
		return [new HarmonyLinkingError(errorMessage)];
	}

	// implement this method to allow the occurrence order plugin to count correctly
	getNumberOfIdOccurrences() {
		return 0;
	}

	updateHash(hash, moduleGraph) {
		super.updateHash(hash, moduleGraph);
		const importedModule = moduleGraph.getModule(this);
		hash.update((importedModule && this.getId(moduleGraph)) + "");
		hash.update(
			(importedModule &&
				this.getId(moduleGraph) &&
				importedModule.isUsed(this.getId(moduleGraph))) + ""
		);
		hash.update(
			(importedModule &&
				(!importedModule.buildMeta || importedModule.buildMeta.exportsType)) +
				""
		);
		hash.update(
			(importedModule &&
				importedModule.used + JSON.stringify(importedModule.usedExports)) + ""
		);
	}
}

HarmonyImportSpecifierDependency.Template = class HarmonyImportSpecifierDependencyTemplate extends HarmonyImportDependency.Template {
	apply(dep, source, ctx) {
		super.apply(dep, source, ctx);
		const content = this.getContent(dep, ctx);
		source.replace(dep.range[0], dep.range[1] - 1, content);
	}

	getContent(dep, { runtimeTemplate: runtime, moduleGraph }) {
		const exportExpr = runtime.exportFromImport({
			module: moduleGraph.getModule(dep),
			request: dep.request,
			exportName: dep.getId(moduleGraph),
			originModule: dep.originModule,
			asiSafe: dep.shorthand,
			isCall: dep.call,
			callContext: !dep.directImport,
			importVar: dep.getImportVar(moduleGraph)
		});
		return dep.shorthand ? `${dep.name}: ${exportExpr}` : exportExpr;
	}
};

module.exports = HarmonyImportSpecifierDependency;
