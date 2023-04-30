/**
 * AssemblyScript Compiler IO emulation
 * @type {{reportDiagnostics: ascIO.reportDiagnostics, stdout: ascIO.stdout, stderr: ascIO.stderr, write: ascIO.write}}
 */
export const ascIO = {
  write: function (path, data, a2, a3) {
    console.log("a");
    return;
    console.log(
      `[IO] write. Path: ${path} \n\n DATA:\n${data}\n\n ::: a2: ${a2}, a3: ${a3}`
    );
  },

  reportDiagnostics: function (path, data, a2, a3) {
    console.log("b");
    return;
    console.log(
      `[IO] reportDiagnostics. Path: ${path} \n\n DATA:\n${data}\n\n ::: a2: ${a2}, a3: ${a3}`
    );
  },

  stdout: function (path, data, a2, a3) {
    console.log("c");
    return;
    console.log(
      `[IO] stdout. Path: ${path} \n\n DATA:\n${data}\n\n ::: a2: ${a2}, a3: ${a3}`
    );
  },

  stderr: function (path, data, a2, a3) {
    console.log("d");
    return;
    console.error(
      `[IO] stderr. Path: ${path} \n\n DATA:\n${data}\n\n ::: a2: ${a2}, a3: ${a3}`
    );
  },
};
