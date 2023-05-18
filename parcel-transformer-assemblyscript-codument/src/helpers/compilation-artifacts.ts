import { ArtifactFileType } from "../artifact-file-type";

export type CompilationArtifacts = {
  [ArtifactFileType.MAP]: string;
  [ArtifactFileType.WASM]: Buffer;
  [ArtifactFileType.WAT]: string;
  [ArtifactFileType.D_TS]: string;
  [ArtifactFileType.JS]: string;
  /** A printable string with the statistics of the compilation */
  stats: string;
};
