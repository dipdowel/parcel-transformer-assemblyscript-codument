"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactFileType = void 0;
/**
 * An enum with all the types of ASC compilation artifacts
 * @type {{JS: string, D_TS: string, WAT: string, WASM: string, MAP: string}}
 */
var ArtifactFileType;
(function (ArtifactFileType) {
    ArtifactFileType["MAP"] = ".wasm.map";
    ArtifactFileType["WAT"] = ".wat";
    ArtifactFileType["D_TS"] = ".d.ts";
    ArtifactFileType["WASM"] = ".wasm";
    ArtifactFileType["JS"] = ".js";
})(ArtifactFileType = exports.ArtifactFileType || (exports.ArtifactFileType = {}));
//# sourceMappingURL=artifact-file-type.js.map