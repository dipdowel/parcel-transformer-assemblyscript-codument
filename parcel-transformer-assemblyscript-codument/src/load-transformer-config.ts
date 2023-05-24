import type { Config } from "@parcel/types";
import ThrowableDiagnostic from "@parcel/diagnostic";

export type OnOff = "on" | "off";

export type AssemblyScriptCodumentConfig = {
  consoleLogs: OnOff;
  displayStats: OnOff;
};

const configShape = {
  enableConsoleLogs: "on | off",
  displayStats: "on | off",
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

export async function loadTransformerConfig(config: Config): Promise<{
  filePath?: string | null;
  displayStats: boolean;
  enableConsoleLogs: boolean;
}> {
  let conf = await config.getConfig<AssemblyScriptCodumentConfig>(
    ["as-codument-config.json"],
    {
      packageKey: "assemblyscript-transformer-codument",
    }
  );

  config.invalidateOnStartup();

  // default values to return
  let displayStats = false;
  let enableConsoleLogs = false;

  if (conf) {
    if (!conf?.contents?.consoleLogs || !conf?.contents?.displayStats) {
      throwConfigError();
    }

    enableConsoleLogs = conf?.contents?.consoleLogs === "on";
    displayStats = conf?.contents?.displayStats === "on";
  }
  return {
    filePath: conf && conf.filePath,
    displayStats,
    enableConsoleLogs,
  };
}
