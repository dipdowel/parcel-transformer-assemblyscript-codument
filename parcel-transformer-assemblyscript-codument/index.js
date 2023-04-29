require = require("esm")(module);
const { default: ThrowableDiagnostic, md } = require("@parcel/diagnostic");
const { fs } = require("fs");
const { Transformer } = require("@parcel/plugin");

// const asc = require("assemblyscript/dist/asc").default;

// const esmModule = await requireEsm("");

// =====================================================================================================================
// const wabtPromise = require("wabt");
const path = require("path");
const { Buffer } = require("buffer");
const ERROR_REGEX = /^parseWat failed:\n[^:]*:(\d):(\d)+: (.*)/;

// =====================================================================================================================

/** AssemblyScript Compiler, accessible for programmatic usage */
let asc;

/**
 *
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: null, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
async function something(asset) {
  // const esmModule = await requireEsm("./wasm-result.mock");
  //
  // await (async () => {
  //   console.log(esmModule.foo());
  // })();

  const { filePath, inputCode, readFile } = asset;
  console.log(`>>> smth filePath: ${filePath}`);
  console.log(`>>> smth inputCode: ${inputCode}`);
  console.log(`>>> smth readFile: ${readFile}`);
  const jsResult = "console.log('hi there');";

  // const readData = readFile(path.basename(asset.filePath));
  // console.log(`>>> -----------------------------------------------------`);
  // console.log(`>>> readData: ${JSON.stringify(readData)}`);
  // console.log(`>>> -----------------------------------------------------`);

  const absolutePath = path.basename(asset.filePath);

  // #####################################################################################################################

  // ========= [ make sure `build` directory exists ] ====================================
  // const directoryPath = "../build/";
  //
  // fs.stat(directoryPath, (err, stats) => {
  //   if (err || !stats.isDirectory()) {
  //     fs.mkdir(directoryPath, { recursive: true }, (err) => {
  //       if (err) throw err;
  //       console.log("Directory created");
  //     });
  //   } else {
  //     console.log("Directory exists");
  //   }
  // });
  // ========= [ / make sure `build` directory exists ] ====================================

  const { error, stdout, stderr, stats } = await asc.main(
    [
      // Command line options
      absolutePath,
      "--outFile",
      "build/myModule.wasm",
      // "--optimize",
      // "--sourceMap",
      // "--stats"
    ],
    {
      /// Additional API options
      // stdout?: ...,
      // stderr?: ...,
      // readFile?: ...,
      // writeFile?: ...,
      // listFiles?: ...,
      // reportDiagnostic?: ...,
      // transforms?: ...
    }
  );

  if (error) {
    console.log("[ASC] Compilation failed: " + error.message);
    console.log(stderr.toString());
  } else {
    console.log(stdout.toString());
  }

  // #####################################################################################################################

  return {
    jsResult,
    // wasmResult: WASM_RESULT_MOCK,
    wasmResult: `add()`,
    error: null,
    invalidateOnFileChange: [],
    invalidateOnFileCreate: [],
    invalidateOnEnvChange: [],
  };
}

module.exports = new Transformer({
  async transform({ asset, logger, inputFs }) {
    console.log(`>>> step 0`);

    // TODO: Please read the Parcel Transformer developer's documentation again
    // TODO: There was something about not working with files directly but only through Parcel
    // TODO: Check if that's followed accurately when providing ASC with the compilation entry point file.

    // AssemblyScript Compiler is an ESM, hence this trickery to load it into a CommonJS file.
    await (async () => {
      asc = await import("assemblyscript/dist/asc.js");
      console.log("[ASC]  AssemblyScript compiler loaded...");
    })();

    console.log(`>>> step 1`);
    let {
      jsResult,
      wasmResult,
      error,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange,
    } = await something({
      filePath: asset.filePath,
      inputCode: await asset.getCode(),
      readFile: (...args) => fs.readFile(...args),
    });
    console.log(`>>> step 2`);
    /*
        jsResult should be something like
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
    console.log(`>>> step 3`);
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

    console.log(`>>> step 4`);
    for (let file of invalidateOnFileChange) {
      asset.invalidateOnFileChange(file);
    }
    console.log(`>>> step 5`);
    for (let file of invalidateOnFileCreate) {
      asset.invalidateOnFileCreate({ filePath: file });
    }
    console.log(`>>> step 6`);
    for (let envvar of invalidateOnEnvChange) {
      asset.invalidateOnEnvChange(envvar);
    }

    asset.type = "js";
    // asset.setCode(result);
    asset.setCode(jsResult);
    console.log(`>>> step 7`);
    return [
      asset,
      // uniqueKey is however the Wasm module was imported on the JS side.
      { type: "wasm", content: wasmResult, uniqueKey: "asc-wasm-module" },
    ];
  },
});
