"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiService = createApiService;
exports.createRestApiService = createRestApiService;
exports.createCustomApiService = createCustomApiService;
const index_1 = require("./index");
function createApiService(config) {
    const { url: baseUrl, method: defaultMethod = 'GET' } = config;
    const buildUrl = (id) => {
        if (id !== undefined) {
            return `${baseUrl}/${id}`;
        }
        return baseUrl;
    };
    return {
        get: (params, requestConfig) => {
            return (0, index_1.get)(baseUrl, params, requestConfig);
        },
        post: (data, requestConfig) => {
            return (0, index_1.post)(baseUrl, data, requestConfig);
        },
        put: (data, requestConfig) => {
            const id = data === null || data === void 0 ? void 0 : data.id;
            const url = buildUrl(id);
            const _a = data || {}, { id: _ } = _a, restData = __rest(_a, ["id"]);
            return (0, index_1.put)(url, restData, requestConfig);
        },
        delete: (params, requestConfig) => {
            const id = typeof params === 'string' || typeof params === 'number' ? params : params === null || params === void 0 ? void 0 : params.id;
            const url = buildUrl(id);
            return (0, index_1.del)(url, undefined, requestConfig);
        },
        patch: (data, requestConfig) => {
            const id = data === null || data === void 0 ? void 0 : data.id;
            const url = buildUrl(id);
            const _a = data || {}, { id: _ } = _a, restData = __rest(_a, ["id"]);
            return (0, index_1.patch)(url, restData, requestConfig);
        },
        request: (requestConfig) => {
            return (0, index_1.request)(Object.assign(Object.assign({}, requestConfig), { url: requestConfig.url.startsWith('http') ? requestConfig.url : `${baseUrl}${requestConfig.url}` }));
        }
    };
}
function createRestApiService(config) {
    const baseService = createApiService(config);
    const { url: baseUrl } = config;
    return Object.assign(Object.assign({}, baseService), { getById: (id) => {
            return (0, index_1.get)(`${baseUrl}/${id}`);
        }, update: (id, data) => {
            return (0, index_1.put)(`${baseUrl}/${id}`, data);
        }, remove: (id) => {
            return (0, index_1.del)(`${baseUrl}/${id}`);
        } });
}
function createCustomApiService(url, methods) {
    const service = createApiService({ url });
    return Object.assign(Object.assign({}, service), methods);
}
__exportStar(require("./index"), exports);
__exportStar(require("./types"), exports);
//# sourceMappingURL=apiConfig.js.map