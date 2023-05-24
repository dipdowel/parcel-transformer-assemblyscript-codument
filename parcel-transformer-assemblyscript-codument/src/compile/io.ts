import { ArtifactFileType } from "../artifact-file-type";
import * as fs from "fs";
import * as path from "path";

import * as defaultASConfig from "../asconfig.default.json";
import { verifyConfig } from "./verify-config";

/**
 * A collection of middleware functions.
 * The functions are used to hook into AssemblyScript Compiler input/output.
 */

// TODO:  !!! THIS FILE MUST BE HEAVILY UNIT-TESTED !!!

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

/** `asconfig.json` read from the user's project root directory */
let asconfigCache: string;

/**
 * A middleware function for ASC.
 * Writes a compilation artifact file into an object in memory instead of disk storage.
 * The object is then used by Parcel.
 * @param compilationArtifacts
 * @param filename
 * @param contents
 * @param baseDir
 */
export function write(
  compilationArtifacts: Record<ArtifactFileType, string | Buffer | Uint8Array>,
  filename: string,
  contents: string | Buffer | Uint8Array,
  baseDir: string
): void {
  const filePath = path.join(baseDir, filename);

  // console.log(`>>>>>>>>>> filename : ${JSON.stringify(filename)}`);

  contents &&
    console.log(
      `${PREF_WRITE} ${filePath} `.padEnd(DOT_PADDING, ".") +
        ` ${contents.length} bytes`
    );

  //  Based on the type of the compilation artifact,
  //  place the artifact content into a corresponding field of `compilationArtifacts`
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
}

/**
 * A middleware function for ASC.
 * Modifies the way how ASC reads files from the file system.
 * - NB: Caches user's custom `asconfig.json` on the first read and never re-reads.
 * - Adds some logging for the read operations.
 * @param inputCode
 * @param filename
 * @param baseDir
 * @return
 */
export function read(
  inputCode: string,
  filename: string,
  baseDir: string
): string {
  let filePath = path.join(baseDir, filename);

  const isConfigFile = filename.toLowerCase().trim().endsWith(`asconfig.json`);

  if (isConfigFile) {
    filePath = "./asconfig.json";
  }

  // return cached AssemblyScript config file if requested *and* previously cached
  if (isConfigFile && asconfigCache) {
    console.log(
      `${PREF_READ} ${filePath} `.padEnd(DOT_PADDING, ".") +
        ` ${asconfigCache.length} bytes [CACHED]`
    );
    return asconfigCache;
  }

  let content: string | undefined;

  try {
    content = fs.readFileSync(filePath, "utf8");
    if (isConfigFile) {
      console.log(`[AS-CONF] User's 'asconfig.json' loaded...`);
    }
  } catch (err) {
    if (!isConfigFile) {
      //  a missing non-configuration file is a problem
      const msg = `${PREF_READ} Error reading ${filePath} :: ${err}`;
      throw new Error(msg);
    } else {
      //  a missing configuration file is a valid case.
      //  In such case we use the default configuration instead.
      content = JSON.stringify(defaultASConfig);
      console.log(`[AS-CONF] Default asconfig.json used...`);
    }
  }

  if (isConfigFile) {
    // User config may need to be modified or completely replaced by the default one
    content = verifyConfig(content) || JSON.stringify(defaultASConfig);
  }

  if (isConfigFile) {
    // Cache AssemblyScript config file
    asconfigCache = content;
    console.log(
      `[ASC] 📦 Cached ${filePath} `.padEnd(DOT_PADDING, ".") +
        ` ${content.length} bytes`
    );
  }

  console.log(
    `${PREF_READ} ${filePath} `.padEnd(DOT_PADDING, ".") +
      ` ${content.length} bytes`
  );

  return content;
}
