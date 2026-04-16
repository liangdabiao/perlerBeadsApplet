"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditorTempStore = void 0;
const pinia_1 = require("pinia");
const vue_1 = require("vue");
exports.useEditorTempStore = (0, pinia_1.defineStore)('editorTemp', () => {
    const tempData = (0, vue_1.ref)(null);
    const setTempData = (data) => {
        tempData.value = data;
    };
    const getTempData = () => {
        return tempData.value;
    };
    const clearTempData = () => {
        tempData.value = null;
    };
    return {
        tempData,
        setTempData,
        getTempData,
        clearTempData
    };
});
//# sourceMappingURL=editorTemp.js.map