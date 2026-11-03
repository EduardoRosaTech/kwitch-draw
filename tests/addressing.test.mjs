import { test } from "node:test";
import assert from "node:assert/strict";
import { address } from "../lib/addressing.ts";
test("feminine treatment", () => {
  assert.equal(address("feminine").alias, "Bruxinha");
  assert.equal(address("feminine").artist, "Ilustradora de mundos");
  assert.equal(address("feminine").witch, "Bruxa do ateliê");
});
test("masculine treatment", () => {
  assert.equal(address("masculine").alias, "Bruxinho");
  assert.equal(address("masculine").artist, "Ilustrador de mundos");
  assert.equal(address("masculine").witch, "Bruxo do ateliê");
});
test("neutral and missing preference", () => {
  assert.equal(address().alias, "Pessoa criativa");
  assert.equal(address("neutral").witch, "Magia do ateliê");
  assert.equal(address(undefined).welcome, "SEU ATELIÊ ESTÁ DE PORTAS ABERTAS");
});
