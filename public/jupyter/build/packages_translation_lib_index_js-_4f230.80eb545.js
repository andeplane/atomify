"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_translation_lib_index_js-_4f230"],{

/***/ 95115:
/*!********************************************!*\
  !*** ../packages/translation/lib/index.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ITranslation": () => (/* reexport safe */ _tokens__WEBPACK_IMPORTED_MODULE_1__.ITranslation),
/* harmony export */   "Translation": () => (/* reexport safe */ _translation__WEBPACK_IMPORTED_MODULE_0__.Translation)
/* harmony export */ });
/* harmony import */ var _translation__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./translation */ 85116);
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tokens */ 90183);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/***/ }),

/***/ 90183:
/*!*********************************************!*\
  !*** ../packages/translation/lib/tokens.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ITranslation": () => (/* binding */ ITranslation)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);

/**
 * The token for the settings service.
 */
const ITranslation = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token('@jupyterlite/translation:ITranslation');


/***/ }),

/***/ 85116:
/*!**************************************************!*\
  !*** ../packages/translation/lib/translation.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Translation": () => (/* binding */ Translation)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);

/**
 * A fake locale to retrieve all the language packs.
 */
const ALL = 'all';
/**
 * A class to handle requests to /api/translations
 */
class Translation {
    constructor() {
        this._prevLocale = '';
    }
    /**
     * Get the translation data for the given locale
     * @param locale The locale
     * @returns
     */
    async get(locale) {
        const apiURL = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getBaseUrl(), `api/translations/${locale}.json`);
        try {
            const response = await fetch(apiURL);
            const json = JSON.parse(await response.text());
            if (this._prevLocale !== ALL && locale === ALL) {
                // TODO: fix this logic upstream?
                // the upstream translation plugin relies on the comparison between
                // the display name and the native name to enable or disable the commands:
                // https://github.com/jupyterlab/jupyterlab/blob/befa831ffef36321b87f352a48fbe2439df6c872/packages/translation-extension/src/index.ts#L117
                const prev = this._prevLocale;
                json.data[prev].displayName = json.data[prev].nativeName;
                if (prev !== 'en') {
                    json.data['en'].displayName = `${json.data['en'].nativeName} (default)`;
                }
            }
            this._prevLocale = locale;
            return json;
        }
        catch (e) {
            if (locale) {
                return {
                    data: {},
                    message: `Language pack '${locale}' not installed!`,
                };
            }
            return {
                data: {
                    en: { displayName: 'English', nativeName: 'English' },
                },
                message: '',
            };
        }
    }
}


/***/ })

}]);
//# sourceMappingURL=packages_translation_lib_index_js-_4f230.80eb545.js.map