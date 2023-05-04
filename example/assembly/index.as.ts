// The entry file of your WebAssembly module.

import { myNumber } from "./data";
import { helper } from "./helper";

export function add(a: i32, b: i32): i32 {
  const myArray = helper();

  console.log("[WASM] Hi there!");
  return a + b + myNumber + myArray[0];
}
