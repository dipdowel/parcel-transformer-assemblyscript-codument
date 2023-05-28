import test from "tape";
import * as fs from "fs";
import { writeDeclarationFile } from "./write-declaration-file";
import mock from "mock-fs";

test("writeDeclarationFile should write the declaration file correctly", (t) => {
  mock({
    "./assembly/../": {},
  });

  writeDeclarationFile(" Custom declarations ");
  const isFileCreated = fs.existsSync("./assembly/../wasm-module.d.ts");
  t.ok(
    isFileCreated,
    "File `wasm-module.d.ts` should be created in `./assembly/../`"
  );

  // t.comment("Make sure the content of `wasm-module.d.ts` is correct");

  const data = fs.readFileSync("./assembly/../wasm-module.d.ts", {
    encoding: "utf-8",
  });
  t.equals(
    data,
    "/** ATTENTION: This file is autogenerated by AssemblyScript compiler, please do not edit manually. */\n Custom declarations \n/** Shape of the WASM module compiled from AssemblyScript */\nexport type WasmModule = typeof __AdaptedExports;",
    "The content of `wasm-module.d.ts` is correct"
  );

  mock.restore();
  t.end();
});