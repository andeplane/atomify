"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_contents_lib_drivefs_js"],{

/***/ 39694:
/*!*******************************************!*\
  !*** ../packages/contents/lib/drivefs.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ContentsAPI": () => (/* binding */ ContentsAPI),
/* harmony export */   "DIR_MODE": () => (/* binding */ DIR_MODE),
/* harmony export */   "DRIVE_SEPARATOR": () => (/* binding */ DRIVE_SEPARATOR),
/* harmony export */   "DriveFS": () => (/* binding */ DriveFS),
/* harmony export */   "DriveFSEmscriptenNodeOps": () => (/* binding */ DriveFSEmscriptenNodeOps),
/* harmony export */   "DriveFSEmscriptenStreamOps": () => (/* binding */ DriveFSEmscriptenStreamOps),
/* harmony export */   "FILE_MODE": () => (/* binding */ FILE_MODE),
/* harmony export */   "SEEK_CUR": () => (/* binding */ SEEK_CUR),
/* harmony export */   "SEEK_END": () => (/* binding */ SEEK_END)
/* harmony export */ });
// Types and implementation inspired from https://github.com/jvilk/BrowserFS
// LICENSE: https://github.com/jvilk/BrowserFS/blob/8977a704ea469d05daf857e4818bef1f4f498326/LICENSE
// And from https://github.com/gzuidhof/starboard-notebook
// LICENSE: https://github.com/gzuidhof/starboard-notebook/blob/cd8d3fc30af4bd29cdd8f6b8c207df8138f5d5dd/LICENSE
const DIR_MODE = 16895; // 040777
const FILE_MODE = 33206; // 100666
const SEEK_CUR = 1;
const SEEK_END = 2;
const DRIVE_SEPARATOR = ':';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');
// Mapping flag -> do we need to overwrite the file upon closing it
const flagNeedsWrite = {
    0 /*O_RDONLY*/: false,
    1 /*O_WRONLY*/: true,
    2 /*O_RDWR*/: true,
    64 /*O_CREAT*/: true,
    65 /*O_WRONLY|O_CREAT*/: true,
    66 /*O_RDWR|O_CREAT*/: true,
    129 /*O_WRONLY|O_EXCL*/: true,
    193 /*O_WRONLY|O_CREAT|O_EXCL*/: true,
    514 /*O_RDWR|O_TRUNC*/: true,
    577 /*O_WRONLY|O_CREAT|O_TRUNC*/: true,
    578 /*O_CREAT|O_RDWR|O_TRUNC*/: true,
    705 /*O_WRONLY|O_CREAT|O_EXCL|O_TRUNC*/: true,
    706 /*O_RDWR|O_CREAT|O_EXCL|O_TRUNC*/: true,
    1024 /*O_APPEND*/: true,
    1025 /*O_WRONLY|O_APPEND*/: true,
    1026 /*O_RDWR|O_APPEND*/: true,
    1089 /*O_WRONLY|O_CREAT|O_APPEND*/: true,
    1090 /*O_RDWR|O_CREAT|O_APPEND*/: true,
    1153 /*O_WRONLY|O_EXCL|O_APPEND*/: true,
    1154 /*O_RDWR|O_EXCL|O_APPEND*/: true,
    1217 /*O_WRONLY|O_CREAT|O_EXCL|O_APPEND*/: true,
    1218 /*O_RDWR|O_CREAT|O_EXCL|O_APPEND*/: true,
    4096 /*O_RDONLY|O_DSYNC*/: true,
    4098 /*O_RDWR|O_DSYNC*/: true,
};
class DriveFSEmscriptenStreamOps {
    constructor(fs) {
        this.fs = fs;
    }
    open(stream) {
        const path = this.fs.realPath(stream.node);
        if (this.fs.FS.isFile(stream.node.mode)) {
            stream.file = this.fs.API.get(path);
        }
    }
    close(stream) {
        if (!this.fs.FS.isFile(stream.node.mode) || !stream.file) {
            return;
        }
        const path = this.fs.realPath(stream.node);
        const flags = stream.flags;
        let parsedFlags = typeof flags === 'string' ? parseInt(flags, 10) : flags;
        parsedFlags &= 0x1fff;
        let needsWrite = true;
        if (parsedFlags in flagNeedsWrite) {
            needsWrite = flagNeedsWrite[parsedFlags];
        }
        if (needsWrite) {
            this.fs.API.put(path, stream.file);
            stream.file = undefined;
        }
    }
    read(stream, buffer, offset, length, position) {
        var _a;
        if (length <= 0 || stream.file === undefined) {
            return 0;
        }
        const size = Math.min(((_a = stream.file.data.length) !== null && _a !== void 0 ? _a : 0) - position, length);
        try {
            buffer.set(stream.file.data.subarray(position, position + size), offset);
        }
        catch (e) {
            throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
        }
        return size;
    }
    write(stream, buffer, offset, length, position) {
        var _a, _b;
        if (length <= 0 || stream.file === undefined) {
            return 0;
        }
        stream.node.timestamp = Date.now();
        try {
            if (position + length > ((_b = (_a = stream.file) === null || _a === void 0 ? void 0 : _a.data.length) !== null && _b !== void 0 ? _b : 0)) {
                const oldData = stream.file.data ? stream.file.data : new Uint8Array();
                stream.file.data = new Uint8Array(position + length);
                stream.file.data.set(oldData);
            }
            stream.file.data.set(buffer.subarray(offset, offset + length), position);
            return length;
        }
        catch (e) {
            throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
        }
    }
    llseek(stream, offset, whence) {
        let position = offset;
        if (whence === SEEK_CUR) {
            position += stream.position;
        }
        else if (whence === SEEK_END) {
            if (this.fs.FS.isFile(stream.node.mode)) {
                if (stream.file !== undefined) {
                    position += stream.file.data.length;
                }
                else {
                    throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
                }
            }
        }
        if (position < 0) {
            throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EINVAL']);
        }
        return position;
    }
}
class DriveFSEmscriptenNodeOps {
    constructor(fs) {
        this.fs = fs;
    }
    getattr(node) {
        return {
            ...this.fs.API.getattr(this.fs.realPath(node)),
            mode: node.mode,
            ino: node.id,
        };
    }
    setattr(node, attr) {
        // TODO
    }
    lookup(parent, name) {
        const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
        const result = this.fs.API.lookup(path);
        if (!result.ok) {
            throw this.fs.FS.genericErrors[this.fs.ERRNO_CODES['ENOENT']];
        }
        return this.fs.createNode(parent, name, result.mode);
    }
    mknod(parent, name, mode, dev) {
        const path = this.fs.PATH.join2(this.fs.realPath(parent), name);
        this.fs.API.mknod(path, mode);
        return this.fs.createNode(parent, name, mode, dev);
    }
    rename(oldNode, newDir, newName) {
        this.fs.API.rename(oldNode.parent
            ? this.fs.PATH.join2(this.fs.realPath(oldNode.parent), oldNode.name)
            : oldNode.name, this.fs.PATH.join2(this.fs.realPath(newDir), newName));
        // Updating the in-memory node
        oldNode.name = newName;
        oldNode.parent = newDir;
    }
    unlink(parent, name) {
        this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
    }
    rmdir(parent, name) {
        this.fs.API.rmdir(this.fs.PATH.join2(this.fs.realPath(parent), name));
    }
    readdir(node) {
        return this.fs.API.readdir(this.fs.realPath(node));
    }
    symlink(parent, newName, oldPath) {
        throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
    }
    readlink(node) {
        throw new this.fs.FS.ErrnoError(this.fs.ERRNO_CODES['EPERM']);
    }
}
/**
 * Wrap ServiceWorker requests for an Emscripten-compatible synchronous API.
 */
