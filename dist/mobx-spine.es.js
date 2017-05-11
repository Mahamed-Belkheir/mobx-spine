import {
    action,
    autorun,
    computed,
    extendObservable,
    isObservable,
    isObservableArray,
    isObservableObject,
    observable,
    toJS,
} from 'mobx';
import {
    at,
    filter,
    find,
    forIn,
    get,
    isArray,
    isPlainObject,
    keyBy,
    map,
    mapKeys,
    mapValues,
    result,
    snakeCase,
    uniqueId,
} from 'lodash';
import axios from 'axios';
import moment from 'moment';

// lodash's `camelCase` method removes dots from the string; this breaks mobx-spine
function snakeToCamel(s) {
    if (s.startsWith('_')) {
        return s;
    }
    return s.replace(/_\w/g, function(m) {
        return m[1].toUpperCase();
    });
}

var classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError('Cannot call a class as a function');
    }
};

var createClass = (function() {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ('value' in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
})();

var _class$1;
var _descriptor$1;
var _descriptor2$1;
var _descriptor3$1;
var _descriptor4;
var _class2$1;
var _temp$1;

function _initDefineProp$1(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer
            ? descriptor.initializer.call(context)
            : void 0,
    });
}

function _applyDecoratedDescriptor$1(
    target,
    property,
    decorators,
    descriptor,
    context
) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function(key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function(desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

var AVAILABLE_CONST_OPTIONS = ['relations', 'limit'];

var Store = ((_class$1 = ((_temp$1 = _class2$1 = (function() {
    createClass(Store, [
        {
            key: 'initialize',

            // Empty function, but can be overridden if you want to do something after initializing the model.
            value: function initialize() {},
        },
        {
            key: 'isLoading',
            get: function get$$1() {
                return this.__pendingRequestCount > 0;
            },
            // Holds the fetch parameters
        },
        {
            key: 'length',
            get: function get$$1() {
                return this.models.length;
            },
        },
        {
            key: 'backendResourceName',
            set: function set$$1(v) {
                throw new Error(
                    '`backendResourceName` should be a static property on the store.'
                );
            },
        },
    ]);

    function Store() {
        var options = arguments.length > 0 && arguments[0] !== undefined
            ? arguments[0]
            : {};
        classCallCheck(this, Store);

        _initDefineProp$1(this, 'models', _descriptor$1, this);

        _initDefineProp$1(this, 'params', _descriptor2$1, this);

        _initDefineProp$1(this, '__pendingRequestCount', _descriptor3$1, this);

        _initDefineProp$1(this, '__state', _descriptor4, this);

        this.__activeRelations = [];
        this.Model = null;
        this.api = null;
        this.__nestedRepository = {};

        if (!isPlainObject(options)) {
            throw Error(
                'Store only accepts an object with options. Chain `.parse(data)` to add models.'
            );
        }
        forIn(options, function(value, option) {
            if (!AVAILABLE_CONST_OPTIONS.includes(option)) {
                throw Error('Unknown option passed to store: ' + option);
            }
        });
        if (options.relations) {
            this.__parseRelations(options.relations);
        }
        if (options.limit !== undefined) {
            this.setLimit(options.limit);
        }
        this.initialize();
    }

    createClass(Store, [
        {
            key: '__parseRelations',
            value: function __parseRelations(activeRelations) {
                this.__activeRelations = activeRelations;
            },
        },
        {
            key: '__addFromRepository',
            value: function __addFromRepository() {
                var _this = this;

                var ids = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : [];

                ids = isArray(ids) ? ids : [ids];

                var records = at(
                    keyBy(this.__repository, this.Model.primaryKey),
                    ids
                );
                this.models.replace(
                    records.map(function(record) {
                        return new _this.Model(record, {
                            store: _this,
                            relations: _this.__activeRelations,
                        });
                    })
                );
            },
        },
        {
            key: '__getApi',
            value: function __getApi() {
                if (!this.api) {
                    throw new Error(
                        'You are trying to perform a API request without an `api` property defined on the store.'
                    );
                }
                if (!this.url) {
                    throw new Error(
                        'You are trying to perform a API request without an `url` property defined on the store.'
                    );
                }
                return this.api;
            },
        },
        {
            key: 'fromBackend',
            value: function fromBackend(_ref) {
                var _this2 = this;

                var data = _ref.data,
                    repos = _ref.repos,
                    relMapping = _ref.relMapping;

                this.models.replace(
                    data.map(function(record) {
                        // TODO: I'm not happy at all about how this looks.
                        // We'll need to finetune some things, but hey, for now it works.
                        var model = _this2._newModel();
                        model.fromBackend({
                            data: record,
                            repos: repos,
                            relMapping: relMapping,
                        });
                        return model;
                    })
                );
            },
        },
        {
            key: '_newModel',
            value: function _newModel() {
                var model = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : null;

                return new this.Model(model, {
                    store: this,
                    relations: this.__activeRelations,
                });
            },
        },
        {
            key: 'parse',
            value: function parse(models) {
                if (!isArray(models)) {
                    throw new Error(
                        'Parameter supplied to parse() is not an array.'
                    );
                }
                this.models.replace(models.map(this._newModel.bind(this)));

                return this;
            },
        },
        {
            key: 'add',
            value: function add(models) {
                var _this3 = this;

                var singular = !isArray(models);
                models = singular ? [models] : models.slice();

                var modelInstances = models.map(this._newModel.bind(this));

                modelInstances.forEach(function(modelInstance) {
                    var primaryValue = modelInstance[_this3.Model.primaryKey];
                    if (primaryValue && _this3.get(primaryValue)) {
                        throw Error(
                            'A model with the same primary key value "' +
                                primaryValue +
                                '" already exists in this store.'
                        );
                    }
                    _this3.models.push(modelInstance);
                });

                return singular ? modelInstances[0] : modelInstances;
            },
        },
        {
            key: 'remove',
            value: function remove(models) {
                var _this4 = this;

                var singular = !isArray(models);
                models = singular ? [models] : models.slice();

                models.forEach(function(model) {
                    return _this4.models.remove(model);
                });

                return models;
            },
        },
        {
            key: 'removeById',
            value: function removeById(ids) {
                var _this5 = this;

                var singular = !isArray(ids);
                ids = singular ? [ids] : ids.slice();
                if (ids.some(isNaN)) {
                    throw new Error(
                        'Cannot remove a model by id that is not a number: ' +
                            JSON.stringify(ids)
                    );
                }

                var models = ids.map(function(id) {
                    return _this5.get(id);
                });

                models.forEach(function(model) {
                    if (model) {
                        _this5.models.remove(model);
                    }
                });

                return models;
            },
        },
        {
            key: 'clear',
            value: function clear() {
                this.models.clear();
            },
        },
        {
            key: 'fetch',
            value: function fetch() {
                var _this6 = this;

                var options = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : {};

                this.__pendingRequestCount += 1;
                var data = Object.assign(
                    this.__getApi().buildFetchStoreParams(this),
                    this.params,
                    options.data
                );
                return this.__getApi()
                    .fetchStore({ url: result(this, 'url'), data: data })
                    .then(
                        action(function(res) {
                            _this6.__pendingRequestCount -= 1;
                            _this6.__state.totalRecords = res.totalRecords;
                            _this6.fromBackend(res);
                        })
                    );
            },
        },
        {
            key: 'toJS',
            value: function toJS$$1() {
                return this.models.map(function(model) {
                    return model.toJS();
                });
            },

            // Methods for pagination.
        },
        {
            key: 'getPageOffset',
            value: function getPageOffset() {
                return (this.__state.currentPage - 1) * this.__state.limit;
            },
        },
        {
            key: 'setLimit',
            value: function setLimit(limit) {
                if (limit && !Number.isInteger(limit)) {
                    throw new Error(
                        'Page limit should be a number or falsy value.'
                    );
                }
                this.__state.limit = limit || null;
            },
        },
        {
            key: 'getNextPage',
            value: function getNextPage() {
                if (!this.hasNextPage) {
                    throw new Error('There is no next page.');
                }
                this.__state.currentPage += 1;
                return this.fetch();
            },
        },
        {
            key: 'getPreviousPage',
            value: function getPreviousPage() {
                if (!this.hasPreviousPage) {
                    throw new Error('There is no previous page.');
                }
                this.__state.currentPage -= 1;
                return this.fetch();
            },
        },
        {
            key: 'setPage',
            value: function setPage() {
                var page = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : 1;
                var options = arguments.length > 1 && arguments[1] !== undefined
                    ? arguments[1]
                    : {};

                if (!Number.isInteger(page)) {
                    throw new Error('Page should be a number.');
                }
                if (page > this.totalPages || page < 1) {
                    throw new Error(
                        'Page should be between 1 and ' + this.totalPages + '.'
                    );
                }
                this.__state.currentPage = page;
                if (options.fetch === undefined || options.fetch) {
                    return this.fetch();
                }
                return Promise.resolve();
            },
        },
        {
            key: 'toBackendAll',
            value: function toBackendAll() {
                var newIds = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : [];
                var options = arguments.length > 1 && arguments[1] !== undefined
                    ? arguments[1]
                    : {};

                var modelData = this.models.map(function(model, i) {
                    return model.toBackendAll(
                        newIds && newIds[i] !== undefined ? newIds[i] : null,
                        { relations: options.relations }
                    );
                });

                var data = [];
                var relations = {};

                modelData.forEach(function(model) {
                    data = data.concat(model.data);
                    forIn(model.relations, function(relModel, key) {
                        relations[key] = relations[key]
                            ? relations[key].concat(relModel)
                            : relModel;
                    });
                });

                return { data: data, relations: relations };
            },

            // Create a new instance of this store with a predicate applied.
            // This new store will be automatically kept in-sync with all models that adhere to the predicate.
        },
        {
            key: 'virtualStore',
            value: function virtualStore(_ref2) {
                var _this7 = this;

                var filter$$1 = _ref2.filter;

                var store = new this.constructor({
                    relations: this.__activeRelations,
                });
                // Oh gawd MobX is so awesome.
                autorun(function() {
                    var models = _this7.filter(filter$$1);
                    store.models.replace(models);
                });
                return store;
            },

            // Helper methods to read models.
        },
        {
            key: 'get',
            value: function get$$1(id) {
                // The id can be defined as a string or int, but we want it to work in both cases.
                return this.models.find(
                    function(model) {
                        return model[model.constructor.primaryKey] == id;
                    } // eslint-disable-line eqeqeq
                );
            },
        },
        {
            key: 'map',
            value: function map$$1(predicate) {
                return map(this.models, predicate);
            },
        },
        {
            key: 'mapByPrimaryKey',
            value: function mapByPrimaryKey() {
                return this.map(this.Model.primaryKey);
            },
        },
        {
            key: 'filter',
            value: function filter$$1(predicate) {
                return filter(this.models, predicate);
            },
        },
        {
            key: 'find',
            value: function find$$1(predicate) {
                return find(this.models, predicate);
            },
        },
        {
            key: 'each',
            value: function each(predicate) {
                return this.models.forEach(predicate);
            },
        },
        {
            key: 'at',
            value: function at$$1(index) {
                var zeroLength = this.length - 1;
                if (index > zeroLength) {
                    throw new Error(
                        'Index ' +
                            index +
                            ' is out of bounds (max ' +
                            zeroLength +
                            ').'
                    );
                }
                if (index < 0) {
                    index += this.length;
                }
                return this.models[index];
            },
        },
        {
            key: 'totalPages',
            get: function get$$1() {
                if (!this.__state.limit) {
                    return 0;
                }
                return Math.ceil(
                    this.__state.totalRecords / this.__state.limit
                );
            },
        },
        {
            key: 'currentPage',
            get: function get$$1() {
                return this.__state.currentPage;
            },
        },
        {
            key: 'hasNextPage',
            get: function get$$1() {
                return this.__state.currentPage + 1 <= this.totalPages;
            },
        },
        {
            key: 'hasPreviousPage',
            get: function get$$1() {
                return this.__state.currentPage > 1;
            },
        },
    ]);
    return Store;
})()), (_class2$1.backendResourceName =
    ''), _temp$1)), ((_descriptor$1 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'models',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return [];
        },
    }
)), (_descriptor2$1 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'params',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {};
        },
    }
)), (_descriptor3$1 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    '__pendingRequestCount',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return 0;
        },
    }
)), (_descriptor4 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    '__state',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {
                currentPage: 1,
                limit: 25,
                totalRecords: 0,
            };
        },
    }
)), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'isLoading',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'isLoading'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'length',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'length'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'fromBackend',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'fromBackend'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'parse',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'parse'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'add',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'add'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'remove',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'remove'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'removeById',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'removeById'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'clear',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'clear'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'fetch',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'fetch'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'setLimit',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'setLimit'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'totalPages',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'totalPages'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'currentPage',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'currentPage'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'hasNextPage',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'hasNextPage'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'hasPreviousPage',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'hasPreviousPage'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'getNextPage',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'getNextPage'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'getPreviousPage',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'getPreviousPage'),
    _class$1.prototype
), _applyDecoratedDescriptor$1(
    _class$1.prototype,
    'setPage',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'setPage'),
    _class$1.prototype
)), _class$1);

