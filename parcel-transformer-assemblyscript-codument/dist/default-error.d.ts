/**
 * An error object template. To be cloned, filled with available error details, and passed on to Parcel.
 * @type {{detailedMessage: string, filePath: string, start: {line: number, column: number}, end: {line: number, column: number}, message: string}}
 */
export declare const defaultError: {
    message: string;
    filePath: string;
    detailedMessage: string;
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
};
/** FIXME */
export type ErrorObj = typeof defaultError;
