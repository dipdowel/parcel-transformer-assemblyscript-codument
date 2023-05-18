import { ArtifactFileType } from "../artifact-file-type";

import * as fs from "fs";

/**
 * AssemblyScript Compiler IO hooks.
 * FIXME: improve the JSDoc below!
 * We don't want to let AssemblyScript Compiler interact with the filesystem on its own, TODO: explain why!
 * so we use custom `read()` and `write()` functions to hook into all the read/write operations
 * and customise them.
 * @type {{read: ((function(string, string, string): Promise<*>)|*), write: (function(*, *, *, *): Promise<*>)}}
 */

// TODO:  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// TODO:  !!! THIS FILE MUST BE HEAVILY UNIT-TESTED !!!
// TODO:  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// FIXME: See whether `read()` and `write()` have to be async or not and update the code accordingly!
/**
 * Prefix for logging the reading of files from the FS
 * @type {string}
 */
const PREF_READ = `[ASC] 📤 Read  `;

/**
 * Prefix for logging the writing of files to the FS
 * @type {string}
 */
const PREF_WRITE = `[ASC] 💽 Write `;

const DOT_PADDING = 100;

/**
 * `asconfig.json` read from the user's project root directory
 * @type {JSON}
 * FIXME: So is it `JSON` or `string` after all?!
 */
let asconfigCache: string;

/**
 * Overrides the ASC functionality of writing to the file system.
 * Writes a compilation artifact file into an object in memory, to be passed to Parcel.
 * @param {{[p: string]: null, stats: null}} compilationArtifacts -- the result of the compilation gets written to this object
 * @param {string} filename
 * @param {any} contents
 * @param {string} baseDir
 * @return {Promise<*>}
 */
export function write(
  compilationArtifacts: Record<ArtifactFileType, string | Buffer | Uint8Array>,
  filename: string,
  contents: string | Buffer | Uint8Array,
  baseDir: string
) {
  const path = `${baseDir}/${filename}`;
  contents &&
    console.log(
      `${PREF_WRITE} ${path} `.padEnd(DOT_PADDING, ".") +
        ` ${contents.length} bytes`
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

  // FIXME: Do we want this function to be async after all?
  // FIXME: Do we want to reject the promise upon an unknown file format?
  return new Promise<void>((resolve) => {
    resolve();
  });
}

/**
 * Overrides the ASC functionality of reading from the file system.
 * - NB: Caches user's custom `asconfig.json` on the first read and never re-reads.
 * - Adds some logging for the read operations.
 * @param {string} inputCode
 * @param {string} filename
 * @param {string} baseDir
 * @return {Promise<unknown>}
 */
export function read(inputCode: string, filename: string, baseDir: string) {
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

    // return cached AssemblyScript config file if requested *and* previously cached
    if (isConfigFile && asconfigCache) {
      console.log(
        `${PREF_READ} ${absolutePath} `.padEnd(DOT_PADDING, ".") +
          ` ${asconfigCache.length} bytes [CACHED]`
      );
      return asconfigCache;
    }

    const content = fs.readFileSync(absolutePath, "utf8");

    console.log(
      `${PREF_READ} ${absolutePath} `.padEnd(DOT_PADDING, ".") +
        ` ${content.length} bytes`
    );
    if (isConfigFile) {
      // Cache AssemblyScript config file
      asconfigCache = content;
      console.log(
        `[ASC] 📦 Cached ${absolutePath} `.padEnd(DOT_PADDING, ".") +
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
  // FIXME: Do we want this function to be async after all?
  // return new Promise((resolve) => {
  //   resolve();
  //   reject();
  // });
}
