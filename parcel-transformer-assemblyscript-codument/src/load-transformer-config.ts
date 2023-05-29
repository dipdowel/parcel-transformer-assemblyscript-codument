import type { Config } from "@parcel/types";
import ThrowableDiagnostic from "@parcel/diagnostic";

export type OnOff = "on" | "off";

/**
 * The expected shape of the user's configuration file for the transformer.
 */
export type ASCConfigFile = {
  /** Switch all the console outputs on or off. */
  consoleLogs: OnOff;
  /** Enable or disable printing of  the compilation statistics to the terminal. */
  displayStats: OnOff;
  /***/
  /** Path to a file where we shall write TS-types generated during the compilation. */
  [".d.ts_path"]: string;
};

const configShape = {
  enableConsoleLogs: "on | off",
  displayStats: "on | off",
  [".d.ts_path"]: "path/to/generated-types.d.ts",
};

function throwConfigError(): void {
  throw new ThrowableDiagnostic({
    diagnostic: {
      message: `Invalid 'as-codument-config.json'. The expected shape is:\n${JSON.stringify(
        configShape,
        null,
        4
      )} `,
      origin: "parcel-transformer-assemblyscript-codument",
    },
  });
}

/**
 * Configuration for Describes the expected format of the user's configuration file for the transformer.
 */
export type ASCTransformerConfig = {
  /** FIXME: Path to the ???  */
  filePath?: string | null;

  /** Display the compilation statistics in the terminal on every recompilation */
  displayStats: boolean;
  /** Switch all the console outputs on or off. */
  enableConsoleLogs: boolean;
  /** Path to a file where we shall write TS-types generated during the compilation. */
  dtsPath: string;
};

const DEFAULT_D_TS_PATH = "./wasm-module.d.ts";

export async function loadTransformerConfig(
  config: Config
): Promise<ASCTransformerConfig> {
  let conf = await config.getConfig<ASCConfigFile>(
    ["as-codument-config.json"],
    {
      packageKey: "assemblyscript-transformer-codument",
    }
  );

  config.invalidateOnStartup();

  // default values to return
  let displayStats = false;
  let enableConsoleLogs = false;
  let dtsPath: string = DEFAULT_D_TS_PATH;

  if (conf) {
    if (!conf?.contents?.consoleLogs || !conf?.contents?.displayStats) {
      throwConfigError();
    }
    enableConsoleLogs = conf?.contents?.consoleLogs === "on";
    displayStats = conf?.contents?.displayStats === "on";
    dtsPath = conf?.contents?.[".d.ts_path"] || DEFAULT_D_TS_PATH;
  }

  return {
    filePath: conf && conf.filePath,
    displayStats,
    enableConsoleLogs,
    dtsPath: dtsPath as string,
  };
}
