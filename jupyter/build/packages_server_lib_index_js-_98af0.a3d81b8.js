"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_server_lib_index_js-_98af0"],{

/***/ 84753:
/*!*************************************!*\
  !*** ../packages/server/lib/app.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "JupyterLiteServer": () => (/* binding */ JupyterLiteServer)
/* harmony export */ });
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/services */ 33527);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lumino_application__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/application */ 95823);
/* harmony import */ var _lumino_application__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_application__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var mock_socket__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! mock-socket */ 79334);
/* harmony import */ var mock_socket__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(mock_socket__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./router */ 30035);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/**
 * Server is the main application class. It is instantiated once and shared.
 */
class JupyterLiteServer extends _lumino_application__WEBPACK_IMPORTED_MODULE_1__.Application {
    /**
     * Construct a new JupyterLite object.
     *
     * @param options The instantiation options for a JupyterLiteServer application.
     */
    constructor(options) {
        var _a;
        super(options);
        /**
         * The name of the application.
         */
        this.name = 'JupyterLite Server';
        /**
         * A namespace/prefix plugins may use to denote their provenance.
         */
        this.namespace = this.name;
        /**
         * The version of the application.
         */
        this.version = 'unknown';
        this._router = new _router__WEBPACK_IMPORTED_MODULE_3__.Router();
        this._serviceManager = new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__.ServiceManager({
            standby: 'never',
            serverSettings: {
                ..._jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__.ServerConnection.makeSettings(),
                WebSocket: mock_socket__WEBPACK_IMPORTED_MODULE_2__.WebSocket,
                fetch: (_a = this.fetch.bind(this)) !== null && _a !== void 0 ? _a : undefined,
            },
        });
    }
    /**
     * Get the underlying `Router` instance.
     */
    get router() {
        return this._router;
    }
    /**
     * Get the underlying lite service manager for this app.
     */
    get serviceManager() {
        return this._serviceManager;
    }
    /**
     * Handle an incoming request from the client.
     *
     * @param req The incoming request
     * @param init The optional init request
     */
    async fetch(req, init) {
        if (!(req instanceof Request)) {
            throw Error('Request info is not a Request');
        }
        return this._router.route(req);
    }
    /**
     * Attach the application shell to the DOM.
     *
     * @param id - The id of the host node for the shell, or `''`.
     *
     * #### Notes
     * For this server application there is no shell to attach
     */
    attachShell(id) {
        // no-op
    }
    /**
     * A method invoked on a window `'resize'` event.
     *
     * #### Notes
     * For this server application there is no shell to update
     */
    evtResize(event) {
        // no-op
    }
    /**
     * Register plugins from a plugin module.
     *
     * @param mod - The plugin module to register.
     */
    registerPluginModule(mod) {
        let data = mod.default;
        // Handle commonjs exports.
        if (!Object.prototype.hasOwnProperty.call(mod, '__esModule')) {
            data = mod;
        }
        if (!Array.isArray(data)) {
            data = [data];
        }
        data.forEach((item) => {
            try {
                this.registerPlugin(item);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    /**
     * Register the plugins from multiple plugin modules.
     *
     * @param mods - The plugin modules to register.
     */
    registerPluginModules(mods) {
        mods.forEach((mod) => {
            this.registerPluginModule(mod);
        });
    }
}


/***/ }),

/***/ 38941:
/*!***************************************!*\
  !*** ../packages/server/lib/index.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IServiceWorkerRegistrationWrapper": () => (/* reexport safe */ _tokens__WEBPACK_IMPORTED_MODULE_2__.IServiceWorkerRegistrationWrapper),
/* harmony export */   "JupyterLiteServer": () => (/* reexport safe */ _app__WEBPACK_IMPORTED_MODULE_0__.JupyterLiteServer),
/* harmony export */   "Router": () => (/* reexport safe */ _router__WEBPACK_IMPORTED_MODULE_1__.Router),
/* harmony export */   "ServiceWorkerRegistrationWrapper": () => (/* reexport safe */ _serviceworker__WEBPACK_IMPORTED_MODULE_3__.ServiceWorkerRegistrationWrapper)
/* harmony export */ });
/* harmony import */ var _app__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./app */ 84753);
/* harmony import */ var _router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./router */ 30035);
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tokens */ 26678);
/* harmony import */ var _serviceworker__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./serviceworker */ 93652);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.






/***/ }),

/***/ 30035:
/*!****************************************!*\
  !*** ../packages/server/lib/router.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Router": () => (/* binding */ Router)
