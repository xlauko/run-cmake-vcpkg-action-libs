// Copyright (c) 2019-2020-2021-2022 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

// How to mock resources:
// How-to: https://stackoverflow.com/questions/47402005/jest-mock-how-to-mock-es6-class-default-import-using-factory-parameter
// How to mock methods in detail: https://stackoverflow.com/questions/50091438/jest-how-to-mock-one-specific-method-of-a-class
// How to mock an exported function: https://github.com/facebook/jest/issues/936#issuecomment-630155771

import * as baselib from '@xlauko/base-lib';
import * as baseutillib from '@xlauko/base-util-lib';
import { ActionToolRunner } from '@xlauko/action-lib/src';
import { ExecOptions } from 'child_process';
import * as testutils from './utils'
import * as assert from 'assert'
import os from 'os'

// Provider of results of commands execution.
export const answersMocks: testutils.MockAnswers = new testutils.MockAnswers()

// Inputs provider.
export const inputsMocks: testutils.MockInputs = new testutils.MockInputs();

// run-vcpkg-lib specific mocks.
export class VcpkgMocks {
  public static isVcpkgSubmodule: boolean = false;
  public static vcpkgRoot: string;
  public static vcpkgExePath: string;
  public static vcpkgExeExists: boolean = true;
}

// run-cmake-lib specific mocks.
export class CMakeMocks {

}

// Mock for BaseUtilLib
export const MockBaseUtilLib = baseutillib.BaseUtilLib as jest.Mocked<typeof baseutillib.BaseUtilLib>;
MockBaseUtilLib.prototype.readFile = jest.fn().mockImplementation(() => null);
jest.spyOn(baseutillib.BaseUtilLib.prototype, 'isVcpkgSubmodule').mockImplementation(
  function (this: baseutillib.BaseUtilLib, gitPath: string, fullVcpkgPath: string): Promise<boolean> {
    return Promise.resolve(VcpkgMocks.isVcpkgSubmodule);
  });
jest.spyOn(baseutillib.BaseUtilLib.prototype, 'directoryExists').mockImplementation(
  function (this: baseutillib.BaseUtilLib, path: string): boolean {
    assert.strictEqual(path, VcpkgMocks.vcpkgRoot);
    return true;
  });
jest.spyOn(baseutillib.BaseUtilLib.prototype, 'fileExists').mockImplementation(
  function (this: baseutillib.BaseUtilLib, path: string): boolean {
    assert.strictEqual(path, VcpkgMocks.vcpkgExePath);
    return VcpkgMocks.vcpkgExeExists;
  });

// Mock for environment variables.
export const envVarSetDict: { [name: string]: string } = {};

function toolRunner(toolPath: string) {
  return {
    toolPath: toolPath,
    arg:
      jest.fn(),
    exec:
      jest.fn(),
    execSync: jest.fn().mockImplementation(function (this: ActionToolRunner, options: ExecOptions) {
      const a: any = this.arg;
      return answersMocks.getResponse('exec', a.path);
    })
  }
}

let lastOperationName: string = "";

export let baselibInfo = jest.fn();
export let baselibwriteFile = jest.fn();

import * as actionLib from '@xlauko/action-lib';

