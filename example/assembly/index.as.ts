// The entry file of your WebAssembly module.

import { myNumber } from "./data";

export function add(a: i32, b: i32): i32 {
  return a + b + myNumber;
}
