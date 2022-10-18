"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["repl_build_index_js"],{

/***/ 61772:
/*!*****************************!*\
  !*** ./repl/build/index.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "main": () => (/* binding */ main)
/* harmony export */ });
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlite/server */ 38170);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.



// The webpack public path needs to be set before loading the CSS assets.


__webpack_require__(/*! ./style.js */ 54236);

const serverExtensions = [
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_javascript-kernel-extension_jupyterlite_javascrip-512860").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/javascript-kernel-extension */ 41555, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_pyolite-kernel-extension_jupyterlite_pyolite-kern-fdf22c").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/pyolite-kernel-extension */ 84964, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_server-extension_jupyterlite_server-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/server-extension */ 77494, 23))
];

const mimeExtensionsMods = [
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_iframe-extension_jupyterlite_iframe-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/iframe-extension */ 80061, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlab_javascript-extension_jupyterlab_javascript-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlab/javascript-extension */ 22746, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlab_json-extension_jupyterlab_json-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlab/json-extension */ 11585, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlab_vega5-extension_jupyterlab_vega5-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlab/vega5-extension */ 45825, 23))
];

async function createModule(scope, module) {
  try {
    const factory = await window._JUPYTERLAB[scope].get(module);
    return factory();
  } catch (e) {
    console.warn(`Failed to create module: package: ${scope}; module: ${module}`);
    throw e;
  }
}

/**
 * The main entry point for the application.
 */
