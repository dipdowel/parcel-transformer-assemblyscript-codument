const { ArtifactFileType } = require("./artifact-file-type");
const fs = require("fs");

// FIXME:
// FIXME:
// FIXME:  !!! THIS FILE MUST BE HEAVILY UNIT-TESTED !!!
// FIXME:
// FIXME:

const PREF_READ = `[ASC] 📤 Read  `;
const PREF_WRITE = `[ASC] 💽 Write `;

/**
 * `asconfig.json` read from the user's project root directory
 * @type {JSON}
 */
let asconfigCache = null;

/**
 * AssemblyScript Compiler IO hooks.
 * We don't want to let AssemblyScript Compiler interact with the physical filesystem,
 * so we use custom `read()` and `write()` functions to perform all the read/write operations just in  memory
 * @type {{read: ((function(string, string, string): Promise<*>)|*), write: (function(*, *, *, *): Promise<*>)}}
 */
export const ascIO = {
  /**
   *  Reading from the physical file system,
   *  NB: Caches user's custom `asconfig.json` on the first read and never re-reads.
   * @param {string} inputCode
   * @param {string} filename
   * @param {string} baseDir
   * @return {Promise<unknown>}
   */
  read: (inputCode, filename, baseDir) => {
    // const absolutePath = `${baseDir}/${filename}`;
    let absolutePath = `./assembly/${filename}`;
    try {
      // const isConfigFile = filename.toLowerCase().trim() === `asconfig.json`;
      const isConfigFile = filename
        .toLowerCase()
        .trim()
        .endsWith(`asconfig.json`);

      if (isConfigFile) {
        absolutePath = "./asconfig.json";
      }

      // return cached AssemblyScript config file if requested and previously cached
      if (isConfigFile && asconfigCache) {
        console.log(
          `${PREF_READ} ${absolutePath} `.padEnd(80, ".") +
            ` ${content.length} bytes [CACHED]`
        );
        return asconfigCache;
      }

      const content = fs.readFileSync(absolutePath, "utf8");

      console.log(
        `${PREF_READ} ${absolutePath} `.padEnd(80, ".") +
          ` ${content.length} bytes`
      );
      if (isConfigFile) {
        // Cache AssemblyScript config file
        asconfigCache = content;
        console.log(
          `[ASC] 📦 Cached ${absolutePath} `.padEnd(80, ".") +
            ` ${content.length} bytes`
        );
      }
      return content;
      //
    } catch (err) {
      const msg = `${PREF_READ} Error reading ${absolutePath} :: ${err}`;
      console.error(msg);
      throw new Error(msg); // Should I`throw` here or just call `console.error()`?
    }
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
        `${PREF_WRITE} ${path} `.padEnd(80, ".") + ` ${contents.length} bytes`
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
        console.warn(`${PREF_WRITE} Unknown file format: ${filename}`);
    }

    // FIXME: Do we want to reject the promise upon an unknown file format?
    return new Promise((resolve) => {
      resolve();
    });
  },
};
