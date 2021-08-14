// Copyright (c) 2019-2020-2021 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as globals from '../src/cmake-globals'
import * as testutils from '../../run-vcpkg-lib/__tests__/utils'
import * as path from 'path'
import * as mock from '../../run-vcpkg-lib/__tests__/mocks'
import * as assert from 'assert'
import * as utils from '@lukka/base-util-lib';

// Arrange.
const isWin = process.platform === "win32";
const oldGitRef = 'gitref';
const gitPath = '/usr/local/bin/git';
const vcpkgRoot = '/path/to/vcpkg';
const cmakeExePath = '/usr/bin/cmake';
const ninjaExePath = '/usr/bin/ninja';
const prefix = isWin ? "cmd.exe /c " : "/bin/bash -c ";
const cmakeListsTxtPath = path.join('/home/user/project/src/path/', 'CMakeLists.txt');

jest.spyOn(utils.BaseUtilLib.prototype, 'readFile').mockImplementation(
  function (this: utils.BaseUtilLib, file: string): string | null {
    if (testutils.areEqualVerbose(file, path.join(vcpkgRoot, globals.cmakeAppendedArgs))) {
      return oldGitRef;
    }
    else
      throw `readFile called with unexpected file name: '${file}'.`;
  });

import { CMakeRunner } from '../src/cmake-runner';

mock.inputsMocks.setBooleanInput(globals.buildWithCMake, true);
mock.inputsMocks.setInput(globals.cmakeListsTxtPath, cmakeListsTxtPath)

testutils.testWithHeader('run-cmake must fail when a tool returns error code 1', () => {
  const answers: testutils.BaseLibAnswers = {
    "exec": {
      [`${gitPath}`]:
        { code: 0, stdout: "git output" },
      [`${cmakeExePath} -GNinja -DCMAKE_MAKE_PROGRAM=${ninjaExePath} -DCMAKE_BUILD_TYPE=Release ${path.dirname(cmakeListsTxtPath)}`]: { 'code': 1, "stdout": 'cmake error output here' },
      [`${cmakeExePath} --build .`]: { 'code': 0, "stdout": 'cmake --build output here' },
      [gitPath]: { 'code': 0, 'stdout': 'git output here' },
    },
    "exist": { [vcpkgRoot]: true },
    'which': {
      'git': '/usr/local/bin/git',
      'sh': '/bin/bash',
      'chmod': '/bin/chmod',
      'cmd.exe': 'cmd.exe',
      'cmake': cmakeExePath,
      'ninja': ninjaExePath
    },
  };
  mock.answersMocks.reset(answers);

  // Act.
  const cmakeRunner: CMakeRunner = new CMakeRunner(mock.exportedBaselib);
  expect(() => cmakeRunner.run()).rejects.toThrowError();// Assert

  // Assert.
  expect(mock.exportedBaselib.warning).toBeCalledTimes(0);
  expect(mock.exportedBaselib.error).toBeCalledTimes(0);
});
