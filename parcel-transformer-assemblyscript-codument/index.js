require = require("esm")(module);
const { default: ThrowableDiagnostic, md } = require("@parcel/diagnostic");

const fs = require("fs");

const { Transformer } = require("@parcel/plugin");
const { ascIO } = require("./asc-io");

const path = require("path");

const { ArtifactFileType } = require("./artifact-file-type");

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
  filePath: "n/a",
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
    console.log(`${PREF} Compilation failed: ${error.message}`);
    console.log(stderr.toString());
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

function throwTransformerError(error) {
  throw new ThrowableDiagnostic({
    diagnostic: {
      message: error.message,
      codeFrames: [
        {
          language: "asc",
          filePath: error.filePath,
          codeHighlights: [
            {
              message: error.detailedMessage,
              start: { line: error.start.line, column: error.start.column },
              end: { line: error.end.line, column: error.end.column },
            },
          ],
        },
      ],
    },
  });
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

    // NB: Should an error occur, it needs to be copied to this `error` variable in order to be properly reported.
    let error;

    // AssemblyScript Compiler is an ESM, hence this trickery to load it into a CommonJS file.
    await (async () => {
      // FIXME: we now manually copy `assemblyscript` to `node_modules`, that needs to be managed by `package.json`!
      asc = await import("assemblyscript/dist/asc.js");
      console.log(`${PREF} 🚀 AssemblyScript compiler loaded`);
    })().catch((e) => {
      error = new Error(`: ${e}`);
      error = {
        ...defaultError,
        message: `${PREF} Could not find AssemblyScript installation in NODE_MODULES`,
      };
    });

    if (error) {
      throwTransformerError(error);
    }

    // FiXME: add `try/catch` around `compileAssemblyScript()`!

    let {
      compiledResult,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange,
    } = await compileAssemblyScript({
      filePath: asset.filePath,
      inputCode: await asset.getCode(),
    });

    /*
    // The comments below were added by @mischnic
    // --------------------------------------------------------------
        jsResult should be compileAssemblyScript like
        ```js
        const wasmURL = new URL("asc-wasm-module", import.meta.url);
        export async function instantiate(imports = {}) {
          const { exports } = await WebAssembly.instantiateStreaming(fetch(wasmURL), imports);
          // AssemblyScript probably has more code in here for bindings
          return exports;
        }
        ```

        wasmResult should be a binary buffer containing the compiled Wasm
        */

    if (error) {
      throwTransformerError(error);
    }

    for (let file of invalidateOnFileChange) {
      asset.invalidateOnFileChange(file);
    }

    for (let file of invalidateOnFileCreate) {
      asset.invalidateOnFileCreate({ filePath: file });
    }

    for (let envvar of invalidateOnEnvChange) {
      asset.invalidateOnEnvChange(envvar);
    }

    console.log(`>>> asset.env.isNode: ${JSON.stringify(asset.env.isNode)}`);

    asset.type = "js";
    const jsCode =
      compiledResult[ArtifactFileType.JS] +
      `let instance = null;
      export async function initWasm() {
        if (instance == null) {
          let url = new URL("output.wasm", import.meta.url);
          instance = await instantiate(
            await ${
              //asset.env.isNode
              // ? `WebAssembly.compile(await (await import("node:fs/promises")).readFile(url))`
              //: `WebAssembly.compileStreaming(fetch(url))`
              `WebAssembly.compileStreaming(fetch(url))`
            },
            {}
          );
        }
        return instance;
      }`;

    asset.setCode(jsCode);

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

    // Write types for the WASM module to the disk
    try {
      fs.writeFileSync(
        `./assembly/../WasmModule.d.ts`,
        compiledResult?.[ArtifactFileType.D_TS] +
          "\n\n" +
          `/** Shape of the WASM module compiled from AssemblyScript */\n` +
          `export type WasmModule = typeof __AdaptedExports;`
      );
      console.log(`${PREF} '.d.ts' file written successfully!`);
    } catch (error) {
      console.error(`${PREF} Error writing to file: ${error}`);
    }
    /*
        // Write the generated JS glue for the WASM module to the disk
        try {
          fs.writeFileSync(`./assembly/../glue.js`, jsCode);
          console.log(`${PREF} 'assembly.js' file written successfully!`);
        } catch (error) {
          console.error(`${PREF} Error writing to file glue.js: ${error}`);
        }
    */
    return [
      asset,
      // TODO: uniqueKey needs to be the Wasm module was imported on the JS side.
      {
        type: "wasm",
        content: compiledResult[ArtifactFileType.WASM],
        uniqueKey: "output.wasm",
      },
    ];
  },
});
