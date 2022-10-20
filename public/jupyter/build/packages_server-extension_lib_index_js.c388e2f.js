"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_server-extension_lib_index_js"],{

/***/ 84599:
/*!********************************************!*\
  !*** ../packages/contents/lib/contents.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Contents": () => (/* binding */ Contents)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 79615);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tokens */ 38693);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_1__);




/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';
/**
 * The number of checkpoints to save.
 */
const N_CHECKPOINTS = 5;
/**
 * A class to handle requests to /api/contents
 */
class Contents {
    /**
     * Construct a new localForage-powered contents provider
     */
    constructor(options) {
        /**
         * A reducer for turning arbitrary binary into a string
         */
        this.reduceBytesToString = (data, byte) => {
            return data + String.fromCharCode(byte);
        };
        this._serverContents = new Map();
        this._storageName = DEFAULT_STORAGE_NAME;
        this._storageDrivers = null;
        this._localforage = options.localforage;
        this._storageName = options.storageName || DEFAULT_STORAGE_NAME;
        this._storageDrivers = options.storageDrivers || null;
        this._ready = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_1__.PromiseDelegate();
    }
    /**
     * Finish any initialization after server has started and all extensions are applied.
     */
    async initialize() {
        await this.initStorage();
        this._ready.resolve(void 0);
    }
    /**
     * Initialize all storage instances
     */
    async initStorage() {
        this._storage = this.createDefaultStorage();
        this._counters = this.createDefaultCounters();
        this._checkpoints = this.createDefaultCheckpoints();
    }
    /**
     * A promise that resolves once all storage is fully initialized.
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * A lazy reference to the underlying storage.
     */
    get storage() {
        return this.ready.then(() => this._storage);
    }
    /**
     * A lazy reference to the underlying counters.
     */
    get counters() {
        return this.ready.then(() => this._counters);
    }
    /**
     * A lazy reference to the underlying checkpoints.
     */
    get checkpoints() {
        return this.ready.then(() => this._checkpoints);
    }
    /**
     * Get default options for localForage instances
     */
    get defaultStorageOptions() {
        const driver = this._storageDrivers && this._storageDrivers.length ? this._storageDrivers : null;
        return {
            version: 1,
            name: this._storageName,
            ...(driver ? { driver } : {}),
        };
    }
    /**
     * Initialize the default storage for contents.
     */
    createDefaultStorage() {
        return this._localforage.createInstance({
            description: 'Offline Storage for Notebooks and Files',
            storeName: 'files',
            ...this.defaultStorageOptions,
        });
    }
    /**
     * Initialize the default storage for counting file suffixes.
     */
    createDefaultCounters() {
        return this._localforage.createInstance({
            description: 'Store the current file suffix counters',
            storeName: 'counters',
            ...this.defaultStorageOptions,
        });
    }
    /**
     * Create the default checkpoint storage.
     */
    createDefaultCheckpoints() {
        return this._localforage.createInstance({
            description: 'Offline Storage for Checkpoints',
            storeName: 'checkpoints',
            ...this.defaultStorageOptions,
        });
    }
    /**
     * Create a new untitled file or directory in the specified directory path.
     *
     * @param options: The options used to create the file.
     *
     * @returns A promise which resolves with the created file content when the file is created.
     */
    async newUntitled(options) {
        var _a, _b, _c;
        const path = (_a = options === null || options === void 0 ? void 0 : options.path) !== null && _a !== void 0 ? _a : '';
        const type = (_b = options === null || options === void 0 ? void 0 : options.type) !== null && _b !== void 0 ? _b : 'notebook';
        const created = new Date().toISOString();
        let dirname = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.dirname(path);
        const basename = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.basename(path);
        const extname = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.extname(path);
        const item = await this.get(dirname);
        // handle the case of "Save As", where the path points to the new file
        // to create, e.g. subfolder/example-copy.ipynb
        let name = '';
        if (path && !extname && item) {
            // directory
            dirname = `${path}/`;
            name = '';
        }
        else if (dirname && basename) {
            // file in a subfolder
            dirname = `${dirname}/`;
            name = basename;
        }
        else {
            // file at the top level
            dirname = '';
            name = path;
        }
        let file;
        switch (type) {
            case 'directory': {
                const counter = await this._incrementCounter('directory');
                name = `Untitled Folder${counter || ''}`;
                file = {
                    name,
                    path: `${dirname}${name}`,
                    last_modified: created,
                    created,
                    format: 'json',
                    mimetype: '',
                    content: null,
                    size: 0,
                    writable: true,
                    type: 'directory',
                };
                break;
            }
            case 'notebook': {
                const counter = await this._incrementCounter('notebook');
                name = name || `Untitled${counter || ''}.ipynb`;
                file = {
                    name,
                    path: `${dirname}${name}`,
                    last_modified: created,
                    created,
                    format: 'json',
                    mimetype: _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.JSON,
                    content: Private.EMPTY_NB,
                    size: JSON.stringify(Private.EMPTY_NB).length,
                    writable: true,
                    type: 'notebook',
                };
                break;
            }
            default: {
                const ext = (_c = options === null || options === void 0 ? void 0 : options.ext) !== null && _c !== void 0 ? _c : '.txt';
                const counter = await this._incrementCounter('file');
                const mimetype = _tokens__WEBPACK_IMPORTED_MODULE_2__.FILE.getType(ext) || _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.OCTET_STREAM;
                let format;
                if (_tokens__WEBPACK_IMPORTED_MODULE_2__.FILE.hasFormat(ext, 'text') || mimetype.indexOf('text') !== -1) {
                    format = 'text';
                }
                else if (ext.indexOf('json') !== -1 || ext.indexOf('ipynb') !== -1) {
                    format = 'json';
                }
                else {
                    format = 'base64';
                }
                name = name || `untitled${counter || ''}${ext}`;
                file = {
                    name,
                    path: `${dirname}${name}`,
                    last_modified: created,
                    created,
                    format,
                    mimetype,
                    content: '',
                    size: 0,
                    writable: true,
                    type: 'file',
                };
                break;
            }
        }
        const key = file.path;
        await (await this.storage).setItem(key, file);
        return file;
    }
    /**
     * Copy a file into a given directory.
     *
     * @param path - The original file path.
     * @param toDir - The destination directory path.
     *
     * @returns A promise which resolves with the new contents model when the
     *  file is copied.
     *
     * #### Notes
     * The server will select the name of the copied file.
     */
    async copy(path, toDir) {
        let name = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.basename(path);
        toDir = toDir === '' ? '' : `${toDir.slice(1)}/`;
        // TODO: better handle naming collisions with existing files
        while (await this.get(`${toDir}${name}`, { content: true })) {
            const ext = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.extname(name);
            const base = name.replace(ext, '');
            name = `${base} (copy)${ext}`;
        }
        const toPath = `${toDir}${name}`;
        let item = await this.get(path, { content: true });
        if (!item) {
            throw Error(`Could not find file with path ${path}`);
        }
        item = {
            ...item,
            name,
            path: toPath,
        };
        await (await this.storage).setItem(toPath, item);
        return item;
    }
    /**
     * Get a file or directory.
     *
     * @param path: The path to the file.
     * @param options: The options used to fetch the file.
     *
     * @returns A promise which resolves with the file content.
     */
    async get(path, options) {
        // remove leading slash
        path = decodeURIComponent(path.replace(/^\//, ''));
        if (path === '') {
            return await this._getFolder(path);
        }
        const storage = await this.storage;
        const item = await storage.getItem(path);
        const serverItem = await this._getServerContents(path, options);
        const model = (item || serverItem);
        if (!model) {
            return null;
        }
        if (!(options === null || options === void 0 ? void 0 : options.content)) {
            return {
                ...model,
                content: null,
                size: 0,
            };
        }
        // for directories, find all files with the path as the prefix
        if (model.type === 'directory') {
            const contentMap = new Map();
            await storage.iterate((file, key) => {
                // use an additional slash to not include the directory itself
                if (key === `${path}/${file.name}`) {
                    contentMap.set(file.name, file);
                }
            });
            const serverContents = serverItem
                ? serverItem.content
                : Array.from((await this._getServerDirectory(path)).values());
            for (const file of serverContents) {
                if (!contentMap.has(file.name)) {
                    contentMap.set(file.name, file);
                }
            }
            const content = [...contentMap.values()];
            return {
                name: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.basename(path),
                path,
                last_modified: model.last_modified,
                created: model.created,
                format: 'json',
                mimetype: _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.JSON,
                content,
                size: 0,
                writable: true,
                type: 'directory',
            };
        }
        return model;
    }
    /**
     * Rename a file or directory.
     *
     * @param oldLocalPath - The original file path.
     * @param newLocalPath - The new file path.
     *
     * @returns A promise which resolves with the new file content model when the file is renamed.
     */
    async rename(oldLocalPath, newLocalPath) {
        const path = decodeURIComponent(oldLocalPath);
        const file = await this.get(path, { content: true });
        if (!file) {
            throw Error(`Could not find file with path ${path}`);
        }
        const modified = new Date().toISOString();
        const name = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.basename(newLocalPath);
        const newFile = {
            ...file,
            name,
            path: newLocalPath,
            last_modified: modified,
        };
        const storage = await this.storage;
        await storage.setItem(newLocalPath, newFile);
        // remove the old file
        await storage.removeItem(path);
        // remove the corresponding checkpoint
        await (await this.checkpoints).removeItem(path);
        // if a directory, recurse through all children
        if (file.type === 'directory') {
            let child;
            for (child of file.content) {
                await this.rename(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(oldLocalPath, child.name), _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(newLocalPath, child.name));
            }
        }
        return newFile;
    }
    /**
     * Save a file.
     *
     * @param path - The desired file path.
     * @param options - Optional overrides to the model.
     *
     * @returns A promise which resolves with the file content model when the file is saved.
     */
    async save(path, options = {}) {
        var _a;
        path = decodeURIComponent(path);
        // process the file if coming from an upload
        const ext = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.extname((_a = options.name) !== null && _a !== void 0 ? _a : '');
        let item = await this.get(path);
        if (!item) {
            item = await this.newUntitled({ path, ext, type: 'file' });
        }
        if (!item) {
            return null;
        }
        // override with the new values
        const modified = new Date().toISOString();
        item = {
            ...item,
            ...options,
            last_modified: modified,
        };
        if (options.content && options.format === 'base64') {
            if (ext === '.ipynb') {
                item = {
                    ...item,
                    content: JSON.parse(this.unescapeContent(options.content)),
                    format: 'json',
                    type: 'notebook',
                };
            }
            else if (_tokens__WEBPACK_IMPORTED_MODULE_2__.FILE.hasFormat(ext, 'json')) {
                item = {
                    ...item,
                    content: JSON.parse(this.unescapeContent(options.content)),
                    format: 'json',
                    type: 'file',
                };
            }
            else if (_tokens__WEBPACK_IMPORTED_MODULE_2__.FILE.hasFormat(ext, 'text')) {
                item = {
                    ...item,
                    content: this.unescapeContent(options.content),
                    format: 'text',
                    type: 'file',
                };
            }
        }
        await (await this.storage).setItem(path, item);
        return item;
    }
    unescapeContent(content) {
        return decodeURIComponent(escape(atob(content)));
    }
    /**
     * Delete a file from browser storage.
     *
     * Has no effect on server-backed files, which will re-appear with their
     * original timestamp.
     *
     * @param path - The path to the file.
     */
    async delete(path) {
        path = decodeURIComponent(path);
        const slashed = `${path}/`;
        const toDelete = (await (await this.storage).keys()).filter((key) => key === path || key.startsWith(slashed));
        await Promise.all(toDelete.map(this.forgetPath, this));
    }
    /**
     * Remove the localForage and checkpoints for a path.
     *
     * @param path - The path to the file
     */
    async forgetPath(path) {
        await Promise.all([
            (await this.storage).removeItem(path),
            (await this.checkpoints).removeItem(path),
        ]);
    }
    /**
     * Create a checkpoint for a file.
     *
     * @param path - The path of the file.
     *
     * @returns A promise which resolves with the new checkpoint model when the
     *   checkpoint is created.
     */
    async createCheckpoint(path) {
        var _a;
        const checkpoints = await this.checkpoints;
        path = decodeURIComponent(path);
        const item = await this.get(path, { content: true });
        if (!item) {
            throw Error(`Could not find file with path ${path}`);
        }
        const copies = ((_a = (await checkpoints.getItem(path))) !== null && _a !== void 0 ? _a : []).filter(Boolean);
        copies.push(item);
        // keep only a certain amount of checkpoints per file
        if (copies.length > N_CHECKPOINTS) {
            copies.splice(0, copies.length - N_CHECKPOINTS);
        }
        await checkpoints.setItem(path, copies);
        const id = `${copies.length - 1}`;
        return { id, last_modified: item.last_modified };
    }
    /**
     * List available checkpoints for a file.
     *
     * @param path - The path of the file.
     *
     * @returns A promise which resolves with a list of checkpoint models for
     *    the file.
     */
    async listCheckpoints(path) {
        const copies = (await (await this.checkpoints).getItem(path)) || [];
        return copies.filter(Boolean).map(this.normalizeCheckpoint, this);
    }
    normalizeCheckpoint(model, id) {
        return { id: id.toString(), last_modified: model.last_modified };
    }
    /**
     * Restore a file to a known checkpoint state.
     *
     * @param path - The path of the file.
     * @param checkpointID - The id of the checkpoint to restore.
     *
     * @returns A promise which resolves when the checkpoint is restored.
     */
    async restoreCheckpoint(path, checkpointID) {
        path = decodeURIComponent(path);
        const copies = ((await (await this.checkpoints).getItem(path)) || []);
        const id = parseInt(checkpointID);
        const item = copies[id];
        await (await this.storage).setItem(path, item);
    }
    /**
     * Delete a checkpoint for a file.
     *
     * @param path - The path of the file.
     * @param checkpointID - The id of the checkpoint to delete.
     *
     * @returns A promise which resolves when the checkpoint is deleted.
     */
    async deleteCheckpoint(path, checkpointID) {
        path = decodeURIComponent(path);
        const copies = ((await (await this.checkpoints).getItem(path)) || []);
        const id = parseInt(checkpointID);
        copies.splice(id, 1);
        await (await this.checkpoints).setItem(path, copies);
    }
    /**
     * retrieve the contents for this path from the union of local storage and
     * `api/contents/{path}/all.json`.
     *
     * @param path - The contents path to retrieve
     *
     * @returns A promise which resolves with a Map of contents, keyed by local file name
     */
    async _getFolder(path) {
        const content = new Map();
        const storage = await this.storage;
        await storage.iterate((file, key) => {
            if (key.includes('/')) {
                return;
            }
            content.set(file.path, file);
        });
        // layer in contents that don't have local overwrites
        for (const file of (await this._getServerDirectory(path)).values()) {
            if (!content.has(file.path)) {
                content.set(file.path, file);
            }
        }
        if (path && content.size === 0) {
            return null;
        }
        return {
            name: '',
            path,
            last_modified: new Date(0).toISOString(),
            created: new Date(0).toISOString(),
            format: 'json',
            mimetype: _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.JSON,
            content: Array.from(content.values()),
            size: 0,
            writable: true,
            type: 'directory',
        };
    }
    /**
     * Attempt to recover the model from `{:path}/__all__.json` file, fall back to
     * deriving the model (including content) off the file in `/files/`. Otherwise
     * return `null`.
     */
    async _getServerContents(path, options) {
        const name = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.basename(path);
        const parentContents = await this._getServerDirectory(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(path, '..'));
        let model = parentContents.get(name);
        if (!model) {
            return null;
        }
        model = model || {
            name,
            path,
            last_modified: new Date(0).toISOString(),
            created: new Date(0).toISOString(),
            format: 'text',
            mimetype: _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.PLAIN_TEXT,
            type: 'file',
            writable: true,
            content: null,
        };
        if (options === null || options === void 0 ? void 0 : options.content) {
            if (model.type === 'directory') {
                const serverContents = await this._getServerDirectory(path);
                model = { ...model, content: Array.from(serverContents.values()) };
            }
            else {
                const fileUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getBaseUrl(), 'files', path);
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    return null;
                }
                const mimetype = model.mimetype || response.headers.get('Content-Type');
                const ext = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.extname(name);
                if (model.type === 'notebook' ||
                    _tokens__WEBPACK_IMPORTED_MODULE_2__.FILE.hasFormat(ext, 'json') ||
                    (mimetype === null || mimetype === void 0 ? void 0 : mimetype.indexOf('json')) !== -1 ||
                    path.match(/\.(ipynb|[^/]*json[^/]*)$/)) {
                    model = {
                        ...model,
                        content: await response.json(),
                        format: 'json',
                        mimetype: model.mimetype || _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.JSON,
                    };
                }
                else if (_tokens__WEBPACK_IMPORTED_MODULE_2__.FILE.hasFormat(ext, 'text') || mimetype.indexOf('text') !== -1) {
                    model = {
                        ...model,
                        content: await response.text(),
                        format: 'text',
                        mimetype: mimetype || _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.PLAIN_TEXT,
                    };
                }
                else {
                    model = {
                        ...model,
                        content: btoa(new Uint8Array(await response.arrayBuffer()).reduce(this.reduceBytesToString, '')),
                        format: 'base64',
                        mimetype: mimetype || _tokens__WEBPACK_IMPORTED_MODULE_2__.MIME.OCTET_STREAM,
                    };
                }
            }
        }
        return model;
    }
    /**
     * retrieve the contents for this path from `__index__.json` in the appropriate
     * folder.
     *
     * @param newLocalPath - The new file path.
     *
     * @returns A promise which resolves with a Map of contents, keyed by local file name
     */
    async _getServerDirectory(path) {
        const content = this._serverContents.get(path) || new Map();
        if (!this._serverContents.has(path)) {
            const apiURL = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getBaseUrl(), 'api/contents', path, 'all.json');
            try {
                const response = await fetch(apiURL);
                const json = JSON.parse(await response.text());
                for (const file of json['content']) {
                    content.set(file.name, file);
                }
            }
            catch (err) {
                console.warn(`don't worry, about ${err}... nothing's broken. If there had been a
          file at ${apiURL}, you might see some more files.`);
            }
            this._serverContents.set(path, content);
        }
        return content;
    }
    /**
     * Increment the counter for a given file type.
     * Used to avoid collisions when creating new untitled files.
     *
     * @param type The file type to increment the counter for.
     */
    async _incrementCounter(type) {
        var _a;
        const counters = await this.counters;
        const current = (_a = (await counters.getItem(type))) !== null && _a !== void 0 ? _a : -1;
        const counter = current + 1;
        await counters.setItem(type, counter);
        return counter;
    }
}
/**
 * A namespace for private data.
 */