async function main() {
  const mimeExtensions = await Promise.all(mimeExtensionsMods);

  let baseMods = [
    // @jupyterlite plugins
    __webpack_require__(/*! @jupyterlite/application-extension */ 22027),
    __webpack_require__(/*! @jupyterlite/repl-extension */ 38635),

    // @retrolab plugins
    (__webpack_require__(/*! @retrolab/application-extension */ 88394)["default"].filter)(({ id }) =>
      [
        '@retrolab/application-extension:session-dialogs',
      ].includes(id)
    ),

    // @jupyterlab plugins
    (__webpack_require__(/*! @jupyterlab/application-extension */ 22345)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/application-extension:commands',
        '@jupyterlab/application-extension:context-menu',
        '@jupyterlab/application-extension:faviconbusy'
      ].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/apputils-extension */ 59595)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/apputils-extension:palette',
        '@jupyterlab/apputils-extension:settings',
        '@jupyterlab/apputils-extension:state',
        '@jupyterlab/apputils-extension:themes',
        '@jupyterlab/apputils-extension:themes-palette-menu'
      ].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/codemirror-extension */ 2048)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/codemirror-extension:services',
        '@jupyterlab/codemirror-extension:codemirror'
      ].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/completer-extension */ 69020)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/completer-extension:manager',
        '@jupyterlab/completer-extension:consoles'
      ].includes(id)
    ),
    __webpack_require__(/*! @jupyterlab/console-extension */ 69683),
    (__webpack_require__(/*! @jupyterlab/docmanager-extension */ 64531)["default"].filter)(({ id }) =>
      ['@jupyterlab/docmanager-extension:plugin'].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/filebrowser-extension */ 71152)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/filebrowser-extension:factory'
      ].includes(id)
    ),
    __webpack_require__(/*! @jupyterlab/mainmenu-extension */ 98188),
    __webpack_require__(/*! @jupyterlab/mathjax2-extension */ 63880),
    __webpack_require__(/*! @jupyterlab/rendermime-extension */ 52246),
    __webpack_require__(/*! @jupyterlab/shortcuts-extension */ 72099),
    __webpack_require__(/*! @jupyterlab/theme-light-extension */ 83585),
    __webpack_require__(/*! @jupyterlab/theme-dark-extension */ 49939),
    (__webpack_require__(/*! @jupyterlab/tooltip-extension */ 70948)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/tooltip-extension:manager',
        '@jupyterlab/tooltip-extension:consoles'
      ].includes(id)
    ),
    __webpack_require__(/*! @jupyterlab/translation-extension */ 35803)
  ];

  const mods = [];
  const federatedExtensionPromises = [];
  const federatedMimeExtensionPromises = [];
  const federatedStylePromises = [];
  const litePluginsToRegister = [];
  const liteExtensionPromises = [];

  // This is all the data needed to load and activate plugins. This should be
  // gathered by the server and put onto the initial page template.
  const extensions = JSON.parse(
    _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('federated_extensions')
  );

  // The set of federated extension names.
  const federatedExtensionNames = new Set();

  extensions.forEach(data => {
    if (data.liteExtension) {
      liteExtensionPromises.push(createModule(data.name, data.extension));
      return;
    }
    if (data.extension) {
      federatedExtensionNames.add(data.name);
      federatedExtensionPromises.push(createModule(data.name, data.extension));
    }
    if (data.mimeExtension) {
      federatedExtensionNames.add(data.name);
      federatedMimeExtensionPromises.push(createModule(data.name, data.mimeExtension));
    }
    if (data.style) {
      federatedStylePromises.push(createModule(data.name, data.style));
    }
  });

  /**
   * Iterate over active plugins in an extension.
   */
  function* activePlugins(extension) {
    // Handle commonjs or es2015 modules
    let exports;
    if (extension.hasOwnProperty('__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }

    let plugins = Array.isArray(exports) ? exports : [exports];
    for (let plugin of plugins) {
      if (_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.Extension.isDisabled(plugin.id)) {
        continue;
      }
      yield plugin;
    }
  }

  // Add the base frontend extensions
  const baseFrontendMods = await Promise.all(baseMods);
  baseFrontendMods.forEach(p => {
    for (let plugin of activePlugins(p)) {
      mods.push(plugin);
    }
  })

  // Add the federated mime extensions.
  const federatedMimeExtensions = await Promise.allSettled(federatedMimeExtensionPromises);
  federatedMimeExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        mimeExtensions.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Add the federated extensions.
  const federatedExtensions = await Promise.allSettled(federatedExtensionPromises);
  federatedExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        mods.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Add the base serverlite extensions
  const baseServerExtensions = await Promise.all(serverExtensions);
  baseServerExtensions.forEach(p => {
    for (let plugin of activePlugins(p)) {
      litePluginsToRegister.push(plugin);
    }
  });

  // Add the serverlite federated extensions.
  const federatedLiteExtensions = await Promise.allSettled(liteExtensionPromises);
  federatedLiteExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        litePluginsToRegister.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new _jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__.JupyterLiteServer({});
  jupyterLiteServer.registerPluginModules(litePluginsToRegister);
  // start the server
  await jupyterLiteServer.start();

  // retrieve the custom service manager from the server app
  const { serviceManager } = jupyterLiteServer;

  // create a RetroLab frontend
  const { SingleWidgetApp } = __webpack_require__(/*! @jupyterlite/application */ 87150);
  const app = new SingleWidgetApp({ serviceManager, mimeExtensions });

  app.name = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('appName') || 'REPLite';

  app.registerPluginModules(mods);

  // Expose global app instance when in dev mode or when toggled explicitly.
  const exposeAppInBrowser =
    (_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('exposeAppInBrowser') || '').toLowerCase() === 'true';

  if (exposeAppInBrowser) {
    window.jupyterapp = app;
  }

  await app.start();
  await app.restored;
}


/***/ }),

/***/ 54236:
/*!*****************************!*\
  !*** ./repl/build/style.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _jupyterlab_application_extension_style_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application-extension/style/index.js */ 18915);
