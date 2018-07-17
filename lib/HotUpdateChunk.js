/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Chunk = require("./Chunk");

class HotUpdateChunk extends Chunk {
	constructor() {
		super();
		/** @type {(number|string)[]} */
		this.removedModules = undefined;
	}
}

module.exports = HotUpdateChunk;
