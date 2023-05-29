import test from "tape";
import { verifyConfig } from "./verify-config";

test("verifyConfig should return the config JSON if it is valid", (t) => {
  t.plan(6);
  //
  const validConfig = `{
  "targets": {
    "debug": {},
    "release": {}
  },
  "options": {
    "bindings": "raw"
  }
}`;
  let result = verifyConfig(validConfig);
  t.equal(
    result,
    '{"targets":{"debug":{},"release":{}},"options":{"bindings":"raw"}}',
    "Should return the same config JSON if all the fields are valid"
  );

  // Here 'esm' is invalid. It should be replaced with 'raw' by the validator.
  const configESM = `{
  "targets": {
    "debug": {},
    "release": {}
  },
  "options": {
    "bindings": "esm"
  }
}`;
  result = verifyConfig(configESM);
  t.equal(
    result,
    '{"targets":{"debug":{},"release":{}},"options":{"bindings":"raw"}}',
    "'esm' should be replaced with 'raw' by the validator"
  );

  // "options" omitted
  const configNoOptions = `{
  "targets": {
    "debug": {},
    "release": {}
  }
}`;
  result = verifyConfig(configNoOptions);
  t.equal(
    result,
    '{"targets":{"debug":{},"release":{}},"options":{"bindings":"raw"}}',
    "Missing 'options' field should be correctly inserted by the validator"
  );

  const configNoDebug = `{
  "targets": {   
    "release": {}
  },
  "options": {
    "bindings": "esm"
  }
}`;
  t.throws(
    () => verifyConfig(configNoDebug),
    "[no 'debug'] providing an incomplete config should throw an error"
  );

  const configNoRelease = `{
  "targets": {   
    "debug": {}
  },
  "options": {
    "bindings": "raw"
  }
}`;
  t.throws(
    () => verifyConfig(configNoRelease),
    "[no 'release'] providing an incomplete config should throw an error"
  );

  const configNoTarget = `{
    "options": {
    "bindings": "raw"
  }
}`;
  t.throws(
    () => verifyConfig(configNoTarget),
    "[no 'target'] providing an incomplete config should throw an error"
  );

  t.end();
});