/* harmony import */ var _jupyterlab_apputils_extension_style_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils-extension/style/index.js */ 71380);
/* harmony import */ var _jupyterlab_codemirror_extension_style_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/codemirror-extension/style/index.js */ 18934);
/* harmony import */ var _jupyterlab_completer_extension_style_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/completer-extension/style/index.js */ 24017);
/* harmony import */ var _jupyterlab_console_extension_style_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/console-extension/style/index.js */ 72867);
/* harmony import */ var _jupyterlab_docmanager_extension_style_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jupyterlab/docmanager-extension/style/index.js */ 91532);
/* harmony import */ var _jupyterlab_imageviewer_extension_style_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @jupyterlab/imageviewer-extension/style/index.js */ 36429);
/* harmony import */ var _jupyterlab_inspector_extension_style_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @jupyterlab/inspector-extension/style/index.js */ 56124);
/* harmony import */ var _jupyterlab_javascript_extension_style_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @jupyterlab/javascript-extension/style/index.js */ 74782);
/* harmony import */ var _jupyterlab_json_extension_style_index_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @jupyterlab/json-extension/style/index.js */ 93027);
/* harmony import */ var _jupyterlab_markdownviewer_extension_style_index_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @jupyterlab/markdownviewer-extension/style/index.js */ 48680);
/* harmony import */ var _jupyterlab_mathjax2_extension_style_index_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @jupyterlab/mathjax2-extension/style/index.js */ 20023);
/* harmony import */ var _jupyterlab_pdf_extension_style_index_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @jupyterlab/pdf-extension/style/index.js */ 77522);
/* harmony import */ var _jupyterlab_rendermime_extension_style_index_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @jupyterlab/rendermime-extension/style/index.js */ 87967);
/* harmony import */ var _jupyterlab_shortcuts_extension_style_index_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @jupyterlab/shortcuts-extension/style/index.js */ 63897);
/* harmony import */ var _jupyterlab_tooltip_extension_style_index_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @jupyterlab/tooltip-extension/style/index.js */ 58014);
/* harmony import */ var _jupyterlab_translation_extension_style_index_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @jupyterlab/translation-extension/style/index.js */ 37609);
/* harmony import */ var _jupyterlab_vega5_extension_style_index_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @jupyterlab/vega5-extension/style/index.js */ 38438);
/* harmony import */ var _jupyterlite_application_extension_style_index_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @jupyterlite/application-extension/style/index.js */ 87814);
/* harmony import */ var _jupyterlite_iframe_extension_style_index_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @jupyterlite/iframe-extension/style/index.js */ 74316);
/* harmony import */ var _jupyterlite_javascript_kernel_extension_style_index_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @jupyterlite/javascript-kernel-extension/style/index.js */ 40047);
/* harmony import */ var _jupyterlite_repl_extension_style_index_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @jupyterlite/repl-extension/style/index.js */ 90080);
/* harmony import */ var _jupyterlite_server_extension_style_index_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! @jupyterlite/server-extension/style/index.js */ 975);
/* harmony import */ var _retrolab_application_extension_style_index_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! @retrolab/application-extension/style/index.js */ 97000);
/* This is a generated file of CSS imports */
/* It was generated by @jupyterlab/builder in Build.ensureAssets() */



























/***/ }),

/***/ 97000:
/*!**********************************************************************!*\
  !*** ../node_modules/@retrolab/application-extension/style/index.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _retrolab_application_style_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @retrolab/application/style/index.js */ 12928);
/* harmony import */ var _lumino_widgets_style_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/widgets/style/index.js */ 73685);
/* harmony import */ var _base_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./base.css */ 25997);






/***/ }),

/***/ 12928:
/*!************************************************************!*\
  !*** ../node_modules/@retrolab/application/style/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _jupyterlab_application_style_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application/style/index.js */ 92076);
/* harmony import */ var _jupyterlab_mainmenu_style_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/mainmenu/style/index.js */ 70022);
/* harmony import */ var _jupyterlab_ui_components_style_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/ui-components/style/index.js */ 74907);
/* harmony import */ var _base_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./base.css */ 86152);
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/








/***/ }),

