import type { FileCreateInvalidation, FilePath } from "@parcel/types";

import path from "path";

import { APIResult, ASC, loadCompiler } from "./compile/load-compiler";

import { read, write } from "./compile/io";
import { CompilationArtifacts } from "./helpers/compilation-artifacts";

/**
 * Logging prefix
 * @type {string}
 */
const PREF = "[ASC][COMPILE]";

export type Compiled = {
  invalidateOnFileChange: FilePath[];
  invalidateOnFileCreate: FileCreateInvalidation[];
  invalidateOnEnvChange: string[];
  compilationArtifacts: CompilationArtifacts;
};

// AssemblyScript Compiler suitable for programmatic usage.
// Keeping it as a global variable allows caching in order to avoid reloading the compiler every time
let asc: ASC | undefined;

/**
 *
 * @param asset
 * @return {Promise<{wasmResult: string, invalidateOnFileChange: *[], invalidateOnEnvChange: *[], error: *, jsResult: string, invalidateOnFileCreate: *[]}>}
 */
/**
 * TODO: Write JSDoc!
 * @param asset
 */
export async function compile(asset: {
  filePath: FilePath;
  inputCode: string;
}): Promise<Compiled> {
  // console.log(`>>>>>>> Is ASC from cache? ${!!asc}`);

  // If ASC hasn't been cached yet, load and cache it.
  if (!asc) {
    asc = await loadCompiler();
  }

  const { filePath, inputCode /*, readFile */ } = asset;

  const absolutePath = path.basename(filePath);

  console.log(
    `${PREF} compileAssemblyScript(), absolutePath: ${absolutePath} `
  );

  /** A collection of all the compilation artifacts that ASC produces + compilation statistics info */
  let compilationArtifacts: Partial<CompilationArtifacts> = {};

  // -------------------------------------------------------------------------------------------------------------------
  // [AssemblyScript Compiler] starts

  // All the files referenced in AssemblyScript code
  const filesToWatch: string[] = [];

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
      readFile: (absolutePath: string, baseDir: string = "./assembly/") => {
        // We want to watch all the files except the configuration
        !absolutePath.includes(`asconfig.json`) &&
          filesToWatch.push(`./assembly/${absolutePath}`);

        return read(inputCode, absolutePath, baseDir);
      },

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

  const {
    error,
    stdout,
    stderr,
    /** @See type `Stats` in https://github.com/AssemblyScript/assemblyscript/blob/main/cli/index.d.ts */
    stats,
  } = result;

  // [AssemblyScript Compiler] ends
  // -------------------------------------------------------------------------------------------------------------------

  // Store the log-friendly string representation of the compilation statistics
  compilationArtifacts.stats = stats?.toString();

  if (error) {
    // Some formatting for the errors in AssemblyScript code
    const line = "─".repeat(79);
    throw new Error(
      `\n${line}\nAssemblyScript Compiler\n${line}\n${error}\n\n${stderr?.toString()}${line}\n`
    );
  } else {
    console.log(stdout?.toString());
  }

  return {
    compilationArtifacts: compilationArtifacts as CompilationArtifacts,
    invalidateOnFileChange: filesToWatch,
    invalidateOnFileCreate: [],
    invalidateOnEnvChange: [],
  };
}
