/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerCreateScript = void 0;
const vscode = __webpack_require__(2);
const path = __webpack_require__(3);
const vscode_1 = __webpack_require__(2);
const fs = __webpack_require__(4);
const registerCreateScript = (context) => {
    context.subscriptions.push(vscode_1.commands.registerCommand("DiFlow.createScript", async (args) => {
        const rootPath = vscode.workspace.rootPath || ""; // 获取当前右键文件夹位置作为目标源
        // 指定复制源位置
        const sourceFolderPath = path.join(rootPath, "materials", "blocks");
        const targetFolderPath = args._fsPath;
        if (!sourceFolderPath) {
            vscode.window.showErrorMessage("请选择来源文件夹");
            return;
        }
        if (!targetFolderPath) {
            vscode.window.showErrorMessage("请选择目标文件夹");
            return;
        }
        try {
            await copyDirectoryContents(sourceFolderPath, targetFolderPath);
            vscode.window.showInformationMessage("复制文件夹内容成功");
        }
        catch (error) {
            vscode.window.showErrorMessage(`复制文件夹内容失败`);
        }
    }));
};
exports.registerCreateScript = registerCreateScript;
async function copyDirectoryContents(sourcePath, targetPath) {
    // 确保目标目录存在，如果不存在则创建
    await fs.ensureDir(targetPath);
    // 获取源目录的内容列表
    const sourceItems = await fs.readdir(sourcePath);
    // 遍历源目录的内容
    for (const sourceItem of sourceItems) {
        const sourceItemPath = path.join(sourcePath, sourceItem);
        const targetItemPath = path.join(targetPath, sourceItem);
        // 判断是文件还是文件夹
        const isDirectory = (await fs.stat(sourceItemPath)).isDirectory();
        if (isDirectory) {
            // 如果是文件夹，递归复制子文件夹
            await copyDirectoryContents(sourceItemPath, targetItemPath);
        }
        else {
            // 如果是文件，直接复制
            await fs.copyFile(sourceItemPath, targetItemPath);
        }
    }
}


/***/ }),
/* 2 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 3 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 4 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = {
  // Export promiseified graceful-fs:
  ...__webpack_require__(5),
  // Export extra methods:
  ...__webpack_require__(16),
  ...__webpack_require__(25),
  ...__webpack_require__(27),
  ...__webpack_require__(33),
  ...__webpack_require__(18),
  ...__webpack_require__(40),
  ...__webpack_require__(38),
  ...__webpack_require__(21),
  ...__webpack_require__(26)
}


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

// This is adapted from https://github.com/normalize/mz
// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
const u = (__webpack_require__(6).fromCallback)
const fs = __webpack_require__(7)

const api = [
  'access',
  'appendFile',
  'chmod',
  'chown',
  'close',
  'copyFile',
  'fchmod',
  'fchown',
  'fdatasync',
  'fstat',
  'fsync',
  'ftruncate',
  'futimes',
  'lchmod',
  'lchown',
  'link',
  'lstat',
  'mkdir',
  'mkdtemp',
  'open',
  'opendir',
  'readdir',
  'readFile',
  'readlink',
  'realpath',
  'rename',
  'rm',
  'rmdir',
  'stat',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'writeFile'
].filter(key => {
  // Some commands are not available on some systems. Ex:
  // fs.cp was added in Node.js v16.7.0
  // fs.lchown is not available on at least some Linux
  return typeof fs[key] === 'function'
})

// Export cloned fs:
Object.assign(exports, fs)

// Universalify async methods:
api.forEach(method => {
  exports[method] = u(fs[method])
})

// We differ from mz/fs in that we still ship the old, broken, fs.exists()
// since we are a drop-in replacement for the native module
exports.exists = function (filename, callback) {
  if (typeof callback === 'function') {
    return fs.exists(filename, callback)
  }
  return new Promise(resolve => {
    return fs.exists(filename, resolve)
  })
}

// fs.read(), fs.write(), fs.readv(), & fs.writev() need special treatment due to multiple callback args

exports.read = function (fd, buffer, offset, length, position, callback) {
  if (typeof callback === 'function') {
    return fs.read(fd, buffer, offset, length, position, callback)
  }
  return new Promise((resolve, reject) => {
    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
      if (err) return reject(err)
      resolve({ bytesRead, buffer })
    })
  })
}

// Function signature can be
// fs.write(fd, buffer[, offset[, length[, position]]], callback)
// OR
// fs.write(fd, string[, position[, encoding]], callback)
// We need to handle both cases, so we use ...args
exports.write = function (fd, buffer, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fs.write(fd, buffer, ...args)
  }

  return new Promise((resolve, reject) => {
    fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
      if (err) return reject(err)
      resolve({ bytesWritten, buffer })
    })
  })
}

// Function signature is
// s.readv(fd, buffers[, position], callback)
// We need to handle the optional arg, so we use ...args
exports.readv = function (fd, buffers, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fs.readv(fd, buffers, ...args)
  }

  return new Promise((resolve, reject) => {
    fs.readv(fd, buffers, ...args, (err, bytesRead, buffers) => {
      if (err) return reject(err)
      resolve({ bytesRead, buffers })
    })
  })
}

// Function signature is
// s.writev(fd, buffers[, position], callback)
// We need to handle the optional arg, so we use ...args
exports.writev = function (fd, buffers, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return fs.writev(fd, buffers, ...args)
  }

  return new Promise((resolve, reject) => {
    fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
      if (err) return reject(err)
      resolve({ bytesWritten, buffers })
    })
  })
}

// fs.realpath.native sometimes not available if fs is monkey-patched
if (typeof fs.realpath.native === 'function') {
  exports.realpath.native = u(fs.realpath.native)
} else {
  process.emitWarning(
    'fs.realpath.native is not a function. Is fs being monkey-patched?',
    'Warning', 'fs-extra-WARN0003'
  )
}


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.fromCallback = function (fn) {
  return Object.defineProperty(function (...args) {
    if (typeof args[args.length - 1] === 'function') fn.apply(this, args)
    else {
      return new Promise((resolve, reject) => {
        args.push((err, res) => (err != null) ? reject(err) : resolve(res))
        fn.apply(this, args)
      })
    }
  }, 'name', { value: fn.name })
}

exports.fromPromise = function (fn) {
  return Object.defineProperty(function (...args) {
    const cb = args[args.length - 1]
    if (typeof cb !== 'function') return fn.apply(this, args)
    else {
      args.pop()
      fn.apply(this, args).then(r => cb(null, r), cb)
    }
  }, 'name', { value: fn.name })
}


/***/ }),
/* 7 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fs = __webpack_require__(8)
var polyfills = __webpack_require__(9)
var legacy = __webpack_require__(11)
var clone = __webpack_require__(13)

var util = __webpack_require__(14)

/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue
var previousSymbol

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue')
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous')
} else {
  gracefulQueue = '___graceful-fs.queue'
  previousSymbol = '___graceful-fs.previous'
}

function noop () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  })
}

var debug = noop
if (util.debuglog)
  debug = util.debuglog('gfs4')
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments)
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
    console.error(m)
  }

// Once time initialization
if (!fs[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue = global[gracefulQueue] || []
  publishQueue(fs, queue)

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          resetQueue()
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments)
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    })
    return close
  })(fs.close)

  fs.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs, arguments)
      resetQueue()
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    })
    return closeSync
  })(fs.closeSync)

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug(fs[gracefulQueue])
      __webpack_require__(15).equal(fs[gracefulQueue].length, 0)
    })
  }
}

if (!global[gracefulQueue]) {
  publishQueue(global, fs[gracefulQueue]);
}

module.exports = patch(clone(fs))
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
    module.exports = patch(fs)
    fs.__patched = true;
}

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs)
  fs.gracefulify = patch

  fs.createReadStream = createReadStream
  fs.createWriteStream = createWriteStream
  var fs$readFile = fs.readFile
  fs.readFile = readFile
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb, startTime) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile
  fs.writeFile = writeFile
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb, startTime) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile
  if (fs$appendFile)
    fs.appendFile = appendFile
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb, startTime) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$copyFile = fs.copyFile
  if (fs$copyFile)
    fs.copyFile = copyFile
  function copyFile (src, dest, flags, cb) {
    if (typeof flags === 'function') {
      cb = flags
      flags = 0
    }
    return go$copyFile(src, dest, flags, cb)

    function go$copyFile (src, dest, flags, cb, startTime) {
      return fs$copyFile(src, dest, flags, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$copyFile, [src, dest, flags, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  var fs$readdir = fs.readdir
  fs.readdir = readdir
  var noReaddirOptionVersions = /^v[0-5]\./
  function readdir (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    var go$readdir = noReaddirOptionVersions.test(process.version)
      ? function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, fs$readdirCallback(
          path, options, cb, startTime
        ))
      }
      : function go$readdir (path, options, cb, startTime) {
        return fs$readdir(path, options, fs$readdirCallback(
          path, options, cb, startTime
        ))
      }

    return go$readdir(path, options, cb)

    function fs$readdirCallback (path, options, cb, startTime) {
      return function (err, files) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([
            go$readdir,
            [path, options, cb],
            err,
            startTime || Date.now(),
            Date.now()
          ])
        else {
          if (files && files.sort)
            files.sort()

          if (typeof cb === 'function')
            cb.call(this, err, files)
        }
      }
    }
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs)
    ReadStream = legStreams.ReadStream
    WriteStream = legStreams.WriteStream
  }

  var fs$ReadStream = fs.ReadStream
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype)
    ReadStream.prototype.open = ReadStream$open
  }

  var fs$WriteStream = fs.WriteStream
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype)
    WriteStream.prototype.open = WriteStream$open
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val
    },
    enumerable: true,
    configurable: true
  })
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val
    },
    enumerable: true,
    configurable: true
  })

  // legacy names
  var FileReadStream = ReadStream
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val
    },
    enumerable: true,
    configurable: true
  })
  var FileWriteStream = WriteStream
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val
    },
    enumerable: true,
    configurable: true
  })

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy()

        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
        that.read()
      }
    })
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy()
        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
      }
    })
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open
  fs.open = open
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb, startTime) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb], err, startTime || Date.now(), Date.now()])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1])
  fs[gracefulQueue].push(elem)
  retry()
}

// keep track of the timeout between retry() calls
var retryTimer

// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
function resetQueue () {
  var now = Date.now()
  for (var i = 0; i < fs[gracefulQueue].length; ++i) {
    // entries that are only a length of 2 are from an older version, don't
    // bother modifying those since they'll be retried anyway.
    if (fs[gracefulQueue][i].length > 2) {
      fs[gracefulQueue][i][3] = now // startTime
      fs[gracefulQueue][i][4] = now // lastTime
    }
  }
  // call retry to make sure we're actively processing the queue
  retry()
}

function retry () {
  // clear the timer and remove it to help prevent unintended concurrency
  clearTimeout(retryTimer)
  retryTimer = undefined

  if (fs[gracefulQueue].length === 0)
    return

  var elem = fs[gracefulQueue].shift()
  var fn = elem[0]
  var args = elem[1]
  // these items may be unset if they were added by an older graceful-fs
  var err = elem[2]
  var startTime = elem[3]
  var lastTime = elem[4]

  // if we don't have a startTime we have no way of knowing if we've waited
  // long enough, so go ahead and retry this item now
  if (startTime === undefined) {
    debug('RETRY', fn.name, args)
    fn.apply(null, args)
  } else if (Date.now() - startTime >= 60000) {
    // it's been more than 60 seconds total, bail now
    debug('TIMEOUT', fn.name, args)
    var cb = args.pop()
    if (typeof cb === 'function')
      cb.call(null, err)
  } else {
    // the amount of time between the last attempt and right now
    var sinceAttempt = Date.now() - lastTime
    // the amount of time between when we first tried, and when we last tried
    // rounded up to at least 1
    var sinceStart = Math.max(lastTime - startTime, 1)
    // backoff. wait longer than the total time we've been retrying, but only
    // up to a maximum of 100ms
    var desiredDelay = Math.min(sinceStart * 1.2, 100)
    // it's been long enough since the last retry, do it again
    if (sinceAttempt >= desiredDelay) {
      debug('RETRY', fn.name, args)
      fn.apply(null, args.concat([startTime]))
    } else {
      // if we can't do this job yet, push it to the end of the queue
      // and let the next iteration check again
      fs[gracefulQueue].push(elem)
    }
  }

  // schedule our next run if one isn't already scheduled
  if (retryTimer === undefined) {
    retryTimer = setTimeout(retry, 0)
  }
}


/***/ }),
/* 8 */
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),
/* 9 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var constants = __webpack_require__(10)

var origCwd = process.cwd
var cwd = null

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process)
  return cwd
}
try {
  process.cwd()
} catch (er) {}

// This check is needed until node.js 12 is required
if (typeof process.chdir === 'function') {
  var chdir = process.chdir
  process.chdir = function (d) {
    cwd = null
    chdir.call(process, d)
  }
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir)
}

module.exports = patch

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs)
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs)
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown)
  fs.fchown = chownFix(fs.fchown)
  fs.lchown = chownFix(fs.lchown)

  fs.chmod = chmodFix(fs.chmod)
  fs.fchmod = chmodFix(fs.fchmod)
  fs.lchmod = chmodFix(fs.lchmod)

  fs.chownSync = chownFixSync(fs.chownSync)
  fs.fchownSync = chownFixSync(fs.fchownSync)
  fs.lchownSync = chownFixSync(fs.lchownSync)

  fs.chmodSync = chmodFixSync(fs.chmodSync)
  fs.fchmodSync = chmodFixSync(fs.fchmodSync)
  fs.lchmodSync = chmodFixSync(fs.lchmodSync)

  fs.stat = statFix(fs.stat)
  fs.fstat = statFix(fs.fstat)
  fs.lstat = statFix(fs.lstat)

  fs.statSync = statFixSync(fs.statSync)
  fs.fstatSync = statFixSync(fs.fstatSync)
  fs.lstatSync = statFixSync(fs.lstatSync)

  // if lchmod/lchown do not exist, then make them no-ops
  if (fs.chmod && !fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchmodSync = function () {}
  }
  if (fs.chown && !fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchownSync = function () {}
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = typeof fs.rename !== 'function' ? fs.rename
    : (function (fs$rename) {
      function rename (from, to, cb) {
        var start = Date.now()
        var backoff = 0;
        fs$rename(from, to, function CB (er) {
          if (er
              && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY")
              && Date.now() - start < 60000) {
            setTimeout(function() {
              fs.stat(to, function (stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er)
              })
            }, backoff)
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er)
        })
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename)
      return rename
    })(fs.rename)
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = typeof fs.read !== 'function' ? fs.read
  : (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments)
        }
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read)
    return read
  })(fs.read)

  fs.readSync = typeof fs.readSync !== 'function' ? fs.readSync
  : (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          continue
        }
        throw er
      }
    }
  }})(fs.readSync)

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants.O_WRONLY | constants.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err)
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2)
          })
        })
      })
    }

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode)

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true
      var ret
      try {
        ret = fs.fchmodSync(fd, mode)
        threw = false
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd)
          } catch (er) {}
        } else {
          fs.closeSync(fd)
        }
      }
      return ret
    }
  }

  function patchLutimes (fs) {
    if (constants.hasOwnProperty("O_SYMLINK") && fs.futimes) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er)
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2)
            })
          })
        })
      }

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants.O_SYMLINK)
        var ret
        var threw = true
        try {
          ret = fs.futimesSync(fd, at, mt)
          threw = false
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd)
            } catch (er) {}
          } else {
            fs.closeSync(fd)
          }
        }
        return ret
      }

    } else if (fs.futimes) {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb) }
      fs.lutimesSync = function () {}
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null
        if (cb) cb.apply(this, arguments)
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null
        if (cb) cb.apply(this, arguments)
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options
        options = null
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000
          if (stats.gid < 0) stats.gid += 0x100000000
        }
        if (cb) cb.apply(this, arguments)
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target)
      if (stats) {
        if (stats.uid < 0) stats.uid += 0x100000000
        if (stats.gid < 0) stats.gid += 0x100000000
      }
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}


/***/ }),
/* 10 */
/***/ ((module) => {

"use strict";
module.exports = require("constants");

/***/ }),
/* 11 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Stream = (__webpack_require__(12).Stream)

module.exports = legacy

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    })
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}


/***/ }),
/* 12 */
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),
/* 13 */
/***/ ((module) => {

"use strict";


module.exports = clone

var getPrototypeOf = Object.getPrototypeOf || function (obj) {
  return obj.__proto__
}

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: getPrototypeOf(obj) }
  else
    var copy = Object.create(null)

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
  })

  return copy
}