class ContentsAPI {
    constructor(baseUrl, driveName, mountpoint, FS, ERRNO_CODES) {
        this._baseUrl = baseUrl;
        this._driveName = driveName;
        this._mountpoint = mountpoint;
        this.FS = FS;
        this.ERRNO_CODES = ERRNO_CODES;
    }
    request(data) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', encodeURI(this.endpoint), false);
        try {
            xhr.send(JSON.stringify(data));
        }
        catch (e) {
            console.error(e);
        }
        if (xhr.status >= 400) {
            throw new this.FS.ErrnoError(this.ERRNO_CODES['EINVAL']);
        }
        return JSON.parse(xhr.responseText);
    }
    lookup(path) {
        return this.request({ method: 'lookup', path: this.normalizePath(path) });
    }
    getmode(path) {
        return Number.parseInt(this.request({ method: 'getmode', path: this.normalizePath(path) }));
    }
    mknod(path, mode) {
        return this.request({
            method: 'mknod',
            path: this.normalizePath(path),
            data: { mode },
        });
    }
    rename(oldPath, newPath) {
        return this.request({
            method: 'rename',
            path: this.normalizePath(oldPath),
            data: { newPath: this.normalizePath(newPath) },
        });
    }
    readdir(path) {
        const dirlist = this.request({
            method: 'readdir',
            path: this.normalizePath(path),
        });
        dirlist.push('.');
        dirlist.push('..');
        return dirlist;
    }
    rmdir(path) {
        return this.request({ method: 'rmdir', path: this.normalizePath(path) });
    }
    get(path) {
        const response = this.request({ method: 'get', path: this.normalizePath(path) });
        const serializedContent = response.content;
        const format = response.format;
        switch (format) {
            case 'json':
            case 'text':
                return {
                    data: encoder.encode(serializedContent),
                    format,
                };
            case 'base64': {
                const binString = atob(serializedContent);
                const len = binString.length;
                const data = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    data[i] = binString.charCodeAt(i);
                }
                return {
                    data,
                    format,
                };
            }
            default:
                throw new this.FS.ErrnoError(this.ERRNO_CODES['ENOENT']);
        }
    }
    put(path, value) {
        switch (value.format) {
            case 'json':
            case 'text':
                return this.request({
                    method: 'put',
                    path: this.normalizePath(path),
                    data: {
                        format: value.format,
                        data: decoder.decode(value.data),
                    },
                });
            case 'base64': {
                let binary = '';
                for (let i = 0; i < value.data.byteLength; i++) {
                    binary += String.fromCharCode(value.data[i]);
                }
                return this.request({
                    method: 'put',
                    path: this.normalizePath(path),
                    data: {
                        format: value.format,
                        data: btoa(binary),
                    },
                });
            }
        }
    }
    getattr(path) {
        const stats = this.request({
            method: 'getattr',
            path: this.normalizePath(path),
        });
        // Turn datetimes into proper objects
        stats.atime = new Date(stats.atime);
        stats.mtime = new Date(stats.mtime);
        stats.ctime = new Date(stats.ctime);
        // ensure a non-undefined size (0 isn't great, though)
        stats.size = stats.size || 0;
        return stats;
    }
    /**
     * Normalize a Path by making it compliant for the content manager
     *
     * @param path: the path relatively to the Emscripten drive
     */
    normalizePath(path) {
        // Remove mountpoint prefix
        if (path.startsWith(this._mountpoint)) {
            path = path.slice(this._mountpoint.length);
        }
        // Add JupyterLab drive name
        if (this._driveName) {
            path = `${this._driveName}${DRIVE_SEPARATOR}${path}`;
        }
        return path;
    }
    /**
     * Get the api/drive endpoint
     */
    get endpoint() {
        return `${this._baseUrl}api/drive`;
    }
}
class DriveFS {
    constructor(options) {
        this.FS = options.FS;
        this.PATH = options.PATH;
        this.ERRNO_CODES = options.ERRNO_CODES;
        this.API = new ContentsAPI(options.baseUrl, options.driveName, options.mountpoint, this.FS, this.ERRNO_CODES);
        this.driveName = options.driveName;
        this.node_ops = new DriveFSEmscriptenNodeOps(this);
        this.stream_ops = new DriveFSEmscriptenStreamOps(this);
    }
    mount(mount) {
        return this.createNode(null, mount.mountpoint, DIR_MODE | 511, 0);
    }
    createNode(parent, name, mode, dev) {
        const FS = this.FS;
        if (!FS.isDir(mode) && !FS.isFile(mode)) {
            throw new FS.ErrnoError(this.ERRNO_CODES['EINVAL']);
        }
        const node = FS.createNode(parent, name, mode, dev);
        node.node_ops = this.node_ops;
        node.stream_ops = this.stream_ops;
        return node;
    }
    getMode(path) {
        return this.API.getmode(path);
    }
    realPath(node) {
        const parts = [];
        let currentNode = node;
        parts.push(currentNode.name);
        while (currentNode.parent !== currentNode) {
            currentNode = currentNode.parent;
            parts.push(currentNode.name);
        }
        parts.reverse();
        return this.PATH.join.apply(null, parts);
    }
}


/***/ })

}]);
//# sourceMappingURL=packages_contents_lib_drivefs_js.615580b.js.map