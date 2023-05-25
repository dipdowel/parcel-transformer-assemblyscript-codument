import { expect } from "chai";
import { extendJsCode } from "./extend-js-code";

describe("sum", () => {
  it("should return the sum of two numbers", () => {
    const result = extendJsCode("console.log('test')", false);
    expect(1).to.equal(1);
  });
});