/***/ }),
/* 14 */
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),
/* 15 */
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),
/* 16 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
module.exports = {
  copy: u(__webpack_require__(17)),
  copySync: __webpack_require__(24)
}


/***/ }),
/* 17 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(5)
const path = __webpack_require__(3)
const { mkdirs } = __webpack_require__(18)
const { pathExists } = __webpack_require__(21)
const { utimesMillis } = __webpack_require__(22)
const stat = __webpack_require__(23)

async function copy (src, dest, opts = {}) {
  if (typeof opts === 'function') {
    opts = { filter: opts }
  }

  opts.clobber = 'clobber' in opts ? !!opts.clobber : true // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0001'
    )
  }

  const { srcStat, destStat } = await stat.checkPaths(src, dest, 'copy', opts)

  await stat.checkParentPaths(src, srcStat, dest, 'copy')

  const include = await runFilter(src, dest, opts)

  if (!include) return

  // check if the parent of dest exists, and create it if it doesn't exist
  const destParent = path.dirname(dest)
  const dirExists = await pathExists(destParent)
  if (!dirExists) {
    await mkdirs(destParent)
  }

  await getStatsAndPerformCopy(destStat, src, dest, opts)
}

async function runFilter (src, dest, opts) {
  if (!opts.filter) return true
  return opts.filter(src, dest)
}

async function getStatsAndPerformCopy (destStat, src, dest, opts) {
  const statFn = opts.dereference ? fs.stat : fs.lstat
  const srcStat = await statFn(src)

  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts)

  if (
    srcStat.isFile() ||
    srcStat.isCharacterDevice() ||
    srcStat.isBlockDevice()
  ) return onFile(srcStat, destStat, src, dest, opts)

  if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts)
  if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`)
  if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`)
  throw new Error(`Unknown file: ${src}`)
}

async function onFile (srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile(srcStat, src, dest, opts)

  if (opts.overwrite) {
    await fs.unlink(dest)
    return copyFile(srcStat, src, dest, opts)
  }
  if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

async function copyFile (srcStat, src, dest, opts) {
  await fs.copyFile(src, dest)
  if (opts.preserveTimestamps) {
    // Make sure the file is writable before setting the timestamp
    // otherwise open fails with EPERM when invoked with 'r+'
    // (through utimes call)
    if (fileIsNotWritable(srcStat.mode)) {
      await makeFileWritable(dest, srcStat.mode)
    }

    // Set timestamps and mode correspondingly

    // Note that The initial srcStat.atime cannot be trusted
    // because it is modified by the read(2) system call
    // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
    const updatedSrcStat = await fs.stat(src)
    await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime)
  }

  return fs.chmod(dest, srcStat.mode)
}

function fileIsNotWritable (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable (dest, srcMode) {
  return fs.chmod(dest, srcMode | 0o200)
}

async function onDir (srcStat, destStat, src, dest, opts) {
  // the dest directory might not exist, create it
  if (!destStat) {
    await fs.mkdir(dest)
  }

  const items = await fs.readdir(src)

  // loop through the files in the current directory to copy everything
  await Promise.all(items.map(async item => {
    const srcItem = path.join(src, item)
    const destItem = path.join(dest, item)

    // skip the item if it is matches by the filter function
    const include = await runFilter(srcItem, destItem, opts)
    if (!include) return

    const { destStat } = await stat.checkPaths(srcItem, destItem, 'copy', opts)

    // If the item is a copyable file, `getStatsAndPerformCopy` will copy it
    // If the item is a directory, `getStatsAndPerformCopy` will call `onDir` recursively
    return getStatsAndPerformCopy(destStat, srcItem, destItem, opts)
  }))

  if (!destStat) {
    await fs.chmod(dest, srcStat.mode)
  }
}

async function onLink (destStat, src, dest, opts) {
  let resolvedSrc = await fs.readlink(src)
  if (opts.dereference) {
    resolvedSrc = path.resolve(process.cwd(), resolvedSrc)
  }
  if (!destStat) {
    return fs.symlink(resolvedSrc, dest)
  }

  let resolvedDest = null
  try {
    resolvedDest = await fs.readlink(dest)
  } catch (e) {
    // dest exists and is a regular file or directory,
    // Windows may throw UNKNOWN error. If dest already exists,
    // fs throws error anyway, so no need to guard against it here.
    if (e.code === 'EINVAL' || e.code === 'UNKNOWN') return fs.symlink(resolvedSrc, dest)
    throw e
  }
  if (opts.dereference) {
    resolvedDest = path.resolve(process.cwd(), resolvedDest)
  }
  if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
    throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
  }

  // do not copy if src is a subdir of dest since unlinking
  // dest in this case would result in removing src contents
  // and therefore a broken symlink would be created.
  if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
    throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
  }

  // copy the link
  await fs.unlink(dest)
  return fs.symlink(resolvedSrc, dest)
}

module.exports = copy


/***/ }),
/* 18 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const u = (__webpack_require__(6).fromPromise)
const { makeDir: _makeDir, makeDirSync } = __webpack_require__(19)
const makeDir = u(_makeDir)

module.exports = {
  mkdirs: makeDir,
  mkdirsSync: makeDirSync,
  // alias
  mkdirp: makeDir,
  mkdirpSync: makeDirSync,
  ensureDir: makeDir,
  ensureDirSync: makeDirSync
}


/***/ }),
/* 19 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const fs = __webpack_require__(5)
const { checkPath } = __webpack_require__(20)

const getMode = options => {
  const defaults = { mode: 0o777 }
  if (typeof options === 'number') return options
  return ({ ...defaults, ...options }).mode
}

module.exports.makeDir = async (dir, options) => {
  checkPath(dir)

  return fs.mkdir(dir, {
    mode: getMode(options),
    recursive: true
  })
}

module.exports.makeDirSync = (dir, options) => {
  checkPath(dir)

  return fs.mkdirSync(dir, {
    mode: getMode(options),
    recursive: true
  })
}


/***/ }),
/* 20 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Adapted from https://github.com/sindresorhus/make-dir
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const path = __webpack_require__(3)

// https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088
module.exports.checkPath = function checkPath (pth) {
  if (process.platform === 'win32') {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path.parse(pth).root, ''))

    if (pathHasInvalidWinCharacters) {
      const error = new Error(`Path contains invalid characters: ${pth}`)
      error.code = 'EINVAL'
      throw error
    }
  }
}


/***/ }),
/* 21 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const u = (__webpack_require__(6).fromPromise)
const fs = __webpack_require__(5)

function pathExists (path) {
  return fs.access(path).then(() => true).catch(() => false)
}

module.exports = {
  pathExists: u(pathExists),
  pathExistsSync: fs.existsSync
}


/***/ }),
/* 22 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(5)
const u = (__webpack_require__(6).fromPromise)

async function utimesMillis (path, atime, mtime) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  const fd = await fs.open(path, 'r+')

  let closeErr = null

  try {
    await fs.futimes(fd, atime, mtime)
  } finally {
    try {
      await fs.close(fd)
    } catch (e) {
      closeErr = e
    }
  }

  if (closeErr) {
    throw closeErr
  }
}

function utimesMillisSync (path, atime, mtime) {
  const fd = fs.openSync(path, 'r+')
  fs.futimesSync(fd, atime, mtime)
  return fs.closeSync(fd)
}

module.exports = {
  utimesMillis: u(utimesMillis),
  utimesMillisSync
}


/***/ }),
/* 23 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(5)
const path = __webpack_require__(3)
const u = (__webpack_require__(6).fromPromise)

function getStats (src, dest, opts) {
  const statFunc = opts.dereference
    ? (file) => fs.stat(file, { bigint: true })
    : (file) => fs.lstat(file, { bigint: true })
  return Promise.all([
    statFunc(src),
    statFunc(dest).catch(err => {
      if (err.code === 'ENOENT') return null
      throw err
    })
  ]).then(([srcStat, destStat]) => ({ srcStat, destStat }))
}

function getStatsSync (src, dest, opts) {
  let destStat
  const statFunc = opts.dereference
    ? (file) => fs.statSync(file, { bigint: true })
    : (file) => fs.lstatSync(file, { bigint: true })
  const srcStat = statFunc(src)
  try {
    destStat = statFunc(dest)
  } catch (err) {
    if (err.code === 'ENOENT') return { srcStat, destStat: null }
    throw err
  }
  return { srcStat, destStat }
}

async function checkPaths (src, dest, funcName, opts) {
  const { srcStat, destStat } = await getStats(src, dest, opts)
  if (destStat) {
    if (areIdentical(srcStat, destStat)) {
      const srcBaseName = path.basename(src)
      const destBaseName = path.basename(dest)
      if (funcName === 'move' &&
        srcBaseName !== destBaseName &&
        srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true }
      }
      throw new Error('Source and destination must not be the same.')
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`)
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName))
  }

  return { srcStat, destStat }
}

function checkPathsSync (src, dest, funcName, opts) {
  const { srcStat, destStat } = getStatsSync(src, dest, opts)

  if (destStat) {
    if (areIdentical(srcStat, destStat)) {
      const srcBaseName = path.basename(src)
      const destBaseName = path.basename(dest)
      if (funcName === 'move' &&
        srcBaseName !== destBaseName &&
        srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true }
      }
      throw new Error('Source and destination must not be the same.')
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`)
    }
  }

  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return { srcStat, destStat }
}

// recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
async function checkParentPaths (src, srcStat, dest, funcName) {
  const srcParent = path.resolve(path.dirname(src))
  const destParent = path.resolve(path.dirname(dest))
  if (destParent === srcParent || destParent === path.parse(destParent).root) return

  let destStat
  try {
    destStat = await fs.stat(destParent, { bigint: true })
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }

  if (areIdentical(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName))
  }

  return checkParentPaths(src, srcStat, destParent, funcName)
}

function checkParentPathsSync (src, srcStat, dest, funcName) {
  const srcParent = path.resolve(path.dirname(src))
  const destParent = path.resolve(path.dirname(dest))
  if (destParent === srcParent || destParent === path.parse(destParent).root) return
  let destStat
  try {
    destStat = fs.statSync(destParent, { bigint: true })
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  if (areIdentical(srcStat, destStat)) {
    throw new Error(errMsg(src, dest, funcName))
  }
  return checkParentPathsSync(src, srcStat, destParent, funcName)
}

function areIdentical (srcStat, destStat) {
  return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev
}

// return true if dest is a subdir of src, otherwise false.
// It only checks the path strings.
function isSrcSubdir (src, dest) {
  const srcArr = path.resolve(src).split(path.sep).filter(i => i)
  const destArr = path.resolve(dest).split(path.sep).filter(i => i)
  return srcArr.every((cur, i) => destArr[i] === cur)
}

function errMsg (src, dest, funcName) {
  return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`
}

module.exports = {
  // checkPaths
  checkPaths: u(checkPaths),
  checkPathsSync,
  // checkParent
  checkParentPaths: u(checkParentPaths),
  checkParentPathsSync,
  // Misc
  isSrcSubdir,
  areIdentical
}


/***/ }),
/* 24 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(7)
const path = __webpack_require__(3)
const mkdirsSync = (__webpack_require__(18).mkdirsSync)
const utimesMillisSync = (__webpack_require__(22).utimesMillisSync)
const stat = __webpack_require__(23)

function copySync (src, dest, opts) {
  if (typeof opts === 'function') {
    opts = { filter: opts }
  }

  opts = opts || {}
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    process.emitWarning(
      'Using the preserveTimestamps option in 32-bit node is not recommended;\n\n' +
      '\tsee https://github.com/jprichardson/node-fs-extra/issues/269',
      'Warning', 'fs-extra-WARN0002'
    )
  }

  const { srcStat, destStat } = stat.checkPathsSync(src, dest, 'copy', opts)
  stat.checkParentPathsSync(src, srcStat, dest, 'copy')
  if (opts.filter && !opts.filter(src, dest)) return
  const destParent = path.dirname(dest)
  if (!fs.existsSync(destParent)) mkdirsSync(destParent)
  return getStats(destStat, src, dest, opts)
}

function getStats (destStat, src, dest, opts) {
  const statSync = opts.dereference ? fs.statSync : fs.lstatSync
  const srcStat = statSync(src)

  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts)
  else if (srcStat.isFile() ||
           srcStat.isCharacterDevice() ||
           srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts)
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts)
  else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`)
  else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`)
  throw new Error(`Unknown file: ${src}`)
}

function onFile (srcStat, destStat, src, dest, opts) {
  if (!destStat) return copyFile(srcStat, src, dest, opts)
  return mayCopyFile(srcStat, src, dest, opts)
}

function mayCopyFile (srcStat, src, dest, opts) {
  if (opts.overwrite) {
    fs.unlinkSync(dest)
    return copyFile(srcStat, src, dest, opts)
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

function copyFile (srcStat, src, dest, opts) {
  fs.copyFileSync(src, dest)
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest)
  return setDestMode(dest, srcStat.mode)
}

function handleTimestamps (srcMode, src, dest) {
  // Make sure the file is writable before setting the timestamp
  // otherwise open fails with EPERM when invoked with 'r+'
  // (through utimes call)
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode)
  return setDestTimestamps(src, dest)
}

function fileIsNotWritable (srcMode) {
  return (srcMode & 0o200) === 0
}

function makeFileWritable (dest, srcMode) {
  return setDestMode(dest, srcMode | 0o200)
}

function setDestMode (dest, srcMode) {
  return fs.chmodSync(dest, srcMode)
}

function setDestTimestamps (src, dest) {
  // The initial srcStat.atime cannot be trusted
  // because it is modified by the read(2) system call
  // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
  const updatedSrcStat = fs.statSync(src)
  return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime)
}

function onDir (srcStat, destStat, src, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts)
  return copyDir(src, dest, opts)
}

function mkDirAndCopy (srcMode, src, dest, opts) {
  fs.mkdirSync(dest)
  copyDir(src, dest, opts)
  return setDestMode(dest, srcMode)
}

function copyDir (src, dest, opts) {
  fs.readdirSync(src).forEach(item => copyDirItem(item, src, dest, opts))
}

function copyDirItem (item, src, dest, opts) {
  const srcItem = path.join(src, item)
  const destItem = path.join(dest, item)
  if (opts.filter && !opts.filter(srcItem, destItem)) return
  const { destStat } = stat.checkPathsSync(srcItem, destItem, 'copy', opts)
  return getStats(destStat, srcItem, destItem, opts)
}

function onLink (destStat, src, dest, opts) {
  let resolvedSrc = fs.readlinkSync(src)
  if (opts.dereference) {
    resolvedSrc = path.resolve(process.cwd(), resolvedSrc)
  }

  if (!destStat) {
    return fs.symlinkSync(resolvedSrc, dest)
  } else {
    let resolvedDest
    try {
      resolvedDest = fs.readlinkSync(dest)
    } catch (err) {
      // dest exists and is a regular file or directory,
      // Windows may throw UNKNOWN error. If dest already exists,
      // fs throws error anyway, so no need to guard against it here.
      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return fs.symlinkSync(resolvedSrc, dest)
      throw err
    }
    if (opts.dereference) {
      resolvedDest = path.resolve(process.cwd(), resolvedDest)
    }
    if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
    }

    // prevent copy if src is a subdir of dest since unlinking
    // dest in this case would result in removing src contents
    // and therefore a broken symlink would be created.
    if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
    }
    return copyLink(resolvedSrc, dest)
  }
}

function copyLink (resolvedSrc, dest) {
  fs.unlinkSync(dest)
  return fs.symlinkSync(resolvedSrc, dest)
}

module.exports = copySync


/***/ }),
/* 25 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
const fs = __webpack_require__(5)
const path = __webpack_require__(3)
const mkdir = __webpack_require__(18)
const remove = __webpack_require__(26)

const emptyDir = u(async function emptyDir (dir) {
  let items
  try {
    items = await fs.readdir(dir)
  } catch {
    return mkdir.mkdirs(dir)
  }

  return Promise.all(items.map(item => remove.remove(path.join(dir, item))))
})

function emptyDirSync (dir) {
  let items
  try {
    items = fs.readdirSync(dir)
  } catch {
    return mkdir.mkdirsSync(dir)
  }

  items.forEach(item => {
    item = path.join(dir, item)
    remove.removeSync(item)
  })
}

module.exports = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
}


/***/ }),
/* 26 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(7)
const u = (__webpack_require__(6).fromCallback)

function remove (path, callback) {
  fs.rm(path, { recursive: true, force: true }, callback)
}

function removeSync (path) {
  fs.rmSync(path, { recursive: true, force: true })
}

module.exports = {
  remove: u(remove),
  removeSync
}


/***/ }),
/* 27 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { createFile, createFileSync } = __webpack_require__(28)
const { createLink, createLinkSync } = __webpack_require__(29)
const { createSymlink, createSymlinkSync } = __webpack_require__(30)

module.exports = {
  // file
  createFile,
  createFileSync,
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  // link
  createLink,
  createLinkSync,
  ensureLink: createLink,
  ensureLinkSync: createLinkSync,
  // symlink
  createSymlink,
  createSymlinkSync,
  ensureSymlink: createSymlink,
  ensureSymlinkSync: createSymlinkSync
}


/***/ }),
/* 28 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
const path = __webpack_require__(3)
const fs = __webpack_require__(5)
const mkdir = __webpack_require__(18)

async function createFile (file) {
  let stats
  try {
    stats = await fs.stat(file)
  } catch { }
  if (stats && stats.isFile()) return

  const dir = path.dirname(file)

  let dirStats = null
  try {
    dirStats = await fs.stat(dir)
  } catch (err) {
    // if the directory doesn't exist, make it
    if (err.code === 'ENOENT') {
      await mkdir.mkdirs(dir)
      await fs.writeFile(file, '')
      return
    } else {
      throw err
    }
  }

  if (dirStats.isDirectory()) {
    await fs.writeFile(file, '')
  } else {
    // parent is not a directory
    // This is just to cause an internal ENOTDIR error to be thrown
    await fs.readdir(dir)
  }
}

function createFileSync (file) {
  let stats
  try {
    stats = fs.statSync(file)
  } catch { }
  if (stats && stats.isFile()) return

  const dir = path.dirname(file)
  try {
    if (!fs.statSync(dir).isDirectory()) {
      // parent is not a directory
      // This is just to cause an internal ENOTDIR error to be thrown
      fs.readdirSync(dir)
    }
  } catch (err) {
    // If the stat call above failed because the directory doesn't exist, create it
    if (err && err.code === 'ENOENT') mkdir.mkdirsSync(dir)
    else throw err
  }

  fs.writeFileSync(file, '')
}

module.exports = {
  createFile: u(createFile),
  createFileSync
}


/***/ }),
/* 29 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
const path = __webpack_require__(3)
const fs = __webpack_require__(5)
const mkdir = __webpack_require__(18)
const { pathExists } = __webpack_require__(21)
const { areIdentical } = __webpack_require__(23)

async function createLink (srcpath, dstpath) {
  let dstStat
  try {
    dstStat = await fs.lstat(dstpath)
  } catch {
    // ignore error
  }

  let srcStat
  try {
    srcStat = await fs.lstat(srcpath)
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink')
    throw err
  }

  if (dstStat && areIdentical(srcStat, dstStat)) return

  const dir = path.dirname(dstpath)

  const dirExists = await pathExists(dir)

  if (!dirExists) {
    await mkdir.mkdirs(dir)
  }

  await fs.link(srcpath, dstpath)
}

function createLinkSync (srcpath, dstpath) {
  let dstStat
  try {
    dstStat = fs.lstatSync(dstpath)
  } catch {}

  try {
    const srcStat = fs.lstatSync(srcpath)
    if (dstStat && areIdentical(srcStat, dstStat)) return
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink')
    throw err
  }

  const dir = path.dirname(dstpath)
  const dirExists = fs.existsSync(dir)
  if (dirExists) return fs.linkSync(srcpath, dstpath)
  mkdir.mkdirsSync(dir)

  return fs.linkSync(srcpath, dstpath)
}

module.exports = {
  createLink: u(createLink),
  createLinkSync
}


/***/ }),
/* 30 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
const path = __webpack_require__(3)
const fs = __webpack_require__(5)

const { mkdirs, mkdirsSync } = __webpack_require__(18)

const { symlinkPaths, symlinkPathsSync } = __webpack_require__(31)
const { symlinkType, symlinkTypeSync } = __webpack_require__(32)

const { pathExists } = __webpack_require__(21)

const { areIdentical } = __webpack_require__(23)

async function createSymlink (srcpath, dstpath, type) {
  let stats
  try {
    stats = await fs.lstat(dstpath)
  } catch { }

  if (stats && stats.isSymbolicLink()) {
    const [srcStat, dstStat] = await Promise.all([
      fs.stat(srcpath),
      fs.stat(dstpath)
    ])

    if (areIdentical(srcStat, dstStat)) return
  }

  const relative = await symlinkPaths(srcpath, dstpath)
  srcpath = relative.toDst
  const toType = await symlinkType(relative.toCwd, type)
  const dir = path.dirname(dstpath)

  if (!(await pathExists(dir))) {
    await mkdirs(dir)
  }

  return fs.symlink(srcpath, dstpath, toType)
}

function createSymlinkSync (srcpath, dstpath, type) {
  let stats
  try {
    stats = fs.lstatSync(dstpath)
  } catch { }
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs.statSync(srcpath)
    const dstStat = fs.statSync(dstpath)
    if (areIdentical(srcStat, dstStat)) return
  }

  const relative = symlinkPathsSync(srcpath, dstpath)
  srcpath = relative.toDst
  type = symlinkTypeSync(relative.toCwd, type)
  const dir = path.dirname(dstpath)
  const exists = fs.existsSync(dir)
  if (exists) return fs.symlinkSync(srcpath, dstpath, type)
  mkdirsSync(dir)
  return fs.symlinkSync(srcpath, dstpath, type)
}

module.exports = {
  createSymlink: u(createSymlink),
  createSymlinkSync
}


/***/ }),
/* 31 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const path = __webpack_require__(3)
const fs = __webpack_require__(5)
const { pathExists } = __webpack_require__(21)

const u = (__webpack_require__(6).fromPromise)

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

async function symlinkPaths (srcpath, dstpath) {
  if (path.isAbsolute(srcpath)) {
    try {
      await fs.lstat(srcpath)
    } catch (err) {
      err.message = err.message.replace('lstat', 'ensureSymlink')
      throw err
    }

    return {
      toCwd: srcpath,
      toDst: srcpath
    }
  }

  const dstdir = path.dirname(dstpath)
  const relativeToDst = path.join(dstdir, srcpath)

  const exists = await pathExists(relativeToDst)
  if (exists) {
    return {
      toCwd: relativeToDst,
      toDst: srcpath
    }
  }

  try {
    await fs.lstat(srcpath)
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureSymlink')
    throw err
  }

  return {
    toCwd: srcpath,
    toDst: path.relative(dstdir, srcpath)
  }
}

function symlinkPathsSync (srcpath, dstpath) {
  if (path.isAbsolute(srcpath)) {
    const exists = fs.existsSync(srcpath)
    if (!exists) throw new Error('absolute srcpath does not exist')
    return {
      toCwd: srcpath,
      toDst: srcpath
    }
  }

  const dstdir = path.dirname(dstpath)
  const relativeToDst = path.join(dstdir, srcpath)
  const exists = fs.existsSync(relativeToDst)
  if (exists) {
    return {
      toCwd: relativeToDst,
      toDst: srcpath
    }
  }

  const srcExists = fs.existsSync(srcpath)
  if (!srcExists) throw new Error('relative srcpath does not exist')
  return {
    toCwd: srcpath,
    toDst: path.relative(dstdir, srcpath)
  }
}

module.exports = {
  symlinkPaths: u(symlinkPaths),
  symlinkPathsSync
}


/***/ }),
/* 32 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(5)
const u = (__webpack_require__(6).fromPromise)

async function symlinkType (srcpath, type) {
  if (type) return type

  let stats
  try {
    stats = await fs.lstat(srcpath)
  } catch {
    return 'file'
  }

  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

function symlinkTypeSync (srcpath, type) {
  if (type) return type

  let stats
  try {
    stats = fs.lstatSync(srcpath)
  } catch {
    return 'file'
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

module.exports = {
  symlinkType: u(symlinkType),
  symlinkTypeSync
}


/***/ }),
/* 33 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
const jsonFile = __webpack_require__(34)

jsonFile.outputJson = u(__webpack_require__(37))
jsonFile.outputJsonSync = __webpack_require__(39)
// aliases
jsonFile.outputJSON = jsonFile.outputJson
jsonFile.outputJSONSync = jsonFile.outputJsonSync
jsonFile.writeJSON = jsonFile.writeJson
jsonFile.writeJSONSync = jsonFile.writeJsonSync
jsonFile.readJSON = jsonFile.readJson
jsonFile.readJSONSync = jsonFile.readJsonSync

module.exports = jsonFile


/***/ }),
/* 34 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const jsonFile = __webpack_require__(35)

module.exports = {
  // jsonfile exports
  readJson: jsonFile.readFile,
  readJsonSync: jsonFile.readFileSync,
  writeJson: jsonFile.writeFile,
  writeJsonSync: jsonFile.writeFileSync
}


/***/ }),
/* 35 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

let _fs
try {
  _fs = __webpack_require__(7)
} catch (_) {
  _fs = __webpack_require__(8)
}
const universalify = __webpack_require__(6)
const { stringify, stripBom } = __webpack_require__(36)

async function _readFile (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options }
  }

  const fs = options.fs || _fs

  const shouldThrow = 'throws' in options ? options.throws : true

  let data = await universalify.fromCallback(fs.readFile)(file, options)

  data = stripBom(data)

  let obj
  try {
    obj = JSON.parse(data, options ? options.reviver : null)
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`
      throw err
    } else {
      return null
    }
  }

  return obj
}

const readFile = universalify.fromPromise(_readFile)

function readFileSync (file, options = {}) {
  if (typeof options === 'string') {
    options = { encoding: options }
  }

  const fs = options.fs || _fs

  const shouldThrow = 'throws' in options ? options.throws : true

  try {
    let content = fs.readFileSync(file, options)
    content = stripBom(content)
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file}: ${err.message}`
      throw err
    } else {
      return null
    }
  }
}

async function _writeFile (file, obj, options = {}) {
  const fs = options.fs || _fs

  const str = stringify(obj, options)

  await universalify.fromCallback(fs.writeFile)(file, str, options)
}

const writeFile = universalify.fromPromise(_writeFile)

function writeFileSync (file, obj, options = {}) {
  const fs = options.fs || _fs

  const str = stringify(obj, options)
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

const jsonfile = {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync
}

module.exports = jsonfile


/***/ }),
/* 36 */
/***/ ((module) => {

function stringify (obj, { EOL = '\n', finalEOL = true, replacer = null, spaces } = {}) {
  const EOF = finalEOL ? EOL : ''
  const str = JSON.stringify(obj, replacer, spaces)

  return str.replace(/\n/g, EOL) + EOF
}

function stripBom (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8')
  return content.replace(/^\uFEFF/, '')
}

module.exports = { stringify, stripBom }


/***/ }),
/* 37 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { stringify } = __webpack_require__(36)
const { outputFile } = __webpack_require__(38)

async function outputJson (file, data, options = {}) {
  const str = stringify(data, options)

  await outputFile(file, str, options)
}

module.exports = outputJson


/***/ }),
/* 38 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
const fs = __webpack_require__(5)
const path = __webpack_require__(3)
const mkdir = __webpack_require__(18)
const pathExists = (__webpack_require__(21).pathExists)

async function outputFile (file, data, encoding = 'utf-8') {
  const dir = path.dirname(file)

  if (!(await pathExists(dir))) {
    await mkdir.mkdirs(dir)
  }

  return fs.writeFile(file, data, encoding)
}

function outputFileSync (file, ...args) {
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    mkdir.mkdirsSync(dir)
  }

  fs.writeFileSync(file, ...args)
}

module.exports = {
  outputFile: u(outputFile),
  outputFileSync
}


/***/ }),
/* 39 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { stringify } = __webpack_require__(36)
const { outputFileSync } = __webpack_require__(38)

function outputJsonSync (file, data, options) {
  const str = stringify(data, options)

  outputFileSync(file, str, options)
}

module.exports = outputJsonSync


/***/ }),
/* 40 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const u = (__webpack_require__(6).fromPromise)
module.exports = {
  move: u(__webpack_require__(41)),
  moveSync: __webpack_require__(42)
}


/***/ }),
/* 41 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(5)
const path = __webpack_require__(3)
const { copy } = __webpack_require__(16)
const { remove } = __webpack_require__(26)
const { mkdirp } = __webpack_require__(18)
const { pathExists } = __webpack_require__(21)
const stat = __webpack_require__(23)

async function move (src, dest, opts = {}) {
  const overwrite = opts.overwrite || opts.clobber || false

  const { srcStat, isChangingCase = false } = await stat.checkPaths(src, dest, 'move', opts)

  await stat.checkParentPaths(src, srcStat, dest, 'move')

  // If the parent of dest is not root, make sure it exists before proceeding
  const destParent = path.dirname(dest)
  const parsedParentPath = path.parse(destParent)
  if (parsedParentPath.root !== destParent) {
    await mkdirp(destParent)
  }

  return doRename(src, dest, overwrite, isChangingCase)
}

async function doRename (src, dest, overwrite, isChangingCase) {
  if (!isChangingCase) {
    if (overwrite) {
      await remove(dest)
    } else if (await pathExists(dest)) {
      throw new Error('dest already exists.')
    }
  }

  try {
    // Try w/ rename first, and try copy + remove if EXDEV
    await fs.rename(src, dest)
  } catch (err) {
    if (err.code !== 'EXDEV') {
      throw err
    }
    await moveAcrossDevice(src, dest, overwrite)
  }
}

async function moveAcrossDevice (src, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true,
    preserveTimestamps: true
  }

  await copy(src, dest, opts)
  return remove(src)
}

module.exports = move


/***/ }),
/* 42 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const fs = __webpack_require__(7)
const path = __webpack_require__(3)
const copySync = (__webpack_require__(16).copySync)
const removeSync = (__webpack_require__(26).removeSync)
const mkdirpSync = (__webpack_require__(18).mkdirpSync)
const stat = __webpack_require__(23)

function moveSync (src, dest, opts) {
  opts = opts || {}
  const overwrite = opts.overwrite || opts.clobber || false

  const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, 'move', opts)
  stat.checkParentPathsSync(src, srcStat, dest, 'move')
  if (!isParentRoot(dest)) mkdirpSync(path.dirname(dest))
  return doRename(src, dest, overwrite, isChangingCase)
}

function isParentRoot (dest) {
  const parent = path.dirname(dest)
  const parsedPath = path.parse(parent)
  return parsedPath.root === parent
}

function doRename (src, dest, overwrite, isChangingCase) {
  if (isChangingCase) return rename(src, dest, overwrite)
  if (overwrite) {
    removeSync(dest)
    return rename(src, dest, overwrite)
  }
  if (fs.existsSync(dest)) throw new Error('dest already exists.')
  return rename(src, dest, overwrite)
}

function rename (src, dest, overwrite) {
  try {
    fs.renameSync(src, dest)
  } catch (err) {
    if (err.code !== 'EXDEV') throw err
    return moveAcrossDevice(src, dest, overwrite)
  }
}

function moveAcrossDevice (src, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true,
    preserveTimestamps: true
  }
  copySync(src, dest, opts)
  return removeSync(src)
}

module.exports = moveSync


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerCreateSnippets = void 0;
const vscode_1 = __webpack_require__(2);
const webviewUtils_1 = __webpack_require__(44);
const registerCreateSnippets = (context) => {
    context.subscriptions.push(vscode_1.commands.registerCommand("DiFlow.createSnippets", async () => {
        (0, webviewUtils_1.showWebView)(context, {
            key: "main",
            title: "添加代码片段",
            viewColumn: 1,
            task: {
                task: "route",
                data: {
                    path: "/add-snippets",
                },
            },
        });
    }));
};
exports.registerCreateSnippets = registerCreateSnippets;


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getHtmlForWebview = exports.showWebView = void 0;
const vscode = __webpack_require__(2);
const snippet = __webpack_require__(45);
const cursorIntegration_1 = __webpack_require__(46);
const path = __webpack_require__(3);
const fs = __webpack_require__(8);
// 当前的webview列表
let webviewPanelList = [];
// 创建 Cursor 集成实例
const cursorIntegration = new cursorIntegration_1.CursorIntegration();
// 创建webview
const showWebView = (context, options) => {
    // 先判断，webview是否存在了，存在了则不新增，传递消息给webview处理后续
    const webview = webviewPanelList.find((s) => s.key === options.key);
    if (webview) {
        webview.panel.reveal(); // 显示webview
        // 传递任务
        if (options.task) {
            webview.panel.webview.postMessage({
                cmd: "vscodePushTask",
                task: options.task.task,
                data: options.task.data,
            });
        }
    }
    else {
        const panel = vscode.window.createWebviewPanel("DiFlow", options.title || "DiFlow", {
            viewColumn: options.viewColumn || vscode.ViewColumn.Two,
        }, {
            enableScripts: true,
            retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
        });
        // 设置icon
        panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, "images", "title.jpg"));
        panel.webview.html = (0, exports.getHtmlForWebview)(context, panel.webview);
        // 创建监听器，监听 webview 返回信息，
        // 在webview中会通过 vscode.postMessage{command: 'someCommand',data: { /* 你的数据 */ },} 发送信息
        // 创建资源管理列表
        const disposables = [];
        panel.webview.onDidReceiveMessage(async (message) => {
            // 监听webview反馈回来加载完成，初始化主动推送消息
            if (message.cmd === "webviewLoaded") {
                if (options.task) {
                    panel.webview.postMessage({
                        cmd: "vscodePushTask",
                        task: options?.task?.task,
                        data: options?.task?.data,
                    });
                }
            }
            // 分发别的任务
            if (taskMap[message.cmd]) {
                // 将回调消息传递到分发任务中
                taskMap[message.cmd](context, message);
            }
        }, null, disposables);
        // 关闭时销毁
        panel.onDidDispose(() => {
            panel.dispose();
            while (disposables.length) {
                const x = disposables.pop();
                if (x) {
                    x.dispose();
                }
            }
            // 去掉该 panel
            webviewPanelList = webviewPanelList.filter((s) => s.key !== options.key);
        }, null, disposables);
        // 添加
        webviewPanelList.push({
            key: options.key,
            panel,
            disposables,
        });
        // 如果有任务，执行任务
        if (options.task) {
            setTimeout(() => {
                panel.webview.postMessage({
                    cmd: "vscodePushTask",
                    task: options.task.task,
                    data: options.task.data,
                });
            }, 500);
        }
    }
};
exports.showWebView = showWebView;
// 获取 webview html
const getHtmlForWebview = (context, webview) => {
    const isProduction = context.extensionMode === vscode.ExtensionMode.Production;
    let srcUrl = "";
    console.log("isProduction", isProduction);
    if (isProduction) {
        console.log("webview-dist/main.mjs");
        const mainScriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, "webview-dist", "main.mjs"));
        srcUrl = webview.asWebviewUri(mainScriptPathOnDisk);
    }
    else {
        console.log("localhost:7979/src/main.ts");
        srcUrl = "http://localhost:7979/src/main.ts";
    }
    return getWebviewContent(srcUrl);
};
exports.getHtmlForWebview = getHtmlForWebview;
// webview html 容器
const getWebviewContent = (srcUri) => {
    return `<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' vscode-webview: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; style-src 'unsafe-inline' vscode-webview: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; connect-src vscode-webview: http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* http://127.0.0.1:* https://127.0.0.1:* ws://127.0.0.1:* wss://127.0.0.1:*; img-src vscode-webview: data: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; font-src vscode-webview: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*;">
      <title>webview-react</title>
      <script>
         window.vscode = acquireVsCodeApi();
         window.process = {
           env: {
             NODE_ENV: "production",
           },
         }
         // 添加调试信息
         console.log("Webview CSP configured for localhost and 127.0.0.1");
      </script>
    </head>
    <body>
      <div id="app"></div>
      <script  type="module" src="${srcUri}"></script>
    </body>
    </html>`;
};
/**
 * 类型安全的数据访问辅助函数
 */