var Private;
(function (Private) {
    /**
     * The content for an empty notebook.
     */
    Private.EMPTY_NB = {
        metadata: {
            orig_nbformat: 4,
        },
        nbformat_minor: 4,
        nbformat: 4,
        cells: [],
    };
})(Private || (Private = {}));


/***/ }),

/***/ 38693:
/*!******************************************!*\
  !*** ../packages/contents/lib/tokens.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FILE": () => (/* binding */ FILE),
/* harmony export */   "IContents": () => (/* binding */ IContents),
/* harmony export */   "MIME": () => (/* binding */ MIME)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 79615);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var mime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! mime */ 9879);
/* harmony import */ var mime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(mime__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__);



/**
 * The token for the settings service.
 */
const IContents = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__.Token('@jupyterlite/contents:IContents');
/**
 * Commonly-used mimetypes
 */
var MIME;
(function (MIME) {
    MIME.JSON = 'application/json';
    MIME.PLAIN_TEXT = 'text/plain';
    MIME.OCTET_STREAM = 'octet/stream';
})(MIME || (MIME = {}));
/**
 * A namespace for file constructs.
 */
var FILE;
(function (FILE) {
    /**
     * Build-time configured file types.
     */
    const TYPES = JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('fileTypes') || '{}');
    /**
     * Get a mimetype (or fallback).
     */
    function getType(ext, defaultType = null) {
        ext = ext.toLowerCase();
        for (const fileType of Object.values(TYPES)) {
            for (const fileExt of fileType.extensions || []) {
                if (fileExt === ext && fileType.mimeTypes && fileType.mimeTypes.length) {
                    return fileType.mimeTypes[0];
                }
            }
        }
        return mime__WEBPACK_IMPORTED_MODULE_1___default().getType(ext) || defaultType || MIME.OCTET_STREAM;
    }
    FILE.getType = getType;
    /**
     * Determine whether the given extension matches a given fileFormat.
     */
    function hasFormat(ext, fileFormat) {
        ext = ext.toLowerCase();
        for (const fileType of Object.values(TYPES)) {
            if (fileType.fileFormat !== fileFormat) {
                continue;
            }
            for (const fileExt of fileType.extensions || []) {
                if (fileExt === ext) {
                    return true;
                }
            }
        }
        return false;
    }
    FILE.hasFormat = hasFormat;
})(FILE || (FILE = {}));


