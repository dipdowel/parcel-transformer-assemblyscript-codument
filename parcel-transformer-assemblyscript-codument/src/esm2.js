// require = require("esm")(module);
// /**  An instance of AssemblyScript Compiler for programmatic usage. */
// let asc;
//
// // exports.getAsc = async function () {
//
// export async function getAsc() {
//   console.log("Hello from getAsc!");
//
//   try {
//     asc = await import("assemblyscript/dist/asc.js");
//     // asc = require("assemblyscript/dist/asc.js");
//     return asc;
//   } catch (e) {
//     console.error(
//       `Could not import AssemblyScript Compiler. Is "assemblyscript" present  in NODE_MODULES?\n${e}`
//     );
//     return null;
//   }
//
//   //
//   // // AssemblyScript Compiler is an ESM, hence this trickery to load it into a CommonJS file.
//   // await (async () => {
//   //   // FIXME: we now manually copy `assemblyscript` to `node_modules`, that needs to be managed by `package.json`!
//   //
//   //   console.log(`${PREF} 🚀 AssemblyScript compiler loaded`);
//   // })().catch((e) => {
//   //   throwTransformerError({
//   //     ...defaultError,
//   //     message: `${PREF} `,
//   //   });
//   // });
// }
