/**
 * This function removes all debug statements from the input code.
 * A debug statement is a statement that is enclosed between `//#dbg-start` and `//#dbg-end` comments.
 * @param input
 */
export function preprocessDebugStatements(input: string): string {
  const dbgBlock = /\/\/#dbg-start([\s\S]*?)\/\/#dbg-end/g;
  return input.replace(dbgBlock, "");
}

//
// const inputCode = `
// //#dbg-start
// console.log("Debug statement 1");
// //#dbg-end
//
// console.log("Normal statement");
//
// //#dbg-start
// console.log("Debug statement 2");
// //#dbg-end
// `;
//
// const processedCode = preprocessDebugStatements(inputCode);
// console.log(processedCode);