/***/ 78962:
/*!*************************************************************************************************************!*\
  !*** ../node_modules/css-loader/dist/cjs.js!../node_modules/@retrolab/application-extension/style/base.css ***!
  \*************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../css-loader/dist/runtime/sourceMaps.js */ 20559);
/* harmony import */ var _css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../css-loader/dist/runtime/api.js */ 93476);
/* harmony import */ var _css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n|\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\n.jp-RetroSpacer {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.jp-MainAreaWidget {\n  height: 100%;\n}\n", "",{"version":3,"sources":["webpack://./../node_modules/@retrolab/application-extension/style/base.css"],"names":[],"mappings":"AAAA;;;;8EAI8E;;AAE9E;EACE,YAAY;EACZ,cAAc;AAChB;;AAEA;EACE,YAAY;AACd","sourcesContent":["/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n|\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\n.jp-RetroSpacer {\n  flex-grow: 1;\n  flex-shrink: 1;\n}\n\n.jp-MainAreaWidget {\n  height: 100%;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 14218:
/*!***************************************************************************************************!*\
  !*** ../node_modules/css-loader/dist/cjs.js!../node_modules/@retrolab/application/style/base.css ***!
  \***************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../css-loader/dist/runtime/sourceMaps.js */ 20559);
/* harmony import */ var _css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../css-loader/dist/runtime/api.js */ 93476);
/* harmony import */ var _css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\n:root {\n  --jp-private-topbar-height: 28px;\n  /* Override the layout-2 color for the dark theme */\n  --md-grey-800: #323232;\n  --jp-notebook-max-width: 1200px;\n}\n\nbody {\n  margin: 0;\n  padding: 0;\n  background: var(--jp-layout-color2);\n}\n\n#main {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n\n#top-panel-wrapper {\n  min-height: calc(1.5 * var(--jp-private-topbar-height));\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color0);\n  background: var(--jp-layout-color1);\n}\n\n#top-panel {\n  display: flex;\n  min-height: calc(1.5 * var(--jp-private-topbar-height));\n  padding-left: 5px;\n  padding-right: 5px;\n  margin-left: auto;\n  margin-right: auto;\n  max-width: 1200px;\n}\n\n#menu-panel-wrapper {\n  min-height: var(--jp-private-topbar-height);\n  background: var(--jp-layout-color1);\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color0);\n  box-shadow: var(--jp-elevation-z1);\n}\n\n#menu-panel {\n  display: flex;\n  min-height: var(--jp-private-topbar-height);\n  background: var(--jp-layout-color1);\n  padding-left: 5px;\n  padding-right: 5px;\n  margin-left: auto;\n  margin-right: auto;\n  max-width: var(--jp-notebook-max-width);\n}\n\n#main-panel {\n  box-shadow: var(--jp-elevation-z4);\n  margin-left: auto;\n  margin-right: auto;\n  max-width: var(--jp-notebook-max-width);\n}\n\n#spacer-widget {\n  min-height: 16px;\n}\n\n/* Special case notebooks as document oriented pages */\n\nbody[data-retro='notebooks'] #main-panel {\n  margin-left: unset;\n  margin-right: unset;\n  max-width: unset;\n}\n\nbody[data-retro='notebooks'] #spacer-widget {\n  min-height: unset;\n}\n", "",{"version":3,"sources":["webpack://./../node_modules/@retrolab/application/style/base.css"],"names":[],"mappings":"AAAA;;;8EAG8E;;AAE9E;EACE,gCAAgC;EAChC,mDAAmD;EACnD,sBAAsB;EACtB,+BAA+B;AACjC;;AAEA;EACE,SAAS;EACT,UAAU;EACV,mCAAmC;AACrC;;AAEA;EACE,kBAAkB;EAClB,MAAM;EACN,OAAO;EACP,QAAQ;EACR,SAAS;AACX;;AAEA;EACE,uDAAuD;EACvD,mEAAmE;EACnE,mCAAmC;AACrC;;AAEA;EACE,aAAa;EACb,uDAAuD;EACvD,iBAAiB;EACjB,kBAAkB;EAClB,iBAAiB;EACjB,kBAAkB;EAClB,iBAAiB;AACnB;;AAEA;EACE,2CAA2C;EAC3C,mCAAmC;EACnC,mEAAmE;EACnE,kCAAkC;AACpC;;AAEA;EACE,aAAa;EACb,2CAA2C;EAC3C,mCAAmC;EACnC,iBAAiB;EACjB,kBAAkB;EAClB,iBAAiB;EACjB,kBAAkB;EAClB,uCAAuC;AACzC;;AAEA;EACE,kCAAkC;EAClC,iBAAiB;EACjB,kBAAkB;EAClB,uCAAuC;AACzC;;AAEA;EACE,gBAAgB;AAClB;;AAEA,sDAAsD;;AAEtD;EACE,kBAAkB;EAClB,mBAAmB;EACnB,gBAAgB;AAClB;;AAEA;EACE,iBAAiB;AACnB","sourcesContent":["/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\n:root {\n  --jp-private-topbar-height: 28px;\n  /* Override the layout-2 color for the dark theme */\n  --md-grey-800: #323232;\n  --jp-notebook-max-width: 1200px;\n}\n\nbody {\n  margin: 0;\n  padding: 0;\n  background: var(--jp-layout-color2);\n}\n\n#main {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n\n#top-panel-wrapper {\n  min-height: calc(1.5 * var(--jp-private-topbar-height));\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color0);\n  background: var(--jp-layout-color1);\n}\n\n#top-panel {\n  display: flex;\n  min-height: calc(1.5 * var(--jp-private-topbar-height));\n  padding-left: 5px;\n  padding-right: 5px;\n  margin-left: auto;\n  margin-right: auto;\n  max-width: 1200px;\n}\n\n#menu-panel-wrapper {\n  min-height: var(--jp-private-topbar-height);\n  background: var(--jp-layout-color1);\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color0);\n  box-shadow: var(--jp-elevation-z1);\n}\n\n#menu-panel {\n  display: flex;\n  min-height: var(--jp-private-topbar-height);\n  background: var(--jp-layout-color1);\n  padding-left: 5px;\n  padding-right: 5px;\n  margin-left: auto;\n  margin-right: auto;\n  max-width: var(--jp-notebook-max-width);\n}\n\n#main-panel {\n  box-shadow: var(--jp-elevation-z4);\n  margin-left: auto;\n  margin-right: auto;\n  max-width: var(--jp-notebook-max-width);\n}\n\n#spacer-widget {\n  min-height: 16px;\n}\n\n/* Special case notebooks as document oriented pages */\n\nbody[data-retro='notebooks'] #main-panel {\n  margin-left: unset;\n  margin-right: unset;\n  max-width: unset;\n}\n\nbody[data-retro='notebooks'] #spacer-widget {\n  min-height: unset;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 21025:
/*!*************************************************************************************!*\
  !*** ../node_modules/css-loader/dist/cjs.js!../packages/application/style/base.css ***!
  \*************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/sourceMaps.js */ 20559);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ 93476);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\nbody {\n  margin: 0;\n  padding: 0;\n  background: var(--jp-layout-color2);\n}\n\n#main {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n\n#single-widget-panel {\n  height: 100%;\n}\n", "",{"version":3,"sources":["webpack://./../packages/application/style/base.css"],"names":[],"mappings":"AAAA;;;8EAG8E;;AAE9E;EACE,SAAS;EACT,UAAU;EACV,mCAAmC;AACrC;;AAEA;EACE,kBAAkB;EAClB,MAAM;EACN,OAAO;EACP,QAAQ;EACR,SAAS;AACX;;AAEA;EACE,YAAY;AACd","sourcesContent":["/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\nbody {\n  margin: 0;\n  padding: 0;\n  background: var(--jp-layout-color2);\n}\n\n#main {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n}\n\n#single-widget-panel {\n  height: 100%;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 84035:
