"use strict";
require = require("esm")(module);

const fs = require("fs");
const path = require("path");

const { default: ThrowableDiagnostic, md } = require("@parcel/diagnostic");
const { Transformer } = require("@parcel/plugin");
const { default: SourceMap } = require("@parcel/source-map");

const { ArtifactFileType } = require("./artifact-file-type");
const { ascIO } = require("./helpers/asc-io");
const { extendJsCode } = require("./helpers/extend-js-code");
const { writeDeclarationFile } = require("./helpers/write-declaration-file");
const { throwTransformerError } = require("./helpers/throw-transformer-error");
/*
    TODO: It's a little faster to prototype in JS,
    TODO: but it's way easier to maintain a TypeScript project in the long run.
    TODO:
    TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    TODO: !!! CONVERT THE TRANSFORMER TO PROPER TypeScript !!!
    TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

/**  An instance of AssemblyScript Compiler for programmatic usage. */
let asc;

/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC]";

/**
 * An error object template. To be cloned, filled with available error details, and passed on to Parcel.
 * @type {{detailedMessage: string, filePath: string, start: {line: number, column: number}, end: {line: number, column: number}, message: string}}
 */
const defaultError = {
  message: "n/a",
  filePath: __filename,
  detailedMessage: "n/a",
  start: {
    line: -1,
    column: -1,
  },
  end: {
    line: -1,
    column: -1,
  },
};

/**
 * TODO: Write JSDoc!
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: *, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
async function compileAssemblyScript(asset) {
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
    [ArtifactFileType.MAP]: null,
    [ArtifactFileType.WASM]: null,
    [ArtifactFileType.WAT]: null,
    [ArtifactFileType.D_TS]: null,
    [ArtifactFileType.JS]: null,

    /** A printable string with the statistics of the compilation */
    stats: null,
  };

  // -------------------------------------------------------------------------------------------------------------------
  // [AssemblyScript Compiler] starts
  const {
    error,
    stdout,
    stderr,

    /** @See type `Stats` in https://github.com/AssemblyScript/assemblyscript/blob/main/cli/index.d.ts */
    stats,
  } = await asc.main(
    [
      /* Command line options */
      absolutePath,
      "--outFile",
      "output.wasm", // FIXME: See whether it's better to use `asconfig.json` to define the WASM file name
      "--debug", // FIXME: enable/disable debug mode depending on the Parcel mode: "development" or "production".
      // "--optimize",
      // "--sourceMap",
      // "/output.wasm.map",
      // "--stats",
    ],
    {
      /* Additional API options */
      // stdout: io.stdout,
      // stderr: (e, e2) => console.log(new Error(e + " :: " + e2)),

      /**
       * Here we hook into how ASC reads files from the file system,
       * and execute our custom file reading logic
       * @See `ascIO.read()`
       */
      readFile: (absolutePath, baseDir = "./assembly/") =>
        ascIO.read(inputCode, absolutePath, baseDir),

      /**
       * Here we hook into how ASC writes files to the file system,
       * and execute our custom logic of writing to a file.
       * @See `ascIO.write()`
       */
      writeFile: (filename, contents, baseDir) =>
        ascIO.write(compilationArtifacts, filename, contents, baseDir),
    }
  );
  // [AssemblyScript Compiler] ends
  // -------------------------------------------------------------------------------------------------------------------

  // Store the log-friendly string representation of the compilation statistics
  compilationArtifacts.stats = stats.toString();

  if (error) {
    console.error(`${PREF} Compilation failed: ${error.message}`);
    console.error(stderr.toString());
  } else {
    console.log(stdout.toString());
  }

  // #####################################################################################################################

  return {
    compiledResult: compilationArtifacts,
    error,
    invalidateOnFileChange: [], // FIXME: Fill in with the filenames ASC tries to read
    invalidateOnFileCreate: [], // FIXME: Fill in with the filenames created before that ASC sees for the second or a later time (Is it really so?)
    invalidateOnEnvChange: [], // FIXME: How do I fill in this one?
  };
}

module.exports = new Transformer({
  async transform({ asset, logger, inputFs, options, config }) {
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
      throwTransformerError({
        ...defaultError,
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
    } catch (e) {
      throwTransformerError({
        ...defaultError,
        message: `${PREF} Could not compile Assembly Script: ${e}`,
      });
    }

    const {
      compiledResult,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange,
    } = compilationResult;

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

    const jsCode = extendJsCode(compiledResult[ArtifactFileType.JS], isNode);

    asset.type = "js";
    asset.setCode(jsCode);
    asset.setMap(new SourceMap(options.projectRoot));

    console.log(
      `${PREF} Compiled WASM module size: ${
        compiledResult?.[ArtifactFileType.WASM]?.length
      }`
    );
    console.log(`${PREF} Stats:\n${compiledResult.stats}`);

    //  Print raw WASM module, which is a `Uint8Array` instance
    // console.log(compiledResult[ArtifactFileType.WASM]);

    // Print the JavaScript compilation artifact
    // console.log(`${PREF} JS :\n\n${compiledResult[ArtifactFileType.JS]}\n\n\n`);

    // const content = fs.readFileSync(absolutePath, "utf8");

    // A `.d.ts` file with all the signatures of callable function and accessible properties of the WASM module
    writeDeclarationFile(compiledResult?.[ArtifactFileType.D_TS]);

    // Print the MAP compilation artifact
    // console.log(`${PREF} MAP :\n\n${compiledResult[ArtifactFileType.MAP]}\n\n\n`);

    // fs.writeFileSync("output.wasm.map", compiledResult[ArtifactFileType.MAP]);

    const ascMap = JSON.parse(compiledResult[ArtifactFileType.MAP]);

    let wasmSourceMap = new SourceMap(options.projectRoot);
    wasmSourceMap.addVLQMap(ascMap);

    return [
      asset,
      {
        type: "wasm",
        content: compiledResult[ArtifactFileType.WASM],
        uniqueKey: "output.wasm",
        map: wasmSourceMap,
      },
    ];
  },
});
