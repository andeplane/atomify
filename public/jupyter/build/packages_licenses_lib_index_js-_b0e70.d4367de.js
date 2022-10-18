"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_licenses_lib_index_js-_b0e70"],{

/***/ 2677:
/*!*****************************************!*\
  !*** ../packages/licenses/lib/index.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ILicenses": () => (/* reexport safe */ _tokens__WEBPACK_IMPORTED_MODULE_1__.ILicenses),
/* harmony export */   "Licenses": () => (/* reexport safe */ _licenses__WEBPACK_IMPORTED_MODULE_0__.Licenses),
/* harmony export */   "THIRD_PARTY_LICENSES": () => (/* reexport safe */ _tokens__WEBPACK_IMPORTED_MODULE_1__.THIRD_PARTY_LICENSES)
/* harmony export */ });
/* harmony import */ var _licenses__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./licenses */ 5260);
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tokens */ 91085);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/***/ }),

/***/ 5260:
/*!********************************************!*\
  !*** ../packages/licenses/lib/licenses.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Licenses": () => (/* binding */ Licenses)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tokens */ 91085);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


/**
 * An empty bundle.
 */
const EMPTY_BUNDLE = Object.freeze({ packages: [] });
/**
 * A JupyterLite implementation of the jupyterlab_server licenses route
 */
class Licenses {
    /**
     * A GET handler for the licenses
     */
    async get() {
        return {
            bundles: {
                ...(await this._getFederated()),
                [this.appName]: await this._getAppLicenses(),
            },
        };
    }
    /**
     * Get the app name (or default).
     */
    get appName() {
        return _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('appName') || 'JupyterLite';
    }
    /**
     * Get the well-known URL of the app licenses.
     */
    get appLicensesUrl() {
        return _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getBaseUrl(), 'build', _tokens__WEBPACK_IMPORTED_MODULE_1__.THIRD_PARTY_LICENSES);
    }
    /**
     * Get the lab extension base url.
     */
    get labExtensionsUrl() {
        return _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('fullLabextensionsUrl');
    }
    /**
     * Resolve the licenses for the app distribution itself, or the empty bundle.
     */
    async _getAppLicenses() {
        let bundle = EMPTY_BUNDLE;
        try {
            const response = await fetch(this.appLicensesUrl);
            bundle = response.json();
        }
        catch (err) {
            console.warn('Could not resolve licenses for', this.appName);
        }
        return bundle;
    }
    /**
     * Resolve the licenses for all federated extensions.
     */
    async _getFederated() {
        const bundles = {};
        let federated;
        try {
            federated = JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('federated_extensions'));
        }
        catch {
            return bundles;
        }
        const promises = [];
        for (const ext of federated) {
            promises.push(this._getOneFederated(ext, bundles));
        }
        try {
            await Promise.all(promises);
        }
        catch (err) {
            console.warn('Error resolving licenses', err);
        }
        return bundles;
    }
    /**
     * Update the bundles with the extension's licenses, or the empty bundle.
     */
    async _getOneFederated(ext, bundles) {
        try {
            const url = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(this.labExtensionsUrl, ext.name, 'static', _tokens__WEBPACK_IMPORTED_MODULE_1__.THIRD_PARTY_LICENSES);
            const response = await fetch(url);
            bundles[ext.name] = await response.json();
        }
        catch {
            console.warn('Could not resolve licenses for', ext);
            bundles[ext.name] = EMPTY_BUNDLE;
        }
    }
}


/***/ }),

/***/ 91085:
/*!******************************************!*\
  !*** ../packages/licenses/lib/tokens.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ILicenses": () => (/* binding */ ILicenses),
/* harmony export */   "THIRD_PARTY_LICENSES": () => (/* binding */ THIRD_PARTY_LICENSES)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * The well-known name of the file. Can actually be configured by alternate
 * implementations, but the default is probably good enough for "best-effort."
 */
const THIRD_PARTY_LICENSES = 'third-party-licenses.json';
/**
 * The token for the licenses service.
 */
const ILicenses = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token('@jupyterlite/licenses:ILicenses');


/***/ })

}]);
//# sourceMappingURL=packages_licenses_lib_index_js-_b0e70.d4367de.js.map