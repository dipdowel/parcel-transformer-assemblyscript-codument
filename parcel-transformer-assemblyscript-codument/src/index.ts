import type { MutableAsset, TransformerResult } from "@parcel/types";
import { Transformer } from "@parcel/plugin";
import SourceMap from "@parcel/source-map";
import { ArtifactFileType } from "./artifact-file-type";
import { extendJsCode } from "./helpers/extend-js-code";
import { writeDeclarationFile } from "./helpers/write-declaration-file";

import { compile } from "./compile";
import { dbg } from "./dbg";
import { loadTransformerConfig } from "./load-transformer-config";

/*
    TODO:  # GENERAL
    TODO: ======================================================================
    TODO: - Keep on writing unit tests
    TODO: - Pick up FIXMEs and TODOs from around the code every now and then
    TODO: - Make sure JSDoc is in order, we need a 100% doc coverage!
    TODO: - Consider committing `dist` since it's going to be an NPM package (double check!)
    TODO: - Apply licence as explained in file `LICENSE`
    TODO: - Update and improve all the README files. Onboarding for a developer should have clear steps to follow.
    TODO:
    TODO:
    TODO:  # CONFIGURATION
    TODO: ======================================================================
    TODO: - Implement a configuration for the destination of the `.d.ts` file (6. Explain where to find the `.d.ts` file for accessing WASM modules in TypeScript)
    TODO: - Explain in the readme that all the file names in asconfig should not be used
    TODO: - Throw out file-related keys from the config read from the user's directory. just keep the source maps, but handle them to be boolean

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

    dbg.log(
      `${PREF} Generated types will be written to the following file: ${config?.dtsPath}`
    );

    let {
      error,
      compilationArtifacts,
      invalidateOnFileChange,
      invalidateOnFileCreate,
      invalidateOnEnvChange,
    } = await compile(
      { filePath: asset.filePath, inputCode: await asset.getCode() },
      isDev
    );

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

    if (error) {
      throw error;
    }

    // FIXME: add support for NodeJS later on. For now, we only support browsers.
    // const isNode = asset.env.isNode() || false;
    const isNode = false;

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
      compilationArtifacts?.[ArtifactFileType.D_TS] as string,
      config?.dtsPath
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
