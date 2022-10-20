"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_application_lib_index_js"],{

/***/ 21451:
/*!********************************************!*\
  !*** ../packages/application/lib/index.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ISingleWidgetShell": () => (/* reexport safe */ _singleWidgetShell__WEBPACK_IMPORTED_MODULE_1__.ISingleWidgetShell),
/* harmony export */   "SingleWidgetApp": () => (/* reexport safe */ _singleWidgetApp__WEBPACK_IMPORTED_MODULE_0__.SingleWidgetApp),
/* harmony export */   "SingleWidgetShell": () => (/* reexport safe */ _singleWidgetShell__WEBPACK_IMPORTED_MODULE_1__.SingleWidgetShell)
/* harmony export */ });
/* harmony import */ var _singleWidgetApp__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./singleWidgetApp */ 19153);
/* harmony import */ var _singleWidgetShell__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./singleWidgetShell */ 84929);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/***/ }),

/***/ 19153:
/*!******************************************************!*\
  !*** ../packages/application/lib/singleWidgetApp.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SingleWidgetApp": () => (/* binding */ SingleWidgetApp)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ 70714);
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_application_lib_mimerenderers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/application/lib/mimerenderers */ 75677);
/* harmony import */ var _jupyterlab_application_lib_status__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/application/lib/status */ 20389);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/coreutils */ 79615);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _singleWidgetShell__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./singleWidgetShell */ 84929);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.





/**
 * App is the main application class. It is instantiated once and shared.
 */
class SingleWidgetApp extends _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.JupyterFrontEnd {
    /**
     * Construct a new SingleWidgetApp object.
     *
     * @param options The instantiation options for an application.
     */
    constructor(options = { shell: new _singleWidgetShell__WEBPACK_IMPORTED_MODULE_2__.SingleWidgetShell() }) {
        var _a, _b;
        super({
            ...options,
            shell: (_a = options.shell) !== null && _a !== void 0 ? _a : new _singleWidgetShell__WEBPACK_IMPORTED_MODULE_2__.SingleWidgetShell(),
        });
        /**
         * The name of the application.
         */
        this.name = 'Single Widget Application';
        /**
         * A namespace/prefix plugins may use to denote their provenance.
         */
        this.namespace = this.name;
        /**
         * The application busy and dirty status signals and flags.
         */
        this.status = new _jupyterlab_application_lib_status__WEBPACK_IMPORTED_MODULE_3__.LabStatus(this);
        /**
         * The version of the application.
         */
        this.version = (_b = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('appVersion')) !== null && _b !== void 0 ? _b : 'unknown';
        if (options.mimeExtensions) {
            for (const plugin of (0,_jupyterlab_application_lib_mimerenderers__WEBPACK_IMPORTED_MODULE_4__.createRendermimePlugins)(options.mimeExtensions)) {
                this.registerPlugin(plugin);
            }
        }
    }
    /**
     * The JupyterLab application paths dictionary.
     */
    get paths() {
        return {
            urls: {
                base: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('baseUrl'),
                notFound: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('notFoundUrl'),
                app: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('appUrl'),
                static: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('staticUrl'),
                settings: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('settingsUrl'),
                themes: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('themesUrl'),
                doc: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('docUrl'),
                translations: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('translationsApiUrl'),
                hubHost: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('hubHost') || undefined,
                hubPrefix: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('hubPrefix') || undefined,
                hubUser: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('hubUser') || undefined,
                hubServerName: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('hubServerName') || undefined,
            },
            directories: {
                appSettings: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('appSettingsDir'),
                schemas: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('schemasDir'),
                static: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('staticDir'),
                templates: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('templatesDir'),
                themes: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('themesDir'),
                userSettings: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('userSettingsDir'),
                serverRoot: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('serverRoot'),
                workspaces: _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('workspacesDir'),
            },
        };
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

/***/ 84929:
/*!********************************************************!*\
  !*** ../packages/application/lib/singleWidgetShell.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ISingleWidgetShell": () => (/* binding */ ISingleWidgetShell),
/* harmony export */   "SingleWidgetShell": () => (/* binding */ SingleWidgetShell)
/* harmony export */ });
/* harmony import */ var _lumino_algorithm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/algorithm */ 43892);
/* harmony import */ var _lumino_algorithm__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_algorithm__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/signaling */ 62318);
/* harmony import */ var _lumino_signaling__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_signaling__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @lumino/widgets */ 60150);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_3__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/**
 * The single widget application shell token.
 */
const ISingleWidgetShell = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_1__.Token('@jupyterlite/application:ISingleWidgetShell');
/**
 * The application shell.
 */
class SingleWidgetShell extends _lumino_widgets__WEBPACK_IMPORTED_MODULE_3__.Widget {
    constructor() {
        super();
        this._currentChanged = new _lumino_signaling__WEBPACK_IMPORTED_MODULE_2__.Signal(this);
        this.id = 'main';
        const rootLayout = new _lumino_widgets__WEBPACK_IMPORTED_MODULE_3__.PanelLayout();
        this._main = new _lumino_widgets__WEBPACK_IMPORTED_MODULE_3__.Panel();
        this._main.id = 'single-widget-panel';
        rootLayout.addWidget(this._main);
        this.layout = rootLayout;
    }
    /**
     * A signal emitted when the current widget changes.
     */
    get currentChanged() {
        return this._currentChanged;
    }
    /**
     * The current widget in the shell's main area.
     */
    get currentWidget() {
        var _a;
        return (_a = this._main.widgets[0]) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Activate a widget in its area.
     */
    activateById(id) {
        const widget = (0,_lumino_algorithm__WEBPACK_IMPORTED_MODULE_0__.find)(this.widgets('main'), (w) => w.id === id);
        if (widget) {
            widget.activate();
        }
    }
    /**
     * Add a widget to the application shell.
     *
     * @param widget - The widget being added.
     *
     * @param area - Optional region in the shell into which the widget should
     * be added.
     *
     * @param options - Optional open options.
     *
     */
    add(widget, area, options) {
        if (area === 'main' || area === undefined) {
            if (this._main.widgets.length > 0) {
                // do not add the widget if there is already one
                return;
            }
            this._main.addWidget(widget);
            this._main.update();
            this._currentChanged.emit(void 0);
        }
    }
    /**
     * Return the list of widgets for the given area.
     *
     * @param area The area
     */
    widgets(area) {
        switch (area !== null && area !== void 0 ? area : 'main') {
            case 'main':
                return (0,_lumino_algorithm__WEBPACK_IMPORTED_MODULE_0__.iter)(this._main.widgets);
            default:
                throw new Error(`Invalid area: ${area}`);
        }
    }
}


/***/ })

}]);
//# sourceMappingURL=packages_application_lib_index_js.efc9e49.js.map