/*!****************************************************************************************!*\
  !*** ../node_modules/css-loader/dist/cjs.js!../packages/repl-extension/style/base.css ***!
  \****************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/sourceMaps.js */ 20559);
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ 93476);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\n.jp-CodeConsole-promptCell .jp-InputPrompt {\n  margin-right: 10px;\n}\n\n.jp-CodeConsole-input .jp-InputCollapser {\n  display: none;\n}\n\n.jp-InputArea {\n  flex-direction: row;\n}\n\n.jp-InputArea-editor,\n.jp-OutputArea-child .jp-OutputArea-output {\n  margin-left: unset;\n}\n\n.jp-OutputArea-child {\n  flex-direction: row;\n}\n", "",{"version":3,"sources":["webpack://./../packages/repl-extension/style/base.css"],"names":[],"mappings":"AAAA;;;8EAG8E;;AAE9E;EACE,kBAAkB;AACpB;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,mBAAmB;AACrB;;AAEA;;EAEE,kBAAkB;AACpB;;AAEA;EACE,mBAAmB;AACrB","sourcesContent":["/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n\n.jp-CodeConsole-promptCell .jp-InputPrompt {\n  margin-right: 10px;\n}\n\n.jp-CodeConsole-input .jp-InputCollapser {\n  display: none;\n}\n\n.jp-InputArea {\n  flex-direction: row;\n}\n\n.jp-InputArea-editor,\n.jp-OutputArea-child .jp-OutputArea-output {\n  margin-left: unset;\n}\n\n.jp-OutputArea-child {\n  flex-direction: row;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 25997:
/*!**********************************************************************!*\
  !*** ../node_modules/@retrolab/application-extension/style/base.css ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/injectStylesIntoStyleTag.js */ 1892);
