type AcceptedConfig = {
  targets: {
    debug: {};
    release: {};
  };
  options: {
    bindings: "raw";
  };
};

const minConfig = { targets: { debug: {}, release: {} } };
function getConfigError(): Error {
  return new Error(
    `'asconfig.json' must have the following shape:\n${JSON.stringify(
      minConfig,
      null,
      4
    )}`
  );
}

/**
 *
 * @param configJson
 */
export function verifyConfig(configJson: string): string | null {
  const config: AcceptedConfig = JSON.parse(configJson);

  const { targets, options } = config;

  // Parcel can only work with the "raw" bindings, not with "esm".
  if (!options || options.bindings !== "raw") {
    config.options = {
      bindings: "raw",
    };
  }

  if (!targets) {
    throw getConfigError();
  }
  const { debug, release } = targets;

  if (!debug || !release) {
    throw getConfigError();
  }

  return JSON.stringify(config);
}
