"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPixelArtToGallery = exportPixelArtToGallery;
exports.compressAndExportPixelArt = compressAndExportPixelArt;
exports.convertPixelArtToPngPath = convertPixelArtToPngPath;
exports.convertPixelArtToPngBuffer = convertPixelArtToPngBuffer;
exports.arrayBufferToTempFilePath = arrayBufferToTempFilePath;
exports.checkTempFileExists = checkTempFileExists;
exports.generatePixelArtPreview = generatePixelArtPreview;
exports.pngToPixelArtData = pngToPixelArtData;
exports.upscalePixelArtPng = upscalePixelArtPng;
exports.upscalePixelArtPngToBuffer = upscalePixelArtPngToBuffer;
const taro_1 = require("@tarojs/taro");
const HIGH_QUALITY_SIZE = 256;
function calculateCanvasSize(gridSize, highQuality) {
    if (!highQuality) {
        return gridSize;
    }
    const multiplier = Math.round(HIGH_QUALITY_SIZE / gridSize);
    return gridSize * multiplier;
}
async function createOffscreenCanvas(width, height) {
    return new Promise((resolve, reject) => {
        const query = taro_1.default.createSelectorQuery();
        query.select('#exportCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
            if (res && res[0]) {
                const canvas = res[0].node;
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;
                resolve({ canvas, ctx });
            }
            else {
                reject(new Error('Canvas not found'));
            }
        });
    });
}
async function drawPixelArtToCanvas(ctx, data, canvasSize) {
    const { gridSize, pixelData } = data;
    const pixelSize = canvasSize / gridSize;
    for (let i = 0; i < pixelData.length; i++) {
        const x = (i % gridSize) * pixelSize;
        const y = Math.floor(i / gridSize) * pixelSize;
        const color = pixelData[i];
        ctx.fillStyle = color;
        ctx.fillRect(x, y, pixelSize, pixelSize);
    }
}
async function canvasToTempFilePath(canvas, quality = 0.8) {
    return new Promise((resolve, reject) => {
        taro_1.default.canvasToTempFilePath({
            canvas: canvas,
            fileType: 'png',
            quality: quality,
            success: (res) => {
                resolve(res.tempFilePath);
            },
            fail: (err) => {
                reject(err);
            }
        });
    });
}
async function canvasToArrayBuffer(canvas, quality = 0.9) {
    try {
        const tempFilePath = await canvasToTempFilePath(canvas, quality);
        return new Promise((resolve, reject) => {
            const fs = taro_1.default.getFileSystemManager();
            fs.readFile({
                filePath: tempFilePath,
                success: (res) => {
                    resolve(res.data);
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    }
    catch (error) {
        console.error('Canvas to ArrayBuffer failed:', error);
        throw error;
    }
}
async function saveImageToPhotosAlbum(filePath) {
    return new Promise((resolve, reject) => {
        taro_1.default.saveImageToPhotosAlbum({
            filePath: filePath,
            success: () => {
                resolve();
            },
            fail: (err) => {
                if (err.errMsg.includes('auth deny')) {
                    taro_1.default.showModal({
                        title: '提示',
                        content: '需要您授权保存相册权限',
                        success: (modalRes) => {
                            if (modalRes.confirm) {
                                taro_1.default.openSetting({
                                    success: (settingRes) => {
                                        if (settingRes.authSetting['scope.writePhotosAlbum']) {
                                            saveImageToPhotosAlbum(filePath).then(resolve).catch(reject);
                                        }
                                        else {
                                            reject(new Error('用户拒绝授权'));
                                        }
                                    }
                                });
                            }
                            else {
                                reject(new Error('用户拒绝授权'));
                            }
                        }
                    });
                }
                else {
                    reject(err);
                }
            }
        });
    });
}
async function exportPixelArtToGallery(data, highQuality = false) {
    try {
        const { gridSize } = data;
        const canvasSize = calculateCanvasSize(gridSize, highQuality);
        const { canvas, ctx } = await createOffscreenCanvas(canvasSize, canvasSize);
        await drawPixelArtToCanvas(ctx, data, canvasSize);
        const tempFilePath = await canvasToTempFilePath(canvas, 0.8);
        await saveImageToPhotosAlbum(tempFilePath);
    }
    catch (error) {
        console.error('Export pixel art failed:', error);
        throw error;
    }
}
async function compressAndExportPixelArt(data, highQuality = false) {
    return exportPixelArtToGallery(data, highQuality);
}
async function convertPixelArtToPngPath(data, highQuality = false) {
    try {
        const { gridSize } = data;
        const canvasSize = calculateCanvasSize(gridSize, highQuality);
        const { canvas, ctx } = await createOffscreenCanvas(canvasSize, canvasSize);
        await drawPixelArtToCanvas(ctx, data, canvasSize);
        const tempFilePath = await canvasToTempFilePath(canvas, 0.9);
        return tempFilePath;
    }
    catch (error) {
        console.error('Convert pixel art to PNG path failed:', error);
        throw error;
    }
}
async function convertPixelArtToPngBuffer(data, highQuality = false) {
    try {
        const { gridSize } = data;
        const canvasSize = calculateCanvasSize(gridSize, highQuality);
        const { canvas, ctx } = await createOffscreenCanvas(canvasSize, canvasSize);
        await drawPixelArtToCanvas(ctx, data, canvasSize);
        const buffer = await canvasToArrayBuffer(canvas, 0.9);
        return buffer;
    }
    catch (error) {
        console.error('Convert pixel art to PNG buffer failed:', error);
        throw error;
    }
}
async function arrayBufferToTempFilePath(buffer) {
    try {
        const fs = taro_1.default.getFileSystemManager();
        const tempFilePath = `${taro_1.default.env.USER_DATA_PATH}/temp_${Date.now()}.png`;
        return new Promise((resolve, reject) => {
            fs.writeFile({
                filePath: tempFilePath,
                data: buffer,
                encoding: 'binary',
                success: () => {
                    resolve(tempFilePath);
                },
                fail: (err) => {
                    reject(err);
                }
            });
        });
    }
    catch (error) {
        console.error('ArrayBuffer to temp file path failed:', error);
        throw error;
    }
}
async function checkTempFileExists(filePath) {
    try {
        const fs = taro_1.default.getFileSystemManager();
        return new Promise((resolve) => {
            fs.access({
                path: filePath,
                success: () => {
                    resolve(true);
                },
                fail: () => {
                    resolve(false);
                }
            });
        });
    }
    catch (error) {
        return false;
    }
}
function generatePixelArtPreview(data, highQuality = false) {
    return convertPixelArtToPngPath(data, highQuality);
}
async function getImageInfo(src) {
    return new Promise((resolve, reject) => {
        taro_1.default.getImageInfo({
            src: src,
            success: resolve,
            fail: reject
        });
    });
}
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}
async function pngToPixelArtData(imagePath, gridSize) {
    try {
        const imageInfo = await getImageInfo(imagePath);
        const { width, height } = imageInfo;
        const { canvas, ctx } = await createOffscreenCanvas(width, height);
        return new Promise((resolve, reject) => {
            const img = canvas.createImage();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                const pixelData = [];
                const pixelWidth = width / gridSize;
                const pixelHeight = height / gridSize;
                for (let row = 0; row < gridSize; row++) {
                    for (let col = 0; col < gridSize; col++) {
                        const x = Math.floor(col * pixelWidth + pixelWidth / 2);
                        const y = Math.floor(row * pixelHeight + pixelHeight / 2);
                        const imageData = ctx.getImageData(x, y, 1, 1);
                        const [r, g, b] = imageData.data;
                        const hexColor = rgbToHex(r, g, b);
                        pixelData.push(hexColor);
                    }
                }
                const result = {
                    gridSize: gridSize,
                    pixelData: pixelData
                };
                resolve(result);
            };
            img.onerror = (err) => {
                reject(new Error('Failed to load image'));
            };
            img.src = imagePath;
        });
    }
    catch (error) {
        console.error('Convert PNG to pixel art data failed:', error);
        throw error;
    }
}
async function upscalePixelArtPng(imagePath, gridSize, highQuality = true) {
    const pixelData = await pngToPixelArtData(imagePath, gridSize);
    const hdPath = await convertPixelArtToPngPath(pixelData, highQuality);
    return hdPath;
}
async function upscalePixelArtPngToBuffer(imagePath, gridSize, highQuality = true) {
    const pixelData = await pngToPixelArtData(imagePath, gridSize);
    const buffer = await convertPixelArtToPngBuffer(pixelData, highQuality);
    return buffer;
}
//# sourceMappingURL=pixelArt.js.map