var _class;
var _descriptor;
var _descriptor2;
var _descriptor3;
var _class2;
var _temp;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer
            ? descriptor.initializer.call(context)
            : void 0,
    });
}

function _applyDecoratedDescriptor(
    target,
    property,
    decorators,
    descriptor,
    context
) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function(key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function(desc, decorator) {
        return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function generateNegativeId() {
    return -parseInt(uniqueId());
}

function concatInDict(dict, key, value) {
    dict[key] = dict[key] ? dict[key].concat(value) : value;
}

var Model = ((_class = ((_temp = _class2 = (function() {
    createClass(Model, [
        {
            key: 'casts',
            value: function casts() {
                return {};
            },

            // Empty function, but can be overridden if you want to do something after initializing the model.
        },
        {
            key: 'initialize',
            value: function initialize() {},
        },
        {
            key: 'url',

            // A `cid` can be used to identify the model locally.

            // Holds activated - non-nested - relations (e.g. `['animal']`)

            // Holds original attributes with values, so `clear()` knows what to reset to (quite ugly).
            get: function get$$1() {
                var id = this[this.constructor.primaryKey];
                return '' + this.urlRoot + (id ? id + '/' : '');
            },
            // URL query params that are added to fetch requests.

            // Holds activated - nested - relations (e.g. `['animal', 'animal.breed']`)

            // How the model is known at the backend. This is useful when the model is in a relation that has a different name.
        },
        {
            key: 'isNew',
            get: function get$$1() {
                return !this[this.constructor.primaryKey];
            },
        },
        {
            key: 'isLoading',
            get: function get$$1() {
                return this.__pendingRequestCount > 0;
            },
        },
        {
            key: 'primaryKey',
            set: function set$$1(v) {
                throw new Error(
                    '`primaryKey` should be a static property on the model.'
                );
            },
        },
        {
            key: 'backendResourceName',
            set: function set$$1(v) {
                throw new Error(
                    '`backendResourceName` should be a static property on the model.'
                );
            },
        },
    ]);

    function Model(data) {
        var _this = this;

        var options = arguments.length > 1 && arguments[1] !== undefined
            ? arguments[1]
            : {};
        classCallCheck(this, Model);
        this.__attributes = [];
        this.__originalAttributes = {};
        this.__activeRelations = [];
        this.__activeCurrentRelations = [];
        this.api = null;
        this.cid = 'm' + uniqueId();

        _initDefineProp(this, '__backendValidationErrors', _descriptor, this);

        _initDefineProp(this, '__pendingRequestCount', _descriptor2, this);

        _initDefineProp(this, '__fetchParams', _descriptor3, this);

        this.__store = options.store;
        this.__repository = options.repository;
        // Find all attributes. Not all observables are an attribute.
        forIn(this, function(value, key) {
            if (!key.startsWith('__') && isObservable(_this, key)) {
                _this.__attributes.push(key);
                var newValue = value;
                // An array or object observable can be mutated, so we want to ensure we always have
                // the original not-yet-mutated object/array.
                if (isObservableArray(value)) {
                    newValue = value.slice();
                } else if (isObservableObject(value)) {
                    newValue = Object.assign({}, value);
                }
                _this.__originalAttributes[key] = newValue;
            }
        });
        if (options.relations) {
            this.__parseRelations(options.relations);
        }
        if (data) {
            this.parse(data);
        }
        this.initialize();
    }

    createClass(Model, [
        {
            key: '__parseRelations',
            value: function __parseRelations(activeRelations) {
                var _this2 = this;

                this.__activeRelations = activeRelations;
                // TODO: No idea why getting the relations only works when it's a Function.
                var relations = this.relations && this.relations();
                var relModels = {};
                activeRelations.forEach(function(aRel) {
                    // Find the relation name before the first dot, and include all other relations after it
                    // Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
                    var relNames = aRel.match(/([^.]+)\.(.+)/);

                    var currentRel = relNames ? relNames[1] : aRel;
                    var otherRelNames = relNames && relNames[2];
                    var currentProp = relModels[currentRel];
                    var otherRels = otherRelNames && [otherRelNames];
                    // When two nested relations are defined next to each other (e.g. `['kind.breed', 'kind.location']`),
                    // the relation `kind` only needs to be initialized once.
                    relModels[currentRel] = currentProp
                        ? currentProp.concat(otherRels)
                        : otherRels;
                    if (!_this2.__activeCurrentRelations.includes(currentRel)) {
                        _this2.__activeCurrentRelations.push(currentRel);
                    }
                });
                extendObservable(
                    this,
                    mapValues(relModels, function(otherRelNames, relName) {
                        var RelModel = relations[relName];
                        if (!RelModel) {
                            throw new Error(
                                'Specified relation "' +
                                    relName +
                                    '" does not exist on model.'
                            );
                        }
                        var options = { relations: otherRelNames };
                        if (
                            _this2.__store &&
                            _this2.__store.__nestedRepository[relName]
                        ) {
                            options.repository =
                                _this2.__store.__nestedRepository[relName];
                        }
                        if (RelModel.prototype instanceof Store) {
                            return new RelModel(options);
                        }
                        return new RelModel(null, options);
                    })
                );
            },
        },
        {
            key: 'toBackend',
            value: function toBackend() {
                var _this3 = this;

                var output = {};
                this.__attributes.forEach(function(attr) {
                    if (!attr.startsWith('_')) {
                        output[snakeCase(attr)] = _this3.__toJSAttr(
                            attr,
                            _this3[attr]
                        );
                    }
                });
                // Add active relations as id.
                this.__activeCurrentRelations.forEach(function(currentRel) {
                    var rel = _this3[currentRel];
                    var relBackendName = snakeCase(currentRel);
                    if (rel instanceof Model) {
                        output[relBackendName] =
                            rel[rel.constructor.primaryKey];
                    }
                    if (rel instanceof Store) {
                        output[relBackendName] = rel.mapByPrimaryKey();
                    }
                });
                return output;
            },
        },
        {
            key: 'toBackendAll',
            value: function toBackendAll(newId) {
                var _this4 = this;

                var options = arguments.length > 1 && arguments[1] !== undefined
                    ? arguments[1]
                    : {};

                // TODO: This implementation is more a proof of concept; it's very shitty coded.
                var includeRelations = options.relations || [];
                var data = this.toBackend();
                var relations = {};

                if (newId) {
                    data[this.constructor.primaryKey] = newId;
                } else if (data[this.constructor.primaryKey] === null) {
                    data[this.constructor.primaryKey] = generateNegativeId();
                }

                this.__activeCurrentRelations.forEach(function(currentRel) {
                    var rel = _this4[currentRel];
                    var myNewId = null;
                    var relBackendName = snakeCase(currentRel);
                    if (data[relBackendName] === null) {
                        myNewId = generateNegativeId();
                        data[relBackendName] = myNewId;
                    }
                    if (isArray(data[relBackendName])) {
                        myNewId = data[relBackendName].map(function(id) {
                            return id === null ? generateNegativeId() : id;
                        });
                        data[relBackendName] = myNewId;
                    }

                    // `includeRelations` can look like `['kind.breed', 'owner']`
                    // Check to see if `currentRel` matches the first part of the relation (`kind` or `owner`)
                    var includeRelationData = includeRelations.filter(function(
                        rel
                    ) {
                        var nestedRels = rel.split('.');
                        return nestedRels.length > 0
                            ? nestedRels[0] === currentRel
                            : false;
                    });
                    if (includeRelationData.length > 0) {
                        // We want to pass through nested relations to the next relation, but pop of the first level.
                        var relativeRelations = includeRelationData
                            .map(function(rel) {
                                var nestedRels = rel.split('.');
                                nestedRels.shift();
                                return nestedRels.join('.');
                            })
                            .filter(function(rel) {
                                return !!rel;
                            });
                        var relBackendData = rel.toBackendAll(myNewId, {
                            relations: relativeRelations,
                        });
                        // Sometimes the backend knows the relation by a different name, e.g. the relation is called
                        // `activities`, but the name in the backend is `activity`.
                        // In that case, you can add `static backendResourceName = 'activity';` to that model.
                        var realBackendName =
                            rel.constructor.backendResourceName ||
                            relBackendName;
                        concatInDict(
                            relations,
                            realBackendName,
                            relBackendData.data
                        );
                        forIn(relBackendData.relations, function(relB, key) {
                            concatInDict(relations, key, relB);
                        });
                    }
                });

                return { data: [data], relations: relations };
            },
        },
        {
            key: 'toJS',
            value: function toJS$$1() {
                var _this5 = this;

                var output = {};
                this.__attributes.forEach(function(attr) {
                    output[attr] = _this5.__toJSAttr(attr, _this5[attr]);
                });

                this.__activeCurrentRelations.forEach(function(currentRel) {
                    var model = _this5[currentRel];
                    if (model) {
                        output[currentRel] = model.toJS();
                    }
                });
                return output;
            },
        },
        {
            key: '__toJSAttr',
            value: function __toJSAttr(attr, value) {
                var casts = this.casts();
                var cast = casts[attr];
                if (cast !== undefined) {
                    return toJS(cast.toJS(attr, value));
                }
                return toJS(value);
            },
        },
        {
            key: 'setFetchParams',
            value: function setFetchParams(params) {
                this.__fetchParams = Object.assign({}, params);
            },
        },
        {
            key: 'fromBackend',
            value: function fromBackend(_ref) {
                var _this6 = this;

                var data = _ref.data,
                    repos = _ref.repos,
                    relMapping = _ref.relMapping;

                // `data` contains properties for the current model.
                // `repos` is an object of "repositories". A repository is
                // e.g. "animal_kind", while the relation name would be "kind".
                // `relMapping` maps relation names to repositories.
                forIn(relMapping, function(repoName, relName) {
                    var repository = repos[repoName];
                    // All nested models get a repository. At this time we don't know yet
                    // what id the model should get, since the parent may or may not be set.
                    var model = get(_this6, snakeToCamel(relName));

                    // If we have a model which has a store relation which has a nested relation,
                    // the model doesn't exist yet
                    if (model === undefined) {
                        // We need to find the first store in the chain
                        // But we currently only support Model > Store > Model
                        // If there are more Models/Store in the length the "find first store in chain"
                        // needs to be implemented
                        var rels = relName.split('.');
                        var store = void 0;
                        var nestedRel = void 0;

                        // Find the first Store relation in the relation chain
                        rels.some(function(rel, i) {
                            // Try rel, rel.rel, rel.rel.rel, etc.
                            var subRelName = rels.slice(0, i + 1).join('.');
                            var subRel = get(_this6, snakeToCamel(subRelName));

                            if (subRel instanceof Store) {
                                store = subRel;
                                // Now we found the store.
                                // The store has models, and those models have another (model) relation.
                                //
                                // We need to set the a `__nestedRepository` in the store
                                // That means that when models get added to the store,
                                // Their relation is filled from the correct `__nestedRepository` in the store.
                                //
                                // So a Dog has PastOwners (store), the Owners in that store have a Town rel.
                                // We set 'town': repository in the `__nestedRepository` of the PastOwners
                                // When Owners get added, parsed, whatever, their town relation is set,
                                // using `Store.__nestedRepository`.
                                nestedRel = rels
                                    .slice(i + 1, rels.length)
                                    .join('.');
                                return true;
                            }
                            return false;
                        });
                        store.__nestedRepository[nestedRel] = repository;
                    } else {
                        model.__repository = repository;
                    }
                });

                // Now all repositories are set on the relations, start parsing the actual data.
                // `parse()` will recursively fill in all relations.
                if (data) {
                    this.parse(data);
                }
            },
        },
        {
            key: '__getApi',
            value: function __getApi() {
                if (!this.api) {
                    throw new Error(
                        'You are trying to perform a API request without an `api` property defined on the model.'
                    );
                }
                if (!this.urlRoot) {
                    throw new Error(
                        'You are trying to perform a API request without an `urlRoot` property defined on the model.'
                    );
                }
                return this.api;
            },
        },
        {
            key: '__addFromRepository',
            value: function __addFromRepository(id) {
                var relData = find(this.__repository, { id: id });
                if (relData) {
                    this.parse(relData);
                }
            },
        },
        {
            key: 'parse',
            value: function parse(data) {
                var _this7 = this;

                if (!isPlainObject(data)) {
                    throw new Error(
                        'Parameter supplied to parse() is not an object.'
                    );
                }
                forIn(data, function(value, key) {
                    var attr = snakeToCamel(key);
                    if (_this7.__attributes.includes(attr)) {
                        _this7[attr] = _this7.__parseAttr(attr, value);
                    } else if (_this7.__activeCurrentRelations.includes(attr)) {
                        // In Binder, a relation property is an `int` or `[int]`, referring to its ID.
                        // However, it can also be an object if there are nested relations (non flattened).
                        if (
                            isPlainObject(value) ||
                            isPlainObject(get(value, '[0]'))
                        ) {
                            _this7[attr].parse(value);
                        } else {
                            _this7[attr].__addFromRepository(value);
                        }
                    }
                });

                return this;
            },
        },
        {
            key: '__parseAttr',
            value: function __parseAttr(attr, value) {
                var casts = this.casts();
                var cast = casts[attr];
                if (cast !== undefined) {
                    return cast.parse(attr, value);
                }
                return value;
            },
        },
        {
            key: 'save',
            value: function save() {
                var _this8 = this;

                var options = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : {};

                this.__backendValidationErrors = {};
                this.__pendingRequestCount += 1;
                // TODO: Allow data from an argument to be saved?
                return this.__getApi()
                    .saveModel({
                        url: this.url,
                        data: this.toBackend(),
                        params: options.params,
                        isNew: this.isNew,
                    })
                    .then(
                        action(function(res) {
                            _this8.__pendingRequestCount -= 1;
                            _this8.saveFromBackend(res);
                        })
                    )
                    .catch(
                        action(function(err) {
                            _this8.__pendingRequestCount -= 1;
                            if (err.valErrors) {
                                _this8.__backendValidationErrors =
                                    err.valErrors;
                            }
                            throw err;
                        })
                    );
            },
        },
        {
            key: 'saveAll',
            value: function saveAll() {
                var _this9 = this;

                var options = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : {};

                this.__backendValidationErrors = {};
                this.__pendingRequestCount += 1;
                return this.__getApi()
                    .saveAllModels({
                        url: this.urlRoot,
                        data: this.toBackendAll(null, {
                            relations: options.relations,
                        }),
                    })
                    .then(
                        action(function(res) {
                            _this9.__pendingRequestCount -= 1;
                            _this9.saveFromBackend(res);
                        })
                    )
                    .catch(
                        action(function(err) {
                            _this9.__pendingRequestCount -= 1;
                            // TODO: saveAll does not support handling backend validation errors yet.
                            throw err;
                        })
                    );
            },

            // This is just a pass-through to make it easier to override parsing backend responses from the backend.
            // Sometimes the backend won't return the model after a save because e.g. it is created async.
        },
        {
            key: 'saveFromBackend',
            value: function saveFromBackend(res) {
                return this.fromBackend(res);
            },

            // TODO: This is a bit hacky...
        },
        {
            key: 'delete',
            value: function _delete() {
                var _this10 = this;

                var options = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : {};

                var removeFromStore = function removeFromStore() {
                    return _this10.__store
                        ? _this10.__store.remove(_this10)
                        : null;
                };
                if (options.immediate || this.isNew) {
                    removeFromStore();
                }
                if (this.isNew) {
                    return Promise.resolve();
                }

                this.__pendingRequestCount += 1;
                return this.__getApi()
                    .deleteModel({ url: this.url, params: options.params })
                    .then(
                        action(function() {
                            _this10.__pendingRequestCount -= 1;
                            if (!options.immediate) {
                                removeFromStore();
                            }
                        })
                    );
            },
        },
        {
            key: 'fetch',
            value: function fetch() {
                var _this11 = this;

                var options = arguments.length > 0 && arguments[0] !== undefined
                    ? arguments[0]
                    : {};

                if (this.isNew) {
                    throw new Error('Trying to fetch model without id!');
                }
                this.__pendingRequestCount += 1;
                var data = Object.assign(
                    this.__getApi().buildFetchModelParams(this),
                    this.__fetchParams,
                    options.data
                );
                return this.__getApi()
                    .fetchModel({ url: this.url, data: data })
                    .then(
                        action(function(res) {
                            _this11.fromBackend(res);
                            _this11.__pendingRequestCount -= 1;
                        })
                    );
            },
        },
        {
            key: 'clear',
            value: function clear() {
                var _this12 = this;

                forIn(this.__originalAttributes, function(value, key) {
                    _this12[key] = value;
                });

                this.__activeCurrentRelations.forEach(function(currentRel) {
                    _this12[currentRel].clear();
                });
            },
        },
        {
            key: 'backendValidationErrors',
            get: function get$$1() {
                return this.__backendValidationErrors;
            },
        },
    ]);
    return Model;
})()), (_class2.primaryKey = 'id'), (_class2.backendResourceName =
    ''), _temp)), ((_descriptor = _applyDecoratedDescriptor(
    _class.prototype,
    '__backendValidationErrors',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {};
        },
    }
)), (_descriptor2 = _applyDecoratedDescriptor(
    _class.prototype,
    '__pendingRequestCount',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return 0;
        },
    }
)), (_descriptor3 = _applyDecoratedDescriptor(
    _class.prototype,
    '__fetchParams',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {};
        },
    }
)), _applyDecoratedDescriptor(
    _class.prototype,
    'url',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'url'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'isNew',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'isNew'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'isLoading',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'isLoading'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    '__parseRelations',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, '__parseRelations'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'fromBackend',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'fromBackend'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'parse',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'parse'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'save',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'save'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'saveAll',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'saveAll'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'backendValidationErrors',
    [computed],
    Object.getOwnPropertyDescriptor(
        _class.prototype,
        'backendValidationErrors'
    ),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'delete',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'delete'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'fetch',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'fetch'),
    _class.prototype
), _applyDecoratedDescriptor(
    _class.prototype,
    'clear',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'clear'),
    _class.prototype
)), _class);

