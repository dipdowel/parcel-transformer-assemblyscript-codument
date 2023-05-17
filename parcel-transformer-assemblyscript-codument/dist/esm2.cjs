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
require = require("esm")(module);
/**  An instance of AssemblyScript Compiler for programmatic usage. */
let asc;
exports.getAsc = async function () {
    console.log("Hello from getAsc!");
    try {
        asc = await Promise.resolve().then(() => __importStar(require("assemblyscript/dist/asc.js")));
        return asc;
    }
    catch (e) {
        console.error(`Could not import AssemblyScript Compiler. Is "assemblyscript" present  in NODE_MODULES?\n${e}`);
        return null;
    }
    //
    // // AssemblyScript Compiler is an ESM, hence this trickery to load it into a CommonJS file.
    // await (async () => {
    //   // FIXME: we now manually copy `assemblyscript` to `node_modules`, that needs to be managed by `package.json`!
    //
    //   console.log(`${PREF} 🚀 AssemblyScript compiler loaded`);
    // })().catch((e) => {
    //   throwTransformerError({
    //     ...defaultError,
    //     message: `${PREF} `,
    //   });
    // });
};
//# sourceMappingURL=esm2.cjs.map