/***/ }),

/***/ 81815:
/*!*************************************************!*\
  !*** ../packages/server-extension/lib/index.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 79615);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @jupyterlite/contents */ 38693);
/* harmony import */ var _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @jupyterlite/contents */ 84599);
/* harmony import */ var _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @jupyterlite/contents */ 39694);
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlite/kernel */ 60699);
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlite_licenses__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlite/licenses */ 9265);
/* harmony import */ var _jupyterlite_licenses__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_licenses__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlite/server */ 38170);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_server__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _jupyterlite_session__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlite/session */ 61952);
/* harmony import */ var _jupyterlite_session__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_session__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _jupyterlite_settings__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jupyterlite/settings */ 64480);
/* harmony import */ var _jupyterlite_settings__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_settings__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _jupyterlite_translation__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @jupyterlite/translation */ 81133);
/* harmony import */ var _jupyterlite_translation__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_translation__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @jupyterlite/localforage */ 61597);
/* harmony import */ var _jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var localforage__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! localforage */ 20927);
/* harmony import */ var localforage__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(localforage__WEBPACK_IMPORTED_MODULE_8__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.










/**
 * The localforage plugin
 */
const localforagePlugin = {
    id: '@jupyterlite/server-extension:localforage',
    autoStart: true,
    provides: _jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7__.ILocalForage,
    activate: (app) => {
        return { localforage: (localforage__WEBPACK_IMPORTED_MODULE_8___default()) };
    },
};
/**
 * The volatile localforage memory plugin
 */
const localforageMemoryPlugin = {
    id: '@jupyterlite/server-extension:localforage-memory-storage',
    autoStart: true,
    requires: [_jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7__.ILocalForage],
    activate: async (app, forage) => {
        if (JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('enableMemoryStorage') || 'false')) {
            console.warn('Memory storage fallback enabled: contents and settings may not be saved');
            await (0,_jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7__.ensureMemoryStorage)(forage.localforage);
        }
    },
};
/**
 * The contents service plugin.
 */
