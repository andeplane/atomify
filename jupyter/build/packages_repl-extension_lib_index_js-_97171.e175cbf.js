"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_repl-extension_lib_index_js-_97171"],{

/***/ 19282:
/*!***********************************************!*\
  !*** ../packages/repl-extension/lib/index.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ 63109);
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils */ 94367);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_console__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/console */ 13414);
/* harmony import */ var _jupyterlab_console__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_console__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_translation__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/translation */ 13790);
/* harmony import */ var _jupyterlab_translation__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_translation__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/ui-components */ 6002);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _jupyterlite_application__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jupyterlite/application */ 87150);
/* harmony import */ var _jupyterlite_application__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_application__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @jupyterlite/ui-components */ 87729);
/* harmony import */ var _jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @lumino/widgets */ 60150);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_7__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.








/**
 * The name of the translation bundle for internationalized strings.
 */
const I18N_BUNDLE = 'jupyterlite';
/**
 * A plugin to add buttons to the console toolbar.
 */
const buttons = {
    id: '@jupyterlite/console-application:buttons',
    autoStart: true,
    requires: [_jupyterlab_translation__WEBPACK_IMPORTED_MODULE_3__.ITranslator],
    optional: [_jupyterlab_console__WEBPACK_IMPORTED_MODULE_2__.IConsoleTracker],
    activate: (app, translator, tracker) => {
        if (!tracker) {
            return;
        }
        const { commands } = app;
        const trans = translator.load(I18N_BUNDLE);
        // wrapper commands to be able to override the icon
        const runCommand = 'repl:run';
        commands.addCommand(runCommand, {
            caption: trans.__('Run'),
            icon: _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_4__.runIcon,
            execute: () => {
                return commands.execute('console:run-forced');
            },
        });
        const runButton = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.CommandToolbarButton({
            commands,
            id: runCommand,
        });
        const restartCommand = 'repl:restart';
        commands.addCommand(restartCommand, {
            caption: trans.__('Restart'),
            icon: _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_4__.refreshIcon,
            execute: () => {
                return commands.execute('console:restart-kernel');
            },
        });
        const restartButton = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.CommandToolbarButton({
            commands,
            id: restartCommand,
        });
        const clearCommand = 'repl:clear';
        commands.addCommand(clearCommand, {
            caption: trans.__('Clear'),
            icon: _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_4__.clearIcon,
            execute: () => {
                return commands.execute('console:clear');
            },
        });
        const clearButton = new _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.CommandToolbarButton({
            commands,
            id: clearCommand,
        });
        tracker.widgetAdded.connect((_, console) => {
            const { toolbar } = console;
            console.toolbar.addItem('run', runButton);
            console.toolbar.addItem('restart', restartButton);
            console.toolbar.addItem('clear', clearButton);
            toolbar.addItem('spacer', _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.Toolbar.createSpacerItem());
            const node = document.createElement('a');
            node.title = trans.__('Powered by JupyterLite');
            node.href = 'https://github.com/jupyterlite/jupyterlite';
            node.target = '_blank';
            node.rel = 'noopener noreferrer';
            const poweredBy = new _lumino_widgets__WEBPACK_IMPORTED_MODULE_7__.Widget({ node });
            _jupyterlite_ui_components__WEBPACK_IMPORTED_MODULE_6__.liteIcon.element({
                container: node,
                elementPosition: 'center',
                margin: '2px 2px 2px 8px',
                height: 'auto',
                width: '16px',
            });
            poweredBy.addClass('jp-PoweredBy');
            toolbar.insertAfter('spacer', 'powered-by', poweredBy);
        });
    },
};
/**
 * A plugin to open a code console and
 * parse custom parameters from the query string arguments.
 */
const consolePlugin = {
    id: '@jupyterlite/repl-extension:console',
    autoStart: true,
    optional: [_jupyterlab_console__WEBPACK_IMPORTED_MODULE_2__.IConsoleTracker, _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.IThemeManager],
    activate: (app, tracker, themeManager) => {
        var _a;
        if (!tracker) {
            return;
        }
        const { commands, serviceManager, started } = app;
        const search = window.location.search;
        const urlParams = new URLSearchParams(search);
        const code = urlParams.getAll('code');
        const kernel = urlParams.get('kernel') || undefined;
        const theme = (_a = urlParams.get('theme')) === null || _a === void 0 ? void 0 : _a.trim();
        const toolbar = urlParams.get('toolbar');
        Promise.all([started, serviceManager.ready]).then(async () => {
            commands.execute('console:create', { kernelPreference: { name: kernel } });
        });
        if (theme && themeManager) {
            const themeName = decodeURIComponent(theme);
            themeManager.setTheme(themeName);
        }
        tracker.widgetAdded.connect(async (_, widget) => {
            const { console } = widget;
            if (!toolbar) {
                // hide the toolbar by default if not specified
                widget.toolbar.dispose();
            }
            if (code) {
                await console.sessionContext.ready;
                code.forEach((line) => console.inject(line));
            }
        });
    },
};
/**
 * The default JupyterLab application status provider.
 */
const status = {
    id: '@jupyterlite/repl-extension:status',
    autoStart: true,
    provides: _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabStatus,
    requires: [_jupyterlab_translation__WEBPACK_IMPORTED_MODULE_3__.ITranslator],
    activate: (app, translator) => {
        if (!(app instanceof _jupyterlite_application__WEBPACK_IMPORTED_MODULE_5__.SingleWidgetApp)) {
            const trans = translator.load(I18N_BUNDLE);
            throw new Error(trans.__('%1 must be activated in SingleWidgetApp.', status.id));
        }
        return app.status;
    },
};
/**
 * The default paths for a single widget app.
 */
const paths = {
    id: '@jupyterlite/repl-extension:paths',
    autoStart: true,
    provides: _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.JupyterFrontEnd.IPaths,
    activate: (app) => {
        if (!(app instanceof _jupyterlite_application__WEBPACK_IMPORTED_MODULE_5__.SingleWidgetApp)) {
            throw new Error(`${paths.id} must be activated in SingleWidgetApp.`);
        }
        return app.paths;
    },
};
/**
 * The default URL router provider.
 */
const router = {
    id: '@jupyterlite/repl-extension:router',
    autoStart: true,
    provides: _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.IRouter,
    requires: [_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.JupyterFrontEnd.IPaths],
    activate: (app, paths) => {
        const { commands } = app;
        const base = paths.urls.base;
        const router = new _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.Router({ base, commands });
        void app.started.then(() => {
            // Route the very first request on load.
            void router.route();
            // Route all pop state events.
            window.addEventListener('popstate', () => {
                void router.route();
            });
        });
        return router;
    },
};
const plugins = [
    buttons,
    consolePlugin,
    paths,
    router,
    status,
];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ })

}]);
//# sourceMappingURL=packages_repl-extension_lib_index_js-_97171.e175cbf.js.map