import test from "tape";
import mock from "mock-fs";
import { read } from "./io";

const DEFAULT_CONFIG = {
  targets: {
    debug: {
      sourceMap: true,
      shrinkLevel: 0,
      debug: true,
    },
    release: {
      sourceMap: false,
      optimizeLevel: 3,
      shrinkLevel: 2,
      converge: false,
      noAssert: false,
      debug: false,
    },
  },
  options: {
    bindings: "raw",
  },
};

test("read - reads the file content", (t) => {
  // t.plan(2);

  const filename = "test.txt";
  const baseDir = "/path/to/files";

  const expectedContent = "{targets: {debug:{}, release:{}}}";

  mock({
    "/path/to/files/test.txt": expectedContent,
  });

  const content = read(filename, baseDir, JSON.stringify(DEFAULT_CONFIG));

  t.comment(" content: " + content);

  t.equal(content, expectedContent, "Returns the expected file content");

  mock.restore();
  t.end();
});

// test("read - throws error when reading non-config file", (t) => {
//   t.plan(2);
//
//   const filename = "test.txt";
//   const baseDir = "/path/to/files";
//
//   const expectedError = new Error(
//     "Error reading /path/to/files/test.txt :: File not found"
//   );
//
//   fsMock.mock({
//     "/path/to/files/test.txt": fsMock.error({ code: "ENOENT" }),
//   });
//
//   t.throws(
//     () => {
//       read(filename, baseDir);
//     },
//     expectedError,
//     "Throws an error when reading non-config file"
//   );
//
//   t.equal(
//     fsMock.readFileSync.calls.length,
//     1,
//     "fs.readFileSync is called once"
//   );
//
//   fsMock.restore();
//
//   t.end();
// });
//
// test("read - returns default config when reading missing asconfig.json", (t) => {
//   t.plan(3);
//
//   const filename = "asconfig.json";
//   const baseDir = "/path/to/files";
//
//   const expectedDefaultConfig = JSON.stringify({ defaultConfig: true });
//
//   fsMock.mock({
//     "/path/to/files/asconfig.json": fsMock.error({ code: "ENOENT" }),
//   });
//
//   const content = read(filename, baseDir);
//
//   t.equal(
//     fsMock.readFileSync.calls.length,
//     1,
//     "fs.readFileSync is called once"
//   );
//   t.equal(content, expectedDefaultConfig, "Returns the default config");
//   t.equal(fsMock.console.log.calls.length, 1, "Logs the use of default config");
//
//   fsMock.restore();
//
//   t.end();
// });
//
// test("read - returns cached config when reading asconfig.json", (t) => {
//   t.plan(3);
//
//   const filename = "asconfig.json";
//   const baseDir = "/path/to/files";
//
//   const cachedConfig = JSON.stringify({ cachedConfig: true });
//
//   fsMock.mock({
//     "/path/to/files/asconfig.json": cachedConfig,
//   });
//
//   const content = read(filename, baseDir);
//
//   t.equal(
//     fsMock.readFileSync.calls.length,
//     1,
//     "fs.readFileSync is called once"
//   );
//   t.equal(content, cachedConfig, "Returns the cached config");
//   t.equal(fsMock.console.log.calls.length, 1, "Logs the use of cached config");
//
//   fsMock.restore();
//
//   t.end();
// });
