const { default: ThrowableDiagnostic } = require("@parcel/diagnostic");

/**
 * Throws an error in the Parcel way.
 * @param error
 */
export function throwTransformerError(error) {
  throw new ThrowableDiagnostic({
    diagnostic: {
      message: error.message,
      codeFrames: [
        {
          language: "asc",
          filePath: error.filePath,
          codeHighlights: [
            {
              message: error.detailedMessage,
              start: { line: error.start.line, column: error.start.column },
              end: { line: error.end.line, column: error.end.column },
            },
          ],
        },
      ],
    },
  });
}
