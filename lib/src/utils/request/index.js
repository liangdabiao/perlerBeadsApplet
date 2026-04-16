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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBaseURL = setBaseURL;
exports.getBaseURL = getBaseURL;
exports.request = request;
exports.get = get;
exports.post = post;
exports.put = put;
exports.del = del;
exports.patch = patch;
exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.initRequest = initRequest;
const taro_1 = require("@tarojs/taro");
const interceptors_1 = require("./interceptors");
const DEFAULT_CONFIG = {
    method: 'GET',
    timeout: 30000,
    dataType: 'json',
    header: {
        'Content-Type': 'application/json'
    }
};
let baseURL = '';
function setBaseURL(url) {
    baseURL = url;
}
function getBaseURL() {
    return baseURL;
}
async function request(config) {
    try {
        const mergedConfig = Object.assign(Object.assign(Object.assign({}, DEFAULT_CONFIG), config), { header: Object.assign(Object.assign({}, DEFAULT_CONFIG.header), config.header) });
        if (!mergedConfig.url.startsWith('http')) {
            mergedConfig.url = `${baseURL}${mergedConfig.url}`;
        }
        const processedConfig = await (0, interceptors_1.applyRequestInterceptors)(mergedConfig);
        const response = await taro_1.default.request({
            url: processedConfig.url,
            method: processedConfig.method,
            data: processedConfig.data,
            header: processedConfig.header,
            timeout: processedConfig.timeout,
            dataType: processedConfig.dataType,
            responseType: processedConfig.responseType,
            enableCache: processedConfig.enableCache,
            enableHttp2: processedConfig.enableHttp2,
            enableQuic: processedConfig.enableQuic
        });
        const processedResponse = await (0, interceptors_1.applyResponseInterceptors)(response);
        const apiData = processedResponse.data;
        if (apiData && typeof apiData === 'object' && 'success' in apiData) {
            if (apiData.success) {
                return apiData.data;
            }
            else {
                throw new Error(apiData.message || '请求失败');
            }
        }
        return processedResponse.data;
    }
    catch (error) {
        const requestError = {
            errMsg: error.errMsg || error.message || '未知错误',
            errno: error.errno
        };
        return (0, interceptors_1.applyErrorInterceptors)(requestError);
    }
}
function get(url, params, config) {
    return request(Object.assign({ url, method: 'GET', data: params }, config));
}
function post(url, data, config) {
    return request(Object.assign({ url, method: 'POST', data }, config));
}
function put(url, data, config) {
    return request(Object.assign({ url, method: 'PUT', data }, config));
}
function del(url, params, config) {
    return request(Object.assign({ url, method: 'DELETE', data: params }, config));
}
function patch(url, data, config) {
    return request(Object.assign({ url, method: 'PATCH', data }, config));
}
function uploadFile(url, filePath, name = 'file', formData, config) {
    const uploadUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    return new Promise((resolve, reject) => {
        taro_1.default.uploadFile({
            url: uploadUrl,
            filePath,
            name,
            formData,
            header: Object.assign(Object.assign({}, DEFAULT_CONFIG.header), config === null || config === void 0 ? void 0 : config.header),
            success: (res) => {
                try {
                    const data = JSON.parse(res.data);
                    if (data.success) {
                        resolve(data.data);
                    }
                    else {
                        reject(new Error(data.message || '上传失败'));
                    }
                }
                catch (_a) {
                    resolve(res.data);
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
function downloadFile(url, config) {
    const downloadUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    return new Promise((resolve, reject) => {
        taro_1.default.downloadFile({
            url: downloadUrl,
            header: Object.assign(Object.assign({}, DEFAULT_CONFIG.header), config === null || config === void 0 ? void 0 : config.header),
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.tempFilePath);
                }
                else {
                    reject(new Error(`下载失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
function initRequest(config) {
    setBaseURL(config.baseURL);
    if (config.setupInterceptors !== false) {
        (0, interceptors_1.setupDefaultInterceptors)();
    }
}
__exportStar(require("./types"), exports);
__exportStar(require("./interceptors"), exports);
//# sourceMappingURL=index.js.map