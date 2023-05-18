import path from "path";
import { ArtifactFileType } from "./artifact-file-type";
import { APIResult, ASC, loadCompiler } from "./compile/load-compiler";
import { throwTransformerError } from "./helpers/throw-transformer-error";
import { read, write } from "./compile/io";
import { CompilationArtifacts } from "./helpers/compilation-artifacts";
import { ConfigRequest } from "./parcel-types";

/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC][COMPILE]";

// /**  An instance of AssemblyScript Compiler for programmatic usage. */
let asc: ASC | undefined;

/**
 * TODO: Write JSDoc!
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: *, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
export async function compile(asset: any /* FIXME: the type! */): Promise<
  | undefined
  | (ConfigRequest & {
      compiledResult: CompilationArtifacts;
    })
> {
  //FIXME: #############################################################################################################
  //FIXME: 1. Extract into a separate function
  //FIXME: 2. Load just once and then mem-cache
  //FIXME: 3. Print a log on every usage to see whether the caching actually makes sense here

  const { asc: compiler, error: ascError } = await loadCompiler();

  // FIXME: this is ugly, fix it!
  asc = compiler;

  if (!asc || ascError) {
    ascError && throwTransformerError(ascError);
    return;
  }
  //FIXME: #############################################################################################################

  const { filePath, inputCode /*, readFile */ } = asset;
  // console.log(`>>> compileAssemblyScript(), filePath: ${filePath}`);
  // console.log(`>>> compileAssemblyScript(), inputCode: ${inputCode}`);

  const absolutePath = path.basename(filePath);

  console.log(
    `${PREF} compileAssemblyScript(), absolutePath: ${absolutePath} `
  );

  // /**
  //  * A collection of all the compilation artifacts that ASC produces + compilation statistics info
  //  * @type {{[p: string]: null, stats: null}}
  //  * FIXME: tighten the type! It's clear which fields are binary and which are a `string`!
  //  */
  // let compilationArtifacts333: Record<
  //   ArtifactFileType,
  //   undefined | string | Buffer
  // > & {
  //   stats?: string;
  // } = {
  //   [ArtifactFileType.MAP]: undefined,
  //   [ArtifactFileType.WASM]: undefined,
  //   [ArtifactFileType.WAT]: undefined,
  //   [ArtifactFileType.D_TS]: undefined,
  //   [ArtifactFileType.JS]: undefined,
  //
  //   /** A printable string with the statistics of the compilation */
  //   stats: undefined,
  // };

  // Record< ArtifactFileType, undefined | string | Buffer > & { stats?: string; } =

  /** A collection of all the compilation artifacts that ASC produces + compilation statistics info */
  let compilationArtifacts: Partial<CompilationArtifacts> = {};

  // -------------------------------------------------------------------------------------------------------------------
  // [AssemblyScript Compiler] starts
  const result: APIResult = await asc.main(
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
        read(inputCode, absolutePath, baseDir),

      /**
       * Here we hook into how ASC writes files to the file system,
       * and execute our custom logic of writing to a file.
       * @See `ascIO.write()`
       */
      writeFile: (
        filename: string,
        contents: string | Buffer | Uint8Array /*Uint8Array*/,
        baseDir: string
      ) =>
        write(
          compilationArtifacts as CompilationArtifacts,
          filename,
          contents,
          baseDir
        ),
    }
  );

  let error, stdout, stderr, stats;

  if (result) {
    error = result.error;
    stdout = result.stdout;
    stderr = result.stderr;
    /** @See type `Stats` in https://github.com/AssemblyScript/assemblyscript/blob/main/cli/index.d.ts */
    stats = result.stats;
  }

  // [AssemblyScript Compiler] ends
  // -------------------------------------------------------------------------------------------------------------------

  // Store the log-friendly string representation of the compilation statistics
  compilationArtifacts.stats = stats?.toString();

  if (error) {
    console.error(`${PREF} Compilation failed: ${error.message}`);
    console.error(stderr?.toString());
  } else {
    console.log(stdout?.toString());
  }

  // #####################################################################################################################

  return {
    compiledResult: compilationArtifacts as CompilationArtifacts,
    error,
    // @ts-ignore
    invalidateOnFileChange: [], // FIXME: Fill in with the filenames ASC tries to read
    // @ts-ignore
    invalidateOnFileCreate: [], // FIXME: Fill in with the filenames created before that ASC sees for the second or a later time (Is it really so?)
    // @ts-ignore
    invalidateOnEnvChange: [], // FIXME: How do I fill in this one?
  };
}
