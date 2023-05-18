import ThrowableDiagnostic from "@parcel/diagnostic";
import { ParcelError } from "../default-error";

/**
 * Throws an error in the Parcel way.
 * @param error
 */
export function throwTransformerError(error: ParcelError) {
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
