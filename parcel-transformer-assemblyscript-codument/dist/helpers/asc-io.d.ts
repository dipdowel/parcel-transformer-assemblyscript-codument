import { ArtifactFileType } from "../artifact-file-type";
/**
 * AssemblyScript Compiler IO hooks.
 * We don't want to let AssemblyScript Compiler interact with the filesystem on its own,
 * so we use custom `read()` and `write()` functions to hook into all the read/write operations
 * and customise them.
 * @type {{read: ((function(string, string, string): Promise<*>)|*), write: (function(*, *, *, *): Promise<*>)}}
 */
export declare const ascIO: {
    /**
     * Overrides the ASC functionality of writing to the file system.
     * Writes a compilation artifact file into an object in memory, to be passed to Parcel.
     * @param {{[p: string]: null, stats: null}} compilationArtifacts -- the result of the compilation gets written to this object
     * @param {string} filename
     * @param {any} contents
     * @param {string} baseDir
     * @return {Promise<*>}
     */
    write: (compilationArtifacts: Record<ArtifactFileType, string | Buffer | Uint8Array>, filename: string, contents: string | Buffer | Uint8Array, baseDir: string) => Promise<void>;
    /**
     * Overrides the ASC functionality of reading from the file system.
     * - NB: Caches user's custom `asconfig.json` on the first read and never re-reads.
     * - Adds some logging for the read operations.
     * @param {string} inputCode
     * @param {string} filename
     * @param {string} baseDir
     * @return {Promise<unknown>}
     */
    read: (inputCode: string, filename: string, baseDir: string) => any;
};
