import type { MutableAsset, TransformerResult } from "@parcel/types";
import { Transformer } from "@parcel/plugin";
import SourceMap from "@parcel/source-map";
import { ArtifactFileType } from "./artifact-file-type";
import { extendJsCode } from "./helpers/extend-js-code";
import { writeDeclarationFile } from "./helpers/write-declaration-file";
import { throwTransformerError } from "./helpers/throw-transformer-error";
import { defaultError } from "./default-error";
import { compile } from "./compile";
import { dbg } from "./dbg";
import { loadTransformerConfig } from "./load-transformer-config";

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
    TODO: - What happens if there is more than one *.as.ts file? Will it all crash?
    TODO: - Can we narrow down glob to just `index.as.ts`?
    TODO:
    TODO:  # CONFIGURATION
    TODO: ======================================================================
    TODO: -
    TODO: -  explain in the readme that all the file names in asconfig should not be used
    TODO: - throw out file-related keys from the config read from the user's directory. just keep the source maps, but handle them to be boolean

    TODO:  # LOGGING / ERROR HANDLING
    TODO: ======================================================================
    TODO: - Improve error reporting as mentioned here: https://github.com/parcel-bundler/parcel/discussions/8964?sort=old#discussioncomment-5952588

 */

/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC]";

module.exports = new Transformer({
  async loadConfig({ config }) {
    return await loadTransformerConfig(config);
  },
  async transform({
    asset,
    logger,
    options,
    config,
  }): Promise<(MutableAsset | TransformerResult)[]> {
    const isDev = options.mode !== "production";

    dbg.setEnabled(config?.enableConsoleLogs);

    let compilationArtifacts,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange;

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

    dbg.log(
      `${PREF} Compiled WASM module size: ${
        compilationArtifacts?.[ArtifactFileType.WASM]?.length
      }`
    );

    //NB: this is the preferred way of logging things via Parcel
    // logger.verbose({
    //   origin: "[ASC]",
    //   name: "n/a",
    //   message: `# Compiled WASM module size: ${
    //     compilationArtifacts?.[ArtifactFileType.WASM]?.length
    //   }`,
    // });

    config?.displayStats &&
      console.log(`${PREF} Stats:\n${compilationArtifacts?.stats}`);

    //  Print raw WASM module, which is a `Uint8Array` instance
    // dbg.log(compiledResult[ArtifactFileType.WASM]);

    // Print the JavaScript compilation artifact
    // dbg.log(`${PREF} JS :\n\n${compiledResult[ArtifactFileType.JS]}\n\n\n`);

    // const content = fs.readFileSync(absolutePath, "utf8");

    // A `.d.ts` file with all the signatures of callable function and accessible properties of the WASM module
    writeDeclarationFile(
      compilationArtifacts?.[ArtifactFileType.D_TS] as string
    );

    // Print the MAP compilation artifact
    // dbg.log(`${PREF} MAP :\n\n${compiledResult[ArtifactFileType.MAP]}\n\n\n`);

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
