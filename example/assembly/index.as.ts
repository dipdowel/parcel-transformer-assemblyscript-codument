// The entry file of your WebAssembly module.

import { myNumber } from "./data";
import { helper } from "./package1/sub-package-1/helper";
import { newFileValue } from "./new-file-1";

/**
 * This is a simple addition of two i32 values
 * @param a
 * @param b
 */
export function add(a: i32, b: i32): i32 {
  const myArray = helper();

  console.log("[WASM] Hi there!");
  console.log("[WASM] myNumber: " + myNumber.toString(10));
  console.log("[WASM] myArray: " + myArray.toString());
  console.log("[WASM] newFileValue: " + newFileValue.toString(10));

  console.log("CHANGE THIS STRING TO TRIGGER THE COMPILER");

  //
  // Throw an error on purpose
  // const ddd: i32;
  // console.log("[WASM] ddd: " + ddd.toString(10));

  return a + b;
}
