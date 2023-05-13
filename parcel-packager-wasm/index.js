const assert = require("assert");
const { Packager } = require("@parcel/plugin");

module.exports = new Packager({
  async package({ bundle }) {
    let assets = [];
    bundle.traverseAssets((asset) => {
      assets.push(asset);
    });

    assert.equal(assets.length, 1, "Raw bundles must only contain one asset");
    return { contents: assets[0].getStream(), map: await assets[0].getMap() };
  },
});
