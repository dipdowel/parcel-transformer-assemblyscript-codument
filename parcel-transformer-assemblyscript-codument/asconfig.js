export const asconfig = JSON.stringify({
  targets: {
    debug: {
      outFile: "build/debug.wasm",
      textFile: "build/debug.wat",
      sourceMap: true,
      debug: true,
    },
    release: {
      outFile: "build/release.wasm",
      textFile: "build/release.wat",
      sourceMap: true,
      optimizeLevel: 3,
      shrinkLevel: 0,
      converge: false,
      noAssert: false,
    },
  },
  options: {
    bindings: "esm",
  },
});
