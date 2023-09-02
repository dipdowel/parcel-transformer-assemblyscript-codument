// The entry file of your WebAssembly module.

import { myNumber } from "./data";
import { helper } from "./package1/sub-package-1/helper";
import { newFileValue } from "./new-file-1";

//#dbg-start
import { debugOnlyHelper } from "./package1/sub-package-1/debug-only-helper";
// All the code enclosed between the opening and closing debug comments gets removed from the production build.
// So this import won't even happen on `yarn build`, it only happens on `yarn start`.
//#dbg-end

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

  //#dbg-start
  //--------------------------------------------------------------------------------------------------------
  // This code will be removed from the production build.
  // Because it's enclosed between the opening and closing debug comments.
  debugOnlyHelper();
  const debugNumber = 123;
  console.log(
    ">>> This line will not be printed in a production build. It will be removed by the preprocessor",
  );
  console.log(">>> Debug number: " + debugNumber.toString(10));
  //--------------------------------------------------------------------------------------------------------
  //#dbg-end

  console.log("CHANGE THIS STRING TO TRIGGER THE COMPILER");

  return a + b;
}