jest.mock('@xlauko/action-lib', jest.fn().mockImplementation(() => {
  return {
    ActionLib: jest.fn().mockImplementation(() => {
      return {
        execSync: jest.fn().mockImplementation(function (this: actionLib.ActionLib, cmd: string, args: string[]) {
          return answersMocks.getResponse('exec', cmd + " " + args.join(' '));
        }),
        getInput:
          jest.fn().mockImplementation((name: string, required: boolean) =>
            inputsMocks.getInput(name, required)),
        getPathInput:
          jest.fn().mockImplementation((name: string, required: boolean) =>
            inputsMocks.getInput(name, required)),
        getBoolInput:
          jest.fn().mockImplementation((name: string, required: boolean) =>
            inputsMocks.getBooleanInput(name, required)),
        getDelimitedInput:
          jest.fn().mockImplementation((name: string, separator?: string, required?: boolean) =>
            inputsMocks.getDelimitedInput(name, separator, required)),
        debug:
          jest.fn().mockImplementation((msg: string) => testutils.testLog(`debug: ${msg}`)),
        warning:
          jest.fn().mockImplementation((msg: string) => testutils.testLog(`warn: ${msg}`)),
        error:
          jest.fn().mockImplementation((msg: string) =>
            testutils.testLog(`err: ${msg}`)),
        info:
          baselibInfo.mockImplementation((msg: string) =>
            testutils.testLog(`info: ${msg}`)),
        beginOperation:
          jest.fn().mockImplementation((operationName: string) => {
            testutils.testLog(`beginOperation('${operationName}')`);
            lastOperationName = operationName;
          }),
        endOperation:
          jest.fn().mockImplementation(() => {
            testutils.testLog(`endOperation('${lastOperationName}')`);
          }),
        setVariable:
          jest.fn(),
        setOutput:
          jest.fn(),
        exist:
          jest.fn().mockImplementation((filePath: string) => {
            return answersMocks.getResponse("exist", filePath);
          }),
        stats:
          jest.fn().mockImplementation((filePath: string) => {
            return answersMocks.getResponse("stats", filePath);
          }),
        which:
          jest.fn().mockImplementation((filePath: string) => {
            return answersMocks.getResponse("which", filePath);
          }),
        mkdirP:
          jest.fn().mockImplementation((dirPath: string) => {
            testutils.testLog(`mkdirP(${dirPath})`)
          }),
        cd:
          jest.fn().mockImplementation((dirPath: string) => {
            testutils.testLog(`cd(${dirPath})`)
          }),
        tool:
          jest.fn().mockImplementation((toolPath: string) =>
            new ActionToolRunner(toolPath)),
        writeFile:
          baselibwriteFile.mockImplementation((file: string, content: string) =>
            testutils.testLog(`writeFile('${file}','${content}')`)),
        rmRF:
          jest.fn().mockImplementation((file: string) => testutils.testLog(`rmRf(${file})`)),
        addMatcher: jest.fn(),
        removeMatcher: jest.fn(),
        getSrcDir: jest.fn(),
        getArtifactsDir: jest.fn().mockImplementation((): Promise<string> => Promise.resolve("")),
        getBinDir: jest.fn().mockImplementation(async (): Promise<string> => os.tmpdir()),
      };
    }),
    ActionToolRunner: jest.fn().mockImplementation((toolPath) => toolRunner(toolPath))
  }
}));

// Mock the execSync of ActionToolRunner.

jest.spyOn(ActionToolRunner.prototype, 'execSync').mockImplementation(
  function (this: ActionToolRunner, options?: ExecOptions): Promise<baselib.ExecResult> {
    const toolRunnerPrivateAccess: any = this;
    const response = answersMocks.getResponse('exec', `${toolRunnerPrivateAccess.path} ${toolRunnerPrivateAccess.arguments.join(' ')}`);
    testutils.testLog(response);
    testutils.testLog(JSON.stringify(response));
    return Promise.resolve({ code: response.code, stdout: response.stdout, stderr: response.stderr } as baselib.ExecResult);
  });

jest.spyOn(ActionToolRunner.prototype, 'exec').mockImplementation(
  function (this: ActionToolRunner, options?: ExecOptions): Promise<number> {
    const toolRunnerPrivateAccess: any = this;
    const response = answersMocks.getResponse('exec', `${toolRunnerPrivateAccess.path} ${toolRunnerPrivateAccess.arguments.join(' ')}`);
    testutils.testLog(response);
    return Promise.resolve(response.code);
  });

export let exportedBaselib: baselib.BaseLib = new actionLib.ActionLib();

exportedBaselib.exec = jest.fn().mockImplementation((cmd: string, args: string[]) => {
  answersMocks.printResponse('exec', cmd);
});
