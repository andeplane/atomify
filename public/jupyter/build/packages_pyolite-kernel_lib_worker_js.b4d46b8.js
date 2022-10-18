"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_pyolite-kernel_lib_worker_js"],{

/***/ 88289:
/*!************************************************!*\
  !*** ../packages/pyolite-kernel/lib/worker.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PyoliteRemoteKernel": () => (/* binding */ PyoliteRemoteKernel)
/* harmony export */ });
/* harmony import */ var _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlite/contents */ 39694);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// TODO Once this https://github.com/pyodide/pyodide/pull/2582/files is released
// Remove this shameless copy
const ERRNO_CODES = {
    E2BIG: 1,
    EACCES: 2,
    EADDRINUSE: 3,
    EADDRNOTAVAIL: 4,
    EADV: 122,
    EAFNOSUPPORT: 5,
    EAGAIN: 6,
    EALREADY: 7,
    EBADE: 113,
    EBADF: 8,
    EBADFD: 127,
    EBADMSG: 9,
    EBADR: 114,
    EBADRQC: 103,
    EBADSLT: 102,
    EBFONT: 101,
    EBUSY: 10,
    ECANCELED: 11,
    ECHILD: 12,
    ECHRNG: 106,
    ECOMM: 124,
    ECONNABORTED: 13,
    ECONNREFUSED: 14,
    ECONNRESET: 15,
    EDEADLK: 16,
    EDEADLOCK: 16,
    EDESTADDRREQ: 17,
    EDOM: 18,
    EDOTDOT: 125,
    EDQUOT: 19,
    EEXIST: 20,
    EFAULT: 21,
    EFBIG: 22,
    EHOSTDOWN: 142,
    EHOSTUNREACH: 23,
    EIDRM: 24,
    EILSEQ: 25,
    EINPROGRESS: 26,
    EINTR: 27,
    EINVAL: 28,
    EIO: 29,
    EISCONN: 30,
    EISDIR: 31,
    EL2HLT: 112,
    EL2NSYNC: 156,
    EL3HLT: 107,
    EL3RST: 108,
    ELIBACC: 129,
    ELIBBAD: 130,
    ELIBEXEC: 133,
    ELIBMAX: 132,
    ELIBSCN: 131,
    ELNRNG: 109,
    ELOOP: 32,
    EMFILE: 33,
    EMLINK: 34,
    EMSGSIZE: 35,
    EMULTIHOP: 36,
    ENAMETOOLONG: 37,
    ENETDOWN: 38,
    ENETRESET: 39,
    ENETUNREACH: 40,
    ENFILE: 41,
    ENOANO: 104,
    ENOBUFS: 42,
    ENOCSI: 111,
    ENODATA: 116,
    ENODEV: 43,
    ENOENT: 44,
    ENOEXEC: 45,
    ENOLCK: 46,
    ENOLINK: 47,
    ENOMEDIUM: 148,
    ENOMEM: 48,
    ENOMSG: 49,
    ENONET: 119,
    ENOPKG: 120,
    ENOPROTOOPT: 50,
    ENOSPC: 51,
    ENOSR: 118,
    ENOSTR: 100,
    ENOSYS: 52,
    ENOTBLK: 105,
    ENOTCONN: 53,
    ENOTDIR: 54,
    ENOTEMPTY: 55,
    ENOTRECOVERABLE: 56,
    ENOTSOCK: 57,
    ENOTSUP: 138,
    ENOTTY: 59,
    ENOTUNIQ: 126,
    ENXIO: 60,
    EOPNOTSUPP: 138,
    EOVERFLOW: 61,
    EOWNERDEAD: 62,
    EPERM: 63,
    EPFNOSUPPORT: 139,
    EPIPE: 64,
    EPROTO: 65,
    EPROTONOSUPPORT: 66,
    EPROTOTYPE: 67,
    ERANGE: 68,
    EREMCHG: 128,
    EREMOTE: 121,
    EROFS: 69,
    ESHUTDOWN: 140,
    ESOCKTNOSUPPORT: 137,
    ESPIPE: 70,
    ESRCH: 71,
    ESRMNT: 123,
    ESTALE: 72,
    ESTRPIPE: 135,
    ETIME: 117,
    ETIMEDOUT: 73,
    ETOOMANYREFS: 141,
    ETXTBSY: 74,
    EUNATCH: 110,
    EUSERS: 136,
    EWOULDBLOCK: 6,
    EXDEV: 75,
    EXFULL: 115,
};
class PyoliteRemoteKernel {
    constructor() {
        /**
         * Initialization options.
         */
        this._options = null;
        this._initializer = null;
        /** TODO: real typing */
        this._localPath = '';
        this._driveName = '';
        this._driveFS = null;
        this._initialized = new Promise((resolve, reject) => {
            this._initializer = { resolve, reject };
        });
    }
    /**
     * Accept the URLs from the host
     **/
    async initialize(options) {
        var _a;
        this._options = options;
        if (options.location.includes(':')) {
            const parts = options.location.split(':');
            this._driveName = parts[0];
            this._localPath = parts[1];
        }
        else {
            this._driveName = '';
            this._localPath = options.location;
        }
        await this.initRuntime(options);
        await this.initFilesystem(options);
        await this.initPackageManager(options);
        await this.initKernel(options);
        await this.initGlobals(options);
        (_a = this._initializer) === null || _a === void 0 ? void 0 : _a.resolve();
    }
    async initRuntime(options) {
        const { pyodideUrl, indexUrl } = options;
        if (pyodideUrl.endsWith('.mjs')) {
            const pyodideModule = await import(/* webpackIgnore: true */ pyodideUrl);
            this._pyodide = await pyodideModule.loadPyodide({ indexURL: indexUrl });
        }
        else {
            importScripts(pyodideUrl);
            this._pyodide = await self.loadPyodide({ indexURL: indexUrl });
        }
    }
    async initPackageManager(options) {
        if (!this._options) {
            throw new Error('Uninitialized');
        }
        const { pipliteWheelUrl, disablePyPIFallback, pipliteUrls } = this._options;
        // this is the only use of `loadPackage`, allow `piplite` to handle the rest
        await this._pyodide.loadPackage(['micropip']);
        // get piplite early enough to impact pyolite dependencies
        await this._pyodide.runPythonAsync(`
      import micropip
      await micropip.install('${pipliteWheelUrl}', keep_going=True)
      import piplite.piplite
      piplite.piplite._PIPLITE_DISABLE_PYPI = ${disablePyPIFallback ? 'True' : 'False'}
      piplite.piplite._PIPLITE_URLS = ${JSON.stringify(pipliteUrls)}
      sys.path.append('/')
    `);
    }
    async initKernel(options) {
        // from this point forward, only use piplite (but not %pip)
        await this._pyodide.runPythonAsync(`
      await piplite.install(['matplotlib', 'pandas', 'ipykernel'], keep_going=True);
      await piplite.install(['pyolite'], keep_going=True);
      await piplite.install(['ipython'], keep_going=True);
      import pyolite
    `);
        // cd to the kernel location
        if (options.mountDrive && this._localPath) {
            await this._pyodide.runPythonAsync(`
        import os;
        os.chdir("${this._localPath}");
      `);
        }
    }
    async initGlobals(options) {
        const { globals } = this._pyodide;
        this._kernel = globals.get('pyolite').kernel_instance.copy();
        this._stdout_stream = globals.get('pyolite').stdout_stream.copy();
        this._stderr_stream = globals.get('pyolite').stderr_stream.copy();
        this._interpreter = this._kernel.interpreter.copy();
        this._interpreter.send_comm = this.sendComm.bind(this);
    }
    /**
     * Setup custom Emscripten FileSystem
     */
    async initFilesystem(options) {
        if (options.mountDrive) {
            const mountpoint = '/drive';
            const { FS } = this._pyodide;
            const { baseUrl } = options;
            // TODO Once this https://github.com/pyodide/pyodide/pull/2582/files is released
            // We'll be able to acces PATH and ERRNO_CODES from this._pyodide directly (not through _module)
            const driveFS = new _jupyterlite_contents__WEBPACK_IMPORTED_MODULE_0__.DriveFS({
                FS,
                PATH: this._pyodide._module.PATH,
                ERRNO_CODES: ERRNO_CODES,
                baseUrl,
                driveName: this._driveName,
                mountpoint,
            });
            FS.mkdir(mountpoint);
            FS.mount(driveFS, {}, mountpoint);
            FS.chdir(mountpoint);
            this._driveFS = driveFS;
        }
    }
    /**
     * Recursively convert a Map to a JavaScript object
     * @param obj A Map, Array, or other  object to convert
     */
    mapToObject(obj) {
        const out = obj instanceof Array ? [] : {};
        obj.forEach((value, key) => {
            out[key] =
                value instanceof Map || value instanceof Array
                    ? this.mapToObject(value)
                    : value;
        });
        return out;
    }
    /**
     * Format the response from the Pyodide evaluation.
     *
     * @param res The result object from the Pyodide evaluation
     */
    formatResult(res) {
        if (!this._pyodide.isPyProxy(res)) {
            return res;
        }
        // TODO: this is a bit brittle
        const m = res.toJs();
        const results = this.mapToObject(m);
        return results;
    }
    /**
     * Makes sure pyodide is ready before continuing, and cache the parent message.
     */
    async setup(parent) {
        await this._initialized;
        this._kernel._parent_header = this._pyodide.toPy(parent);
    }
    /**
     * Execute code with the interpreter.
     *
     * @param content The incoming message with the code to execute.
     */
    async execute(content, parent) {
        await this.setup(parent);
        const publishExecutionResult = (prompt_count, data, metadata) => {
            const bundle = {
                execution_count: prompt_count,
                data: this.formatResult(data),
                metadata: this.formatResult(metadata),
            };
            postMessage({
                parentHeader: this.formatResult(this._kernel._parent_header)['header'],
                bundle,
                type: 'execute_result',
            });
        };
        const publishExecutionError = (ename, evalue, traceback) => {
            const bundle = {
                ename: ename,
                evalue: evalue,
                traceback: traceback,
            };
            postMessage({
                parentHeader: this.formatResult(this._kernel._parent_header)['header'],
                bundle,
                type: 'execute_error',
            });
        };
        const clearOutputCallback = (wait) => {
            const bundle = {
                wait: this.formatResult(wait),
            };
            postMessage({
                parentHeader: this.formatResult(this._kernel._parent_header)['header'],
                bundle,
                type: 'clear_output',
            });
        };
        const displayDataCallback = (data, metadata, transient) => {
            const bundle = {
                data: this.formatResult(data),
                metadata: this.formatResult(metadata),
                transient: this.formatResult(transient),
            };
            postMessage({
                parentHeader: this.formatResult(this._kernel._parent_header)['header'],
                bundle,
                type: 'display_data',
            });
        };
        const updateDisplayDataCallback = (data, metadata, transient) => {
            const bundle = {
                data: this.formatResult(data),
                metadata: this.formatResult(metadata),
                transient: this.formatResult(transient),
            };
            postMessage({
                parentHeader: this.formatResult(this._kernel._parent_header)['header'],
                bundle,
                type: 'update_display_data',
            });
        };
        const publishStreamCallback = (name, text) => {
            const bundle = {
                name: this.formatResult(name),
                text: this.formatResult(text),
            };
            postMessage({
                parentHeader: this.formatResult(this._kernel._parent_header)['header'],
                bundle,
                type: 'stream',
            });
        };
        this._stdout_stream.publish_stream_callback = publishStreamCallback;
        this._stderr_stream.publish_stream_callback = publishStreamCallback;
        this._interpreter.display_pub.clear_output_callback = clearOutputCallback;
        this._interpreter.display_pub.display_data_callback = displayDataCallback;
        this._interpreter.display_pub.update_display_data_callback =
            updateDisplayDataCallback;
        this._interpreter.displayhook.publish_execution_result = publishExecutionResult;
        this._interpreter.input = this.input.bind(this);
        this._interpreter.getpass = this.getpass.bind(this);
        const res = await this._kernel.run(content.code);
        const results = this.formatResult(res);
        if (results['status'] === 'error') {
            publishExecutionError(results['ename'], results['evalue'], results['traceback']);
        }
        return results;
    }
    /**
     * Complete the code submitted by a user.
     *
     * @param content The incoming message with the code to complete.
     */
    async complete(content, parent) {
        await this.setup(parent);
        const res = this._kernel.complete(content.code, content.cursor_pos);
        const results = this.formatResult(res);
        return results;
    }
    /**
     * Inspect the code submitted by a user.
     *
     * @param content The incoming message with the code to inspect.
     */
    async inspect(content, parent) {
        await this.setup(parent);
        const res = this._kernel.inspect(content.code, content.cursor_pos, content.detail_level);
        const results = this.formatResult(res);
        return results;
    }
    /**
     * Check code for completeness submitted by a user.
     *
     * @param content The incoming message with the code to check.
     */
    async isComplete(content, parent) {
        await this.setup(parent);
        const res = this._kernel.is_complete(content.code);
        const results = this.formatResult(res);
        return results;
    }
    /**
     * Respond to the commInfoRequest.
     *
     * @param content The incoming message with the comm target name.
     */
    async commInfo(content, parent) {
        await this.setup(parent);
        const res = this._kernel.comm_info(content.target_name);
        const results = this.formatResult(res);
        return {
            comms: results,
            status: 'ok',
        };
    }
    /**
     * Respond to the commOpen.
     *
     * @param content The incoming message with the comm open.
     */
    async commOpen(content, parent) {
        await this.setup(parent);
        const res = this._kernel.comm_manager.comm_open(this._pyodide.toPy(content));
        const results = this.formatResult(res);
        return results;
    }
    /**
     * Respond to the commMsg.
     *
     * @param content The incoming message with the comm msg.
     */
    async commMsg(content, parent) {
        await this.setup(parent);
        const res = this._kernel.comm_manager.comm_msg(this._pyodide.toPy(content));
        const results = this.formatResult(res);
        return results;
    }
    /**
     * Respond to the commClose.
     *
     * @param content The incoming message with the comm close.
     */
    async commClose(content, parent) {
        await this.setup(parent);
        const res = this._kernel.comm_manager.comm_close(this._pyodide.toPy(content));
        const results = this.formatResult(res);
        return results;
    }
    /**
     * Resolve the input request by getting back the reply from the main thread
     *
     * @param content The incoming message with the reply
     */
    async inputReply(content, parent) {
        await this.setup(parent);
        this._resolveInputReply(content);
    }
    /**
     * Send a input request to the front-end.
     *
     * @param prompt the text to show at the prompt
     * @param password Is the request for a password?
     */
    async sendInputRequest(prompt, password) {
        const content = {
            prompt,
            password,
        };
        postMessage({
            type: 'input_request',
            parentHeader: this.formatResult(this._kernel._parent_header)['header'],
            content,
        });
    }
    async getpass(prompt) {
        prompt = typeof prompt === 'undefined' ? '' : prompt;
        await this.sendInputRequest(prompt, true);
        const replyPromise = new Promise((resolve) => {
            this._resolveInputReply = resolve;
        });
        const result = await replyPromise;
        return result['value'];
    }
    async input(prompt) {
        prompt = typeof prompt === 'undefined' ? '' : prompt;
        await this.sendInputRequest(prompt, false);
        const replyPromise = new Promise((resolve) => {
            this._resolveInputReply = resolve;
        });
        const result = await replyPromise;
        return result['value'];
    }
    /**
     * Send a comm message to the front-end.
     *
     * @param type The type of the comm message.
     * @param content The content.
     * @param metadata The metadata.
     * @param ident The ident.
     * @param buffers The binary buffers.
     */
    async sendComm(type, content, metadata, ident, buffers) {
        postMessage({
            type: type,
            content: this.formatResult(content),
            metadata: this.formatResult(metadata),
            ident: this.formatResult(ident),
            buffers: this.formatResult(buffers),
            parentHeader: this.formatResult(this._kernel._parent_header)['header'],
        });
    }
}


/***/ })

}]);
//# sourceMappingURL=packages_pyolite-kernel_lib_worker_js.b4d46b8.js.map