/* harmony import */ var _style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/styleDomAPI.js */ 95760);
/* harmony import */ var _style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/insertBySelector.js */ 38311);
/* harmony import */ var _style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/setAttributesWithoutAttributes.js */ 58192);
/* harmony import */ var _style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/insertStyleElement.js */ 38060);
/* harmony import */ var _style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/styleTagTransform.js */ 54865);
/* harmony import */ var _style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../css-loader/dist/cjs.js!./base.css */ 78962);

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ 86152:
/*!************************************************************!*\
  !*** ../node_modules/@retrolab/application/style/base.css ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/injectStylesIntoStyleTag.js */ 1892);
/* harmony import */ var _style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/styleDomAPI.js */ 95760);
/* harmony import */ var _style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/insertBySelector.js */ 38311);
/* harmony import */ var _style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/setAttributesWithoutAttributes.js */ 58192);
/* harmony import */ var _style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/insertStyleElement.js */ 38060);
/* harmony import */ var _style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../../style-loader/dist/runtime/styleTagTransform.js */ 54865);
/* harmony import */ var _style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../css-loader/dist/cjs.js!./base.css */ 14218);

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ 91070:
/*!**********************************************!*\
  !*** ../packages/application/style/base.css ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ 1892);
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ 95760);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertBySelector.js */ 38311);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ 58192);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ 38060);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ 54865);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./base.css */ 21025);

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ 7802:
/*!*************************************************!*\
  !*** ../packages/repl-extension/style/base.css ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ 1892);
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ 95760);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertBySelector.js */ 38311);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ 58192);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ 38060);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ 54865);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./base.css */ 84035);

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ 36762:
/*!**********************************************!*\
  !*** ../packages/application/style/index.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _jupyterlab_application_style_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application/style/index.js */ 92076);
/* harmony import */ var _base_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./base.css */ 91070);
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/






/***/ }),

/***/ 90080:
/*!*************************************************!*\
  !*** ../packages/repl-extension/style/index.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _jupyterlite_application_style_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlite/application/style/index.js */ 36762);
/* harmony import */ var _base_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./base.css */ 7802);
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/






/***/ })

}]);
//# sourceMappingURL=repl_build_index_js.119de88.js.map