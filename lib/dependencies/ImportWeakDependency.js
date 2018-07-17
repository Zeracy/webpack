/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";
const ModuleDependency = require("./ModuleDependency");

class ImportWeakDependency extends ModuleDependency {
	constructor(request, originModule, range) {
		super(request);
		this.originModule = originModule;
		this.range = range;
		this.weak = true;
	}

	get type() {
		return "import() weak";
	}
}

ImportWeakDependency.Template = class ImportDependencyTemplate {
	apply(dep, source, { runtimeTemplate: runtime, moduleGraph }) {
		const content = runtime.moduleNamespacePromise({
			module: moduleGraph.getModule(dep),
			request: dep.request,
			strict: dep.originModule.buildMeta.strictHarmonyModule,
			message: "import() weak",
			weak: true
		});
		source.replace(dep.range[0], dep.range[1] - 1, content);
	}
};

module.exports = ImportWeakDependency;
