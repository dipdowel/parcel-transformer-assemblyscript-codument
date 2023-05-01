const { ArtifactFileType } = require("./artifact-file-type");

/**
 * `asconfig.json` read from the user's project root directory
 * @type {JSON}
 */
let configJSON;

/**
 * AssemblyScript Compiler IO emulation.
 * We don't want to let AssemblyScript Compiler interact with the physical filesystem,
 * so we use custom `read()` and `write()` functions to perform all the read/write operations just in  memory
 * @type {{init: (function(JSON): JSON), read: ((function(string, string, string): Promise<*>)|*), write: (function(Object, string, Uint8Array, string): Promise<*>)}}
 */
export const ascIO = {
  /**
   * Provide the ASC configuration file to be returned by `read()` when the AS compiler asks for `asconfig.json`
   * @param {JSON} asconfigJSON
   */
  init: (asconfigJSON) => (configJSON = asconfigJSON),

  /**
   * Emulates reading from the file system, that's easy, since the compiler wants to read just 2 files (config and the source code).
   * FIXME:  The compiler probably won't manage to read AS source files other than `index.as.ts` with this approach!
   * FIXME:  This must be fixed!
   * @param {string} inputCode
   * @param {string} filename
   * @param {string} baseDir
   * @return {Promise<unknown>}
   */
  read: (inputCode, filename, baseDir) => {
    console.log(`[ASC] [READ] filename: ${filename}`);
    // ASC is asking for a configuration file,
    // so we return a hardcoded config for now.
    if (filename.includes(`asconfig.json`)) {
      return new Promise((resolve) => {
        resolve(configJSON);
      });
    }
    // If ASC asked for something else than `asconfig.json`,
    // then we return the AssemblyScript source code that needs to be compiled,
    // because what else the compiler may want? :P
    return new Promise((resolve) => {
      resolve(inputCode);
    });
  },

  /**
   * Writes a compilation artifact file into an object in memory, to be used by Parcel.
   * @param compilationArtifacts
   * @param filename
   * @param contents
   * @param baseDir
   * @return {Promise<*>}
   */
  write: (compilationArtifacts, filename, contents, baseDir) => {
    const path = `${baseDir}/${filename}`;
    contents &&
      console.log(
        `[ASC] [WRITE] ${path} `.padEnd(80, ".") + ` ${contents.length} bytes`
      );

    //  Based on the type of the compilation artifact,
    //  place the artifact content into a corresponding field of `compiledResult`
    //  If `switch (true)` looks weird, please
    //  @See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch#an_alternative_to_if...else_chains
    switch (true) {
      case filename.endsWith(ArtifactFileType.MAP):
        compilationArtifacts[ArtifactFileType.MAP] = contents;
        break;
      case filename.endsWith(ArtifactFileType.WAT):
        compilationArtifacts[ArtifactFileType.WAT] = contents;
        break;
      case filename.endsWith(ArtifactFileType.D_TS):
        compilationArtifacts[ArtifactFileType.D_TS] = contents;
        break;
      case filename.endsWith(ArtifactFileType.WASM):
        compilationArtifacts[ArtifactFileType.WASM] = contents;
        break;
      case filename.endsWith(ArtifactFileType.JS):
        compilationArtifacts[ArtifactFileType.JS] = contents;
        break;
      default:
        console.warn(`[ASC] [WRITE] Unknown file format: ${filename}`);
    }

    // FIXME: Do we want to reject the promise upon an unknown file format?
    return new Promise((resolve) => {
      resolve();
    });
  },
};
