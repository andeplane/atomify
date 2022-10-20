"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_retro-application-extension_lib_index_js-_4d390"],{

/***/ 76475:
/*!************************************************************!*\
  !*** ../packages/retro-application-extension/lib/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_console__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/console */ 48203);
/* harmony import */ var _jupyterlab_console__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_console__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/coreutils */ 79615);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/docmanager */ 95392);
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlite/ui-components */ 87729);
/* harmony import */ var _jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @lumino/widgets */ 60150);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _retrolab_application__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @retrolab/application */ 95191);
/* harmony import */ var _retrolab_application__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_retrolab_application__WEBPACK_IMPORTED_MODULE_5__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.






/**
 * Open consoles in a new tab.
 */
const consoles = {
    id: '@jupyterlite/retro-application-extension:consoles',
    requires: [_jupyterlab_console__WEBPACK_IMPORTED_MODULE_0__.IConsoleTracker],
    autoStart: true,
    activate: (app, tracker) => {
        const baseUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getBaseUrl();
        tracker.widgetAdded.connect(async (send, console) => {
            const { sessionContext } = console;
            const page = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('retroPage');
            if (page === 'consoles') {
                return;
            }
            const path = sessionContext.path;
            window.open(`${baseUrl}retro/consoles?path=${path}`, '_blank');
            // the widget is not needed anymore
            console.dispose();
        });
    },
};
/**
 * A plugin to open document in a new browser tab.
 *
 * TODO: remove and use a custom doc manager?
 */
const docmanager = {
    id: '@jupyterlite/retro-application-extension:docmanager',
    requires: [_jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__.IDocumentManager],
    autoStart: true,
    activate: (app, docManager) => {
        const baseUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getBaseUrl();
        // patch the `docManager.open` option to prevent the default behavior
        const docOpen = docManager.open;
        docManager.open = (path, widgetName = 'default', kernel, options) => {
            const ref = options === null || options === void 0 ? void 0 : options.ref;
            if (ref === '_noref') {
                docOpen.call(docManager, path, widgetName, kernel, options);
                return;
            }
            const ext = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PathExt.extname(path);
            const route = ext === '.ipynb' ? 'notebooks' : 'edit';
            window.open(`${baseUrl}retro/${route}?path=${path}`);
            return undefined;
        };
    },
};
/**
 * The logo plugin.
 */
const logo = {
    id: '@jupyterlite/retro-application-extension:logo',
    autoStart: true,
    activate: (app) => {
        const baseUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getBaseUrl();
        const node = document.createElement('a');
        node.href = `${baseUrl}retro/tree`;
        node.target = '_blank';
        node.rel = 'noopener noreferrer';
        const logo = new _lumino_widgets__WEBPACK_IMPORTED_MODULE_4__.Widget({ node });
        _jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_3__.liteWordmark.element({
            container: node,
            elementPosition: 'center',
            padding: '2px 2px 2px 8px',
            height: '28px',
            width: 'auto',
        });
        logo.id = 'jp-RetroLogo';
        app.shell.add(logo, 'top', { rank: 0 });
    },
};
/**
 * A plugin to trigger a refresh of the commands when the shell layout changes.
 */
const notifyCommands = {
    id: '@jupyterlite/retro-application-extension:notify-commands',
    autoStart: true,
    optional: [_retrolab_application__WEBPACK_IMPORTED_MODULE_5__.IRetroShell],
    activate: (app, retroShell) => {
        if (retroShell) {
            retroShell.currentChanged.connect(() => {
                requestAnimationFrame(() => {
                    app.commands.notifyCommandChanged();
                });
            });
        }
    },
};
const plugins = [
    consoles,
    docmanager,
    logo,
    notifyCommands,
];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ })

}]);
//# sourceMappingURL=packages_retro-application-extension_lib_index_js-_4d390.76eca66.js.map