function getTaskData(data) {
    return data && typeof data === "object" && data !== null
        ? data
        : {};
}
/**
 * 任务映射表
 */
const taskMap = {};
// 添加更新用户规则任务
taskMap.updateUserRules = async (context, message) => {
    try {
        console.log("更新用户规则...", message.data);
        const data = message.data;
        const rules = data?.rules;
        if (typeof rules !== "string") {
            throw new Error("规则内容必须是字符串类型");
        }
        const result = await cursorIntegration.updateUserRules(rules);
        console.log("更新用户规则结果:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("updateUserRules task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 添加获取 Cursor 设置任务
taskMap.getCursorSettings = async (context, message) => {
    try {
        console.log("获取 Cursor 设置...");
        const settings = await cursorIntegration.getCursorSettings();
        console.log("Cursor 设置:", settings);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: settings, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("getCursorSettings task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap.updateCursorSettings = async (context, message) => {
    try {
        console.log("更新 Cursor 设置...", message.data);
        const result = await cursorIntegration.updateCursorSettings(message.data);
        console.log("更新 Cursor 设置结果:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("updateCursorSettings task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error.message,
                },
            });
        }
    }
};
// 添加 snippet 任务处理器
taskMap.addSnippets = async (context, message) => {
    try {
        // 确保 message.data 包含必要的字段
        const data = message.data;
        if (!data || typeof data !== "object") {
            throw new Error("缺少必要的数据");
        }
        // 类型断言确保数据结构正确
        const snippetData = data;
        if (!snippetData.tips ||
            !snippetData.prefix ||
            !snippetData.body ||
            !snippetData.description) {
            throw new Error("缺少必要的代码片段字段");
        }
        await snippet.addSnippets(context, { data: snippetData });
    }
    catch (error) {
        console.error("addSnippets task failed:", error);
    }
};
taskMap.openCursorChat = async (context, message) => {
    try {
        console.log("打开 Cursor 聊天...", message.data);
        const data = message.data;
        const result = await cursorIntegration.openCursorChat(data?.message || "");
        console.log("打开 Cursor 聊天结果:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("openCursorChat task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 添加发送消息到Cursor Chat的任务处理器
taskMap.sendToCursorChat = async (context, message) => {
    try {
        console.log("发送消息到 Cursor Chat...", message.data);
        const data = message.data;
        const result = await cursorIntegration.openCursorChat(data?.message || "");
        console.log("发送消息到 Cursor Chat 结果:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: result,
                    data: result,
                },
            });
        }
    }
    catch (error) {
        console.error("sendToCursorChat task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap.getMcpServers = async (context, message) => {
    try {
        console.log("获取 MCP 服务器列表...");
        const result = await cursorIntegration.getMcpServers();
        console.log("MCP 服务器列表:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("getMcpServers task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap.addMcpServer = async (context, message) => {
    try {
        console.log("添加 MCP 服务器...", message.data);
        const data = message.data;
        const { name, config } = data;
        if (!name || !config) {
            throw new Error("缺少必要参数：name 或 config");
        }
        // 确保 config 包含必要的 command 字段
        const mcpConfig = config;
        if (!mcpConfig.command) {
            throw new Error("MCP 配置缺少必要的 command 字段");
        }
        const result = await cursorIntegration.addMcpServer(name, mcpConfig);
        console.log("添加 MCP 服务器结果:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("addMcpServer task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap.removeMcpServer = async (context, message) => {
    try {
        console.log("删除 MCP 服务器...", message.data);
        const data = message.data;
        const { name } = data;
        if (!name) {
            throw new Error("缺少必要参数：name");
        }
        const result = await cursorIntegration.removeMcpServer(name);
        console.log("删除 MCP 服务器结果:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("removeMcpServer task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 添加获取用户规则任务
taskMap.getUserRules = async (context, message) => {
    try {
        console.log("获取用户规则...");
        const userRules = await cursorIntegration.getUserRules();
        console.log("用户规则:", userRules);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: userRules, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("getUserRules task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap.getSystemInfo = async (context, message) => {
    try {
        console.log("获取系统信息...");
        const systemInfo = cursorIntegration.getSystemInfo();
        console.log("系统信息:", systemInfo);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: systemInfo, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("getSystemInfo task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error.message,
                },
            });
        }
    }
};
taskMap.isCursorInstalled = async (context, message) => {
    try {
        console.log("开始检测 Cursor 安装状态...");
        const result = await cursorIntegration.isCursorInstalled();
        console.log("Cursor 安装检测结果:", result);
        // 发送结果回 webview - 修复返回格式，确保与前端期望一致
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("isCursorInstalled task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap.openCursor = async (context, message) => {
    try {
        console.log("打开 Cursor...", message.data);
        const data = message.data;
        const filePath = data?.filePath;
        const result = await cursorIntegration.openCursor(filePath);
        console.log("打开 Cursor 结果:", result);
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result, // 前端期望在 result.data 中获取实际结果
                },
            });
        }
    }
    catch (error) {
        console.error("openCursor task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap.setCustomInstallPath = async (context, message) => {
    try {
        console.log("setCustomInstallPath 收到数据:", message.data);
        // 修复参数名称匹配问题
        const data = message.data;
        const customPath = data?.path || data?.customPath;
        if (!customPath || typeof customPath !== "string") {
            throw new Error("未提供有效的安装路径");
        }
        console.log("设置自定义安装路径:", customPath);
        cursorIntegration.setCustomInstallPath(customPath);
        // 重新检测安装状态
        const isInstalled = await cursorIntegration.isCursorInstalled();
        const systemInfo = cursorIntegration.getSystemInfo();
        console.log("重新检测结果:", { isInstalled, systemInfo });
        // 发送结果回 webview - 修复返回格式
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    isInstalled,
                    systemInfo,
                },
            });
        }
    }
    catch (error) {
        console.error("setCustomInstallPath task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 获取 Cursor 用户信息任务处理器
taskMap.getCursorUserInfo = async (context, message) => {
    try {
        console.log("获取 Cursor 用户信息...");
        const userInfo = await cursorIntegration.getCursorUserInfo();
        console.log("Cursor 用户信息:", userInfo);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: userInfo,
                },
            });
        }
    }
    catch (error) {
        console.error("getCursorUserInfo task failed:", error);
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 检查 Cursor 登录状态任务处理器
taskMap.isCursorLoggedIn = async (context, message) => {
    try {
        console.log("检查 Cursor 登录状态...");
        const isLoggedIn = await cursorIntegration.isCursorLoggedIn();
        console.log("Cursor 登录状态:", isLoggedIn);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: isLoggedIn,
                },
            });
        }
    }
    catch (error) {
        console.error("isCursorLoggedIn task failed:", error);
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 登录或创建用户任务处理器
taskMap.loginOrCreateUser = async (context, message) => {
    try {
        console.log("获取Cursor用户信息...", message.data);
        // 获取Cursor用户信息
        const cursorUserInfo = await cursorIntegration.getCursorUserInfo();
        console.log("Cursor用户信息:", cursorUserInfo);
        // 发送用户信息到webview，让webview处理API调用
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: cursorUserInfo,
                },
            });
        }
    }
    catch (error) {
        console.error("loginOrCreateUser task failed:", error);
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error.message,
                },
            });
        }
    }
};
// 同步用户数据任务处理器 - 简化为只返回成功状态
taskMap.syncUserData = async (context, message) => {
    try {
        console.log("同步用户数据任务 - 由webview处理", message.data);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    message: "任务已转发到webview处理",
                },
            });
        }
    }
    catch (error) {
        console.error("syncUserData task failed:", error);
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 同步规则到服务器任务处理器 - 简化为只返回成功状态
taskMap.syncRulesToServer = async (context, message) => {
    try {
        console.log("同步规则到服务器任务 - 由webview处理", message.data);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    message: "任务已转发到webview处理",
                },
            });
        }
    }
    catch (error) {
        console.error("syncRulesToServer task failed:", error);
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 同步 MCP 配置到服务器任务处理器 - 简化为只返回成功状态
taskMap.syncMcpsToServer = async (context, message) => {
    try {
        console.log("同步MCP配置到服务器任务 - 由webview处理", message.data);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    message: "任务已转发到webview处理",
                },
            });
        }
    }
    catch (error) {
        console.error("syncMcpsToServer task failed:", error);
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 网络请求处理器 - 允许 webview 通过扩展进行网络请求
taskMap.networkRequest = async (context, message) => {
    try {
        const requestData = message.data;
        if (!requestData || typeof requestData !== "object") {
            throw new Error("请求数据无效");
        }
        const { url, method = "GET", headers = {}, body } = requestData;
        if (!url || typeof url !== "string") {
            throw new Error("URL 参数无效");
        }
        console.log(`网络请求: ${method} ${url}`);
        // 使用 Node.js 的 https/http 模块进行请求
        const https = __webpack_require__(49);
        const http = __webpack_require__(50);
        const { URL } = __webpack_require__(51);
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === "https:";
        const requestModule = isHttps ? https : http;
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: method,
            headers: {
                "User-Agent": "DIFlow-VSCode-Extension/1.0.0",
                ...(typeof headers === "object" && headers !== null ? headers : {}),
            },
        };
        const result = await new Promise((resolve, reject) => {
            const req = requestModule.request(requestOptions, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    try {
                        let parsedData;
                        try {
                            parsedData = JSON.parse(data);
                        }
                        catch {
                            parsedData = data;
                        }
                        resolve({
                            ok: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            data: parsedData,
                            text: data,
                            headers: res.headers,
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            req.on("error", (error) => {
                reject(error);
            });
            if (body &&
                (method === "POST" || method === "PUT" || method === "PATCH")) {
                req.write(typeof body === "string" ? body : JSON.stringify(body));
            }
            req.end();
        });
        console.log(`网络请求完成: ${method} ${url} - ${result.status}`);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result,
                },
            });
        }
    }
    catch (error) {
        console.error("网络请求失败:", error);
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 网络请求代理任务
taskMap.proxyRequest = async (context, message) => {
    try {
        console.log("代理网络请求:", message.data);
        const requestData = message.data;
        if (!requestData || typeof requestData !== "object") {
            throw new Error("请求数据无效");
        }
        const { method, url, data, headers } = requestData;
        if (!method || !url) {
            throw new Error("方法或URL参数缺失");
        }
        // 使用 Node.js 的 https/http 模块发送请求
        const https = __webpack_require__(49);
        const http = __webpack_require__(50);
        const urlLib = __webpack_require__(51);
        const parsedUrl = urlLib.parse(url);
        const isHttps = parsedUrl.protocol === "https:";
        const requestLib = isHttps ? https : http;
        // 构建请求选项
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.path,
            method: String(method).toUpperCase(),
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "DIFlow-VSCode-Extension/1.0.0",
                ...(headers || {}),
            },
            // 忽略 SSL 证书验证（仅用于开发）
            rejectUnauthorized: false,
        };
        console.log("代理请求选项:", options);
        // 发送请求
        const result = await new Promise((resolve, reject) => {
            const req = requestLib.request(options, (res) => {
                let responseData = "";
                res.on("data", (chunk) => {
                    responseData += chunk;
                });
                res.on("end", () => {
                    try {
                        console.log("原始响应数据:", responseData);
                        const parsedData = responseData ? JSON.parse(responseData) : {};
                        resolve({
                            success: true,
                            status: res.statusCode,
                            data: parsedData,
                            headers: res.headers,
                        });
                    }
                    catch (parseError) {
                        console.log("JSON解析失败，返回原始数据:", parseError);
                        resolve({
                            success: true,
                            status: res.statusCode,
                            data: responseData,
                            headers: res.headers,
                        });
                    }
                });
            });
            req.on("error", (error) => {
                console.error("代理请求错误:", error);
                reject({
                    success: false,
                    message: `网络请求失败: ${error.message}`,
                    error: error,
                });
            });
            req.setTimeout(10000, () => {
                req.destroy();
                reject({
                    success: false,
                    message: "请求超时",
                    error: new Error("Request timeout"),
                });
            });
            // 发送请求体数据
            if (data &&
                (String(method).toUpperCase() === "POST" ||
                    String(method).toUpperCase() === "PUT")) {
                const jsonData = JSON.stringify(data);
                console.log("发送请求体数据:", jsonData);
                req.write(jsonData);
            }
            req.end();
        });
        console.log("代理请求成功:", result);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: result,
            });
        }
    }
    catch (error) {
        console.error("proxyRequest task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    message: error instanceof Error ? error.message : "网络请求失败",
                    error: error,
                },
            });
        }
    }
};
// MCP 配置 JSON 管理
taskMap["cursor:getMcpConfigJson"] = async (context, message) => {
    try {
        console.log("=== 开始获取 MCP 配置 JSON ===");
        console.log("消息数据:", message);
        // 直接获取本地配置，API调用由前端通过httpUtils处理
        console.log("调用 cursorIntegration.getMcpConfigJson()...");
        const result = await cursorIntegration.getMcpConfigJson();
        console.log("获取 MCP 配置 JSON 结果:", result);
        console.log("配置项数量:", Object.keys(result.mcpConfig || {}).length);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        console.log("找到的 webview panels:", panels.length);
        if (panels.length > 0 && message.cbid) {
            console.log("发送成功响应到 webview, cbid:", message.cbid);
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result,
                },
            });
            console.log("✅ 成功发送响应到 webview");
        }
        else {
            console.error("❌ 没有找到对应的 webview panel 或缺少 cbid");
            console.log("panels.length:", panels.length);
            console.log("message.cbid:", message.cbid);
        }
    }
    catch (error) {
        console.error("❌ getMcpConfigJson task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            console.log("发送错误响应到 webview, cbid:", message.cbid);
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap["cursor:batchUpdateMcpConfig"] = async (context, message) => {
    try {
        console.log("批量更新 MCP 配置...", message.data);
        const data = message.data;
        // 更新本地配置
        const result = await cursorIntegration.batchUpdateMcpConfig(data.mcpConfig);
        console.log("批量更新 MCP 配置结果:", result);
        // 发送结果回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: true,
                    data: result,
                },
            });
        }
    }
    catch (error) {
        console.error("batchUpdateMcpConfig task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap["cursor:shareMcpConfig"] = async (context, message) => {
    try {
        console.log("分享 MCP 配置...", message.data);
        // 这个任务应该由前端通过httpUtils调用后端API
        // 这里只是一个占位符，实际的API调用在前端进行
        // 发送结果回 webview，告诉前端需要调用API
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: "此功能需要通过前端httpUtils调用后端API",
                },
            });
        }
    }
    catch (error) {
        console.error("shareMcpConfig task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap["cursor:getMcpConfigByShareId"] = async (context, message) => {
    try {
        console.log("获取分享配置...", message.data);
        // 这个任务应该由前端通过httpUtils调用后端API
        // 这里只是一个占位符，实际的API调用在前端进行
        // 发送结果回 webview，告诉前端需要调用API
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: "此功能需要通过前端httpUtils调用后端API",
                },
            });
        }
    }
    catch (error) {
        console.error("getMcpConfigByShareId task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
taskMap["cursor:addMcpByShareId"] = async (context, message) => {
    try {
        console.log("通过分享 ID 添加配置...", message.data);
        // 这个任务应该由前端通过httpUtils调用后端API
        // 这里只是一个占位符，实际的API调用在前端进行
        // 发送结果回 webview，告诉前端需要调用API
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: "此功能需要通过前端httpUtils调用后端API",
                },
            });
        }
    }
    catch (error) {
        console.error("addMcpByShareId task failed:", error);
        // 发送错误回 webview
        const panels = webviewPanelList.filter((panel) => panel.key === "cursor" || panel.key === "main");
        if (panels.length > 0 && message.cbid) {
            panels[0].panel.webview.postMessage({
                cbid: message.cbid,
                data: {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        }
    }
};
// 辅助函数：获取存储的token
async function getStoredToken() {
    // 这里需要从VS Code的存储中获取token
    // 暂时返回空字符串，实际应该从context.globalState或其他地方获取
    return "";
}


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.addSnippets = void 0;
const vscode = __webpack_require__(2);
const path = __webpack_require__(3);
const addSnippets = (context, message) => {
    // 获取当前项目下的路径
    const rootPath = vscode.workspace.rootPath;
    const extensionPath = path.join(rootPath, ".vscode/test.code-snippets");
    const snippetFilePath = vscode.Uri.file(extensionPath);
    // 创建代码片段
    const newSnippet = {
        [message.data.tips]: {
            prefix: message.data?.prefix,
            body: [message.data?.body],
            description: message.data?.description,
        },
    };
    // 将代码片段写入文件并添加到扩展程序
    const writesnippetFilePath = async () => {
        try {
            let existingSnippets = {};
            // 保证一定有该文件
            try {
                const folderStat = await vscode.workspace.fs.stat(snippetFilePath);
                if (folderStat.type !== vscode.FileType.File) {
                    await vscode.workspace.fs.writeFile(snippetFilePath, Buffer.from("", "utf8"));
                }
            }
            catch (error) {
                await vscode.workspace.fs.writeFile(snippetFilePath, Buffer.from("", "utf8"));
            }
            // 读取原有文件内容
            const snippetsFileContent = await vscode.workspace.fs.readFile(snippetFilePath);
            if (snippetsFileContent && snippetsFileContent.toString())
                existingSnippets = JSON.parse(snippetsFileContent.toString());
            // 如果不存在重复代码片段则拼接
            if (!existingSnippets[newSnippet[message.data.tips].prefix]) {
                existingSnippets = { ...existingSnippets, ...newSnippet };
            }
            else {
                existingSnippets = newSnippet;
            }
            const updatedSnippetsContent = JSON.stringify(existingSnippets, null, 2);
            // 写入
            await vscode.workspace.fs.writeFile(snippetFilePath, Buffer.from(updatedSnippetsContent, "utf-8"));
            vscode.window.showInformationMessage("代码片段添加成功!");
        }
        catch (error) {
            vscode.window.showErrorMessage(`代码片段添加失败: ${error}`);
        }
    };
    writesnippetFilePath();
};
exports.addSnippets = addSnippets;


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerCursorManagement = exports.registerCursorIntegration = exports.CursorIntegration = void 0;
const fs = __webpack_require__(8);
const path = __webpack_require__(3);
const os = __webpack_require__(47);
const vscode = __webpack_require__(2);
/**
 * Cursor 集成类 - 动态配置版本
 */
class CursorIntegration {
    constructor() {
        this.configPaths = {};
        this.logger = {
            debug: (message, ...args) => console.log(`[DEBUG] ${message}`, ...args),
            warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
            error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
        };
        this.platform = os.platform();
        this.detectConfigPaths();
    }
    /**
     * 设置用户自定义 Cursor 安装路径
     */
    setCustomInstallPath(customPath) {
        console.log("设置自定义 Cursor 安装路径:", customPath);
        this.configPaths.customInstallPath = customPath;
        // 重新检测配置路径
        this.detectConfigPaths();
    }
    /**
     * 动态检测所有配置路径
     */
    detectConfigPaths() {
        console.log("开始动态检测 Cursor 配置路径...");
        // 检测 settings.json 路径
        this.configPaths.settingsPath = this.findSettingsPath();
        // 检测 MCP 配置路径
        this.configPaths.mcpPath = this.findMcpPath();
        // 检测 .cursorrules 路径
        this.configPaths.rulesPath = this.findRulesPath();
        // 检测 CLI 路径
        this.configPaths.cliPath = this.findCliPath();
        console.log("配置路径检测结果:", this.configPaths);
    }
    /**
     * 查找 Cursor settings.json 文件
     */
    findSettingsPath() {
        const homeDir = os.homedir();
        const possiblePaths = [];
        if (this.platform === "win32") {
            possiblePaths.push(path.join(homeDir, "AppData", "Roaming", "Cursor", "User", "settings.json"), path.join(homeDir, "AppData", "Local", "Cursor", "User", "settings.json"));
        }
        else if (this.platform === "darwin") {
            // macOS 路径 - 确保使用正确的路径
            const macOSPath = path.join(homeDir, "Library", "Application Support", "Cursor", "User", "settings.json");
            possiblePaths.push(macOSPath);
            console.log("macOS 配置文件路径:", macOSPath);
        }
        else {
            possiblePaths.push(path.join(homeDir, ".config", "Cursor", "User", "settings.json"), path.join(homeDir, ".cursor", "settings.json"));
        }
        for (const settingsPath of possiblePaths) {
            console.log("检查配置文件路径:", settingsPath);
            if (fs.existsSync(settingsPath)) {
                console.log("找到 settings.json:", settingsPath);
                return settingsPath;
            }
        }
        console.log("未找到 settings.json 文件，检查的路径:", possiblePaths);
        return undefined;
    }
    /**
     * 查找 MCP 配置文件
     */
    findMcpPath() {
        const homeDir = os.homedir();
        // Cursor MCP 配置文件的正确路径
        let cursorMcpPaths = [];
        if (this.platform === "darwin") {
            // macOS 路径 - 优先查找专门的MCP配置文件
            cursorMcpPaths = [
                path.join(homeDir, ".cursor", "mcp.json"), // 专门的MCP配置文件
                path.join(homeDir, "mcp.json"), // 用户根目录的MCP配置
                path.join(homeDir, "Library", "Application Support", "Cursor", "User", "globalStorage", "rooveterinaryinc.cursor-mcp", "settings.json"),
                path.join(homeDir, "Library", "Application Support", "Cursor", "User", "settings.json"),
            ];
        }
        else if (this.platform === "win32") {
            // Windows 路径 - 优先查找专门的MCP配置文件
            cursorMcpPaths = [
                path.join(homeDir, ".cursor", "mcp.json"), // 专门的MCP配置文件
                path.join(homeDir, "mcp.json"), // 用户根目录的MCP配置
                path.join(homeDir, "AppData", "Roaming", "Cursor", "User", "globalStorage", "rooveterinaryinc.cursor-mcp", "settings.json"),
                path.join(homeDir, "AppData", "Roaming", "Cursor", "User", "settings.json"),
            ];
        }
        else {
            // Linux 路径 - 优先查找专门的MCP配置文件
            cursorMcpPaths = [
                path.join(homeDir, ".cursor", "mcp.json"), // 专门的MCP配置文件
                path.join(homeDir, "mcp.json"), // 用户根目录的MCP配置
                path.join(homeDir, ".config", "Cursor", "User", "globalStorage", "rooveterinaryinc.cursor-mcp", "settings.json"),
                path.join(homeDir, ".config", "Cursor", "User", "settings.json"),
            ];
        }
        console.log("检查 Cursor MCP 配置路径:", cursorMcpPaths);
        for (const mcpPath of cursorMcpPaths) {
            console.log("检查 MCP 路径:", mcpPath);
            if (fs.existsSync(mcpPath)) {
                console.log("找到 MCP 配置文件:", mcpPath);
                return mcpPath;
            }
        }
        // 如果没有找到现有文件，返回专门的MCP配置文件路径作为默认值
        const defaultPath = cursorMcpPaths[0]; // 使用 .cursor/mcp.json 作为默认路径
        console.log("使用默认 MCP 配置路径:", defaultPath);
        return defaultPath;
    }
    /**
     * 查找 .cursorrules 文件
     */
    findRulesPath() {
        // 优先查找当前工作区的 .cursorrules
        const workspaceRules = path.join(process.cwd(), ".cursorrules");
        if (fs.existsSync(workspaceRules)) {
            console.log("找到工作区 .cursorrules:", workspaceRules);
            return workspaceRules;
        }
        // 查找用户主目录的 .cursorrules
        const homeRules = path.join(os.homedir(), ".cursorrules");
        if (fs.existsSync(homeRules)) {
            console.log("找到用户主目录 .cursorrules:", homeRules);
            return homeRules;
        }
        // 返回工作区路径作为默认值
        console.log("使用默认 .cursorrules 路径:", workspaceRules);
        return workspaceRules;
    }
    /**
     * 查找 Cursor CLI 工具
     */
    findCliPath() {
        try {
            const { execSync } = __webpack_require__(48);
            // 如果用户设置了自定义路径，优先使用
            if (this.configPaths.customInstallPath) {
                const customCliPaths = this.getCliPathsFromInstallDir(this.configPaths.customInstallPath);
                for (const cliPath of customCliPaths) {
                    if (fs.existsSync(cliPath)) {
                        console.log("找到自定义路径 CLI:", cliPath);
                        return cliPath;
                    }
                }
            }
            // 首先尝试 which/where 命令
            try {
                const whichCommand = this.platform === "win32" ? "where cursor" : "which cursor";
                const result = execSync(whichCommand, {
                    encoding: "utf8",
                    timeout: 3000,
                });
                const cliPath = result.trim().split("\n")[0];
                if (cliPath && fs.existsSync(cliPath)) {
                    console.log("通过 which/where 找到 CLI:", cliPath);
                    return cliPath;
                }
            }
            catch (error) {
                console.log("which/where 命令未找到 cursor");
            }
            // 平台特定的查找逻辑
            if (this.platform === "darwin") {
                return this.findCliMacOS();
            }
            else if (this.platform === "win32") {
                return this.findCliWindows();
            }
            else {
                return this.findCliLinux();
            }
        }
        catch (error) {
            console.error("查找 CLI 工具时出错:", error);
            return undefined; // 不要返回 "cursor"，因为可能不存在
        }
    }
    /**
     * 从安装目录获取可能的 CLI 路径
     */
    getCliPathsFromInstallDir(installDir) {
        const paths = [];
        if (this.platform === "darwin") {
            // macOS 应用结构
            if (installDir.endsWith(".app")) {
                paths.push(path.join(installDir, "Contents", "Resources", "app", "bin", "cursor"), path.join(installDir, "Contents", "MacOS", "Cursor"), path.join(installDir, "Contents", "Resources", "cursor"));
            }
            else {
                // 可能是直接指向 CLI 的路径
                paths.push(installDir);
            }
        }
        else if (this.platform === "win32") {
            // Windows 结构
            if (installDir.endsWith(".exe")) {
                paths.push(installDir);
            }
            else {
                paths.push(path.join(installDir, "Cursor.exe"), path.join(installDir, "cursor.exe"));
            }
        }
        else {
            // Linux 结构
            paths.push(installDir, path.join(installDir, "cursor"));
        }
        return paths;
    }
    /**
     * macOS 下查找 CLI
     */
    findCliMacOS() {
        try {
            const { execSync } = __webpack_require__(48);
            // 1. 定义所有需要搜索的应用路径
            const appSearchPaths = [
                "/Applications/Cursor.app",
                path.join(os.homedir(), "Applications", "Cursor.app"),
            ];
            // 2. 使用 mdfind 扩展搜索范围
            try {
                console.log("使用 mdfind 搜索 Cursor 应用...");
                const mdfindResult = execSync('mdfind "kMDItemCFBundleIdentifier == com.todesktop.230313mzl4w4u92" 2>/dev/null', { encoding: "utf8", timeout: 5000 }).trim();
                if (mdfindResult) {
                    appSearchPaths.push(...mdfindResult.split("\n"));
                }
            }
            catch (e) {
                console.log("mdfind 查找失败，将继续使用常规路径搜索...");
            }
            // 3. 去重并遍历所有可能的应用路径
            const uniqueAppPaths = [...new Set(appSearchPaths)].filter(Boolean); // 过滤空路径
            console.log("正在搜索以下应用路径:", uniqueAppPaths);
            for (const appPath of uniqueAppPaths) {
                if (appPath && fs.existsSync(appPath)) {
                    console.log("找到潜在的 Cursor 应用:", appPath);
                    // 定义 CLI 工具在 .app 包内的相对路径
                    const cliPath = path.join(appPath, "Contents", "Resources", "app", "bin", "cursor");
                    if (fs.existsSync(cliPath)) {
                        console.log("成功找到 macOS CLI:", cliPath);
                        return cliPath; // **重要: 只返回可执行的 CLI 路径**
                    }
                }
            }
        }
        catch (error) {
            console.error("macOS CLI 查找出错:", error);
        }
        console.log("在 macOS 上未找到任何可执行的 Cursor CLI 工具。");
        return undefined;
    }
    /**
     * Windows 下查找 CLI
     */
    findCliWindows() {
        const possiblePaths = [
            path.join(os.homedir(), "AppData", "Local", "Programs", "cursor", "Cursor.exe"),
            path.join("C:", "Program Files", "Cursor", "Cursor.exe"),
            path.join("C:", "Program Files (x86)", "Cursor", "Cursor.exe"),
        ];
        for (const cliPath of possiblePaths) {
            if (fs.existsSync(cliPath)) {
                console.log("找到 Windows CLI:", cliPath);
                return cliPath;
            }
        }
        return undefined;
    }
    /**
     * Linux 下查找 CLI
     */
    findCliLinux() {
        const possiblePaths = [
            "/usr/bin/cursor",
            "/usr/local/bin/cursor",
            path.join(os.homedir(), ".local", "bin", "cursor"),
            "/opt/cursor/cursor",
            "/snap/bin/cursor",
        ];
        for (const cliPath of possiblePaths) {
            if (fs.existsSync(cliPath)) {
                console.log("找到 Linux CLI:", cliPath);
                return cliPath;
            }
        }
        return undefined;
    }
    /**
     * 检查 Cursor 是否已安装
     */
    async isCursorInstalled() {
        try {
            console.log("=== Cursor 安装检测开始 ===");
            this.detectConfigPaths(); // 确保所有路径都是最新的
            // 强制检测步骤: 基于实际测试的路径直接检查
            console.log("=== 强制检测步骤 ===");
            const forceCheckPaths = {
                app: "/Applications/Cursor.app",
                cli: "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
                settings: path.join(os.homedir(), "Library", "Application Support", "Cursor", "User", "settings.json"),
            };
            let forceDetected = false;
            console.log("强制检测路径:", forceCheckPaths);
            // 检查应用是否存在
            if (fs.existsSync(forceCheckPaths.app)) {
                console.log("✅ 强制检测: 找到 Cursor 应用");
                forceDetected = true;
            }
            // 检查 CLI 是否存在
            if (fs.existsSync(forceCheckPaths.cli)) {
                console.log("✅ 强制检测: 找到 Cursor CLI");
                this.configPaths.cliPath = forceCheckPaths.cli; // 强制设置 CLI 路径
                forceDetected = true;
            }
            // 检查配置文件是否存在
            if (fs.existsSync(forceCheckPaths.settings)) {
                console.log("✅ 强制检测: 找到 Cursor 配置文件");
                this.configPaths.settingsPath = forceCheckPaths.settings; // 强制设置配置路径
                forceDetected = true;
            }
            if (forceDetected) {
                console.log("=== 强制检测成功，Cursor 已安装 ===");
                return true;
            }
            // 检查 1: 是否找到了 CLI 工具
            if (this.configPaths.cliPath && fs.existsSync(this.configPaths.cliPath)) {
                console.log(`检测成功: 找到 CLI 工具路径 '${this.configPaths.cliPath}'`);
                return true;
            }
            console.log("检测信息: 未能通过 CLI 路径直接确认安装。");
            // 检查 2: 是否找到了关键配置文件
            if (this.configPaths.settingsPath &&
                fs.existsSync(this.configPaths.settingsPath)) {
                console.log(`检测成功: 找到配置文件路径 '${this.configPaths.settingsPath}'`);
                return true;
            }
            console.log("检测信息: 未能通过配置文件确认安装。");
            // 检查 3: 检查应用安装情况（作为后备方案）
            if (this.checkAppInstallation()) {
                console.log("检测成功: 找到了应用安装目录 (但未找到明确的 CLI 或配置文件)。");
                return true;
            }
            console.log("检测信息: 未能通过应用目录确认安装。");
            // 检查 4: 尝试在 PATH 中执行 `cursor --version`
            try {
                const { execSync } = __webpack_require__(48);
                execSync("cursor --version", { timeout: 3000, stdio: "ignore" });
                console.log("检测成功: `cursor --version` 命令执行成功。");
                return true;
            }
            catch (error) {
                console.log(`检测信息: 'cursor --version' 命令执行失败: ${error.message}`);
            }
            console.log("=== Cursor 未检测到 ===");
            return false;
        }
        catch (error) {
            console.error("检测 Cursor 安装状态时发生意外错误:", error);
            return false;
        }
    }
    /**
     * 检查应用安装情况
     */
    checkAppInstallation() {
        try {
            if (this.platform === "darwin") {
                // macOS: 检查 Applications 目录
                const appPaths = [
                    "/Applications/Cursor.app",
                    path.join(os.homedir(), "Applications", "Cursor.app"),
                ];
                for (const appPath of appPaths) {
                    if (fs.existsSync(appPath)) {
                        console.log("找到 Cursor 应用:", appPath);
                        return true;
                    }
                }
            }
            else if (this.platform === "win32") {
                // Windows: 检查常见安装位置
                const appPaths = [
                    path.join(os.homedir(), "AppData", "Local", "Programs", "cursor"),
                    path.join("C:", "Program Files", "Cursor"),
                    path.join("C:", "Program Files (x86)", "Cursor"),
                ];
                for (const appPath of appPaths) {
                    if (fs.existsSync(appPath)) {
                        console.log("找到 Cursor 安装目录:", appPath);
                        return true;
                    }
                }
            }
            else {
                // Linux: 检查常见位置
                const appPaths = [
                    "/opt/cursor",
                    "/usr/local/bin/cursor",
                    "/usr/bin/cursor",
                    path.join(os.homedir(), ".local", "bin", "cursor"),
                ];
                for (const appPath of appPaths) {
                    if (fs.existsSync(appPath)) {
                        console.log("找到 Cursor 安装:", appPath);
                        return true;
                    }
                }
            }
        }
        catch (error) {
            console.error("检查应用安装时出错:", error);
        }
        return false;
    }
    /**
     * 获取 Cursor 设置
     */
    async getCursorSettings() {
        const settings = {};
        try {
            // 读取 .cursorrules 文件
            if (this.configPaths.rulesPath &&
                fs.existsSync(this.configPaths.rulesPath)) {
                settings.rules = fs.readFileSync(this.configPaths.rulesPath, "utf-8");
            }
            else {
                settings.rules = "";
            }
            // 读取主配置文件
            if (this.configPaths.settingsPath &&
                fs.existsSync(this.configPaths.settingsPath)) {
                const configContent = fs.readFileSync(this.configPaths.settingsPath, "utf-8");
                try {
                    settings.generalConfig = JSON.parse(configContent);
                }
                catch (parseError) {
                    console.warn("解析 settings.json 失败:", parseError);
                    settings.generalConfig = {};
                }
            }
            else {
                settings.generalConfig = {};
            }
            // 读取 MCP 配置文件
            if (this.configPaths.mcpPath && fs.existsSync(this.configPaths.mcpPath)) {
                const mcpContent = fs.readFileSync(this.configPaths.mcpPath, "utf-8");
                try {
                    settings.mcpConfig = JSON.parse(mcpContent);
                }
                catch (parseError) {
                    console.warn("解析 MCP 配置失败:", parseError);
                    settings.mcpConfig = { mcpServers: {} };
                }
            }
            else {
                settings.mcpConfig = { mcpServers: {} };
            }
        }
        catch (error) {
            console.error("获取 Cursor 设置失败:", error);
            throw new Error(`获取 Cursor 设置失败: ${error}`);
        }
        return settings;
    }
    /**
     * 更新 Cursor 设置
     */
    async updateCursorSettings(settings) {
        try {
            // 更新 .cursorrules 文件
            if (settings.rules !== undefined && this.configPaths.rulesPath) {
                // 确保目录存在
                const rulesDir = path.dirname(this.configPaths.rulesPath);
                if (!fs.existsSync(rulesDir)) {
                    fs.mkdirSync(rulesDir, { recursive: true });
                }
                fs.writeFileSync(this.configPaths.rulesPath, settings.rules, "utf-8");
            }
            // 更新主配置文件
            if (settings.generalConfig !== undefined &&
                this.configPaths.settingsPath) {
                const configDir = path.dirname(this.configPaths.settingsPath);
                if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                }
                let existingConfig = {};
                if (fs.existsSync(this.configPaths.settingsPath)) {
                    try {
                        const configContent = fs.readFileSync(this.configPaths.settingsPath, "utf-8");
                        existingConfig = JSON.parse(configContent);
                    }
                    catch (parseError) {
                        console.warn("解析现有 settings.json 失败，将创建新配置:", parseError);
                    }
                }
                const mergedConfig = { ...existingConfig, ...settings.generalConfig };
                fs.writeFileSync(this.configPaths.settingsPath, JSON.stringify(mergedConfig, null, 2), "utf-8");
            }
            // 更新 MCP 配置文件
            if (settings.mcpConfig !== undefined && this.configPaths.mcpPath) {
                const mcpDir = path.dirname(this.configPaths.mcpPath);
                if (!fs.existsSync(mcpDir)) {
                    fs.mkdirSync(mcpDir, { recursive: true });
                }
                let existingMcpConfig = { mcpServers: {} };
                if (fs.existsSync(this.configPaths.mcpPath)) {
                    try {
                        const mcpContent = fs.readFileSync(this.configPaths.mcpPath, "utf-8");
                        existingMcpConfig = JSON.parse(mcpContent);
                    }
                    catch (parseError) {
                        console.warn("解析现有 MCP 配置失败，将创建新配置:", parseError);
                    }
                }
                const mergedMcpConfig = {
                    ...existingMcpConfig,
                    ...settings.mcpConfig,
                    mcpServers: {
                        ...existingMcpConfig.mcpServers,
                        ...settings.mcpConfig.mcpServers,
                    },
                };
                fs.writeFileSync(this.configPaths.mcpPath, JSON.stringify(mergedMcpConfig, null, 2), "utf-8");
            }
            return true;
        }
        catch (error) {
            console.error("更新 Cursor 设置失败:", error);
            throw new Error(`更新 Cursor 设置失败: ${error}`);
        }
    }
    /**
     * 打开 Cursor 应用程序
     */
    async openCursor(filePath) {
        try {
            const { exec } = __webpack_require__(48);
            let command;
            if (this.platform === "darwin") {
                if (filePath) {
                    command = `open -a "Cursor" "${filePath}"`;
                }
                else {
                    command = `open -a "Cursor" --new`;
                }
            }
            else {
                const cliPath = this.configPaths.cliPath || "cursor";
                command = `"${cliPath}"`;
                if (filePath) {
                    command += ` "${filePath}"`;
                }
                else {
                    command += " --new-window";
                }
            }
            console.log("执行命令:", command);
            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error("打开 Cursor 失败:", error);
                        reject(new Error(`打开 Cursor 失败: ${error.message}`));
                    }
                    else {
                        console.log("Cursor 打开成功");
                        resolve(true);
                    }
                });
            });
        }
        catch (error) {
            console.error("打开 Cursor 失败:", error);
            throw new Error(`打开 Cursor 失败: ${error}`);
        }
    }
    /**
     * 打开 Cursor Chat 并发送消息
     */
    async openCursorChat(message) {
        this.logger.debug("开始打开 Cursor Chat...");
        try {
            // 如果没有提供消息，提示用户输入
            if (!message) {
                const input = await vscode.window.showInputBox({
                    prompt: "请输入要发送到 Cursor Chat 的消息",
                    placeHolder: "输入您的问题或请求...",
                });
                if (!input) {
                    vscode.window.showInformationMessage("❌ 已取消发送消息");
                    return false;
                }
                message = input;
            }
            // 复制消息到剪贴板
            await vscode.env.clipboard.writeText(message);
            this.logger.debug("✅ 消息已复制到剪贴板");
            // 打开聊天界面
            this.logger.debug("正在打开聊天界面...");
            try {
                await vscode.commands.executeCommand("aichat.newchataction");
                this.logger.debug("✅ 成功执行 aichat.newchataction");
            }
            catch (error) {
                this.logger.warn("⚠️ aichat.newchataction 失败，尝试其他命令");
                try {
                    await vscode.commands.executeCommand("workbench.action.chat.open");
                    this.logger.debug("✅ 成功执行 workbench.action.chat.open");
                }
                catch (error2) {
                    this.logger.warn("⚠️ workbench.action.chat.open 失败，尝试最后一个命令");
                    await vscode.commands.executeCommand("workbench.action.chat.newChat");
                    this.logger.debug("✅ 成功执行 workbench.action.chat.newChat");
                }
            }
            // 等待界面加载
            await new Promise((resolve) => setTimeout(resolve, 2500));
            this.logger.debug("⏱️ 等待界面加载完成");
            // 尝试聚焦到聊天输入框
            try {
                await vscode.commands.executeCommand("workbench.action.chat.focusInput");
                this.logger.debug("✅ 成功聚焦到聊天输入框");
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            catch (error) {
                this.logger.warn("⚠️ 聚焦命令失败，继续执行");
            }
            // 使用优化的系统级方法发送消息
            let messageSent = false;
            if (this.platform === "darwin") {
                // macOS: 使用优化的 AppleScript（不激活应用，避免登录问题）
                this.logger.debug("🎯 使用优化的 AppleScript 方法发送消息");
                try {
                    const { exec } = __webpack_require__(48);
                    const { promisify } = __webpack_require__(14);
                    const execAsync = promisify(exec);
                    // 优化的 AppleScript - 不强制激活应用，避免会话重置
                    const appleScript = `
            tell application "System Events"
              -- 检查 Cursor 是否已经在运行，不强制激活
              if (exists (processes whose name is "Cursor")) then
                -- 直接操作当前活动窗口，不切换应用
                delay 0.3
                
                -- 清空当前输入内容（温和方式）
                key code 0 using {command down} -- Cmd+A 全选
                delay 0.1
                key code 51 -- Delete 键删除内容
                delay 0.1
                
                -- 粘贴消息内容
                key code 9 using {command down} -- Cmd+V 粘贴
                delay 0.3
                
                -- 发送消息：按 Enter 键
                key code 36 -- Enter 键
                delay 0.2
                
              else
                error "Cursor 应用未运行"
              end if
            end tell
          `;
                    this.logger.debug("执行优化的 AppleScript 键盘模拟...");
                    await execAsync(`osascript -e '${appleScript}'`);
                    this.logger.debug("✅ AppleScript 执行完成");
                    messageSent = true;
                }
                catch (error) {
                    this.logger.error("❌ AppleScript 执行失败:", error);
                    // 如果 AppleScript 失败，回退到 VS Code 命令方法
                    messageSent = await this.fallbackSendMethod(message);
                }
            }
            else if (this.platform === "win32") {
                // Windows: 使用 PowerShell 进行键盘模拟
                this.logger.debug("🎯 使用 PowerShell 方法发送消息（Windows）");
                try {
                    const { exec } = __webpack_require__(48);
                    const { promisify } = __webpack_require__(14);
                    const execAsync = promisify(exec);
                    // PowerShell 脚本进行键盘模拟
                    const powershellScript = `
            Add-Type -AssemblyName System.Windows.Forms
            
            # 等待一下确保焦点正确
            Start-Sleep -Milliseconds 300
            
            # 全选当前内容
            [System.Windows.Forms.SendKeys]::SendWait("^a")
            Start-Sleep -Milliseconds 100
            
            # 删除内容
            [System.Windows.Forms.SendKeys]::SendWait("{DELETE}")
            Start-Sleep -Milliseconds 100
            
            # 粘贴消息
            [System.Windows.Forms.SendKeys]::SendWait("^v")
            Start-Sleep -Milliseconds 300
            
            # 发送消息（Enter 键）
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
            Start-Sleep -Milliseconds 200
          `;
                    this.logger.debug("执行 PowerShell 键盘模拟...");
                    await execAsync(`powershell -Command "${powershellScript.replace(/"/g, '\\"')}"`, {
                        windowsHide: true,
                    });
                    this.logger.debug("✅ PowerShell 执行完成");
                    messageSent = true;
                }
                catch (error) {
                    this.logger.error("❌ PowerShell 执行失败:", error);
                    // 如果 PowerShell 失败，回退到 VS Code 命令方法
                    messageSent = await this.fallbackSendMethod(message);
                }
            }
            else {
                // Linux: 使用 xdotool 或回退方法
                this.logger.debug("🎯 使用 Linux 方法发送消息");
                try {
                    const { exec } = __webpack_require__(48);
                    const { promisify } = __webpack_require__(14);
                    const execAsync = promisify(exec);
                    // 尝试使用 xdotool
                    try {
                        await execAsync("which xdotool", { timeout: 1000 });
                        const xdotoolCommands = [
                            "sleep 0.3",
                            "xdotool key ctrl+a", // 全选
                            "sleep 0.1",
                            "xdotool key Delete", // 删除
                            "sleep 0.1",
                            "xdotool key ctrl+v", // 粘贴
                            "sleep 0.3",
                            "xdotool key Return", // 回车发送
                            "sleep 0.2",
                        ].join(" && ");
                        this.logger.debug("执行 xdotool 键盘模拟...");
                        await execAsync(xdotoolCommands);
                        this.logger.debug("✅ xdotool 执行完成");
                        messageSent = true;
                    }
                    catch (xdotoolError) {
                        this.logger.warn("⚠️ xdotool 不可用，使用回退方法");
                        messageSent = await this.fallbackSendMethod(message);
                    }
                }
                catch (error) {
                    this.logger.error("❌ Linux 方法执行失败:", error);
                    messageSent = await this.fallbackSendMethod(message);
                }
            }
            // 等待发送完成
            await new Promise((resolve) => setTimeout(resolve, 800));
            // 验证发送结果
            if (messageSent) {
                vscode.window.showInformationMessage(`✅ 消息已发送到 Cursor Chat: "${message}"`);
                this.logger.debug("🎉 Cursor Chat 操作完成，消息发送成功");
                return true;
            }
            else {
                vscode.window.showWarningMessage(`⚠️ 自动发送失败，消息已复制到剪贴板，请手动粘贴并发送。消息内容: "${message}"`);
                this.logger.debug("⚠️ 自动发送失败，需要手动操作");
                return false;
            }
        }
        catch (error) {
            this.logger.error("❌ 打开 Cursor Chat 时发生错误:", error);
            vscode.window.showErrorMessage(`❌ 打开 Cursor Chat 失败: ${error}`);
            return false;
        }
    }
    /**
     * 回退发送方法 - 使用 VS Code 命令
     */
    async fallbackSendMethod(message) {
        this.logger.debug("🔄 使用回退方法发送消息");
        try {
            // 尝试粘贴消息
            await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
            await new Promise((resolve) => setTimeout(resolve, 500));
            this.logger.debug("✅ 回退方法: 消息粘贴完成");
            // 多次尝试 Enter 键
            for (let i = 0; i < 2; i++) {
                try {
                    await vscode.commands.executeCommand("type", { text: "\n" });
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    this.logger.debug(`✅ 回退方法: Enter 键尝试 ${i + 1} 完成`);
                }
                catch (error) {
                    this.logger.debug(`⚠️ 回退方法: Enter 键尝试 ${i + 1} 失败:`, error);
                }
            }
            this.logger.debug("✅ 回退方法执行完成");
            return true;
        }
        catch (error) {
            this.logger.error("❌ 回退方法也失败:", error);
            return false;
        }
    }
    /**
     * 获取 MCP 服务器列表
     */
    async getMcpServers() {
        try {
            // 确保配置路径是最新的
            this.detectConfigPaths();
            const mcpPath = this.configPaths.mcpPath;
            console.log("获取 MCP 服务器 - 使用路径:", mcpPath);
            if (!mcpPath) {
                console.log("MCP 配置路径未找到");
                return {};
            }
            // 如果配置文件不存在，创建一个空的配置文件
            if (!fs.existsSync(mcpPath)) {
                console.log("MCP 配置文件不存在，创建空配置:", mcpPath);
                try {
                    // 确保目录存在
                    const mcpDir = path.dirname(mcpPath);
                    if (!fs.existsSync(mcpDir)) {
                        fs.mkdirSync(mcpDir, { recursive: true });
                    }
                    // 创建空的MCP配置
                    const emptyConfig = { mcpServers: {} };
                    fs.writeFileSync(mcpPath, JSON.stringify(emptyConfig, null, 2), "utf8");
                    console.log("已创建空的 MCP 配置文件");
                }
                catch (createError) {
                    console.error("创建 MCP 配置文件失败:", createError);
                }
                return {};
            }
            const content = fs.readFileSync(mcpPath, "utf8");
            let config;
            try {
                config = JSON.parse(content);
            }
            catch (parseError) {
                console.error("MCP 配置文件 JSON 解析失败:", parseError);
                return {};
            }
            console.log("MCP 配置内容:", config);
            // 处理不同的配置文件格式
            let mcpServers = {};
            // 格式1: 直接的 mcpServers 对象
            if (config.mcpServers && typeof config.mcpServers === "object") {
                mcpServers = config.mcpServers;
            }
            // 格式2: 嵌套在其他结构中
            else if (config.mcp && config.mcp.mcpServers) {
                mcpServers = config.mcp.mcpServers;
            }
            // 格式3: 可能是 Cursor settings.json 格式
            else if (config["mcp.mcpServers"]) {
                mcpServers = config["mcp.mcpServers"];
            }
            // 格式4: 直接就是服务器配置对象
            else if (typeof config === "object" && !Array.isArray(config)) {
                // 检查是否所有键都像是服务器配置
                const isServerConfig = Object.values(config).every((value) => value && typeof value === "object" && "command" in value);
                if (isServerConfig) {
                    mcpServers = config;
                }
            }
            // 过滤掉无效的配置项
            const validServers = {};
            for (const [name, serverConfig] of Object.entries(mcpServers)) {
                // 跳过空键名或无效配置
                if (!name ||
                    name.trim() === "" ||
                    !serverConfig ||
                    typeof serverConfig !== "object") {
                    console.log("跳过无效的 MCP 服务器配置:", { name, serverConfig });
                    continue;
                }
                // 确保配置有必需的字段
                if (!serverConfig.command) {
                    console.log("跳过缺少 command 字段的 MCP 服务器:", name);
                    continue;
                }
                // 标准化配置格式
                validServers[name] = {
                    ...serverConfig, // 先展开原配置
                    command: serverConfig.command, // 确保command字段存在
                    args: serverConfig.args || [],
                    env: serverConfig.env || {},
                };
            }
            console.log("有效的 MCP 服务器配置:", validServers);
            return validServers;
        }
        catch (error) {
            console.error("Error reading MCP configuration:", error);
            return {};
        }
    }
    /**
     * 添加 MCP 服务器
     */
    async addMcpServer(name, config) {
        try {
            const settings = await this.getCursorSettings();
            if (!settings.mcpConfig) {
                settings.mcpConfig = { mcpServers: {} };
            }
            if (!settings.mcpConfig.mcpServers) {
                settings.mcpConfig.mcpServers = {};
            }
            settings.mcpConfig.mcpServers[name] = config;
            return await this.updateCursorSettings({ mcpConfig: settings.mcpConfig });
        }
        catch (error) {
            console.error("添加 MCP 服务器失败:", error);
            throw error;
        }
    }
    /**
     * 删除 MCP 服务器
     */
    async removeMcpServer(name) {
        try {
            const settings = await this.getCursorSettings();
            if (settings.mcpConfig?.mcpServers?.[name]) {
                delete settings.mcpConfig.mcpServers[name];
                if (this.configPaths.mcpPath) {
                    const mcpDir = path.dirname(this.configPaths.mcpPath);
                    if (!fs.existsSync(mcpDir)) {
                        fs.mkdirSync(mcpDir, { recursive: true });
                    }
                    fs.writeFileSync(this.configPaths.mcpPath, JSON.stringify(settings.mcpConfig, null, 2), "utf-8");
                }
                console.log(`MCP 服务器 ${name} 已删除`);
                return true;
            }
            else {
                console.log(`MCP 服务器 ${name} 不存在`);
                return true;
            }
        }
        catch (error) {
            console.error("删除 MCP 服务器失败:", error);
            throw error;
        }
    }
    /**
     * 获取用户规则
     */
    async getUserRules() {
        try {
            const rulesPath = this.findRulesPath();
            if (!rulesPath || !fs.existsSync(rulesPath)) {
                console.log("Rules file not found:", rulesPath);
                return "";
            }
            const content = fs.readFileSync(rulesPath, "utf8");
            console.log("读取到的规则内容:", content);
            return content;
        }
        catch (error) {
            console.error("Error reading user rules:", error);
            return "";
        }
    }
    /**
     * 更新用户规则
     */
    async updateUserRules(rules) {
        try {
            const rulesPath = this.findRulesPath();
            if (!rulesPath) {
                console.error("Rules path not found");
                return false;
            }
            // 确保目录存在
            const rulesDir = path.dirname(rulesPath);
            if (!fs.existsSync(rulesDir)) {
                fs.mkdirSync(rulesDir, { recursive: true });
            }
            // 保存为纯文本格式
            fs.writeFileSync(rulesPath, rules, "utf8");
            console.log("规则已保存到:", rulesPath);
            return true;
        }
        catch (error) {
            console.error("Error updating user rules:", error);
            return false;
        }
    }
    /**
     * 获取 Cursor 用户信息 - 改进版本，从 SQLite 数据库读取
     */
    async getCursorUserInfo() {
        try {
            console.log("=== 开始获取 Cursor 用户信息 ===");
            // 重新检测配置路径
            this.detectConfigPaths();
            // 构建 SQLite 数据库路径
            let dbPath;
            if (this.platform === "darwin") {
                dbPath = path.join(os.homedir(), "Library/Application Support/Cursor/User/globalStorage/state.vscdb");
            }
            else if (this.platform === "win32") {
                dbPath = path.join(os.homedir(), "AppData/Roaming/Cursor/User/globalStorage/state.vscdb");
            }
            else {
                // Linux
                dbPath = path.join(os.homedir(), ".config/Cursor/User/globalStorage/state.vscdb");
            }
            console.log("SQLite 数据库路径:", dbPath);
            // 检查数据库文件是否存在
            if (!fs.existsSync(dbPath)) {
                console.log("❌ Cursor SQLite 数据库不存在");
                return { isLoggedIn: false };
            }
            console.log("✅ 找到 Cursor SQLite 数据库");
            // 使用 sqlite3 命令行工具读取数据库
            const { exec } = __webpack_require__(48);
            const { promisify } = __webpack_require__(14);
            const execAsync = promisify(exec);
            try {
                // 查询用户认证信息
                const query = `
          SELECT key, value 
          FROM ItemTable 
          WHERE key LIKE 'cursorAuth/%'
        `;
                const { stdout } = await execAsync(`sqlite3 "${dbPath}" "${query}"`, {
                    encoding: "utf8",
                });
                console.log("数据库查询结果:", stdout);
                // 解析查询结果
                const lines = stdout.trim().split("\n");
                const authData = {};
                for (const line of lines) {
                    if (line.includes("|")) {
                        const [key, value] = line.split("|", 2);
                        if (key && value) {
                            authData[key] = value;
                        }
                    }
                }
                console.log("解析的认证数据:", authData);
                // 提取用户信息
                const email = authData["cursorAuth/cachedEmail"];
                const membershipType = authData["cursorAuth/stripeMembershipType"];
                const accessToken = authData["cursorAuth/accessToken"];
                const refreshToken = authData["cursorAuth/refreshToken"];
                // 检查是否有有效的认证信息
                const isLoggedIn = !!(email && (accessToken || refreshToken));
                console.log("=== 最终检测结果 ===");
                console.log("邮箱:", email || "未找到");
                console.log("会员类型:", membershipType || "未找到");
                console.log("登录状态:", isLoggedIn);
                return {
                    isLoggedIn,
                    email,
                    username: email ? email.split("@")[0] : undefined, // 从邮箱提取用户名
                    cursorUserId: email, // 暂时使用邮箱作为用户ID
                    avatar: "", // 暂时为空
                    membershipType,
                    token: accessToken, // 使用访问令牌
                };
            }
            catch (dbError) {
                console.error("❌ 数据库查询失败:", dbError);
                // 如果 SQLite 查询失败，尝试备用方法：直接读取 settings.json
                console.log("=== 尝试备用方法：读取 settings.json ===");
                return await this.getCursorUserInfoFromSettings();
            }
        }
        catch (error) {
            console.error("❌ 获取 Cursor 用户信息失败:", error);
            return { isLoggedIn: false };
        }
    }
    /**
     * 从 settings.json 文件获取用户信息的备用方法
     */
    async getCursorUserInfoFromSettings() {
        try {
            console.log("使用备用方法从 settings.json 读取用户信息");
            // 检查 Cursor 设置文件是否存在
            if (!this.configPaths.settingsPath ||
                !fs.existsSync(this.configPaths.settingsPath)) {
                console.log("❌ Cursor 设置文件不存在");
                return { isLoggedIn: false };
            }
            console.log("✅ 找到 Cursor 设置文件");
            // 读取设置文件
            const settingsContent = fs.readFileSync(this.configPaths.settingsPath, "utf-8");
            console.log("设置文件内容长度:", settingsContent.length);
            const settings = JSON.parse(settingsContent);
            // 定义所有可能包含用户信息的字段
            const emailFields = [
                "cursor.account.email",
                "account.email",
                "cursor.pro.email",
                "cursor.subscription.email",
                "cursor.session.email",
                "cursor.login.email",
                "cursor.user.email",
                "user.email",
                "email",
                "userEmail",
                "loginEmail",
                "accountEmail",
            ];
            const nameFields = [
                "cursor.account.name",
                "account.name",
                "cursor.pro.name",
                "cursor.subscription.name",
                "cursor.session.name",
                "cursor.login.name",
                "cursor.user.name",
                "user.name",
                "name",
                "userName",
                "loginName",
                "accountName",
                "displayName",
            ];
            let email;
            let name;
            // 1. 直接字段搜索
            for (const field of emailFields) {
                if (settings[field] && typeof settings[field] === "string") {
                    console.log(`✅ 在字段 '${field}' 找到邮箱:`, settings[field]);
                    email = settings[field];
                    break;
                }
            }
            for (const field of nameFields) {
                if (settings[field] && typeof settings[field] === "string") {
                    console.log(`✅ 在字段 '${field}' 找到用户名:`, settings[field]);
                    name = settings[field];
                    break;
                }
            }
            // 2. 深度搜索 - 查找任何包含 @ 符号的字段（可能是邮箱）
            if (!email) {
                console.log("=== 开始深度搜索邮箱 ===");
                const deepSearch = (obj, path = "") => {
                    for (const [key, value] of Object.entries(obj)) {
                        const currentPath = path ? `${path}.${key}` : key;
                        if (typeof value === "string" &&
                            value.includes("@") &&
                            value.includes(".")) {
                            console.log(`✅ 深度搜索在 '${currentPath}' 找到可能的邮箱:`, value);
                            return value;
                        }
                        else if (typeof value === "object" &&
                            value !== null &&
                            !Array.isArray(value)) {
                            const result = deepSearch(value, currentPath);
                            if (result)
                                return result;
                        }
                    }
                    return undefined;
                };
                email = deepSearch(settings);
            }
            console.log("=== 备用方法检测结果 ===");
            console.log("邮箱:", email || "未找到");
            console.log("用户名:", name || "未找到");
            console.log("登录状态:", !!email);
            return {
                isLoggedIn: !!email,
                email,
                username: name,
                cursorUserId: email,
                avatar: "",
                membershipType: "",
                token: "",
            };
        }
        catch (error) {
            console.error("❌ 备用方法获取用户信息失败:", error);
            return { isLoggedIn: false };
        }
    }
    /**
     * 检查 Cursor 是否已登录
     */
    async isCursorLoggedIn() {
        const userInfo = await this.getCursorUserInfo();
        return userInfo.isLoggedIn;
    }
    /**
     * 获取系统信息
     */
    getSystemInfo() {
        return {
            platform: this.platform,
            version: process.version,
            isLoggedIn: false,
            cursorPath: this.configPaths.customInstallPath ||
                this.configPaths.cliPath ||
                "未找到",
            configPath: this.configPaths.settingsPath || "未找到",
            mcpPath: this.configPaths.mcpPath || "未找到",
            rulesPath: this.configPaths.rulesPath || "未找到",
            cliPath: this.configPaths.cliPath || "未找到",
        };
    }
    /**
     * 获取 MCP 配置 JSON 格式
     * 注意：此方法应该通过 webview 任务处理器调用，不直接在这里实现API调用
     */
    async getMcpConfigJson() {
        try {
            // 直接返回本地配置，API调用应该在webview任务处理器中进行
            const mcpServers = await this.getMcpServers();
            return { mcpConfig: mcpServers };
        }
        catch (error) {
            console.error("获取 MCP 配置 JSON 失败:", error);
            // 返回空配置而不是抛出错误
            return { mcpConfig: {} };
        }
    }
    /**
     * 批量更新 MCP 配置
     * 注意：此方法应该通过 webview 任务处理器调用，不直接在这里实现API调用
     */
    async batchUpdateMcpConfig(mcpConfig) {
        try {
            const mcpPath = this.configPaths.mcpPath;
            if (!mcpPath) {
                throw new Error("未找到 MCP 配置文件路径");
            }
            // 读取现有配置
            let existingConfig = {};
            if (fs.existsSync(mcpPath)) {
                const configContent = fs.readFileSync(mcpPath, "utf8");
                existingConfig = JSON.parse(configContent);
            }
            // 更新配置
            const updatedConfig = {
                ...existingConfig,
                mcpServers: mcpConfig,
            };
            // 写入文件
            fs.writeFileSync(mcpPath, JSON.stringify(updatedConfig, null, 2), "utf8");
            const count = Object.keys(mcpConfig).length;
            console.log(`成功批量更新 ${count} 个 MCP 配置`);
            return { count };
        }
        catch (error) {
            console.error("批量更新 MCP 配置失败:", error);
            throw new Error("批量更新 MCP 配置失败");
        }
    }
    /**
     * 分享 MCP 配置
     * 注意：此方法仅用于webview任务处理器，实际API调用在任务处理器中进行
     */
    async shareMcpConfig(title, description, mcpConfig) {
        // 这个方法不应该直接调用，应该通过webview任务处理器
        throw new Error("此方法应该通过webview任务处理器调用");
    }
    /**
     * 通过分享ID获取 MCP 配置
     * 注意：此方法仅用于webview任务处理器，实际API调用在任务处理器中进行
     */
    async getMcpConfigByShareId(shareId) {
        // 这个方法不应该直接调用，应该通过webview任务处理器
        throw new Error("此方法应该通过webview任务处理器调用");
    }
    /**
     * 通过分享ID添加 MCP 配置
     * 注意：此方法仅用于webview任务处理器，实际API调用在任务处理器中进行
     */
    async addMcpByShareId(shareId) {
        // 这个方法不应该直接调用，应该通过webview任务处理器
        throw new Error("此方法应该通过webview任务处理器调用");
    }
}
exports.CursorIntegration = CursorIntegration;
const registerCursorIntegration = (context) => {
    const { commands } = __webpack_require__(2);
    const { showWebView } = __webpack_require__(44);
    // 创建 CursorIntegration 实例
    const cursorIntegration = new CursorIntegration();
    context.subscriptions.push(commands.registerCommand("DiFlow.getCursorSettings", async () => {
        showWebView(context, {
            key: "main",
            title: "Cursor 管理",
            viewColumn: 1,
            task: { task: "route", data: { path: "/cursor" } },
        });
    }), 
    // 添加 openCursorChat 命令注册
    commands.registerCommand("DiFlow.openCursorChat", async (message) => {
        try {
            // 如果没有提供消息，提示用户输入
            let chatMessage = message;
            if (!chatMessage) {
                const vscode = __webpack_require__(2);
                chatMessage = await vscode.window.showInputBox({
                    prompt: "请输入要发送到 Cursor Chat 的消息",
                    placeHolder: "输入您的消息...",
                });
                if (!chatMessage) {
                    vscode.window.showInformationMessage("已取消发送消息");
                    return;
                }
            }
            console.log("发送消息到 Cursor Chat...", { message: chatMessage });
            // 默认启用自动发送功能
            const result = await cursorIntegration.openCursorChat(chatMessage);
            console.log("发送消息到 Cursor Chat 结果:", result);
            if (result) {
                const vscode = __webpack_require__(2);
                vscode.window.showInformationMessage("Cursor Chat 操作已完成");
            }
            else {
                const vscode = __webpack_require__(2);
                vscode.window.showWarningMessage("无法完成 Cursor Chat 操作，请确保在 Cursor 环境中运行");
            }
        }
        catch (error) {
            const vscode = __webpack_require__(2);
            vscode.window.showErrorMessage(`Cursor Chat 操作失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }));
};
exports.registerCursorIntegration = registerCursorIntegration;
const registerCursorManagement = (context) => {
    const { commands } = __webpack_require__(2);
    const { showWebView } = __webpack_require__(44);
    context.subscriptions.push(commands.registerCommand("DiFlow.cursorManagement", async () => {
        showWebView(context, {
            key: "cursor",
            title: "Cursor 管理",
            viewColumn: 1,
            task: { task: "route", data: { path: "/cursor" } },
        });
    }));
};
exports.registerCursorManagement = registerCursorManagement;


/***/ }),
/* 47 */
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),
/* 48 */
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),
/* 49 */
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),
/* 50 */
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),
/* 51 */
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerCreateSetting = void 0;
const vscode_1 = __webpack_require__(2);
const registerCreateSetting = (context) => {
    context.subscriptions.push(vscode_1.commands.registerCommand("DiFlow.openSetting", () => {
        // 打开插件设置
        vscode_1.commands.executeCommand("workbench.action.openSettings", "DiFlow");
    }));
};
exports.registerCreateSetting = registerCreateSetting;


/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerCreateChatGPTView = void 0;
const vscode_1 = __webpack_require__(2);
const webviewUtils_1 = __webpack_require__(44);
// 创建一个 webview 视图
let webviewViewProvider;
// 实现 Webview 视图提供者接口，以下内容都是 chatGPT 提供
class MyWebviewViewProvider {
    constructor(context) {
        this.context = context;
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        this.webview = webviewView.webview;
        // 设置 enableScripts 选项为 true
        webviewView.webview.options = {
            enableScripts: true,
        };
        // 设置 Webview 的内容
        webviewView.webview.html = (0, webviewUtils_1.getHtmlForWebview)(this.context, webviewView.webview);
        webviewView.webview.onDidReceiveMessage((message) => {
            // 监听webview反馈回来加载完成，初始化主动推送消息
            if (message.cmd === "webviewLoaded") {
                console.log("反馈消息:", message);
            }
        });
    }
    // 销毁
    removeWebView() {
        this.webview = undefined;
    }
}
const openChatGPTView = (selectedText) => {
    // 唤醒 chatGPT 视图
    vscode_1.commands.executeCommand("workbench.view.extension.DiFlow").then(() => {
        vscode_1.commands
            .executeCommand("setContext", "DiFlow.chatGPTView", true)
            .then(() => {
            const config = vscode_1.workspace.getConfiguration("DiFlow");
            const hostname = config.get("hostname");
            const apiKey = config.get("apiKey");
            const model = config.get("model");
            setTimeout(() => {
                // 发送任务,并传递参数
                if (!webviewViewProvider || !webviewViewProvider?.webview) {
                    return;
                }
                webviewViewProvider.webview.postMessage({
                    cmd: "vscodePushTask",
                    task: "route",
                    data: {
                        path: "/chat-gpt-view",
                        query: {
                            hostname,
                            apiKey,
                            selectedText,
                            model,
                        },
                    },
                });
            }, 500);
        });
    });
};
const registerCreateChatGPTView = (context) => {
    // 注册 webview 视图
    webviewViewProvider = new MyWebviewViewProvider(context);
    context.subscriptions.push(vscode_1.window.registerWebviewViewProvider("DiFlow.chatGPTView", webviewViewProvider, {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
    }));
    context.subscriptions.push(
    // 添加打开视图
    vscode_1.commands.registerCommand("DiFlow.openChatGPTView", () => {
        openChatGPTView();
    }), 
    // 添加关闭视图
    vscode_1.commands.registerCommand("DiFlow.hideChatGPTView", () => {
        vscode_1.commands
            .executeCommand("setContext", "DiFlow.chatGPTView", false)
            .then(() => {
            webviewViewProvider?.removeWebView();
        });
    }), 
    // 添加解释这段文案
    vscode_1.commands.registerCommand("DiFlow.explainByChatGPT", () => {
        // 获取当前活动的文本编辑器
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            // 获取用户选中的文本
            const selectedText = editor.document.getText(editor.selection);
            if (!selectedText) {
                vscode_1.window.showInformationMessage("没有选中的文本");
                return;
            }
            // 获取本插件的设置
            const config = vscode_1.workspace.getConfiguration("DiFlow");
            const hostname = config.get("hostname");
            const apiKey = config.get("apiKey");
            if (!hostname) {
                vscode_1.window.showInformationMessage("请先设置插件 DiFlow 的 hostname，点击左侧标签栏 DiFlow 的图标进行设置");
                return;
            }
            if (!apiKey) {
                vscode_1.window.showInformationMessage("请先设置插件 DiFlow 的 apiKey，点击左侧标签栏 DiFlow 的图标进行设置");
                return;
            }
            // 打开左侧的 chatGPT 对话框,并传入问题
            openChatGPTView(selectedText);
        }
        else {
            vscode_1.window.showInformationMessage("没有活动的文本编辑器");
        }
    }));
};
exports.registerCreateChatGPTView = registerCreateChatGPTView;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const createScript_1 = __webpack_require__(1);
const createSnippets_1 = __webpack_require__(43);
const createSetting_1 = __webpack_require__(52);
const createChatGPTView_1 = __webpack_require__(53);
const cursorIntegration_1 = __webpack_require__(46);
function activate(context) {
    // 注册各种命令
    (0, createScript_1.registerCreateScript)(context);
    (0, createSnippets_1.registerCreateSnippets)(context);
    (0, createSetting_1.registerCreateSetting)(context);
    (0, createChatGPTView_1.registerCreateChatGPTView)(context);
    // 注册 Cursor 集成
    (0, cursorIntegration_1.registerCursorIntegration)(context);
    (0, cursorIntegration_1.registerCursorManagement)(context);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map