const contentsPlugin = {
    id: '@jupyterlite/server-extension:contents',
    requires: [_jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7__.ILocalForage],
    autoStart: true,
    provides: _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_9__.IContents,
    activate: (app, forage) => {
        const storageName = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('contentsStorageName');
        const storageDrivers = JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('contentsStorageDrivers') || 'null');
        const { localforage } = forage;
        const contents = new _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_10__.Contents({
            storageName,
            storageDrivers,
            localforage,
        });
        app.started.then(() => contents.initialize().catch(console.warn));
        return contents;
    },
};
/**
 * A plugin providing the routes for the contents service.
 */
const contentsRoutesPlugin = {
    id: '@jupyterlite/server-extension:contents-routes',
    autoStart: true,
    requires: [_jupyterlite_contents__WEBPACK_IMPORTED_MODULE_9__.IContents],
    activate: (app, contents) => {
        // GET /api/contents/{path}/checkpoints - Get a list of checkpoints for a file
        app.router.get('/api/contents/(.+)/checkpoints', async (req, filename) => {
            const res = await contents.listCheckpoints(filename);
            return new Response(JSON.stringify(res));
        });
        // POST /api/contents/{path}/checkpoints/{checkpoint_id} - Restore a file to a particular checkpointed state
        app.router.post('/api/contents/(.+)/checkpoints/(.*)', async (req, filename, checkpoint) => {
            const res = await contents.restoreCheckpoint(filename, checkpoint);
            return new Response(JSON.stringify(res), { status: 204 });
        });
        // POST /api/contents/{path}/checkpoints - Create a new checkpoint for a file
        app.router.post('/api/contents/(.+)/checkpoints', async (req, filename) => {
            const res = await contents.createCheckpoint(filename);
            return new Response(JSON.stringify(res), { status: 201 });
        });
        // DELETE /api/contents/{path}/checkpoints/{checkpoint_id} - Delete a checkpoint
        app.router.delete('/api/contents/(.+)/checkpoints/(.*)', async (req, filename, checkpoint) => {
            const res = await contents.deleteCheckpoint(filename, checkpoint);
            return new Response(JSON.stringify(res), { status: 204 });
        });
        // GET /api/contents/{path} - Get contents of file or directory
        app.router.get('/api/contents(.*)', async (req, filename) => {
            var _a;
            const options = {
                content: ((_a = req.query) === null || _a === void 0 ? void 0 : _a.content) === '1',
            };
            const nb = await contents.get(filename, options);
            if (!nb) {
                return new Response(null, { status: 404 });
            }
            return new Response(JSON.stringify(nb));
        });
        // POST /api/contents/{path} - Create a new file in the specified path
        app.router.post('/api/contents(.*)', async (req, path) => {
            const options = req.body;
            const copyFrom = options === null || options === void 0 ? void 0 : options.copy_from;
            let file;
            if (copyFrom) {
                file = await contents.copy(copyFrom, path);
            }
            else {
                file = await contents.newUntitled(options);
            }
            if (!file) {
                return new Response(null, { status: 400 });
            }
            return new Response(JSON.stringify(file), { status: 201 });
        });
        // PATCH /api/contents/{path} - Rename a file or directory without re-uploading content
        app.router.patch('/api/contents(.*)', async (req, filename) => {
            var _a, _b;
            const newPath = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : '';
            filename = filename[0] === '/' ? filename.slice(1) : filename;
            const nb = await contents.rename(filename, newPath);
            return new Response(JSON.stringify(nb));
        });
        // PUT /api/contents/{path} - Save or upload a file
        app.router.put('/api/contents/(.+)', async (req, filename) => {
            const body = req.body;
            const nb = await contents.save(filename, body);
            return new Response(JSON.stringify(nb));
        });
        // DELETE /api/contents/{path} - Delete a file in the given path
        app.router.delete('/api/contents/(.+)', async (req, filename) => {
            await contents.delete(filename);
            return new Response(null, { status: 204 });
        });
    },
};
/**
 * A plugin installing the service worker.
 */
