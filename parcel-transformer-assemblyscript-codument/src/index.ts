// "use strict";

import { Transformer } from "@parcel/plugin";
import SourceMap from "@parcel/source-map";

import { ArtifactFileType } from "./artifact-file-type";
import { extendJsCode } from "./helpers/extend-js-code";
import { writeDeclarationFile } from "./helpers/write-declaration-file";
import { throwTransformerError } from "./helpers/throw-transformer-error";
import { defaultError } from "./default-error";
import { compile } from "./compile";
import { ConfigRequest } from "./parcel-types";
import { CompilationArtifacts } from "./helpers/compilation-artifacts";

/*
    TODO:  # GENERAL
    TODO: ======================================================================
    TODO: - Switch TS-compiler to 'strict' and fix-fix-fix!!!
    TODO: - Add a unit-test framework
    TODO: - Start writing unit tests
    TODO: - Pick up FIXMEs and TODOs from around the code every now and then
    TODO: - Make sure JSDoc is in order, we need a 100% doc coverage!
    TODO: - Consider committing `dist` since it's going to be an NPM package (double check!)
    TODO:
    TODO:  # CONFIGURATION
    TODO: ======================================================================
    TODO: - Create a custom configuration file for this transformer
    TODO: - Add means for reading and parsing the configuration file
    TODO: - Add sensible built-in defaults for all the config keys
    TODO:
    TODO:  # LOGGING
    TODO: ======================================================================
    TODO: - Stream all the logging through a custom logger function
    TODO: - Hide all the logging by default
    TODO: - Add a configuration key to enable all the verbose logging
 */

/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC]";

module.exports = new Transformer({
  // FIXME: get rid of `ts-ignore`!
  // @ts-ignore
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

    // FiXME: add `try/catch` around `compileAssemblyScript()`!

    let compilationResult:
      | undefined
      | (ConfigRequest & {
          compiledResult: CompilationArtifacts;
        });

    // FIXME: this is super ugly and takes too much space. Compress using something like:
    /*
    const {
            compiledResult,
            invalidateOnFileChange = [],
            invalidateOnFileCreate = [],
            invalidateOnEnvChange = [],
          } = compilationResult ?? {};
     */
    let compiledResult,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange;

    try {
      compilationResult = await compile({
        filePath: asset.filePath,
        inputCode: await asset.getCode(),
      });

      compiledResult = compilationResult?.compiledResult;
      invalidateOnFileChange = compilationResult?.invalidateOnFileChange;
      invalidateOnFileCreate = compilationResult?.invalidateOnFileCreate;
      invalidateOnEnvChange = compilationResult?.invalidateOnEnvChange;
    } catch (e) {
      throwTransformerError({
        ...defaultError,
        message: `${PREF} Could not compile Assembly Script: ${e}`,
      });
      return;
    }

    if (invalidateOnFileChange) {
      for (let file of invalidateOnFileChange) {
        asset.invalidateOnFileChange(file);
      }
    }

    if (invalidateOnFileCreate) {
      for (let file of invalidateOnFileCreate) {
        // FIXME: There's something fishy here, get rid of `ts-ignore`!
        // @ts-ignore
        asset.invalidateOnFileCreate({ filePath: file });
      }
    }

    if (invalidateOnEnvChange) {
      for (let envvar of invalidateOnEnvChange) {
        asset.invalidateOnEnvChange(envvar);
      }
    }

    const isNode = asset.env.isNode() || false;
    if (compiledResult) {
      const jsCode = extendJsCode(
        compiledResult[ArtifactFileType.JS] as string,
        isNode
      );
      asset.type = "js";
      asset.setCode(jsCode);
    }

    asset.setMap(new SourceMap(options.projectRoot));

    console.log(
      `${PREF} Compiled WASM module size: ${
        compiledResult?.[ArtifactFileType.WASM]?.length
      }`
    );

    //NB: this is the preferred way of logging things via Parcel
    logger.verbose({
      origin: "[ASC]",
      name: "n/a",
      message: `# Compiled WASM module size: ${
        compiledResult?.[ArtifactFileType.WASM]?.length
      }`,
    });

    console.log(`${PREF} Stats:\n${compiledResult?.stats}`);

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

    const ascMap = JSON.parse(compiledResult?.[ArtifactFileType.MAP] as string);

    const wasmSourceMap = new SourceMap(options.projectRoot);
    wasmSourceMap.addVLQMap(ascMap);

    return [
      asset,
      {
        type: "wasm",
        content: compiledResult?.[ArtifactFileType.WASM],
        uniqueKey: "output.wasm",
        map: wasmSourceMap,
      },
    ];
  },
});
