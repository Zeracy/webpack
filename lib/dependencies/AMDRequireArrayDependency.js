/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";
const Dependency = require("../Dependency");

class AMDRequireArrayDependency extends Dependency {
	constructor(depsArray, range) {
		super();
		this.depsArray = depsArray;
		this.range = range;
	}

	get type() {
		return "amd require array";
	}
}

AMDRequireArrayDependency.Template = class AMDRequireArrayDependencyTemplate {
	apply(dep, source, { runtimeTemplate, moduleGraph }) {
		const content = this.getContent(dep, { runtimeTemplate, moduleGraph });
		source.replace(dep.range[0], dep.range[1] - 1, content);
	}

	getContent(dep, { runtimeTemplate, moduleGraph }) {
		const requires = dep.depsArray.map(dependency => {
			return this.contentForDependency(dependency, {
				runtimeTemplate,
				moduleGraph
			});
		});
		return `[${requires.join(", ")}]`;
	}

	contentForDependency(dep, { runtimeTemplate, moduleGraph }) {
		if (typeof dep === "string") {
			return dep;
		}

		if (dep.localModule) {
			return dep.localModule.variableName();
		} else {
			return runtimeTemplate.moduleExports({
				module: moduleGraph.getModule(dep),
				request: dep.request
			});
		}
	}
};

module.exports = AMDRequireArrayDependency;