const serviceWorkerPlugin = {
    id: '@jupyterlite/server-extension:service-worker',
    autoStart: true,
    provides: _jupyterlite_server__WEBPACK_IMPORTED_MODULE_3__.IServiceWorkerRegistrationWrapper,
    activate: (app) => {
        return new _jupyterlite_server__WEBPACK_IMPORTED_MODULE_3__.ServiceWorkerRegistrationWrapper();
    },
};
/**
 * A plugin handling communication with the Emscpriten file system.
 */
const emscriptenFileSystemPlugin = {
    id: '@jupyterlite/server-extension:emscripten-filesystem',
    autoStart: true,
    activate: (app) => {
        // Setup communication with service worker for the virtual fs
        const broadcast = new BroadcastChannel('/api/drive.v1');
        let subitems;
        broadcast.onmessage = async (event) => {
            const request = event.data;
            const contentManager = app.serviceManager.contents;
            const path = request.path;
            let model;
            switch (request.method) {
                case 'readdir': {
                    model = await contentManager.get(path, { content: true });
                    if (model.type === 'directory' && model.content) {
                        subitems = model.content.map((subcontent) => subcontent.name);
                        broadcast.postMessage(subitems);
                    }
                    else {
                        broadcast.postMessage([]);
                    }
                    break;
                }
                case 'rmdir': {
                    await contentManager.delete(path);
                    broadcast.postMessage(null);
                    break;
                }
                case 'rename': {
                    await contentManager.rename(path, request.data.newPath);
                    broadcast.postMessage(null);
                    break;
                }
                case 'getmode': {
                    model = await contentManager.get(path);
                    if (model.type === 'directory') {
                        broadcast.postMessage(_jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__.DIR_MODE);
                    }
                    else {
                        broadcast.postMessage(_jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__.FILE_MODE);
                    }
                    break;
                }
                case 'lookup': {
                    try {
                        model = await contentManager.get(path);
                        broadcast.postMessage({
                            ok: true,
                            mode: model.type === 'directory' ? _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__.DIR_MODE : _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__.FILE_MODE,
                        });
                    }
                    catch (e) {
                        broadcast.postMessage({
                            ok: false,
                        });
                    }
                    break;
                }
                case 'mknod': {
                    const mode = Number.parseInt(request.data.mode);
                    model = await contentManager.newUntitled({
                        path: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.dirname(path),
                        type: mode === _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__.DIR_MODE ? 'directory' : 'file',
                        ext: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.extname(path),
                    });
                    await contentManager.rename(model.path, path);
                    broadcast.postMessage(null);
                    break;
                }
                case 'getattr': {
                    model = await contentManager.get(path);
                    broadcast.postMessage({
                        dev: 0,
                        ino: 0,
                        mode: model.type === 'directory' ? _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__.DIR_MODE : _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_11__.FILE_MODE,
                        nlink: 0,
                        uid: 0,
                        gid: 0,
                        rdev: 0,
                        size: model.size || 0,
                        blksize: 0,
                        blocks: 0,
                        atime: model.last_modified,
                        mtime: model.last_modified,
                        ctime: model.last_modified,
                        timestamp: 0,
                    });
                    break;
                }
                case 'get': {
                    model = await contentManager.get(path, { content: true });
                    if (model.type === 'directory') {
                        broadcast.postMessage(null);
                        return;
                    }
                    let content = model.content;
                    if (model.format === 'json') {
                        content = JSON.stringify(model.content);
                    }
                    broadcast.postMessage({
                        content,
                        format: model.format,
                    });
                    break;
                }
                case 'put': {
                    await contentManager.save(path, {
                        content: request.data.format === 'json'
                            ? JSON.parse(request.data.data)
                            : request.data.data,
                        type: 'file',
                        format: request.data.format,
                    });
                    broadcast.postMessage(null);
                    break;
                }
            }
        };
    },
};
/**
 * The kernels service plugin.
 */
