const assert = require('assert');
const immutable = require('immutable');
export const stopify = require('@stopify/stopify');
const browserFS = require('./browserfs-setup.ts');

const fs = browserFS.fs;
const path = browserFS.path;

const nodeModules = {
  'assert': assert,
  'immutable': immutable,
};

export const makeRequireAsync = (
  basePath: string): ((importPath: string) => Promise<any>) => {
  let cwd = basePath;
  let currentRunner: any = null;

  const requireAsyncMain = (importPath: string) => {
    return new Promise(function (resolve, reject) {
      if(importPath in nodeModules) {
        return (nodeModules as any)[importPath];
      }
      const oldWd = cwd;
      const nextPath = path.join(cwd, importPath);
      cwd = path.parse(nextPath).dir;
      if(!fs.existsSync(nextPath)) {
        throw new Error("Path did not exist in requireSync: " + nextPath);
      }
      const contents = String(fs.readFileSync(nextPath));
      const runner = stopify.stopifyLocally("(function() { " + String(contents) + "})()");
      const module = {exports: false};
      runner.g = { stopify, require: requireAsync, module };
      runner.path = nextPath;
      currentRunner = runner;
      runner.run((result: any) => {
        cwd = oldWd;
        const toReturn = module.exports ? module.exports : result;
        resolve(toReturn);
      });
    });
  };

  const requireAsync = (importPath: string) => {
    if(importPath in nodeModules) {
      return (nodeModules as any)[importPath];
    }
    const oldWd = cwd;
    const nextPath = path.join(cwd, importPath);
    cwd = path.parse(nextPath).dir;
    if(!fs.existsSync(nextPath)) {
      throw new Error("Path did not exist in requireSync: " + nextPath);
    }
    const contents = String(fs.readFileSync(nextPath));
    const runner = stopify.stopifyLocally("(function() { " + String(contents) + "})()");
    const module = {exports: false};
    runner.g = { stopify, require: requireAsync, module, console };
    runner.path = nextPath;
    currentRunner.pauseImmediate(() => {
      const oldRunner = currentRunner;
      currentRunner = runner;
      runner.run((result: any) => {
        cwd = oldWd;
        const toReturn = module.exports ? module.exports : result.value;
        currentRunner = oldRunner;
        oldRunner.continueImmediate({ type: 'normal', value: toReturn });
      });
    });
  }

  return requireAsyncMain;
};

export const makeRequire = (basePath: string): ((importPath: string) => any) => {
  var cwd = basePath;
  /*
    Recursively eval (with this definition of require in scope) all of the
    described JavaScript.

    Note that since JS code is generated/written with the assumption that
    require() is sync, we can only use sync versions of the FS function here;
    require must be entirely one synchronous run of the code.

    Future use of stopify could enable the definition of requireAsync, which
    could pause the stack while requiring and then resume.
  */
  const requireSync = (importPath: string) => {
    if(importPath in nodeModules) {
      return (nodeModules as any)[importPath];
    }
    const oldWd = cwd;
    const nextPath = path.join(cwd, importPath);
    cwd = path.parse(nextPath).dir;
    if(!fs.existsSync(nextPath)) {
      throw new Error("Path did not exist in requireSync: " + nextPath);
    }
    const contents = fs.readFileSync(nextPath);
    const f = new Function("require", "module", contents);
    const module = {exports: false};
    const result = f(requireSync, module);
    const toReturn = module.exports ? module.exports : result;
    cwd = oldWd;
    return toReturn;
  };

  return requireSync;
};
