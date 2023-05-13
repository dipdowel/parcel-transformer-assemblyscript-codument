// The entry file of your WebAssembly module.

import { myNumber } from "./data";
import { helper } from "./helper";

export function add(a: i32, b: i32): i32 {
  const myArray = helper();

  console.log("[WASM] Hi there!");
  console.log("[WASM] myNumber: " + myNumber.toString(10));
  console.log("[WASM] myArray[0]: " + myArray.toString());
  return a + b;
}
