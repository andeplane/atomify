"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_pyolite-kernel-extension_lib_index_js-_c0c11"],{

/***/ 65394:
/*!*********************************************************!*\
  !*** ../packages/pyolite-kernel-extension/lib/index.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlite/server */ 38170);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_server__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlite/kernel */ 60699);
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.



/**
 * The default CDN fallback for Pyodide
 */
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js';
/**
 * The id for the extension, and key in the litePlugins.
 */
const PLUGIN_ID = '@jupyterlite/pyolite-kernel-extension:kernel';
/**
 * A plugin to register the Pyodide kernel.
 */
const kernel = {
    id: PLUGIN_ID,
    autoStart: true,
    requires: [_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_2__.IKernelSpecs, _jupyterlite_server__WEBPACK_IMPORTED_MODULE_1__.IServiceWorkerRegistrationWrapper],
    activate: (app, kernelspecs, serviceWorkerRegistrationWrapper) => {
        const baseUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getBaseUrl();
        const config = JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('litePluginSettings') || '{}')[PLUGIN_ID] || {};
        const url = config.pyodideUrl || PYODIDE_CDN_URL;
        const pyodideUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.parse(url).href;
        const rawPipUrls = config.pipliteUrls || [];
        const pipliteUrls = rawPipUrls.map((pipUrl) => _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.parse(pipUrl).href);
        const disablePyPIFallback = !!config.disablePyPIFallback;
        kernelspecs.register({
            spec: {
                name: 'python',
                display_name: 'Python (Pyodide)',
                language: 'python',
                argv: [],
                resources: {
                    'logo-32x32': 'TODO',
                    'logo-64x64': _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(baseUrl, '/kernelspecs/python.svg'),
                },
            },
            create: async (options) => {
                const { PyoliteKernel } = await Promise.all(/*! import() */[__webpack_require__.e("vendors-node_modules_comlink_dist_esm_comlink_mjs"), __webpack_require__.e("webpack_sharing_consume_default_lumino_coreutils_lumino_coreutils"), __webpack_require__.e("packages_contents_lib_drivefs_js"), __webpack_require__.e("packages_pyolite-kernel_lib_worker_js"), __webpack_require__.e("packages_pyolite-kernel_lib_index_js")]).then(__webpack_require__.bind(__webpack_require__, /*! @jupyterlite/pyolite-kernel */ 38845));
                return new PyoliteKernel({
                    ...options,
                    pyodideUrl,
                    pipliteUrls,
                    disablePyPIFallback,
                    mountDrive: serviceWorkerRegistrationWrapper.enabled,
                });
            },
        });
    },
};
const plugins = [kernel];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ })

}]);
//# sourceMappingURL=packages_pyolite-kernel-extension_lib_index_js-_c0c11.5e3d9aa.js.map