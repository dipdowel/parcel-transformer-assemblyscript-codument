// The entry file of your WebAssembly module.

import { myNumber } from "./data";
import { helper } from "./package1/sub-package-1/helper";

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

  // The transformer breaks when any change in AS is done
  console.log("CHANGE THIS STRING TO PROVOKE THE ERROR");

  //
  // Throw an error on purpose
  // const ddd: i32;
  // console.log("[WASM] ddd: " + ddd.toString(10));

  return a + b;
}
