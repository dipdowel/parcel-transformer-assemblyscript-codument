// The entry file of your WebAssembly module.

import { myNumber } from "./data";
import { helper } from "./helper";

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
  return a + b;
}
