"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwTransformerError = void 0;
const diagnostic_1 = __importDefault(require("@parcel/diagnostic"));
/**
 * Throws an error in the Parcel way.
 * @param error
 */
function throwTransformerError(error) {
    throw new diagnostic_1.default({
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
exports.throwTransformerError = throwTransformerError;
//# sourceMappingURL=throw-transformer-error.js.map