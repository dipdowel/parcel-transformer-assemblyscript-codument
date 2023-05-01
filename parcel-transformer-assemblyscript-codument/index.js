require = require("esm")(module);
const { default: ThrowableDiagnostic, md } = require("@parcel/diagnostic");

const fs = require("fs");

const { Transformer } = require("@parcel/plugin");
const { ascIO } = require("./asc-io");
const { asconfig } = require("./asconfig");
const path = require("path");

const { ArtifactFileType } = require("./artifact-file-type");

/** AssemblyScript Compiler for programmatic usage */
let asc;

/**
 * AssemblyScript configuration (parsed from a JSON file named `asconfig.json`)
 * @type {Object}
 */
let asConfig;

/**
 *
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
  const { error, stdout, stderr, stats } = await asc.main(
    [
      /* Command line options */
      absolutePath,
      // "--outFile",
      // "resultingFile.wasm",
      "--debug", // FIXME: Find out how to enable/disable debug mode depending on the Parcel mode: "development" or "production".
      // "--optimize",
      // "--sourceMap",
      // "--stats",
    ],
    {
      /* Additional API options */
      // stdout: io.stdout,
      // stderr: io.stderr,

      /**
       * Here we hook into how ASC reads files from the file system,
       * and instead of giving it access to `fs`, we simulate
       * reading of two files that the compiler ever wants:
       *                                                    1. The config file.
       *                                                    2. The source code to compile.
       * FIXME: the documentation might be misleading if `index.as.ts` imports other files. Check-check-check!!!
       */
      readFile: (filename, baseDir) => ascIO.read(inputCode, filename, baseDir),

      /**
       * Here we hook into how ASC writes files to the file system,
       * and instead of giving it access to `fs`, we simulate
       * the writing by just saving the compilation artifacts
       * into `compiledResult` object
       */
      writeFile: (filename, contents, baseDir) =>
        ascIO.write(compilationArtifacts, filename, contents, baseDir),
    }
  );
  // [AssemblyScript Compiler] ends
  // -------------------------------------------------------------------------------------------------------------------

  compilationArtifacts.stats = stats.toString();

  if (error) {
    console.log("[ASC] Compilation failed: " + error.message);
    console.log(stderr.toString());
  } else {
    console.log(stdout.toString());
  }

  // #####################################################################################################################

  return {
    compiledResult: compilationArtifacts,
    error,
    invalidateOnFileChange: [], // FIXME: How do I fill in this one?
    invalidateOnFileCreate: [], // FIXME: How do I fill in this one?
    invalidateOnEnvChange: [], // FIXME: How do I fill in this one?
  };
}

module.exports = new Transformer({
  async transform({ asset, logger, inputFs, options, config }) {
    // TODO: use `yarn build:node | cat`

    // Should there an error occur, it needs to be copied to this `error` variable
    // In order to be properly reported
    let error;

    let asConfigPath = `${options.projectRoot}/asconfig.json`;

    // AssemblyScript Compiler is an ESM, hence this trickery to load it into a CommonJS file.
    await (async () => {
      // FIXME: we now manually copy `assemblyscript` to `node_modules`, that needs to be managed by `package.json`!
      asc = await import("assemblyscript/dist/asc.js");
      console.log("[ASC] AssemblyScript compiler loaded");
    })().catch((e) => {
      error = new Error(`: ${e}`);
      error = {
        ...defaultError,
        message: "Could not find AssemblyScript installation in NODE_MODULES",
      };
    });

    // Read and store `asconfig.json` from the project root if that hasn't been done yet
    if (!error && !asConfig) {
      try {
        const configJSON = fs.readFileSync(asConfigPath, "utf8");
        ascIO.init(configJSON);
        // asConfig = JSON.parse(configJSON);
        console.log("[ASC] AssemblyScript configuration loaded");
      } catch (err) {
        console.log(
          `[ASC] Error loading AssemblyScript configuration file from ${asConfigPath}`
        );
        error = {
          ...defaultError,
          message: "Error loading AssemblyScript configuration file",
          filePath: asConfigPath,
        };
      }
    }

    if (!error) {
      let {
        compiledResult,

        invalidateOnFileChange,
        invalidateOnFileCreate,
        invalidateOnEnvChange,
      } = await compileAssemblyScript({
        filePath: asset.filePath,
        inputCode: await asset.getCode(),
        // readFile: (...args) => fs.readFile(...args),
      });
    }
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

    for (let file of invalidateOnFileChange) {
      asset.invalidateOnFileChange(file);
    }

    for (let file of invalidateOnFileCreate) {
      asset.invalidateOnFileCreate({ filePath: file });
    }

    for (let envvar of invalidateOnEnvChange) {
      asset.invalidateOnEnvChange(envvar);
    }

    // console.log( `>>> compiledResult[ArtifactFileType.JS]: ${ compiledResult[ArtifactFileType.JS] }`);

    asset.type = "js";
    asset.setCode(compiledResult[ArtifactFileType.JS]);

    console.log(
      `[ASC] WASM resulting size: ${
        compiledResult?.[ArtifactFileType.WASM]?.length
      }`
    );
    console.log(`[ASC] stats:\n${compiledResult.stats}`);

    return [
      asset,
      // TODO: uniqueKey needs to be the Wasm module was imported on the JS side.
      {
        type: "wasm",
        content: compiledResult[ArtifactFileType.WASM],
        uniqueKey: "asc-wasm-module",
      },
    ];
  },
});
