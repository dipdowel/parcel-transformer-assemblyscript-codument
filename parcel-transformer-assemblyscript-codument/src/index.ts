// "use strict";
// require = require("esm")(module);

// import asc from "assemblyscript/dist/asc";

// import fs  from "fs";

import * as path from "path";
import ThrowableDiagnostic, { md } from "@parcel/diagnostic";

import { Transformer } from "@parcel/plugin";

import SourceMap from "@parcel/source-map";

import { ArtifactFileType } from "./artifact-file-type";

import { ascIO } from "./helpers/asc-io";

import { extendJsCode } from "./helpers/extend-js-code";

import { writeDeclarationFile } from "./helpers/write-declaration-file";

import { throwTransformerError } from "./helpers/throw-transformer-error";
import * as stream from "stream";
import { defaultError } from "./default-error";

// import { getAsc } from "./esm2";
// import { getAsc } from "./jsWrapper";

/*
    TODO: It's a little faster to prototype in JS,
    TODO: but it's way easier to maintain a TypeScript project in the long run.
    TODO:
    TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    TODO: !!! CONVERT THE TRANSFORMER TO PROPER TypeScript !!!
    TODO: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 */

// /**  An instance of AssemblyScript Compiler for programmatic usage. */
let asc: { main: Function };

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
async function compileAssemblyScript(asset: any /* FIXME: the type! */) {
  const { filePath, inputCode /*, readFile */ } = asset;
  // console.log(`>>> compileAssemblyScript(), filePath: ${filePath}`);
  // console.log(`>>> compileAssemblyScript(), inputCode: ${inputCode}`);
  // console.log(`>>> compileAssemblyScript(), readFile: ${readFile}`);

  const absolutePath = path.basename(filePath);

  /**
   * A collection of all the compilation artifacts that ASC produces + compilation statistics info
   * @type {{[p: string]: null, stats: null}}
   */

  let compilationArtifacts: Record<ArtifactFileType, string | Buffer> & {
    stats: string;
  } = {
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
      readFile: (absolutePath: string, baseDir: string = "./assembly/") =>
        ascIO.read(inputCode, absolutePath, baseDir),

      /**
       * Here we hook into how ASC writes files to the file system,
       * and execute our custom logic of writing to a file.
       * @See `ascIO.write()`
       */
      writeFile: (
        filename: string,
        contents: string | Buffer | Uint8Array /*Uint8Array*/,
        baseDir: string
      ) => ascIO.write(compilationArtifacts, filename, contents, baseDir),
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
    // @ts-ignore
    invalidateOnFileChange: [], // FIXME: Fill in with the filenames ASC tries to read
    // @ts-ignore
    invalidateOnFileCreate: [], // FIXME: Fill in with the filenames created before that ASC sees for the second or a later time (Is it really so?)
    // @ts-ignore
    invalidateOnEnvChange: [], // FIXME: How do I fill in this one?
  };
}

module.exports = new Transformer({
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

    const jsCode = extendJsCode(
      compiledResult[ArtifactFileType.JS] as string,
      isNode
    );

    asset.type = "js";
    asset.setCode(jsCode);
    asset.setMap(new SourceMap(options.projectRoot));

    console.log(
      `${PREF} Compiled WASM module size: ${
        compiledResult?.[ArtifactFileType.WASM]?.length
      }`
    );

    // FIXME: Figure out how to override the name of the Transformer at the output
    logger.info({
      origin: "[ASC]",
      name: "n/a",
      message: `# Compiled WASM module size: ${
        compiledResult?.[ArtifactFileType.WASM]?.length
      }`,
    });

    console.log(`${PREF} Stats:\n${compiledResult.stats}`);

    //  Print raw WASM module, which is a `Uint8Array` instance
    // console.log(compiledResult[ArtifactFileType.WASM]);

    // Print the JavaScript compilation artifact
    // console.log(`${PREF} JS :\n\n${compiledResult[ArtifactFileType.JS]}\n\n\n`);

    // const content = fs.readFileSync(absolutePath, "utf8");

    // A `.d.ts` file with all the signatures of callable function and accessible properties of the WASM module
    writeDeclarationFile(compiledResult?.[ArtifactFileType.D_TS] as string);

    // Print the MAP compilation artifact
    // console.log(`${PREF} MAP :\n\n${compiledResult[ArtifactFileType.MAP]}\n\n\n`);

    // fs.writeFileSync("output.wasm.map", compiledResult[ArtifactFileType.MAP]);

    const ascMap = JSON.parse(compiledResult[ArtifactFileType.MAP] as string);

    const wasmSourceMap = new SourceMap(options.projectRoot);
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
