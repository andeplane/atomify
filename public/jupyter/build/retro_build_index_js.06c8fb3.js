"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["retro_build_index_js"],{

/***/ 86798:
/*!******************************!*\
  !*** ./retro/build/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "main": () => (/* binding */ main)
/* harmony export */ });
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlite/server */ 38170);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_server__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/coreutils */ 79615);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.



// The webpack public path needs to be set before loading the CSS assets.


__webpack_require__(/*! ./style.js */ 7017);

const serverExtensions = [
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_javascript-kernel-extension_jupyterlite_javascrip-512860").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/javascript-kernel-extension */ 41555, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_pyolite-kernel-extension_jupyterlite_pyolite-kern-fdf22c").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/pyolite-kernel-extension */ 84964, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_server-extension_jupyterlite_server-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/server-extension */ 77494, 23))
];

const mimeExtensionsMods = [
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_iframe-extension_jupyterlite_iframe-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/iframe-extension */ 80061, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlab_javascript-extension_jupyterlab_javascript-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlab/javascript-extension */ 48141, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlab_json-extension_jupyterlab_json-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlab/json-extension */ 39181, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlab_vega5-extension_jupyterlab_vega5-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlab/vega5-extension */ 10906, 23))
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
    __webpack_require__(/*! @jupyterlite/retro-application-extension */ 3449),
    // @retrolab plugins
    // do not enable the document opener from RetroLab
    (__webpack_require__(/*! @retrolab/application-extension */ 88394)["default"].filter)(
      ({ id }) => ![
        '@retrolab/application-extension:logo',
        '@retrolab/application-extension:opener'
      ].includes(id)
    ),
    __webpack_require__(/*! @retrolab/help-extension */ 31161),
    __webpack_require__(/*! @retrolab/notebook-extension */ 61474),

    // @jupyterlab plugins
    (__webpack_require__(/*! @jupyterlab/application-extension */ 5393)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/application-extension:commands',
        '@jupyterlab/application-extension:context-menu',
        '@jupyterlab/application-extension:faviconbusy'
      ].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/apputils-extension */ 63132)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/apputils-extension:palette',
        '@jupyterlab/apputils-extension:settings',
        '@jupyterlab/apputils-extension:state',
        '@jupyterlab/apputils-extension:themes',
        '@jupyterlab/apputils-extension:themes-palette-menu',
        '@jupyterlab/apputils-extension:toolbar-registry'
      ].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/codemirror-extension */ 63274)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/codemirror-extension:services',
        '@jupyterlab/codemirror-extension:codemirror'
      ].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/completer-extension */ 9301)["default"].filter)(({ id }) =>
      ['@jupyterlab/completer-extension:manager'].includes(id)
    ),
    __webpack_require__(/*! @jupyterlab/console-extension */ 95233),
    (__webpack_require__(/*! @jupyterlab/docmanager-extension */ 70747)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/docmanager-extension:plugin',
        '@jupyterlab/docmanager-extension:manager'
      ].includes(id)
    ),
    (__webpack_require__(/*! @jupyterlab/filebrowser-extension */ 41369)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/filebrowser-extension:factory'
      ].includes(id)
    ),
    __webpack_require__(/*! @jupyterlab/mainmenu-extension */ 21424),
    __webpack_require__(/*! @jupyterlab/mathjax2-extension */ 22673),
    (__webpack_require__(/*! @jupyterlab/notebook-extension */ 4024)["default"].filter)(({ id }) =>
      [
        '@jupyterlab/notebook-extension:factory',
        '@jupyterlab/notebook-extension:tracker',
        '@jupyterlab/notebook-extension:widget-factory'
      ].includes(id)
    ),
    __webpack_require__(/*! @jupyterlab/rendermime-extension */ 18000),
    __webpack_require__(/*! @jupyterlab/shortcuts-extension */ 77967),
    __webpack_require__(/*! @jupyterlab/theme-light-extension */ 94686),
    __webpack_require__(/*! @jupyterlab/theme-dark-extension */ 80624),
    __webpack_require__(/*! @jupyterlab/translation-extension */ 19827)
  ];

  // The motivation here is to only load a specific set of plugins dependending on
  // the current page
  const page = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('retroPage');
  switch (page) {
    case 'tree': {
      baseMods = baseMods.concat([
        (__webpack_require__(/*! @jupyterlab/filebrowser-extension */ 41369)["default"].filter)(({ id }) =>
          [
            '@jupyterlab/filebrowser-extension:browser',
            '@jupyterlab/filebrowser-extension:file-upload-status',
            '@jupyterlab/filebrowser-extension:open-with',
          ].includes(id)
        ),
        // do not enable the new terminal button from RetroLab
        (__webpack_require__(/*! @retrolab/tree-extension */ 24918)["default"].filter)(
          ({ id }) => id !== '@retrolab/tree-extension:new-terminal'
        )
      ]);
      break;
    }
    case 'notebooks': {
      baseMods = baseMods.concat([
        __webpack_require__(/*! @jupyterlab/cell-toolbar-extension */ 42202),
        (__webpack_require__(/*! @jupyterlab/completer-extension */ 9301)["default"].filter)(({ id }) =>
          ['@jupyterlab/completer-extension:notebooks'].includes(id)
        ),
        (__webpack_require__(/*! @jupyterlab/tooltip-extension */ 47070)["default"].filter)(({ id }) =>
          [
            '@jupyterlab/tooltip-extension:manager',
            '@jupyterlab/tooltip-extension:notebooks'
          ].includes(id)
        )
      ]);
      break;
    }
    case 'consoles': {
      baseMods = baseMods.concat([
        (__webpack_require__(/*! @jupyterlab/completer-extension */ 9301)["default"].filter)(({ id }) =>
          ['@jupyterlab/completer-extension:consoles'].includes(id)
        ),
        (__webpack_require__(/*! @jupyterlab/tooltip-extension */ 47070)["default"].filter)(({ id }) =>
          [
            '@jupyterlab/tooltip-extension:manager',
            '@jupyterlab/tooltip-extension:consoles'
          ].includes(id)
        )
      ]);
      break;
    }
    case 'edit': {
      baseMods = baseMods.concat([
        (__webpack_require__(/*! @jupyterlab/completer-extension */ 9301)["default"].filter)(({ id }) =>
          ['@jupyterlab/completer-extension:files'].includes(id)
        ),
        (__webpack_require__(/*! @jupyterlab/fileeditor-extension */ 77552)["default"].filter)(({ id }) =>
          ['@jupyterlab/fileeditor-extension:plugin'].includes(id)
        ),
        (__webpack_require__(/*! @jupyterlab/filebrowser-extension */ 41369)["default"].filter)(({ id }) =>
          [
            '@jupyterlab/filebrowser-extension:browser'
          ].includes(id)
        ),
      ]);
      break;
    }
  }

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
  });

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
  const { RetroApp } = __webpack_require__(/*! @retrolab/application */ 95191);
  const app = new RetroApp({ serviceManager, mimeExtensions });

  app.name = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.PageConfig.getOption('appName') || 'RetroLite';

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

