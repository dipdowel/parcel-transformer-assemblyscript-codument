import path from "path";
import { ArtifactFileType } from "./artifact-file-type";
import { ascIO } from "./helpers/asc-io";
import { ASC } from "./load-assembly-script-compiler";

/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC][COMPILE]";

/**
 * TODO: Write JSDoc!
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: *, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
export async function compileAssemblyScript(
  asset: any /* FIXME: the type! */,
  asc: ASC
) {
  const { filePath, inputCode /*, readFile */ } = asset;
  // console.log(`>>> compileAssemblyScript(), filePath: ${filePath}`);
  // console.log(`>>> compileAssemblyScript(), inputCode: ${inputCode}`);

  const absolutePath = path.basename(filePath);

  console.log(
    `${PREF} compileAssemblyScript(), absolutePath: ${absolutePath} `
  );

  /**
   * A collection of all the compilation artifacts that ASC produces + compilation statistics info
   * @type {{[p: string]: null, stats: null}}
   */

  let compilationArtifacts: Record<ArtifactFileType, string | Buffer> & {
    stats: string;
  } = {
    [ArtifactFileType.MAP]: null,
    [ArtifactFileType.WASM]: null,
    [ArtifactFileType.WAT]: null,
    [ArtifactFileType.D_TS]: null,
    [ArtifactFileType.JS]: null,

    /** A printable string with the statistics of the compilation */
    stats: null,
  };

  // -------------------------------------------------------------------------------------------------------------------
  // [AssemblyScript Compiler] starts
  const {
    error,
    stdout,
    stderr,

    /** @See type `Stats` in https://github.com/AssemblyScript/assemblyscript/blob/main/cli/index.d.ts */
    stats,
  } =
    asc &&
    (await asc.main(
      [
        /* Command line options */
        absolutePath,
        "--outFile",
        "output.wasm", // FIXME: See whether it's better to use `asconfig.json` to define the WASM file name
        "--debug", // FIXME: enable/disable debug mode depending on the Parcel mode: "development" or "production".
        // "--optimize",
        // "--sourceMap",
        // "/output.wasm.map",
        // "--stats",
      ],
      {
        /* Additional API options */
        // stdout: io.stdout,
        // stderr: (e, e2) => console.log(new Error(e + " :: " + e2)),

        /**
         * Here we hook into how ASC reads files from the file system,
         * and execute our custom file reading logic
         * @See `ascIO.read()`
         */
        readFile: (absolutePath: string, baseDir: string = "./assembly/") =>
          ascIO.read(inputCode, absolutePath, baseDir),

        /**
         * Here we hook into how ASC writes files to the file system,
         * and execute our custom logic of writing to a file.
         * @See `ascIO.write()`
         */
        writeFile: (
          filename: string,
          contents: string | Buffer | Uint8Array /*Uint8Array*/,
          baseDir: string
        ) => ascIO.write(compilationArtifacts, filename, contents, baseDir),
      }
    ));
  // [AssemblyScript Compiler] ends
  // -------------------------------------------------------------------------------------------------------------------
  asc.main;
  // Store the log-friendly string representation of the compilation statistics
  compilationArtifacts.stats = stats.toString();

  if (error) {
    console.error(`${PREF} Compilation failed: ${error.message}`);
    console.error(stderr.toString());
  } else {
    console.log(stdout.toString());
  }

  // #####################################################################################################################

  return {
    compiledResult: compilationArtifacts,
    error,
    // @ts-ignore
    invalidateOnFileChange: [], // FIXME: Fill in with the filenames ASC tries to read
    // @ts-ignore
    invalidateOnFileCreate: [], // FIXME: Fill in with the filenames created before that ASC sees for the second or a later time (Is it really so?)
    // @ts-ignore
    invalidateOnEnvChange: [], // FIXME: How do I fill in this one?
  };
}
