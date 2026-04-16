"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayBufferToBase64 = arrayBufferToBase64;
exports.base64ToArrayBuffer = base64ToArrayBuffer;
const taro_1 = require("@tarojs/taro");
function arrayBufferToBase64(buffer) {
    return taro_1.default.arrayBufferToBase64(buffer);
}
function base64ToArrayBuffer(base64) {
    return taro_1.default.base64ToArrayBuffer(base64);
}
//# sourceMappingURL=base64.js.map