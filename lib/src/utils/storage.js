"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.savePixelArt = savePixelArt;
exports.updatePixelArt = updatePixelArt;
exports.getPixelArtList = getPixelArtList;
exports.getPixelArtById = getPixelArtById;
exports.deletePixelArt = deletePixelArt;
const taro_1 = require("@tarojs/taro");
const base64_1 = require("./base64");
const STORAGE_KEY = 'pixel_art_gallery';
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
async function savePixelArt(item) {
    const now = new Date().toISOString();
    const newItem = Object.assign(Object.assign({}, item), { pngData: (0, base64_1.arrayBufferToBase64)(item.pngData), status: item.status || 'unfinished', id: generateId(), createdAt: now, updatedAt: now });
    const list = await getPixelArtList();
    list.unshift(newItem);
    // const storageList: PixelArtItemStorage[] = list.map(item => ({
    //   ...item,
    //   pngData: arrayBufferToBase64(item.pngData)
    // }))
    const storageList = list;
    await taro_1.default.setStorage({ key: STORAGE_KEY, data: JSON.stringify(storageList) });
    return list;
}
async function updatePixelArt(id, updates) {
    const list = await getPixelArtList();
    const index = list.findIndex(item => item.id === id);
    if (index === -1) {
        return null;
    }
    list[index] = Object.assign(Object.assign(Object.assign({}, list[index]), updates), { updatedAt: new Date().toISOString() });
    // const storageList: PixelArtItemStorage[] = list.map(item => ({
    //   ...item,
    //   pngData: arrayBufferToBase64(item.pngData)
    // }))
    const storageList = list;
    await taro_1.default.setStorage({ key: STORAGE_KEY, data: JSON.stringify(storageList) });
    return list[index];
}
async function getPixelArtList() {
    try {
        const data = await taro_1.default.getStorage({ key: STORAGE_KEY });
        const storageList = JSON.parse(data.data || '[]');
        return storageList;
    }
    catch (_a) {
        return [];
    }
}
async function getPixelArtById(id) {
    const list = await getPixelArtList();
    return list.find(item => item.id === id) || null;
}
async function deletePixelArt(id) {
    const list = await getPixelArtList();
    const filteredList = list.filter(item => item.id !== id);
    if (filteredList.length === list.length) {
        return false;
    }
    // const storageList: PixelArtItemStorage[] = filteredList.map(item => ({
    //   ...item,
    //   pngData: arrayBufferToBase64(item.pngData)
    // }))
    const storageList = filteredList;
    await taro_1.default.setStorage({ key: STORAGE_KEY, data: JSON.stringify(storageList) });
    return true;
}
//# sourceMappingURL=storage.js.map