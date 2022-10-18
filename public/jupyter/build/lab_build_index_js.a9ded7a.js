"use strict";
(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["lab_build_index_js"],{

/***/ 68131:
/*!****************************!*\
  !*** ./lab/build/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "main": () => (/* binding */ main)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ 63109);
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlite/server */ 38170);
/* harmony import */ var _jupyterlite_server__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlite_server__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/coreutils */ 27476);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.





// The webpack public path needs to be set before loading the CSS assets.


const styles = Promise.all(/*! import() */[__webpack_require__.e("vendors-node_modules_jupyterlab_application-extension_style_index_js-node_modules_jupyterlab_-a16ffe"), __webpack_require__.e("vendors-node_modules_jupyterlab_imageviewer-extension_style_index_js-node_modules_jupyterlab_-35d215"), __webpack_require__.e("vendors-node_modules_jupyterlab_cell-toolbar-extension_style_index_js-node_modules_jupyterlab-3ba786"), __webpack_require__.e("vendors-node_modules_jupyterlab_celltags-extension_style_index_js-node_modules_jupyterlab_csv-f83d10"), __webpack_require__.e("packages_application-extension_style_index_js-packages_iframe-extension_style_index_js-packag-bb94ca"), __webpack_require__.e("lab_build_style_js")]).then(__webpack_require__.bind(__webpack_require__, /*! ./style.js */ 97506));

const serverExtensions = [
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_javascript-kernel-extension_jupyterlite_javascrip-512860").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/javascript-kernel-extension */ 41555, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_pyolite-kernel-extension_jupyterlite_pyolite-kern-fdf22c").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/pyolite-kernel-extension */ 84964, 23)),
  __webpack_require__.e(/*! import() */ "webpack_sharing_consume_default_jupyterlite_server-extension_jupyterlite_server-extension").then(__webpack_require__.t.bind(__webpack_require__, /*! @jupyterlite/server-extension */ 77494, 23))
];

// custom list of disabled plugins
const disabled = [
  '@jupyterlab/apputils-extension:workspaces',
  '@jupyterlab/application-extension:logo',
  '@jupyterlab/application-extension:main',
  '@jupyterlab/application-extension:tree-resolver',
  '@jupyterlab/apputils-extension:resolver',
  '@jupyterlab/docmanager-extension:download',
  '@jupyterlab/filebrowser-extension:download',
  '@jupyterlab/filebrowser-extension:share-file',
  '@jupyterlab/help-extension:about'
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
  // Make sure the styles have loaded
  await styles;

  const pluginsToRegister = [];
  const federatedExtensionPromises = [];
  const federatedMimeExtensionPromises = [];
  const federatedStylePromises = [];
  const litePluginsToRegister = [];
  const liteExtensionPromises = [];

  // This is all the data needed to load and activate plugins. This should be
  // gathered by the server and put onto the initial page template.
  const extensions = JSON.parse(
    _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__.PageConfig.getOption('federated_extensions')
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
      if (
        _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__.PageConfig.Extension.isDisabled(plugin.id) ||
        disabled.includes(plugin.id) ||
        disabled.includes(plugin.id.split(':')[0])
      ) {
        continue;
      }
      yield plugin;
    }
  }

  // Handle the mime extensions.
  const mimeExtensions = [];
  if (!federatedExtensionNames.has('@jupyterlab/json-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/json-extension */ 11585);
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/javascript-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/javascript-extension */ 22746);
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/pdf-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/pdf-extension */ 60758);
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/vega5-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/vega5-extension */ 45825);
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlite/iframe-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlite/iframe-extension */ 80061);
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }

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

  // Handled the standard extensions.
  if (!federatedExtensionNames.has('@jupyterlab/application-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/application-extension */ 22345);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/apputils-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/apputils-extension */ 59595);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/celltags-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/celltags-extension */ 60741);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/cell-toolbar-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/cell-toolbar-extension */ 52577);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/codemirror-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/codemirror-extension */ 2048);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/completer-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/completer-extension */ 69020);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/console-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/console-extension */ 69683);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/csvviewer-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/csvviewer-extension */ 52731);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/docmanager-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/docmanager-extension */ 64531);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/documentsearch-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/documentsearch-extension */ 2012);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/filebrowser-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/filebrowser-extension */ 71152);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/fileeditor-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/fileeditor-extension */ 53630);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/help-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/help-extension */ 30418);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/htmlviewer-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/htmlviewer-extension */ 3774);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/imageviewer-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/imageviewer-extension */ 84033);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/inspector-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/inspector-extension */ 65528);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/launcher-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/launcher-extension */ 64456);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/logconsole-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/logconsole-extension */ 57476);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/mainmenu-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/mainmenu-extension */ 98188);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/markdownviewer-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/markdownviewer-extension */ 18091);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/mathjax2-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/mathjax2-extension */ 63880);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/notebook-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/notebook-extension */ 61402);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/rendermime-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/rendermime-extension */ 52246);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/running-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/running-extension */ 28545);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/settingeditor-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/settingeditor-extension */ 76064);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/shortcuts-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/shortcuts-extension */ 72099);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/statusbar-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/statusbar-extension */ 2073);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/theme-dark-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/theme-dark-extension */ 49939);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/theme-light-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/theme-light-extension */ 83585);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/toc-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/toc-extension */ 74849);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/tooltip-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/tooltip-extension */ 70948);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/translation-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/translation-extension */ 35803);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlab/ui-components-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlab/ui-components-extension */ 74606);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!federatedExtensionNames.has('@jupyterlite/application-extension')) {
    try {
      let ext = __webpack_require__(/*! @jupyterlite/application-extension */ 22027);
      for (let plugin of activePlugins(ext)) {
        pluginsToRegister.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Add the federated extensions.
  const federatedExtensions = await Promise.allSettled(federatedExtensionPromises);
  federatedExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        pluginsToRegister.push(plugin);
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
  })

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

  // Load all federated component styles and log errors for any that do not
  (await Promise.allSettled(federatedStylePromises)).filter(({status}) => status === "rejected").forEach(({reason}) => {
     console.error(reason);
    });

  // create the in-browser JupyterLite Server
  const jupyterLiteServer = new _jupyterlite_server__WEBPACK_IMPORTED_MODULE_1__.JupyterLiteServer({});
  jupyterLiteServer.registerPluginModules(litePluginsToRegister);
  // start the server
  await jupyterLiteServer.start();

  // retrieve the custom service manager from the server app
  const { serviceManager } = jupyterLiteServer;

  // create a full-blown JupyterLab frontend
  const lab = new _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.JupyterLab({
    mimeExtensions,
    serviceManager,
    disabled
  });
  lab.name = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__.PageConfig.getOption('appName') || 'JupyterLite';

  lab.registerPluginModules(pluginsToRegister);

  // Expose global app instance when in dev mode or when toggled explicitly.
  const exposeAppInBrowser =
    (_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_2__.PageConfig.getOption('exposeAppInBrowser') || '').toLowerCase() === 'true';

  if (exposeAppInBrowser) {
    window.jupyterapp = lab;
  }

  /* eslint-disable no-console */
  await lab.start();
  await lab.restored;
}

/***/ })

}]);
//# sourceMappingURL=lab_build_index_js.a9ded7a.js.map