require = require("esm")(module);
const { default: ThrowableDiagnostic, md } = require("@parcel/diagnostic");
const { fs } = require("fs");
const { Transformer } = require("@parcel/plugin");
const { ascIO } = require("./asc-io");

const { asconfig } = require("./asconfig");

// =====================================================================================================================
const path = require("path");
// const { Buffer } = require("buffer");
// const ERROR_REGEX = /^parseWat failed:\n[^:]*:(\d):(\d)+: (.*)/;

// =====================================================================================================================

/** AssemblyScript Compiler for programmatic usage */
let asc;

/**
 * An enum with all the types of ASC compilation artifacts
 * @type {{JS: string, D_TS: string, WAT: string, WASM: string, MAP: string}}
 */
const ArtifactFileType = {
  MAP: ".wasm.map",
  WAT: ".wat",
  D_TS: ".d.ts",
  WASM: ".wasm",
  JS: ".js",
};

/**
 * TODO: Write JSDoc!
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: *, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
async function compileAssemblyScript(asset) {
  const { filePath, inputCode, readFile } = asset;
  // console.log(`>>> compileAssemblyScript(), filePath: ${filePath}`);
  // console.log(`>>> compileAssemblyScript(), inputCode: ${inputCode}`);
  // console.log(`>>> compileAssemblyScript(), readFile: ${readFile}`);

  const absolutePath = path.basename(asset.filePath);

  /**
   * An enum
   * @type {{[p: string]: null, stats: null}}
   */
  let compilationArtifacts = {
    [ArtifactFileType.MAP]: null,
    [ArtifactFileType.WASM]: null,
    [ArtifactFileType.WAT]: null,
    [ArtifactFileType.D_TS]: null,
    [ArtifactFileType.JS]: null,
    stats: null,
  };

  // -------------------------------------------------------------------------------------------------------------------
  // [AssemblyScript Compiler] starts
  const { error, stdout, stderr, stats } = await asc.main(
    [
      // Command line options
      absolutePath,
      "--outFile",
      "build/add-file-name.wasm", // FIXME: the file name should correspond to the filename from `filePath`
      // "--optimize",
      // "--sourceMap",
      // "--stats",
    ],
    {
      /// Additional API options
      // stdout: io.stdout,
      // stderr: io.stderr,

      /**
       * Here we hook into how ASC reads files from the file system,
       * and instead of giving it access to `fs`, we simulate
       * reading of two files that the compiler ever wants:
       *                                                    1. The config file.
       *                                                    2. The source code to compile.
       * @param filename
       * @param baseDir
       * @return {*|Promise<unknown>}
       */
      readFile: (filename, baseDir) => {
        console.log(`[ASC] [READ] filename: ${filename}`);

        // ASC is asking for a configuration file,
        // so we return a hardcoded config for now.
        if (filename.includes(`asconfig.json`)) {
          // TODO: 1. read actual `asconfig.json` just once and cache it in memory
          // TODO: 2. return the content of `asconfig.json` from memory
          // TODO: 3. Think of how it would be possible to detect changes in `asconfig.json` on the fly and reread it then.
          // return asconfig;
          return new Promise((resolve) => {
            resolve(asconfig);
          });
        }
        // If ASC asked for something else than `asconfig.json`,
        // then we return the AssemblyScript source code that needs to be compiled,
        // because what else the compiler may want? :P
        return new Promise((resolve) => {
          resolve(inputCode);
        });
        // return inputCode;
      },

      /**
       * Here we hook into how ASC writes files to the file system,
       * and instead of giving it access to `fs`, we simulate
       * the writing by just saving the compilation artifacts
       * into `compiledResult` object
       * @param {string} filename
       * @param {Uint8Array} contents
       * @param {string} baseDir
       * @return {Promise<unknown>}
       */
      writeFile: (filename, contents, baseDir) => {
        console.log(
          `[ASC] [WRITE] size: ${contents?.length} \t${baseDir}/${filename}`
        );

        //  Based on the type of the compilation artifact,
        //  place the artifact content into a corresponding field of `compiledResult`
        //  If `switch (true)` looks weird, please
        //  @See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch#an_alternative_to_if...else_chains
        switch (true) {
          case filename.endsWith(ArtifactFileType.MAP):
            compilationArtifacts[ArtifactFileType.MAP] = contents;
            break;
          case filename.endsWith(ArtifactFileType.WAT):
            compilationArtifacts[ArtifactFileType.WAT] = contents;
            break;
          case filename.endsWith(ArtifactFileType.D_TS):
            compilationArtifacts[ArtifactFileType.D_TS] = contents;
            break;
          case filename.endsWith(ArtifactFileType.WASM):
            compilationArtifacts[ArtifactFileType.WASM] = contents;
            break;
          case filename.endsWith(ArtifactFileType.JS):
            compilationArtifacts[ArtifactFileType.JS] = contents;
            break;
          default:
            console.warn(`>>> unknown file format found`);
        }

        return new Promise((resolve) => {
          resolve();
        });

        // return Promise
        // void | Promise<void>;),
      },
      // listFiles?: ...,
      // reportDiagnostic: io.reportDiagnostics,
      // transforms?: ...
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
    invalidateOnFileChange: [],
    invalidateOnFileCreate: [],
    invalidateOnEnvChange: [],
  };
}

module.exports = new Transformer({
  async transform({ asset, logger, inputFs }) {
    // TODO: use `yarn build:node | cat`

    // AssemblyScript Compiler is an ESM, hence this trickery to load it into a CommonJS file.
    await (async () => {
      asc = await import("assemblyscript/dist/asc.js");
      console.log("[ASC] AssemblyScript compiler loaded...");
    })();

    let {
      compiledResult,
      error,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange,
    } = await compileAssemblyScript({
      filePath: asset.filePath,
      inputCode: await asset.getCode(),
      readFile: (...args) => fs.readFile(...args),
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
