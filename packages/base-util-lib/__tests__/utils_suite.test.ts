// Copyright (c) 2019-2020-2021-2022 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as assert from 'assert';
import * as path from 'path';
import * as baseutillib from '../src/base-util-lib'
import * as actionlib from '../../action-lib/src/action-lib';
import * as lib from '../../action-lib/src/action-lib'

jest.setTimeout(15 * 1000)

const baseUtilLib: baseutillib.BaseUtilLib = new baseutillib.BaseUtilLib(new actionlib.ActionLib());

test('testing for path normalization', async () => {
  assert.strictEqual(baseutillib.BaseUtilLib.normalizePath('/a/path/'), path.join('/a', 'path'));
  assert.strictEqual(baseutillib.BaseUtilLib.normalizePath('/a/../path/'), path.normalize('/path'));
  assert.strictEqual(baseutillib.BaseUtilLib.normalizePath('/'), path.normalize('/'));
  assert.strictEqual(baseutillib.BaseUtilLib.normalizePath('/a'), path.normalize('/a'));
  assert.strictEqual(baseutillib.BaseUtilLib.normalizePath('/a/'), path.normalize('/a'));
  assert.strictEqual(baseutillib.BaseUtilLib.normalizePath('/a/path'), path.join('/a', 'path'));
});

test('parseVcpkgEnvOutput() tests', async () => {
  expect(baseUtilLib.parseVcpkgEnvOutput('a=1\nb=2')).toEqual({ "a": "1", "b": "2" });
});


test('isValidSHA1() tests', async () => {
  expect(baseutillib.BaseUtilLib.isValidSHA1('a')).toBeFalsy();
  expect(baseutillib.BaseUtilLib.isValidSHA1('477c8a9afe2d67cafa3521417f5feffc41d00bbe')).toBeTruthy();
});

test('tests for dumpError()', async () => {
  const actionLib: lib.ActionLib = new lib.ActionLib();
  // Call dumpError() with message.
  try {
    throw new Error("error");
  }
  catch (err) {
    baseutillib.dumpError(actionLib, err);
  }

  // Call dumpError() with no message.
  try {
    throw new Error();
  }
  catch (err) {
    baseutillib.dumpError(actionLib, err);
  }
});

const baseUtil: baseutillib.BaseUtilLib = new baseutillib.BaseUtilLib(new actionlib.ActionLib());

test('vcpkg.json must be found once', async () => {
  const globExpr = "**/dir/vcpkg.json";
  const ignoreExpr = "**/node_modules/**";
  expect(async () => await baseUtil.getFileHash(globExpr, [ignoreExpr])).toBeTruthy();
  const [file, hash] = await baseUtil.getFileHash(globExpr, [ignoreExpr]);
  expect(hash).toStrictEqual(
    '5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456');
  expect(file).toStrictEqual(
    path.join(__dirname, 'assets', 'dir', 'vcpkg.json'));
});

test('vcpkg.json must be found multiple times', async () => {
  await expect(() => baseUtil.getFileHash("**/vcpkg.json", [])).rejects.toThrow();
});

test('vcpkg.json must not be found', async () => {
  const empty = await baseUtil.getFileHash("**/notexistent/vcpkg.json", []);
  expect(empty).toStrictEqual([null, null]);
});

test('vcpkg.json must not be found because of the ignore pattern', async () => {
  const empty = await baseUtil.getFileHash("**/vcpkg.json", ["**/**"]);
  expect(empty).toStrictEqual([null, null]);
});

test('wrapOp() tests', async () => {
  await baseUtil.wrapOp("wrapOp", () => { return Promise.resolve() });
  await baseUtil.wrapOpSync("wrapOpSync", () => { return Promise.resolve() });
});

test('getDefaultTriplet() tests', async () => {
  expect(baseUtil.getDefaultTriplet()).toBeTruthy();
});