// lodash's `snakeCase` method removes dots from the string; this breaks mobx-spine
function camelToSnake(s) {
    return s.replace(/([A-Z])/g, function($1) {
        return '_' + $1.toLowerCase();
    });
}

// Function ripped from Django docs.
// See: https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
function csrfSafeMethod(method) {
    // These HTTP methods do not require CSRF protection.
    return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}

function parseBackendValidationErrors(response) {
    var valErrors = get(response, 'data.error.validation_errors');
    if (response.status === 400 && valErrors) {
        var camelCasedErrors = mapKeys(valErrors, function(value, key) {
            return snakeToCamel(key);
        });
        return mapValues(camelCasedErrors, function(valError) {
            return valError.map(function(obj) {
                return obj.code;
            });
        });
    }
    return null;
}

var BinderApi = (function() {
    function BinderApi() {
        classCallCheck(this, BinderApi);
        this.baseUrl = null;
        this.csrfToken = null;
        this.defaultHeaders = {};
    }

    createClass(BinderApi, [
        {
            key: '__request',
            value: function __request(method, url, data, options) {
                options || (options = {});
                var useCsrfToken = csrfSafeMethod(method)
                    ? undefined
                    : this.csrfToken;
                this.__testUrl(url);

                var axiosOptions = {
                    method: method,
                    baseURL: this.baseUrl,
                    url: url,
                    data: method !== 'get' && data ? data : undefined,
                    params: method === 'get' && data ? data : options.params,
                    headers: Object.assign(
                        {
                            'Content-Type': 'application/json',
                            'X-Csrftoken': useCsrfToken,
                        },
                        this.defaultHeaders
                    ),
                };

                Object.assign(axiosOptions, options);

                var xhr = axios(axiosOptions);

                // We fork the promise tree as we want to have the error traverse to the listeners
                if (this.onRequestError && options.skipRequestError !== true) {
                    xhr.catch(this.onRequestError);
                }

                var onSuccess = options.skipFormatter === true
                    ? Promise.resolve()
                    : this.__responseFormatter;
                return xhr.then(onSuccess);
            },
        },
        {
            key: '__responseFormatter',
            value: function __responseFormatter(res) {
                return res.data;
            },
        },
        {
            key: '__testUrl',
            value: function __testUrl(url) {
                if (!url.endsWith('/')) {
                    throw new Error(
                        'Binder does not accept urls that do not have a trailing slash: ' +
                            url
                    );
                }
            },
        },
        {
            key: 'get',
            value: function get$$1(url, data, options) {
                return this.__request('get', url, data, options);
            },
        },
        {
            key: 'post',
            value: function post(url, data, options) {
                return this.__request('post', url, data, options);
            },
        },
        {
            key: 'patch',
            value: function patch(url, data, options) {
                return this.__request('patch', url, data, options);
            },
        },
        {
            key: 'put',
            value: function put(url, data, options) {
                return this.__request('put', url, data, options);
            },
        },
        {
            key: 'delete',
            value: function _delete(url, data, options) {
                return this.__request('delete', url, data, options);
            },
        },
        {
            key: 'buildFetchModelParams',
            value: function buildFetchModelParams(model) {
                return {
                    // TODO: I really dislike that this is comma separated and not an array.
                    // We should fix this in the Binder API.
                    with: model.__activeRelations.map(camelToSnake).join(',') ||
                        null,
                };
            },
        },
        {
            key: 'fetchModel',
            value: function fetchModel(_ref) {
                var url = _ref.url, data = _ref.data;

                return this.get(url, data).then(function(res) {
                    return {
                        data: res.data,
                        repos: res.with,
                        relMapping: res.with_mapping,
                    };
                });
            },
        },
        {
            key: 'saveModel',
            value: function saveModel(_ref2) {
                var url = _ref2.url,
                    data = _ref2.data,
                    params = _ref2.params,
                    isNew = _ref2.isNew;

                var method = isNew ? 'post' : 'patch';
                return this[method](url, data, { params: params })
                    .then(function(newData) {
                        return { data: newData };
                    })
                    .catch(function(err) {
                        if (err.response) {
                            err.valErrors = parseBackendValidationErrors(
                                err.response
                            );
                        }
                        throw err;
                    });
            },
        },
        {
            key: 'saveAllModels',
            value: function saveAllModels(_ref3) {
                var url = _ref3.url, data = _ref3.data;

                return this.put(url, {
                    data: data.data,
                    with: data.relations,
                }).then(function(res) {
                    return {
                        data: res.data && res.data.length > 0
                            ? res.data[0]
                            : null,
                        repos: res.with,
                        relMapping: res.with_mapping,
                    };
                });
            },
        },
        {
            key: 'deleteModel',
            value: function deleteModel(_ref4) {
                var url = _ref4.url, params = _ref4.params;

                // TODO: kind of silly now, but we'll probably want better error handling soon.
                return this.delete(url, null, { params: params });
            },
        },
        {
            key: 'buildFetchStoreParams',
            value: function buildFetchStoreParams(store) {
                var offset = store.getPageOffset();
                return {
                    with: store.__activeRelations.join(',') || null,
                    limit: store.__state.limit,
                    // Hide offset if zero so the request looks cleaner in DevTools.
                    offset: offset || null,
                };
            },
        },
        {
            key: 'fetchStore',
            value: function fetchStore(_ref5) {
                var url = _ref5.url, data = _ref5.data;

                return this.get(url, data).then(function(res) {
                    return {
                        data: res.data,
                        repos: res.with,
                        relMapping: res.with_mapping,
                        totalRecords: res.meta.total_records,
                    };
                });
            },
        },
    ]);
    return BinderApi;
})();

