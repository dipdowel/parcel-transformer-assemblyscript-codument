"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDeclarationFile = void 0;
const fs = __importStar(require("fs"));
const PREF = "[ASC][WDF]";
/**
 * Write types for the WASM module to the disk.
 * The `.d.ts` file should contain all the signatures of callable function and accessible properties of the WASM module.
 * @param content
 */
function writeDeclarationFile(content) {
    if (!content) {
        console.error(`${PREF} '.d.ts' has no content!`);
        return;
    }
    const fileName = `./assembly/../WasmModule.d.ts`;
    content += `\n\n/** Shape of the WASM module compiled from AssemblyScript */\nexport type WasmModule = typeof __AdaptedExports;`;
    try {
        fs.writeFileSync(fileName, content);
        console.log(`${PREF} '.d.ts' file written successfully!`);
    }
    catch (error) {
        console.error(`${PREF} Error writing to file: ${error}`);
    }
}
exports.writeDeclarationFile = writeDeclarationFile;
//# sourceMappingURL=write-declaration-file.js.map