"use strict";
// "use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const plugin_1 = require("@parcel/plugin");
const source_map_1 = __importDefault(require("@parcel/source-map"));
const artifact_file_type_1 = require("./artifact-file-type");
const asc_io_1 = require("./helpers/asc-io");
const extend_js_code_1 = require("./helpers/extend-js-code");
const write_declaration_file_1 = require("./helpers/write-declaration-file");
const throw_transformer_error_1 = require("./helpers/throw-transformer-error");
const default_error_1 = require("./default-error");
/*
    TODO: It's a little faster to prototype in JS,
    TODO: but it's way easier to maintain a TypeScript project in the long run.
    TODO:
    TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    TODO: !!! CONVERT THE TRANSFORMER TO PROPER TypeScript !!!
    TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */
// /**  An instance of AssemblyScript Compiler for programmatic usage. */
let asc;
/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC]";
/**
 * TODO: Write JSDoc!
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: *, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
async function compileAssemblyScript(asset /* FIXME: the type! */) {
    const { filePath, inputCode /*, readFile */ } = asset;
    // console.log(`>>> compileAssemblyScript(), filePath: ${filePath}`);
    // console.log(`>>> compileAssemblyScript(), inputCode: ${inputCode}`);
    // console.log(`>>> compileAssemblyScript(), readFile: ${readFile}`);
    const absolutePath = path.basename(filePath);
    /**
     * A collection of all the compilation artifacts that ASC produces + compilation statistics info
     * @type {{[p: string]: null, stats: null}}
     */
    let compilationArtifacts = {
        [artifact_file_type_1.ArtifactFileType.MAP]: null,
        [artifact_file_type_1.ArtifactFileType.WASM]: null,
        [artifact_file_type_1.ArtifactFileType.WAT]: null,
        [artifact_file_type_1.ArtifactFileType.D_TS]: null,
        [artifact_file_type_1.ArtifactFileType.JS]: null,
        /** A printable string with the statistics of the compilation */
        stats: null,
    };
    // -------------------------------------------------------------------------------------------------------------------
    // [AssemblyScript Compiler] starts
    const { error, stdout, stderr, 
    /** @See type `Stats` in https://github.com/AssemblyScript/assemblyscript/blob/main/cli/index.d.ts */
    stats, } = await asc.main([
        /* Command line options */
        absolutePath,
        "--outFile",
        "output.wasm",
        "--debug", // FIXME: enable/disable debug mode depending on the Parcel mode: "development" or "production".
        // "--optimize",
        // "--sourceMap",
        // "/output.wasm.map",
        // "--stats",
    ], {
        /* Additional API options */
        // stdout: io.stdout,
        // stderr: (e, e2) => console.log(new Error(e + " :: " + e2)),
        /**
         * Here we hook into how ASC reads files from the file system,
         * and execute our custom file reading logic
         * @See `ascIO.read()`
         */
        readFile: (absolutePath, baseDir = "./assembly/") => asc_io_1.ascIO.read(inputCode, absolutePath, baseDir),
        /**
         * Here we hook into how ASC writes files to the file system,
         * and execute our custom logic of writing to a file.
         * @See `ascIO.write()`
         */
        writeFile: (filename, contents /*Uint8Array*/, baseDir) => asc_io_1.ascIO.write(compilationArtifacts, filename, contents, baseDir),
    });
    // [AssemblyScript Compiler] ends
    // -------------------------------------------------------------------------------------------------------------------
    // Store the log-friendly string representation of the compilation statistics
    compilationArtifacts.stats = stats.toString();
    if (error) {
        console.error(`${PREF} Compilation failed: ${error.message}`);
        console.error(stderr.toString());
    }
    else {
        console.log(stdout.toString());
    }
    // #####################################################################################################################
    return {
        compiledResult: compilationArtifacts,
        error,
        // @ts-ignore
        invalidateOnFileChange: [],
        // @ts-ignore
        invalidateOnFileCreate: [],
        // @ts-ignore
        invalidateOnEnvChange: [], // FIXME: How do I fill in this one?
    };
}
module.exports = new plugin_1.Transformer({
    async transform({ asset, logger, options, config }) {
        //
        // TODO: Come up with a way of passing the ASC logging to Parcel properly, so that Parcel would print the logs
        // TODO: of this transformer properly.
        // TODO: Try using `logger`, maybe? :P
        //
        // TODO: Come up with the setting to switch verbose logging on/off
        //
        // TODO: NB: At this stage of development use `yarn build:web |cat` to see all the logs, etc.
        //
        // AssemblyScript Compiler is an ESM, hence this trickery to load it into a CommonJS file.
        await (async () => {
            // FIXME: we now manually copy `assemblyscript` to `node_modules`, that needs to be managed by `package.json`!
            asc = await import("assemblyscript/dist/asc.js");
            console.log(`${PREF} 🚀 AssemblyScript compiler loaded`);
        })().catch((e) => {
            (0, throw_transformer_error_1.throwTransformerError)({
                ...default_error_1.defaultError,
                message: `${PREF} Could not find AssemblyScript installation in NODE_MODULES: ${e}`,
            });
        });
        // FiXME: add `try/catch` around `compileAssemblyScript()`!
        let compilationResult;
        try {
            compilationResult = await compileAssemblyScript({
                filePath: asset.filePath,
                inputCode: await asset.getCode(),
            });
        }
        catch (e) {
            (0, throw_transformer_error_1.throwTransformerError)({
                ...default_error_1.defaultError,
                message: `${PREF} Could not compile Assembly Script: ${e}`,
            });
        }
        const { compiledResult, invalidateOnFileChange, invalidateOnFileCreate, invalidateOnEnvChange, } = compilationResult;
        for (let file of invalidateOnFileChange) {
            asset.invalidateOnFileChange(file);
        }
        for (let file of invalidateOnFileCreate) {
            asset.invalidateOnFileCreate({ filePath: file });
        }
        for (let envvar of invalidateOnEnvChange) {
            asset.invalidateOnEnvChange(envvar);
        }
        const isNode = asset.env.isNode() || false;
        const jsCode = (0, extend_js_code_1.extendJsCode)(compiledResult[artifact_file_type_1.ArtifactFileType.JS], isNode);
        asset.type = "js";
        asset.setCode(jsCode);
        asset.setMap(new source_map_1.default(options.projectRoot));
        console.log(`${PREF} Compiled WASM module size: ${compiledResult?.[artifact_file_type_1.ArtifactFileType.WASM]?.length}`);
        // FIXME: Figure out how to override the name of the Transformer at the output
        logger.info({
            origin: "[ASC]",
            name: "n/a",
            message: `# Compiled WASM module size: ${compiledResult?.[artifact_file_type_1.ArtifactFileType.WASM]?.length}`,
        });
        console.log(`${PREF} Stats:\n${compiledResult.stats}`);
        //  Print raw WASM module, which is a `Uint8Array` instance
        // console.log(compiledResult[ArtifactFileType.WASM]);
        // Print the JavaScript compilation artifact
        // console.log(`${PREF} JS :\n\n${compiledResult[ArtifactFileType.JS]}\n\n\n`);
        // const content = fs.readFileSync(absolutePath, "utf8");
        // A `.d.ts` file with all the signatures of callable function and accessible properties of the WASM module
        (0, write_declaration_file_1.writeDeclarationFile)(compiledResult?.[artifact_file_type_1.ArtifactFileType.D_TS]);
        // Print the MAP compilation artifact
        // console.log(`${PREF} MAP :\n\n${compiledResult[ArtifactFileType.MAP]}\n\n\n`);
        // fs.writeFileSync("output.wasm.map", compiledResult[ArtifactFileType.MAP]);
        const ascMap = JSON.parse(compiledResult[artifact_file_type_1.ArtifactFileType.MAP]);
        const wasmSourceMap = new source_map_1.default(options.projectRoot);
        wasmSourceMap.addVLQMap(ascMap);
        return [
            asset,
            {
                type: "wasm",
                content: compiledResult[artifact_file_type_1.ArtifactFileType.WASM],
                uniqueKey: "output.wasm",
                map: wasmSourceMap,
            },
        ];
    },
});
//# sourceMappingURL=index.js.map