const kernelsPlugin = {
    id: '@jupyterlite/server-extension:kernels',
    autoStart: true,
    provides: _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.IKernels,
    requires: [_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.IKernelSpecs],
    activate: (app, kernelspecs) => {
        return new _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.Kernels({ kernelspecs });
    },
};
/**
 * A plugin providing the routes for the kernels service
 */
const kernelsRoutesPlugin = {
    id: '@jupyterlite/server-extension:kernels-routes',
    autoStart: true,
    requires: [_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.IKernels],
    activate: (app, kernels) => {
        // POST /api/kernels/{kernel_id} - Restart a kernel
        app.router.post('/api/kernels/(.*)/restart', async (req, kernelId) => {
            const res = await kernels.restart(kernelId);
            return new Response(JSON.stringify(res));
        });
        // DELETE /api/kernels/{kernel_id} - Kill a kernel and delete the kernel id
        app.router.delete('/api/kernels/(.*)', async (req, kernelId) => {
            const res = await kernels.shutdown(kernelId);
            return new Response(JSON.stringify(res), { status: 204 });
        });
    },
};
/**
 * The kernel spec service plugin.
 */
const kernelSpecPlugin = {
    id: '@jupyterlite/server-extension:kernelspec',
    autoStart: true,
    provides: _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.IKernelSpecs,
    activate: (app) => {
        return new _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.KernelSpecs();
    },
};
/**
 * A plugin providing the routes for the kernelspec service.
 */