function checkMomentInstance(attr, value) {
    if (!moment.isMoment(value)) {
        throw new Error('Attribute `' + attr + '` is not a moment instance.');
    }
}

var Casts = {
    date: {
        parse: function parse(attr, value) {
            if (value === null) {
                return null;
            }
            return moment(value, 'YYYY-MM-DD');
        },
        toJS: function toJS$$1(attr, value) {
            if (value === null) {
                return null;
            }
            checkMomentInstance(attr, value);
            return value.format('YYYY-MM-DD');
        },
    },
    datetime: {
        parse: function parse(attr, value) {
            if (value === null) {
                return null;
            }
            return moment(value);
        },
        toJS: function toJS$$1(attr, value) {
            if (value === null) {
                return null;
            }
            checkMomentInstance(attr, value);
            return value.format();
        },
    },
    enum: function _enum(expectedValues) {
        if (!isArray(expectedValues)) {
            throw new Error(
                'Invalid argument suplied to `Casts.enum`, expected an instance of array.'
            );
        }
        function checkExpectedValues(attr, value) {
            if (value === null) {
                return null;
            }
            if (expectedValues.includes(value)) {
                return value;
            }
            throw new Error(
                'Value set to attribute `' +
                    attr +
                    '`, ' +
                    JSON.stringify(value) +
                    ', is not one of the allowed enum: ' +
                    JSON.stringify(expectedValues)
            );
        }
        return {
            parse: checkExpectedValues,
            toJS: checkExpectedValues,
        };
    },
};

export { Model, Store, BinderApi, Casts };
