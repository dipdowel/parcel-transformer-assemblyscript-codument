/**
 * An enum with all the types of ASC compilation artifacts
 * @type {{JS: string, D_TS: string, WAT: string, WASM: string, MAP: string}}
 */
export enum ArtifactFileType {
  MAP = ".wasm.map",
  WAT = ".wat",
  D_TS = ".d.ts",
  WASM = ".wasm",
  JS = ".js",
}
