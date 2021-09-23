// Copyright (c) 2019-2020-2021 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as globals from '../src/vcpkg-globals';
import * as testutils from './utils';
import * as path from 'path';
import * as mock from './mocks';
import * as assert from 'assert';
import * as utils from '@lukka/base-util-lib';
import * as runvcpkgutils from '../src/vcpkg-utils'

// Arrange.
const isWin = process.platform === "win32";
const newGitRef = '1ee7567890123456789012345678901234567890'
const oldGitRef = '01d4567890123456789012345678901234567890';
const gitPath = '/usr/local/bin/git';
const vcpkgRoot = '/path/to/vcpkg';
const vcpkgExeName = isWin ? "vcpkg.exe" : "vcpkg";
const vcpkgExePath = path.join(vcpkgRoot, vcpkgExeName);
const prefix = isWin ? "cmd.exe /c " : "/bin/bash -c ";
const bootstrapName = isWin ? "bootstrap-vcpkg.bat" : "bootstrap-vcpkg.sh";

mock.VcpkgMocks.isVcpkgSubmodule = false;
mock.VcpkgMocks.vcpkgRoot = vcpkgRoot;
mock.VcpkgMocks.vcpkgExePath = vcpkgExePath;

jest.spyOn(utils.BaseUtilLib.prototype, 'readFile').mockImplementation(
  function (this: utils.BaseUtilLib, file: string): string {
    if (testutils.areEqualVerbose(file, path.join(vcpkgRoot, globals.vcpkgLastBuiltCommitId))) {
      return oldGitRef;
    } else {
      throw `readFile called with unexpected file name: '${file}'.`;
    }
  });

jest.spyOn(utils.BaseUtilLib.prototype, 'setEnvVar').mockImplementation(
  function (this: utils.BaseUtilLib, name: string, value: string): void {
    // Ensure they are not set twice.
    const existingValue: string = mock.envVarSetDict[name];
    if (existingValue) {
      assert.fail(`Error: env var ${name} is set multiple times!`);
    }

    // Ensure their values are the expected ones.
    if (name === globals.outVcpkgRootPath) {
      assert.strictEqual(value, vcpkgRoot);
    } else if (name === globals.vcpkgRoot) {
      assert.strictEqual(value, vcpkgRoot);
    } else {
      assert.fail(`Unexpected variable name: '${name}'`);
    }
  });

const baseUtil = new utils.BaseUtilLib(mock.exportedBaselib);

import { VcpkgRunner } from '../src/vcpkg-runner';

testutils.testWithHeader('run-vcpkg must build and run successfully', async () => {
  const answers: testutils.BaseLibAnswers = {
    "exec": {
      [`${gitPath}`]:
        { code: 0, stdout: "git output" },
      [`${gitPath} rev-parse HEAD`]:
        { code: 0, stdout: 'mygitref' },
      [`${gitPath} clone https://github.com/microsoft/vcpkg.git -n .`]:
        { 'code': 0, 'stdout': 'this is git clone ... output' },
      [`${gitPath} submodule status ${vcpkgRoot}`]:
        { 'code': 0, stdout: 'this is git submodule output' },
      [`${gitPath} checkout --force ${newGitRef}`]:
        { 'code': 0, 'stdout': `this is git checkout ${newGitRef} output` },
      [`chmod +x ${path.join(vcpkgRoot, "vcpkg")}`]:
        { 'code': 0, 'stdout': 'chmod output here' },
      [`chmod +x ${path.join(vcpkgRoot, "bootstrap-vcpkg.sh")}`]:
        { 'code': 0, 'stdout': 'this is the output of chmod +x bootstrap' },
      [gitPath]: { 'code': 0, 'stdout': 'git output here' },
      [`${prefix}${path.join(vcpkgRoot, bootstrapName)}`]:
        { 'code': 0, 'stdout': 'this is the output of bootstrap-vcpkg' },
      [`${path.join(vcpkgRoot, vcpkgExeName)} install --recurse --clean-after-build --x-install-root ${await runvcpkgutils.getDefaultVcpkgInstallDirectory(baseUtil.baseLib)}`]:
        { 'code': 0, 'stdout': 'this is the `vcpkg install` output' },
    },
    "exist": { [vcpkgRoot]: true },
    'which': {
      'git': '/usr/local/bin/git',
      'sh': '/bin/bash',
      'chmod': '/bin/chmod',
      'cmd.exe': 'cmd.exe',
      [vcpkgExePath]: vcpkgExePath
    },
  };
  mock.answersMocks.reset(answers);

  let vcpkg = await VcpkgRunner.create(
    baseUtil,
    vcpkgRoot,
    null,
    newGitRef,
    true, // Must be true
    false, // Must be false
    [],
    "/path/to/location/of/vcpkgjson/",
    null);

  // Act.
  // HACK: 'any' to access private fields.
  let vcpkgBuildMock = jest.spyOn(vcpkg as any, 'build');
  try {
    await vcpkg.run();
  }
  catch (error) {
    throw new Error(`run must have succeeded, instead it failed: ${error} \n ${error.stack}`);
  }

  // Assert.
  expect(mock.exportedBaselib.warning).toBeCalledTimes(0);
  expect(mock.exportedBaselib.error).toBeCalledTimes(0);
  expect(vcpkgBuildMock).toBeCalledTimes(1);
});
