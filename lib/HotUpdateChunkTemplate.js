/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Template = require("./Template");
const HotUpdateChunk = require("./HotUpdateChunk");
const { SyncWaterfallHook, SyncHook } = require("tapable");

/** @typedef {import("./ModuleTemplate")} ModuleTemplate */
/** @typedef {import("./ModuleTemplate").RenderContext} RenderContext */
/** @typedef {import("webpack-sources").Source} Source */

module.exports = class HotUpdateChunkTemplate {
	constructor(outputOptions) {
		this.outputOptions = outputOptions || {};
		this.hooks = {
			/** @type {SyncWaterfallHook<Source, ModuleTemplate, RenderContext>} */
			modules: new SyncWaterfallHook([
				"source",
				"moduleTemplate",
				"renderContext"
			]),
			/** @type {SyncWaterfallHook<Source, ModuleTemplate, RenderContext>} */
			render: new SyncWaterfallHook([
				"source",
				"moduleTemplate",
				"renderContext",
				"hash"
			]),
			hash: new SyncHook(["hash"])
		};
	}

	/**
	 *
	 * @param {RenderContext} renderContext the render context
	 * @param {ModuleTemplate} moduleTemplate the module template
	 * @param {string} hash hash of the compilation
	 */
	render(
		renderContext,
		moduleTemplate,
		hash,
	) {
		const modulesSource = Template.renderChunkModules(
			renderContext,
			m => typeof m.source === "function",
			moduleTemplate
		);
		const core = this.hooks.modules.call(
			modulesSource,
			moduleTemplate,
			renderContext
		);
		const source = this.hooks.render.call(
			core,
			moduleTemplate,
			renderContext,
			hash
		);
		return source;
	}

	updateHash(hash) {
		hash.update("HotUpdateChunkTemplate");
		hash.update("1");
		this.hooks.hash.call(hash);
	}
};
