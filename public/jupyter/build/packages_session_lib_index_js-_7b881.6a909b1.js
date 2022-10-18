"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_session_lib_index_js-_7b881"],{

/***/ 16494:
/*!****************************************!*\
  !*** ../packages/session/lib/index.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ISessions": () => (/* reexport safe */ _tokens__WEBPACK_IMPORTED_MODULE_0__.ISessions),
/* harmony export */   "Sessions": () => (/* reexport safe */ _sessions__WEBPACK_IMPORTED_MODULE_1__.Sessions)
/* harmony export */ });
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tokens */ 92246);
/* harmony import */ var _sessions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sessions */ 21170);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/***/ }),

/***/ 21170:
/*!*******************************************!*\
  !*** ../packages/session/lib/sessions.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Sessions": () => (/* binding */ Sessions)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lumino_algorithm__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/algorithm */ 43892);
/* harmony import */ var _lumino_algorithm__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_algorithm__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__);



/**
 * A class to handle requests to /api/sessions
 */
class Sessions {
    /**
     * Construct a new Sessions.
     *
     * @param options The instantiation options for a Sessions.
     */
    constructor(options) {
        // TODO: offload to a database
        this._sessions = [];
        this._kernels = options.kernels;
    }
    /**
     * Get a session by id.
     *
     * @param id The id of the session.
     */
    async get(id) {
        const session = this._sessions.find((s) => s.id === id);
        if (!session) {
            throw Error(`Session ${id} not found`);
        }
        return session;
    }
    /**
     * List the running sessions
     */
    async list() {
        return this._sessions;
    }
    /**
     * Path an existing session.
     * This can be used to rename a session.
     *
     * - path updates session to track renamed paths
     * - kernel.name starts a new kernel with a given kernelspec
     *
     * @param options The options to patch the session.
     */
    async patch(options) {
        const { id, path, name, kernel } = options;
        const index = this._sessions.findIndex((s) => s.id === id);
        const session = this._sessions[index];
        if (!session) {
            throw Error(`Session ${id} not found`);
        }
        const patched = {
            ...session,
            path: path !== null && path !== void 0 ? path : session.path,
            name: name !== null && name !== void 0 ? name : session.name,
        };
        if (kernel) {
            // Kernel id takes precedence over name.
            if (kernel.id) {
                const session = this._sessions.find((session) => { var _a; return ((_a = session.kernel) === null || _a === void 0 ? void 0 : _a.id) === (kernel === null || kernel === void 0 ? void 0 : kernel.id); });
                if (session) {
                    patched.kernel = session.kernel;
                }
            }
            else if (kernel.name) {
                const newKernel = await this._kernels.startNew({
                    id: _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__.UUID.uuid4(),
                    name: kernel.name,
                    location: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.dirname(patched.path),
                });
                if (newKernel) {
                    patched.kernel = newKernel;
                }
            }
        }
        this._sessions[index] = patched;
        return patched;
    }
    /**
     * Start a new session
     * TODO: read path and name
     *
     * @param options The options to start a new session.
     */
    async startNew(options) {
        var _a, _b, _c;
        const { path, name } = options;
        const running = this._sessions.find((s) => s.name === name);
        if (running) {
            return running;
        }
        const kernelName = (_b = (_a = options.kernel) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '';
        const id = (_c = options.id) !== null && _c !== void 0 ? _c : _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__.UUID.uuid4();
        const kernel = await this._kernels.startNew({
            id,
            name: kernelName,
            location: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PathExt.dirname(options.path),
        });
        const session = {
            id,
            path,
            name: name !== null && name !== void 0 ? name : path,
            type: 'notebook',
            kernel: {
                id: kernel.id,
                name: kernel.name,
            },
        };
        this._sessions.push(session);
        return session;
    }
    /**
     * Shut down a session.
     *
     * @param id The id of the session to shut down.
     */
    async shutdown(id) {
        var _a;
        const session = this._sessions.find((s) => s.id === id);
        if (!session) {
            throw Error(`Session ${id} not found`);
        }
        const kernelId = (_a = session.kernel) === null || _a === void 0 ? void 0 : _a.id;
        if (kernelId) {
            await this._kernels.shutdown(kernelId);
        }
        _lumino_algorithm__WEBPACK_IMPORTED_MODULE_1__.ArrayExt.removeFirstOf(this._sessions, session);
    }
}


/***/ }),

/***/ 92246:
/*!*****************************************!*\
  !*** ../packages/session/lib/tokens.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ISessions": () => (/* binding */ ISessions)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);

/**
 * The token for the sessions service.
 */
const ISessions = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token('@jupyterlite/session:ISessions');


/***/ })

}]);
//# sourceMappingURL=packages_session_lib_index_js-_7b881.6a909b1.js.map