/***/ 7017:
/*!******************************!*\
  !*** ./retro/build/style.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _jupyterlab_application_extension_style_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application-extension/style/index.js */ 18915);
/* harmony import */ var _jupyterlab_apputils_extension_style_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils-extension/style/index.js */ 71380);
/* harmony import */ var _jupyterlab_cell_toolbar_extension_style_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/cell-toolbar-extension/style/index.js */ 21267);
/* harmony import */ var _jupyterlab_codemirror_extension_style_index_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/codemirror-extension/style/index.js */ 18934);
/* harmony import */ var _jupyterlab_completer_extension_style_index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @jupyterlab/completer-extension/style/index.js */ 24017);
/* harmony import */ var _jupyterlab_console_extension_style_index_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @jupyterlab/console-extension/style/index.js */ 72867);
/* harmony import */ var _jupyterlab_docmanager_extension_style_index_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @jupyterlab/docmanager-extension/style/index.js */ 91532);
/* harmony import */ var _jupyterlab_filebrowser_extension_style_index_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @jupyterlab/filebrowser-extension/style/index.js */ 38391);
/* harmony import */ var _jupyterlab_fileeditor_extension_style_index_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @jupyterlab/fileeditor-extension/style/index.js */ 9755);
/* harmony import */ var _jupyterlab_javascript_extension_style_index_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @jupyterlab/javascript-extension/style/index.js */ 74782);
/* harmony import */ var _jupyterlab_json_extension_style_index_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @jupyterlab/json-extension/style/index.js */ 93027);
/* harmony import */ var _jupyterlab_mainmenu_extension_style_index_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @jupyterlab/mainmenu-extension/style/index.js */ 3727);
/* harmony import */ var _jupyterlab_mathjax2_extension_style_index_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! @jupyterlab/mathjax2-extension/style/index.js */ 20023);
/* harmony import */ var _jupyterlab_notebook_extension_style_index_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! @jupyterlab/notebook-extension/style/index.js */ 84221);
/* harmony import */ var _jupyterlab_rendermime_extension_style_index_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! @jupyterlab/rendermime-extension/style/index.js */ 87967);
/* harmony import */ var _jupyterlab_shortcuts_extension_style_index_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! @jupyterlab/shortcuts-extension/style/index.js */ 63897);
/* harmony import */ var _jupyterlab_tooltip_extension_style_index_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! @jupyterlab/tooltip-extension/style/index.js */ 58014);
/* harmony import */ var _jupyterlab_translation_extension_style_index_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! @jupyterlab/translation-extension/style/index.js */ 37609);
/* harmony import */ var _jupyterlab_vega5_extension_style_index_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! @jupyterlab/vega5-extension/style/index.js */ 38438);
/* harmony import */ var _jupyterlite_application_extension_style_index_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! @jupyterlite/application-extension/style/index.js */ 87814);
/* harmony import */ var _jupyterlite_iframe_extension_style_index_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! @jupyterlite/iframe-extension/style/index.js */ 74316);
/* harmony import */ var _jupyterlite_javascript_kernel_extension_style_index_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! @jupyterlite/javascript-kernel-extension/style/index.js */ 40047);
/* harmony import */ var _jupyterlite_retro_application_extension_style_index_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! @jupyterlite/retro-application-extension/style/index.js */ 34507);
/* harmony import */ var _jupyterlite_server_extension_style_index_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! @jupyterlite/server-extension/style/index.js */ 975);
/* harmony import */ var _retrolab_application_extension_style_index_js__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! @retrolab/application-extension/style/index.js */ 97000);
/* harmony import */ var _retrolab_docmanager_extension_style_index_js__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! @retrolab/docmanager-extension/style/index.js */ 21666);
/* harmony import */ var _retrolab_help_extension_style_index_js__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! @retrolab/help-extension/style/index.js */ 9139);
/* harmony import */ var _retrolab_notebook_extension_style_index_js__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! @retrolab/notebook-extension/style/index.js */ 35563);
/* harmony import */ var _retrolab_tree_extension_style_index_js__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! @retrolab/tree-extension/style/index.js */ 57676);
/* This is a generated file of CSS imports */
/* It was generated by @jupyterlab/builder in Build.ensureAssets() */
































/***/ }),

/***/ 228:
/*!*****************************************************************************************************!*\
  !*** ../node_modules/css-loader/dist/cjs.js!../packages/retro-application-extension/style/base.css ***!
  \*****************************************************************************************************/
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
___CSS_LOADER_EXPORT___.push([module.id, "/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n", "",{"version":3,"sources":["webpack://./../packages/retro-application-extension/style/base.css"],"names":[],"mappings":"AAAA;;;8EAG8E","sourcesContent":["/*-----------------------------------------------------------------------------\n| Copyright (c) Jupyter Development Team.\n| Distributed under the terms of the Modified BSD License.\n|----------------------------------------------------------------------------*/\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 70988:
/*!**************************************************************!*\
  !*** ../packages/retro-application-extension/style/base.css ***!
  \**************************************************************/
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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./base.css */ 228);

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ 34507:
/*!**************************************************************!*\
  !*** ../packages/retro-application-extension/style/index.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _base_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.css */ 70988);
/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/




/***/ })

}]);
//# sourceMappingURL=retro_build_index_js.06c8fb3.js.map