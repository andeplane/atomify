"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_settings_lib_index_js-_52a40"],{

/***/ 41349:
/*!*****************************************!*\
  !*** ../packages/settings/lib/index.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ISettings": () => (/* reexport safe */ _tokens__WEBPACK_IMPORTED_MODULE_1__.ISettings),
/* harmony export */   "Settings": () => (/* reexport safe */ _settings__WEBPACK_IMPORTED_MODULE_0__.Settings)
/* harmony export */ });
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./settings */ 45558);
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tokens */ 43212);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/***/ }),

/***/ 45558:
/*!********************************************!*\
  !*** ../packages/settings/lib/settings.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Settings": () => (/* binding */ Settings)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var json5__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! json5 */ 60850);
/* harmony import */ var json5__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(json5__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__);



/**
 * The name of the local storage.
 */
const DEFAULT_STORAGE_NAME = 'JupyterLite Storage';
/**
 * A class to handle requests to /api/settings
 */
class Settings {
    constructor(options) {
        this._storageName = DEFAULT_STORAGE_NAME;
        this._storageDrivers = null;
        this._localforage = options.localforage;
        this._storageName = options.storageName || DEFAULT_STORAGE_NAME;
        this._storageDrivers = options.storageDrivers || null;
        this._ready = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_2__.PromiseDelegate();
    }
    /**
     * A promise that resolves when the settings storage is fully initialized
     */
    get ready() {
        return this._ready.promise;
    }
    /**
     * A lazy reference to initialized storage
     */
    get storage() {
        return this.ready.then(() => this._storage);
    }
    /**
     * Finish any initialization after server has started and all extensions are applied.
     */
    async initialize() {
        await this.initStorage();
        this._ready.resolve(void 0);
    }
    /**
     * Prepare the storage
     */
    async initStorage() {
        this._storage = this.defaultSettingsStorage();
    }
    /**
     * Get default options for localForage instances
     */
    get defaultStorageOptions() {
        var _a;
        const driver = ((_a = this._storageDrivers) === null || _a === void 0 ? void 0 : _a.length) ? this._storageDrivers : null;
        return {
            version: 1,
            name: this._storageName,
            ...(driver ? { driver } : {}),
        };
    }
    /**
     * Create a settings store.
     */
    defaultSettingsStorage() {
        return this._localforage.createInstance({
            description: 'Offline Storage for Settings',
            storeName: 'settings',
            ...this.defaultStorageOptions,
        });
    }
    /**
     * Get settings by plugin id
     *
     * @param pluginId the id of the plugin
     *
     */
    async get(pluginId) {
        const all = await this.getAll();
        const settings = all.settings;
        let found = settings.find((setting) => {
            return setting.id === pluginId;
        });
        if (!found) {
            found = await this._getFederated(pluginId);
        }
        return found;
    }
    /**
     * Get all the settings
     */
    async getAll() {
        var _a;
        const settingsUrl = (_a = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('settingsUrl')) !== null && _a !== void 0 ? _a : '/';
        const storage = await this.storage;
        const all = (await (await fetch(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settingsUrl, 'all.json'))).json());
        const settings = await Promise.all(all.map(async (plugin) => {
            var _a;
            const { id } = plugin;
            const raw = (_a = (await storage.getItem(id))) !== null && _a !== void 0 ? _a : plugin.raw;
            return {
                ...Private.override(plugin),
                raw,
                settings: json5__WEBPACK_IMPORTED_MODULE_1__.parse(raw),
            };
        }));
        return { settings };
    }
    /**
     * Save settings for a given plugin id
     *
     * @param pluginId The id of the plugin
     * @param raw The raw settings
     *
     */
    async save(pluginId, raw) {
        await (await this.storage).setItem(pluginId, raw);
    }
    /**
     * Get the settings for a federated extension
     *
     * @param pluginId The id of a plugin
     */
    async _getFederated(pluginId) {
        var _a;
        const [packageName, schemaName] = pluginId.split(':');
        if (!Private.isFederated(packageName)) {
            return;
        }
        const labExtensionsUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('fullLabextensionsUrl');
        const schemaUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(labExtensionsUrl, packageName, 'schemas', packageName, `${schemaName}.json`);
        const packageUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(labExtensionsUrl, packageName, 'package.json');
        const schema = await (await fetch(schemaUrl)).json();
        const packageJson = await (await fetch(packageUrl)).json();
        const raw = (_a = (await (await this.storage).getItem(pluginId))) !== null && _a !== void 0 ? _a : '{}';
        const settings = json5__WEBPACK_IMPORTED_MODULE_1__.parse(raw) || {};
        return Private.override({
            id: pluginId,
            raw,
            schema,
            settings,
            version: packageJson.version || '3.0.8',
        });
    }
}
/**
 * A namespace for private data
 */
var Private;
(function (Private) {
    const _overrides = JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('settingsOverrides') || '{}');
    /**
     * Test whether this package is configured in `federated_extensions` in this app
     *
     * @param packageName The npm name of a package
     */
    function isFederated(packageName) {
        let federated;
        try {
            federated = JSON.parse(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.PageConfig.getOption('federated_extensions'));
        }
        catch {
            return false;
        }
        for (const { name } of federated) {
            if (name === packageName) {
                return true;
            }
        }
        return false;
    }
    Private.isFederated = isFederated;
    /**
     * Override the defaults of the schema with ones from PageConfig
     *
     * @see https://github.com/jupyterlab/jupyterlab_server/blob/v2.5.2/jupyterlab_server/settings_handler.py#L216-L227
     */
    function override(plugin) {
        if (_overrides[plugin.id]) {
            if (!plugin.schema.properties) {
                // probably malformed, or only provides keyboard shortcuts, etc.
                plugin.schema.properties = {};
            }
            for (const [prop, propDefault] of Object.entries(_overrides[plugin.id] || {})) {
                plugin.schema.properties[prop].default = propDefault;
            }
        }
        return plugin;
    }
    Private.override = override;
})(Private || (Private = {}));


/***/ }),

/***/ 43212:
/*!******************************************!*\
  !*** ../packages/settings/lib/tokens.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ISettings": () => (/* binding */ ISettings)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);

/**
 * The token for the settings service.
 */
const ISettings = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token('@jupyterlite/settings:ISettings');


/***/ })

}]);
//# sourceMappingURL=packages_settings_lib_index_js-_52a40.4da6a14.js.map