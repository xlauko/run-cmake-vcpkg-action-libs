// Copyright (c) 2019-2020 Luca Cappa
// Released under the term specified in file LICENSE.txt
// SPDX short identifier: MIT

import * as stream from 'stream';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Normalize a filesystem path with path.normalize(), then remove any trailing space.
 *
 * @export
 * @param {string} aPath The string representing a filesystem path.
 * @returns {string} The normalizeed path without trailing slash.
 */
export function normalizePath(aPath: string): string {
  aPath = path.normalize(aPath);
  if (/[\\\/]$/.test(aPath))
    aPath = aPath.slice(0, -1);
  return aPath;
}

export interface ToolRunner {
  exec(options: ExecOptions): Promise<number>;
  line(line: string): void;
  arg(val: string | string[]): void;
  execSync(options?: ExecOptions): Promise<ExecResult>;
}

export interface BaseLib {
  getInput(name: string, required: boolean): string | undefined;
  getPathInput(name: string, required: boolean): string | undefined;
  getBoolInput(name: string, required: boolean): boolean | undefined;
  isFilePathSupplied(name: string): boolean;
  getDelimitedInput(name: string, delim: string, required: boolean): string[];
  setVariable(name: string, value: string): void;
  getVariable(name: string): string | undefined;
  setOutput(name: string, value: string): void;
  debug(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  tool(name: string): ToolRunner;
  exec(name: string, args: string[], options?: ExecOptions): Promise<number>;
  execSync(name: string, args: string[], options?: ExecOptions): Promise<ExecResult>;
  which(name: string, required: boolean): Promise<string>;
  rmRF(path: string): Promise<void>;
  mkdirP(path: string): Promise<void>;
  cd(path: string): void;
  writeFile(path: string, content: string): void;
  resolve(path: string): string;
  stats(path: string): fs.Stats;
  exist(path: string): Promise<boolean>;
  getBinDir(): string;
  getSrcDir(): string;
  getArtifactsDir(): string;
}

export interface ExecOptions {
  cwd: string;
  failOnStdErr: boolean;
  ignoreReturnCode: boolean;
  silent: boolean;
  windowsVerbatimArguments: boolean;
  env: {
    [key: string]: string;
  };
  outStream: stream.Writable;
  errStream: stream.Writable;
}

export interface ExecResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number;
  readonly error: Error;
}
