// import { dbg } from "../dbg";
import path from "path";

/** Separates the file name from the rest of the path and returns those two parts of the path separatly */
export function figureOutPaths(pathToDTS: string): {
  filename: string;
  directories: string;
} {
  const filename = path.basename(pathToDTS);
  const directories: string = path.dirname(pathToDTS);

  return { filename, directories };
}