const kernelSpecRoutesPlugin = {
    id: '@jupyterlite/server-extension:kernelspec-routes',
    autoStart: true,
    requires: [_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.IKernelSpecs],
    activate: (app, kernelspecs) => {
        app.router.get('/api/kernelspecs', async (req) => {
            const { specs } = kernelspecs;
            if (!specs) {
                return new Response(null);
            }
            // follow the same format as in Jupyter Server
            const allKernelSpecs = {};
            const allSpecs = specs.kernelspecs;
            Object.keys(allSpecs).forEach((name) => {
                const spec = allSpecs[name];
                const { resources } = spec !== null && spec !== void 0 ? spec : {};
                allKernelSpecs[name] = {
                    name,
                    spec,
                    resources,
                };
            });
            const res = {
                default: specs.default,
                kernelspecs: allKernelSpecs,
            };
            return new Response(JSON.stringify(res));
        });
    },
};
/**
 * The licenses service plugin
 */
const licensesPlugin = {
    id: '@jupyterlite/server-extension:licenses',
    autoStart: true,
    provides: _jupyterlite_licenses__WEBPACK_IMPORTED_MODULE_2__.ILicenses,
    activate: (app) => {
        return new _jupyterlite_licenses__WEBPACK_IMPORTED_MODULE_2__.Licenses();
    },
};
/**
 * A plugin providing the routes for the licenses service.
 */
const licensesRoutesPlugin = {
    id: '@jupyterlite/server-extension:licenses-routes',
    autoStart: true,
    requires: [_jupyterlite_licenses__WEBPACK_IMPORTED_MODULE_2__.ILicenses],
    activate(app, licenses) {
        app.router.get('/api/licenses', async (req) => {
            const res = await licenses.get();
            return new Response(JSON.stringify(res));
        });
    },
};
/**
 * A plugin providing the routes for the nbconvert service.
 * TODO: provide the service in a separate plugin?
 */
const nbconvertRoutesPlugin = {
    id: '@jupyterlite/server-extension:nbconvert-routes',
    autoStart: true,
    activate: (app) => {
        app.router.get('/api/nbconvert', async (req) => {
            return new Response(JSON.stringify({}));
        });
    },
};
/**
 * The sessions service plugin.
 */
const sessionsPlugin = {
    id: '@jupyterlite/server-extension:sessions',
    autoStart: true,
    provides: _jupyterlite_session__WEBPACK_IMPORTED_MODULE_4__.ISessions,
    requires: [_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.IKernels],
    activate: (app, kernels) => {
        return new _jupyterlite_session__WEBPACK_IMPORTED_MODULE_4__.Sessions({ kernels });
    },
};
/**
 * A plugin providing the routes for the session service.
 */
