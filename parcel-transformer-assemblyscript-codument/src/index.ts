import type { MutableAsset, TransformerResult } from "@parcel/types";
import { Transformer } from "@parcel/plugin";
import SourceMap from "@parcel/source-map";

import { ArtifactFileType } from "./artifact-file-type";
import { extendJsCode } from "./helpers/extend-js-code";
import { writeDeclarationFile } from "./helpers/write-declaration-file";
import { throwTransformerError } from "./helpers/throw-transformer-error";
import { defaultError } from "./default-error";
import { compile } from "./compile";

/*
    TODO:  # GENERAL
    TODO: ======================================================================
    TODO: - Add a unit-test framework
    TODO: - Start writing unit tests
    TODO: - Pick up FIXMEs and TODOs from around the code every now and then
    TODO: - Make sure JSDoc is in order, we need a 100% doc coverage!
    TODO: - Consider committing `dist` since it's going to be an NPM package (double check!)
    TODO: - Apply licence as explained in file `LICENSE`
    TODO: - Update and improve all the README files. Onboarding for a developer should have clear steps to follow.
    TODO:
    TODO:  # CONFIGURATION
    TODO: ======================================================================
    TODO: - Differentiate between a 'release' and 'development' build Parcel-wise
    TODO:   - Configure the AS-compilation accordingly
    TODO:
    TODO: - Create a custom configuration file for this transformer
    TODO: - Add means for reading and parsing the configuration file
    TODO: - Add sensible built-in defaults for all the config keys
    TODO:
    TODO:  # LOGGING / ERROR HANDLING
    TODO: ======================================================================
    TODO: - Improve error reporting as mentioned here: https://github.com/parcel-bundler/parcel/discussions/8964?sort=old#discussioncomment-5952588
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
  async transform({
    asset,
    logger,
    options,
  }): Promise<(MutableAsset | TransformerResult)[]> {
    //
    // TODO: Come up with a way of passing the ASC logging to Parcel properly, so that Parcel would print the logs
    // TODO: of this transformer properly.
    // TODO: Try using `logger`, maybe? :P
    //
    // TODO: Come up with the setting to switch verbose logging on/off
    //
    // TODO: NB: At this stage of development use `yarn build:web |cat` to see all the logs, etc.
    //

    const isDev = options.mode !== "production";

    let compilationArtifacts,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange;

    // let compilationResult: Compiled;

    try {
      let compilationResult = await compile(
        { filePath: asset.filePath, inputCode: await asset.getCode() },
        isDev
      );

      compilationResult &&
        ({
          compilationArtifacts,
          invalidateOnFileChange,
          invalidateOnFileCreate,
          invalidateOnEnvChange,
        } = compilationResult);
    } catch (e) {
      throwTransformerError({
        ...defaultError,
        message: `\nCould not compile Assembly Script\n${e}`,
      });
    }

    if (invalidateOnFileChange) {
      for (let file of invalidateOnFileChange) {
        asset.invalidateOnFileChange(file);
      }
    }

    if (invalidateOnFileCreate) {
      for (let file of invalidateOnFileCreate) {
        asset.invalidateOnFileCreate(file);
      }
    }

    if (invalidateOnEnvChange) {
      for (let envvar of invalidateOnEnvChange) {
        asset.invalidateOnEnvChange(envvar);
      }
    }

    const isNode = asset.env.isNode() || false;
    if (compilationArtifacts) {
      const jsCode = extendJsCode(
        compilationArtifacts[ArtifactFileType.JS] as string,
        isNode
      );
      asset.type = "js";
      asset.setCode(jsCode);
    }

    asset.setMap(new SourceMap(options.projectRoot));

    console.log(
      `${PREF} Compiled WASM module size: ${
        compilationArtifacts?.[ArtifactFileType.WASM]?.length
      }`
    );

    //NB: this is the preferred way of logging things via Parcel
    logger.verbose({
      origin: "[ASC]",
      name: "n/a",
      message: `# Compiled WASM module size: ${
        compilationArtifacts?.[ArtifactFileType.WASM]?.length
      }`,
    });

    console.log(`${PREF} Stats:\n${compilationArtifacts?.stats}`);

    //  Print raw WASM module, which is a `Uint8Array` instance
    // console.log(compiledResult[ArtifactFileType.WASM]);

    // Print the JavaScript compilation artifact
    // console.log(`${PREF} JS :\n\n${compiledResult[ArtifactFileType.JS]}\n\n\n`);

    // const content = fs.readFileSync(absolutePath, "utf8");

    // A `.d.ts` file with all the signatures of callable function and accessible properties of the WASM module
    writeDeclarationFile(
      compilationArtifacts?.[ArtifactFileType.D_TS] as string
    );

    // Print the MAP compilation artifact
    // console.log(`${PREF} MAP :\n\n${compiledResult[ArtifactFileType.MAP]}\n\n\n`);

    // fs.writeFileSync("output.wasm.map", compiledResult[ArtifactFileType.MAP]);

    const result = {
      type: "wasm",
      content: compilationArtifacts?.[ArtifactFileType.WASM],
      uniqueKey: "output.wasm",
      // map: wasmSourceMap,
    };

    const maps = compilationArtifacts?.[ArtifactFileType.MAP] as string;

    if (maps && isDev) {
      const ascMap = JSON.parse(maps);
      const wasmSourceMap = new SourceMap(options.projectRoot);
      wasmSourceMap.addVLQMap(ascMap);
      // @ts-ignore
      result["maps"] = wasmSourceMap;
    }

    return [asset, result];
  },
});

// https://github.com/AssemblyScript/assemblyscript/pull/2157
