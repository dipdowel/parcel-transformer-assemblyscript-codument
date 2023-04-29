const wabtPromise = require("wabt");
const path = require("path");
const { Buffer } = require("buffer");
const { default: ThrowableDiagnostic, md } = require("@parcel/diagnostic");

const { Transformer } = require("@parcel/plugin");

const ERROR_REGEX = /^parseWat failed:\n[^:]*:(\d):(\d)+: (.*)/;

module.exports = new Transformer({
    async transform({ asset, logger }) {


        console.log("Point #1D");
        const wabt = await wabtPromise();
        console.log("Point #2D");

        let mod;
        try {
            mod = wabt.parseWat(
                path.basename(asset.filePath),
                await asset.getCode()
            );
        } catch (e) {
            let match = e.message.match(ERROR_REGEX);
            if (match != null) {
                let [, line, column, message] = match;
                throw new ThrowableDiagnostic({
                    diagnostic: {
                        message: "Failed to parse WAT",
                        codeFrames: [
                            {
                                filePath: asset.filePath,
                                language: "wat",
                                codeHighlights: [
                                    {
                                        start: { line, column },
                                        end: { line, column },
                                        message: md`${message}`,
                                    },
                                ],
                            },
                        ],
                    },
                });
            }
            throw e;
        }
        let binary = mod.toBinary({});

        asset.type = "wasm";
        asset.setBuffer(Buffer.from(binary.buffer));
        return [asset];
    },
});
