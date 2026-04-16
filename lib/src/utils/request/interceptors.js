"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interceptorManager = void 0;
exports.addRequestInterceptor = addRequestInterceptor;
exports.addResponseInterceptor = addResponseInterceptor;
exports.addErrorInterceptor = addErrorInterceptor;
exports.applyRequestInterceptors = applyRequestInterceptors;
exports.applyResponseInterceptors = applyResponseInterceptors;
exports.applyErrorInterceptors = applyErrorInterceptors;
exports.setupDefaultInterceptors = setupDefaultInterceptors;
const taro_1 = require("@tarojs/taro");
exports.interceptorManager = {
    request: [],
    response: [],
    error: []
};
function addRequestInterceptor(interceptor) {
    exports.interceptorManager.request.push(interceptor);
    return () => {
        const index = exports.interceptorManager.request.indexOf(interceptor);
        if (index > -1) {
            exports.interceptorManager.request.splice(index, 1);
        }
    };
}
function addResponseInterceptor(interceptor) {
    exports.interceptorManager.response.push(interceptor);
    return () => {
        const index = exports.interceptorManager.response.indexOf(interceptor);
        if (index > -1) {
            exports.interceptorManager.response.splice(index, 1);
        }
    };
}
function addErrorInterceptor(interceptor) {
    exports.interceptorManager.error.push(interceptor);
    return () => {
        const index = exports.interceptorManager.error.indexOf(interceptor);
        if (index > -1) {
            exports.interceptorManager.error.splice(index, 1);
        }
    };
}
async function applyRequestInterceptors(config) {
    let result = config;
    for (const interceptor of exports.interceptorManager.request) {
        result = await interceptor(result);
    }
    return result;
}
async function applyResponseInterceptors(response) {
    let result = response;
    for (const interceptor of exports.interceptorManager.response) {
        result = await interceptor(result);
    }
    return result;
}
async function applyErrorInterceptors(error) {
    for (const interceptor of exports.interceptorManager.error) {
        try {
            return await interceptor(error);
        }
        catch (e) {
            continue;
        }
    }
    throw error;
}
function setupDefaultInterceptors() {
    addRequestInterceptor((config) => {
        const token = taro_1.default.getStorageSync('token');
        if (token) {
            config.header = Object.assign(Object.assign({}, config.header), { Authorization: `Bearer ${token}` });
        }
        return config;
    });
    addResponseInterceptor((response) => {
        const { statusCode, data } = response;
        if (statusCode >= 200 && statusCode < 300) {
            const apiData = data;
            if (apiData && typeof apiData === 'object' && 'success' in apiData) {
                if (!apiData.success) {
                    taro_1.default.showToast({
                        title: apiData.message || '请求失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            }
        }
        else if (statusCode === 401) {
            taro_1.default.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none',
                duration: 2000
            });
            taro_1.default.removeStorageSync('token');
        }
        else if (statusCode >= 500) {
            taro_1.default.showToast({
                title: '服务器错误，请稍后重试',
                icon: 'none',
                duration: 2000
            });
        }
        else {
            taro_1.default.showToast({
                title: `请求失败: ${statusCode}`,
                icon: 'none',
                duration: 2000
            });
        }
        return response;
    });
    addErrorInterceptor(async (error) => {
        console.error('Request Error:', error);
        taro_1.default.showToast({
            title: error.errMsg || '网络请求失败',
            icon: 'none',
            duration: 2000
        });
        throw error;
    });
}
//# sourceMappingURL=interceptors.js.map