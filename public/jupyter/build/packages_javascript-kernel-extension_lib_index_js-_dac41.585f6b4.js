"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_javascript-kernel-extension_lib_index_js-_dac41"],{

/***/ 1169:
/*!************************************************************!*\
  !*** ../packages/javascript-kernel-extension/lib/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlite/kernel */ 60699);
/* harmony import */ var _jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlite_javascript_kernel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlite/javascript-kernel */ 22047);
/* harmony import */ var _jupyterlite_javascript_kernel__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_javascript_kernel__WEBPACK_IMPORTED_MODULE_2__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.



/**
 * A plugin to register the JavaScript kernel.
 */
const kernel = {
    id: '@jupyterlite/javascript-kernel-extension:kernel',
    autoStart: true,
    requires: [_jupyterlite_kernel__WEBPACK_IMPORTED_MODULE_1__.IKernelSpecs],
    activate: (app, kernelspecs) => {
        const baseUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getBaseUrl();
        kernelspecs.register({
            spec: {
                name: 'javascript',
                display_name: 'JavaScript',
                language: 'javascript',
                argv: [],
                resources: {
                    'logo-32x32': '',
                    'logo-64x64': _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(baseUrl, '/kernelspecs/javascript.svg'),
                },
            },
            create: async (options) => {
                return new _jupyterlite_javascript_kernel__WEBPACK_IMPORTED_MODULE_2__.JavaScriptKernel(options);
            },
        });
    },
};
const plugins = [kernel];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ })

}]);
//# sourceMappingURL=packages_javascript-kernel-extension_lib_index_js-_dac41.585f6b4.js.map