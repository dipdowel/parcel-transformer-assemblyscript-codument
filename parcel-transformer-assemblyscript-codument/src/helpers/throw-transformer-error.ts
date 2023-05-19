import ThrowableDiagnostic from "@parcel/diagnostic";
import { ParcelError } from "../default-error";

/**
 * Throws an error in the Parcel way.
 * @param error
 */
export function throwTransformerError(error: ParcelError): never {
  throw new ThrowableDiagnostic({
    diagnostic: {
      message: error.message,
      codeFrames: [
        {
          language: "asc",
          filePath: error.filePath,
          codeHighlights: [
            {
              // TSC does not provide this level of detail, so we fill dummy values in here.
              message: "n/a", // message: error.detailedMessage,
              start: { line: 0, column: 0 }, // start: { line: error.start.line, column: error.start.column },
              end: { line: 0, column: 0 }, // end: { line: error.end.line, column: error.end.column },
            },
          ],
        },
      ],
    },
  });
}
