/**
 * An error object template. To be cloned, filled with available error details, and passed on to Parcel.
 * @type {{detailedMessage: string, filePath: string, start: {line: number, column: number}, end: {line: number, column: number}, message: string}}
 */
export const defaultError = {
  message: "n/a",
  filePath: __filename,
  // detailedMessage: "n/a",
  // start: {
  //   line: -1,
  //   column: -1,
  // },
  // end: {
  //   line: -1,
  //   column: -1,
  // },
};

/** FIXME */
export type ParcelError = typeof defaultError;