/* harmony export */ });
/**
 * A simple router.
 */
class Router {
    constructor() {
        this._routes = [];
    }
    /**
     * Add a new GET route
     *
     * @param pattern The pattern to match
     * @param callback The function to call on pattern match
     *
     */
    get(pattern, callback) {
        this._add('GET', pattern, callback);
    }
    /**
     * Add a new PUT route
     *
     * @param pattern The pattern to match
     * @param callback The function to call on pattern match
     *
     */
    put(pattern, callback) {
        this._add('PUT', pattern, callback);
    }
    /**
     * Add a new POST route
     *
     * @param pattern The pattern to match
     * @param callback The function to call on pattern match
     *
     */
    post(pattern, callback) {
        this._add('POST', pattern, callback);
    }
    /**
     * Add a new PATCH route
     *
     * @param pattern The pattern to match
     * @param callback The function to call on pattern match
     *
     */
    patch(pattern, callback) {
        this._add('PATCH', pattern, callback);
    }
    /**
     * Add a new DELETE route
     *
     * @param pattern The pattern to match
     * @param callback The function to call on pattern match
     *
     */
    delete(pattern, callback) {
        this._add('DELETE', pattern, callback);
    }
    /**
     * Route a request.
     *
     * @param req The request to route.
     */
    async route(req) {
        const url = new URL(req.url);
        const { method } = req;
        const { pathname } = url;
        for (const r of this._routes) {
            if (r.method !== method) {
                continue;
            }
            const match = pathname.match(r.pattern);
            if (!match) {
                continue;
            }
            const matches = match.slice(1);
            let body;
            if (r.method === 'PATCH' || r.method === 'PUT' || r.method === 'POST') {
                try {
                    body = JSON.parse(await req.text());
                }
                catch {
                    body = undefined;
                }
            }
            return r.callback.call(null, {
                pathname,
                body,
                query: Object.fromEntries(url.searchParams),
            }, ...matches);
        }
        throw new Error('Cannot route ' + req.method + ' ' + req.url);
    }
    /**
     * Add a new route.
     *
     * @param method The method
     * @param pattern The pattern
     * @param callback The callback
     */
    _add(method, pattern, callback) {
        if (typeof pattern === 'string') {
            pattern = new RegExp(pattern);
        }
        this._routes.push({
            method,
            pattern,
            callback,
        });
    }
}


/***/ }),

/***/ 93652:
/*!***********************************************!*\
  !*** ../packages/server/lib/serviceworker.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ServiceWorkerRegistrationWrapper": () => (/* binding */ ServiceWorkerRegistrationWrapper)
/* harmony export */ });
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/signaling */ 62318);
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_signaling__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__);


class ServiceWorkerRegistrationWrapper {
    constructor() {
        this._registration = null;
        this._registrationChanged = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_0__.Signal(this);
        this.initialize();
    }
    /**
     * A signal emitted when the registration changes.
     */
    get registrationChanged() {
        return this._registrationChanged;
    }
    /**
     * Whether the ServiceWorker is enabled or not.
     */
    get enabled() {
        return this._registration !== null;
    }
    async initialize() {
        if (!('serviceWorker' in navigator)) {
            console.error('ServiceWorker registration failed: Service Workers not supported in this browser');
            this.setRegistration(null);
        }
        if (navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.getRegistration(navigator.serviceWorker.controller.scriptURL);
            if (registration) {
                this.setRegistration(registration);
            }
        }
        return await navigator.serviceWorker
            .register(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.URLExt.join(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getBaseUrl(), 'services.js'))
            .then((registration) => {
            this.setRegistration(registration);
        }, (err) => {
            console.error(`ServiceWorker registration failed: ${err}`);
            this.setRegistration(null);
        });
    }
    setRegistration(registration) {
        this._registration = registration;
        this._registrationChanged.emit(this._registration);
    }
}


/***/ }),

/***/ 26678:
/*!****************************************!*\
  !*** ../packages/server/lib/tokens.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "IServiceWorkerRegistrationWrapper": () => (/* binding */ IServiceWorkerRegistrationWrapper)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);

/**
 * The token for the ServiceWorker.
 */
const IServiceWorkerRegistrationWrapper = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token('@jupyterlite/server-extension:IServiceWorkerRegistrationWrapper');


/***/ })

}]);
//# sourceMappingURL=packages_server_lib_index_js-_98af0.a3d81b8.js.map