const sessionsRoutesPlugin = {
    id: '@jupyterlite/server-extension:sessions-routes',
    autoStart: true,
    requires: [_jupyterlite_session__WEBPACK_IMPORTED_MODULE_4__.ISessions],
    activate: (app, sessions) => {
        // GET /api/sessions/{session} - Get session
        app.router.get('/api/sessions/(.+)', async (req, id) => {
            const session = await sessions.get(id);
            return new Response(JSON.stringify(session), { status: 200 });
        });
        // GET /api/sessions - List available sessions
        app.router.get('/api/sessions', async (req) => {
            const list = await sessions.list();
            return new Response(JSON.stringify(list), { status: 200 });
        });
        // PATCH /api/sessions/{session} - This can be used to rename a session
        app.router.patch('/api/sessions(.*)', async (req, id) => {
            const options = req.body;
            const session = await sessions.patch(options);
            return new Response(JSON.stringify(session), { status: 200 });
        });
        // DELETE /api/sessions/{session} - Delete a session
        app.router.delete('/api/sessions/(.+)', async (req, id) => {
            await sessions.shutdown(id);
            return new Response(null, { status: 204 });
        });
        // POST /api/sessions - Create a new session or return an existing session if a session of the same name already exists
        app.router.post('/api/sessions', async (req) => {
            const options = req.body;
            const session = await sessions.startNew(options);
            return new Response(JSON.stringify(session), { status: 201 });
        });
    },
};
/**
 * The settings service plugin.
 */
const settingsPlugin = {
    id: '@jupyterlite/server-extension:settings',
    autoStart: true,
    requires: [_jupyterlite_localforage__WEBPACK_IMPORTED_MODULE_7__.ILocalForage],
    provides: _jupyterlite_settings__WEBPACK_IMPORTED_MODULE_5__.ISettings,
    activate: (app, forage) => {
        const storageName = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('settingsStorageName');
        const storageDrivers = JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('settingsStorageDrivers') || 'null');
        const { localforage } = forage;
        const settings = new _jupyterlite_settings__WEBPACK_IMPORTED_MODULE_5__.Settings({ storageName, storageDrivers, localforage });
        app.started.then(() => settings.initialize().catch(console.warn));
        return settings;
    },
};
/**
 * A plugin providing the routes for the settings service.
 */
const settingsRoutesPlugin = {
    id: '@jupyterlite/server-extension:settings-routes',
    autoStart: true,
    requires: [_jupyterlite_settings__WEBPACK_IMPORTED_MODULE_5__.ISettings],
    activate: (app, settings) => {
        // TODO: improve the regex
        // const pluginPattern = new RegExp(/(?:@([^/]+?)[/])?([^/]+?):(\w+)/);
        const pluginPattern = '/api/settings/((?:@([^/]+?)[/])?([^/]+?):([^:]+))$';
        app.router.get(pluginPattern, async (req, pluginId) => {
            const setting = await settings.get(pluginId);
            return new Response(JSON.stringify(setting));
        });
        app.router.put(pluginPattern, async (req, pluginId) => {
            const body = req.body;
            const { raw } = body;
            await settings.save(pluginId, raw);
            return new Response(null, { status: 204 });
        });
        app.router.get('/api/settings', async (req) => {
            const plugins = await settings.getAll();
            return new Response(JSON.stringify(plugins));
        });
    },
};
/**
 * The translation service plugin.
 */
const translationPlugin = {
    id: '@jupyterlite/server-extension:translation',
    autoStart: true,
    provides: _jupyterlite_translation__WEBPACK_IMPORTED_MODULE_6__.ITranslation,
    activate: (app) => {
        const translation = new _jupyterlite_translation__WEBPACK_IMPORTED_MODULE_6__.Translation();
        app.router.get('/api/translations/?(.*)', async (req, locale) => {
            const data = await translation.get(locale || 'all');
            return new Response(JSON.stringify(data));
        });
        return translation;
    },
};
/**
 * A plugin providing the routes for the translation service.
 */
const translationRoutesPlugin = {
    id: '@jupyterlite/server-extension:translation-routes',
    autoStart: true,
    requires: [_jupyterlite_translation__WEBPACK_IMPORTED_MODULE_6__.ITranslation],
    activate: (app, translation) => {
        app.router.get('/api/translations/?(.*)', async (req, locale) => {
            const data = await translation.get(locale || 'all');
            return new Response(JSON.stringify(data));
        });
    },
};
const plugins = [
    contentsPlugin,
    contentsRoutesPlugin,
    emscriptenFileSystemPlugin,
    kernelsPlugin,
    kernelsRoutesPlugin,
    kernelSpecPlugin,
    kernelSpecRoutesPlugin,
    licensesPlugin,
    licensesRoutesPlugin,
    localforageMemoryPlugin,
    localforagePlugin,
    nbconvertRoutesPlugin,
    serviceWorkerPlugin,
    sessionsPlugin,
    sessionsRoutesPlugin,
    settingsPlugin,
    settingsRoutesPlugin,
    translationPlugin,
    translationRoutesPlugin,
];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ })

}]);
//# sourceMappingURL=packages_server-extension_lib_index_js.c388e2f.js.map