(self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] = self["webpackChunk_JUPYTERLAB_CORE_OUTPUT"] || []).push([["packages_localforage_lib_index_js-_a4211"],{

/***/ 41746:
/*!***********************************************************************************************!*\
  !*** ../node_modules/localforage-memoryStorageDriver/dist/localforage-memoryStorageDriver.js ***!
  \***********************************************************************************************/
/***/ (function(module) {

(function (global, factory) {
     true ? module.exports = factory() :
    0;
}(this, function () { 'use strict';

    function getSerializerPromise(localForageInstance) {
        if (getSerializerPromise.result) {
            return getSerializerPromise.result;
        }
        if (!localForageInstance || typeof localForageInstance.getSerializer !== 'function') {
            Promise.reject(new Error('localforage.getSerializer() was not available! ' + 'localforage v1.4+ is required!'));
        }
        getSerializerPromise.result = localForageInstance.getSerializer();
        return getSerializerPromise.result;
    }

    function executeCallback(promise, callback) {
        if (callback) {
            promise.then(function (result) {
                callback(null, result);
            }, function (error) {
                callback(error);
            });
        }
    }

    var storageRepository = {};

    // Config the localStorage backend, using options set in the config.
    function _initStorage(options) {
        var self = this;

        var dbInfo = {};
        if (options) {
            for (var i in options) {
                dbInfo[i] = options[i];
            }
        }

        var database = storageRepository[dbInfo.name] = storageRepository[dbInfo.name] || {};
        var table = database[dbInfo.storeName] = database[dbInfo.storeName] || {};
        dbInfo.db = table;

        self._dbInfo = dbInfo;

        return getSerializerPromise(self).then(function (serializer) {
            dbInfo.serializer = serializer;
        });
    }

    function clear(callback) {
        var self = this;
        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    delete db[key];
                }
            }
        });

        executeCallback(promise, callback);
        return promise;
    }

    function getItem(key, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            console.warn(key + ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            var result = db[key];

            if (result) {
                result = self._dbInfo.serializer.deserialize(result);
            }

            return result;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function iterate(iterator, callback) {
        var self = this;

        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;

            var iterationNumber = 1;
            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    var value = db[key];

                    if (value) {
                        value = self._dbInfo.serializer.deserialize(value);
                    }

                    value = iterator(value, key, iterationNumber++);

                    if (value !== void 0) {
                        return value;
                    }
                }
            }
        });

        executeCallback(promise, callback);
        return promise;
    }

    function key(n, callback) {
        var self = this;
        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            var result = null;
            var index = 0;

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    if (n === index) {
                        result = key;
                        break;
                    }
                    index++;
                }
            }

            return result;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function keys(callback) {
        var self = this;
        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            var keys = [];

            for (var key in db) {
                if (db.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }

            return keys;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function length(callback) {
        var self = this;
        var promise = self.keys().then(function (keys) {
            return keys.length;
        });

        executeCallback(promise, callback);
        return promise;
    }

    function removeItem(key, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            console.warn(key + ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = self.ready().then(function () {
            var db = self._dbInfo.db;
            if (db.hasOwnProperty(key)) {
                delete db[key];
            }
        });

        executeCallback(promise, callback);
        return promise;
    }

    function setItem(key, value, callback) {
        var self = this;

        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
            console.warn(key + ' used as a key, but it is not a string.');
            key = String(key);
        }

        var promise = self.ready().then(function () {
            // Convert undefined values to null.
            // https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
                value = null;
            }

            // Save the original value to pass to the callback.
            var originalValue = value;

            function serializeAsync(value) {
                return new Promise(function (resolve, reject) {
                    self._dbInfo.serializer.serialize(value, function (value, error) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(value);
                        }
                    });
                });
            }

            return serializeAsync(value).then(function (value) {
                var db = self._dbInfo.db;
                db[key] = value;
                return originalValue;
            });
        });

        executeCallback(promise, callback);
        return promise;
    }

    var memoryStorageDriver = {
        _driver: 'memoryStorageDriver',
        _initStorage: _initStorage,
        // _supports: function() { return true; }
        iterate: iterate,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key,
        keys: keys
    };

    return memoryStorageDriver;

}));

/***/ }),

/***/ 33892:
/*!********************************************!*\
  !*** ../packages/localforage/lib/index.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ILocalForage": () => (/* reexport safe */ _tokens__WEBPACK_IMPORTED_MODULE_0__.ILocalForage),
/* harmony export */   "ensureMemoryStorage": () => (/* reexport safe */ _memory__WEBPACK_IMPORTED_MODULE_1__.ensureMemoryStorage)
/* harmony export */ });
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tokens */ 21476);
/* harmony import */ var _memory__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./memory */ 85529);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.




/***/ }),

/***/ 85529:
/*!*********************************************!*\
  !*** ../packages/localforage/lib/memory.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ensureMemoryStorage": () => (/* binding */ ensureMemoryStorage)
/* harmony export */ });
/* harmony import */ var localforage_memoryStorageDriver__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! localforage-memoryStorageDriver */ 41746);
/* harmony import */ var localforage_memoryStorageDriver__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(localforage_memoryStorageDriver__WEBPACK_IMPORTED_MODULE_0__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * Ensure a localforage singleton has had the memory storage driver installed
 */
async function ensureMemoryStorage(theLocalforage) {
    return await theLocalforage.defineDriver((localforage_memoryStorageDriver__WEBPACK_IMPORTED_MODULE_0___default()));
}


/***/ }),

/***/ 21476:
/*!*********************************************!*\
  !*** ../packages/localforage/lib/tokens.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ILocalForage": () => (/* binding */ ILocalForage)
/* harmony export */ });
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/coreutils */ 26169);
/* harmony import */ var _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__);
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * The token for the localforage singleton.
 */
const ILocalForage = new _lumino_coreutils__WEBPACK_IMPORTED_MODULE_0__.Token('@jupyterlite/localforge:ILocalForage');


/***/ })

}]);
//# sourceMappingURL=packages_localforage_lib_index_js-_a4211.a49c244.js.map