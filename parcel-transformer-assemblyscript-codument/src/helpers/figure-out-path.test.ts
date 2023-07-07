// // import { dbg } from "../dbg";
// import test from "tape";
// import { figureOutPaths } from "./figure-out-path";
//
// test("figureOutPaths()", (t) => {
//   let { filename, directories } = figureOutPaths("./src/my-file.d.ts");
//   t.equals(filename, "my-file.d.ts", "filename extracted correctly");
//   t.equals(directories, "./src", "directories extracted correctly");
//
//   ({ filename, directories } = figureOutPaths(
//     "/home/user/project/src/my-file.d.ts"
//   ));
//   t.equals(filename, "my-file.d.ts", "filename extracted correctly");
//   t.equals(
//     directories,
//     "/home/user/project/src",
//     "directories extracted correctly"
//   );
//
//   t.end();
//   // dbg.setEnabled(false); // disable debug output
// });
