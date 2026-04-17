import Taro from '@tarojs/taro'
import { GridDownloadOptions } from '@/types/downloadTypes'
import { colorSystemMapping, ColorSystem } from '@/utils/colorData'

interface PixelArtData {
  gridSize: number
  pixelData: string[]
}
export type PixelArtDataType = PixelArtData
const HIGH_QUALITY_SIZE = 256

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#000000'
  const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  return luma > 0.5 ? '#000000' : '#FFFFFF'
}

function drawRoundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.fill()
}

function getColorKeyByHex(hex: string, colorSystem: ColorSystem = 'MARD'): string {
  const normalizedHex = hex.toUpperCase()
  if (colorSystemMapping[normalizedHex]) {
    return colorSystemMapping[normalizedHex][colorSystem]
  }
  return hex
}

function countColors(pixelData: string[]): { [key: string]: { count: number; color: string } } {
  const counts: { [key: string]: { count: number; color: string } } = {}
  pixelData.forEach(color => {
    if (color !== '#FFFFFF') {
      const key = color.toUpperCase()
      if (!counts[key]) {
        counts[key] = { count: 0, color: key }
      }
      counts[key].count++
    }
  })
  return counts
}

function calculateCanvasSize(gridSize: number, highQuality: boolean): number {
  if (!highQuality) {
    return gridSize
  }
  
  const multiplier = Math.round(HIGH_QUALITY_SIZE / gridSize)
  return gridSize * multiplier
}

async function createOffscreenCanvas(width: number, height: number): Promise<any> {
  try {
    const canvas = Taro.createOffscreenCanvas({
      type: '2d',
      width: width,
      height: height
    })
    const ctx = canvas.getContext('2d')
    return { canvas, ctx }
  } catch (error) {
    console.error('Create offscreen canvas failed:', error)
    throw error
  }
}

async function drawPixelArtToCanvas(ctx: any, data: PixelArtData, canvasSize: number): Promise<void> {
  const { gridSize, pixelData } = data
  const pixelSize = canvasSize / gridSize

  for (let i = 0; i < pixelData.length; i++) {
    const x = (i % gridSize) * pixelSize
    const y = Math.floor(i / gridSize) * pixelSize
    const color = pixelData[i]

    ctx.fillStyle = color
    ctx.fillRect(x, y, pixelSize, pixelSize)
  }
}

async function canvasToTempFilePath(canvas: any, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    Taro.canvasToTempFilePath({
      canvas: canvas,
      fileType: 'png',
      quality: quality,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

async function canvasToArrayBuffer(canvas: any, quality: number = 0.9): Promise<ArrayBuffer> {
  try {
    const tempFilePath = await canvasToTempFilePath(canvas, quality)
    
    return new Promise((resolve, reject) => {
      const fs = Taro.getFileSystemManager()
      fs.readFile({
        filePath: tempFilePath,
        success: (res) => {
          resolve(res.data as ArrayBuffer)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  } catch (error) {
    console.error('Canvas to ArrayBuffer failed:', error)
    throw error
  }
}

async function saveImageToPhotosAlbum(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Taro.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        resolve()
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          Taro.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            success: (modalRes) => {
              if (modalRes.confirm) {
                Taro.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.writePhotosAlbum']) {
                      saveImageToPhotosAlbum(filePath).then(resolve).catch(reject)
                    } else {
                      reject(new Error('用户拒绝授权'))
                    }
                  }
                })
              } else {
                reject(new Error('用户拒绝授权'))
              }
            }
          })
        } else {
          reject(err)
        }
      }
    })
  })
}

export async function exportPixelArtToGallery(data: PixelArtData, highQuality: boolean = false): Promise<void> {
  try {
    const { gridSize } = data
    const canvasSize = calculateCanvasSize(gridSize, highQuality)
    const { canvas, ctx } = await createOffscreenCanvas(canvasSize, canvasSize)
    
    await drawPixelArtToCanvas(ctx, data, canvasSize)
    
    const tempFilePath = await canvasToTempFilePath(canvas, 0.8)
    
    await saveImageToPhotosAlbum(tempFilePath)
  } catch (error) {
    console.error('Export pixel art failed:', error)
    throw error
  }
}

export async function compressAndExportPixelArt(data: PixelArtData, highQuality: boolean = false): Promise<void> {
  return exportPixelArtToGallery(data, highQuality)
}

export async function convertPixelArtToPngPath(data: PixelArtData, highQuality: boolean = false): Promise<string> {
  try {
    const { gridSize } = data
    const canvasSize = calculateCanvasSize(gridSize, highQuality)
    const { canvas, ctx } = await createOffscreenCanvas(canvasSize, canvasSize)

    await drawPixelArtToCanvas(ctx, data, canvasSize)

    const tempFilePath = await canvasToTempFilePath(canvas, 0.9)
    return tempFilePath
  } catch (error) {
    console.error('Convert pixel art to PNG path failed:', error)
    throw error
  }
}

export async function convertPixelArtToPngBuffer(data: PixelArtData, highQuality: boolean = false): Promise<ArrayBuffer> {
  try {
    const { gridSize } = data
    const canvasSize = calculateCanvasSize(gridSize, highQuality)
    const { canvas, ctx } = await createOffscreenCanvas(canvasSize, canvasSize)

    await drawPixelArtToCanvas(ctx, data, canvasSize)

    const buffer = await canvasToArrayBuffer(canvas, 0.9)
    return buffer
  } catch (error) {
    console.error('Convert pixel art to PNG buffer failed:', error)
    throw error
  }
}

export async function arrayBufferToTempFilePath(buffer: ArrayBuffer): Promise<string> {
  try {
    const fs = Taro.getFileSystemManager()
    const tempFilePath = `${Taro.env.USER_DATA_PATH}/temp_${Date.now()}.png`
    
    return new Promise((resolve, reject) => {
      fs.writeFile({
        filePath: tempFilePath,
        data: buffer,
        encoding: 'binary',
        success: () => {
          resolve(tempFilePath)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  } catch (error) {
    console.error('ArrayBuffer to temp file path failed:', error)
    throw error
  }
}

export async function checkTempFileExists(filePath: string): Promise<boolean> {
  try {
    const fs = Taro.getFileSystemManager()
    return new Promise((resolve) => {
      fs.access({
        path: filePath,
        success: () => {
          resolve(true)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  } catch (error) {
    return false
  }
}

export function generatePixelArtPreview(data: PixelArtData, highQuality: boolean = false): Promise<string> {
  return convertPixelArtToPngPath(data, highQuality)
}

async function getImageInfo(src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    Taro.getImageInfo({
      src: src,
      success: resolve,
      fail: reject
    })
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function calculateColorDistance(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const dr = color1.r - color2.r
  const dg = color1.g - color2.g
  const db = color1.b - color2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function findClosestColor(hexColor: string, colorPalette: string[]): string {
  const targetColor = hexToRgb(hexColor)
  let minDistance = Infinity
  let closestColor = colorPalette[0]
  
  for (const color of colorPalette) {
    const paletteColor = hexToRgb(color)
    const distance = calculateColorDistance(targetColor, paletteColor)
    
    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }
  
  return closestColor
}

export async function pngToPixelArtData(imagePath: string, gridSize: number): Promise<PixelArtData> {
  try {
    const imageInfo = await getImageInfo(imagePath)
    const { width, height } = imageInfo
    
    const { canvas, ctx } = await createOffscreenCanvas(width, height)
    
    return new Promise((resolve, reject) => {
      const img = canvas.createImage()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        
        const pixelData: string[] = []
        const pixelWidth = width / gridSize
        const pixelHeight = height / gridSize
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const x = Math.floor(col * pixelWidth + pixelWidth / 2)
            const y = Math.floor(row * pixelHeight + pixelHeight / 2)
            
            const imageData = ctx.getImageData(x, y, 1, 1)
            const [r, g, b] = imageData.data
            const hexColor = rgbToHex(r, g, b)
            
            pixelData.push(hexColor)
          }
        }
        
        const result: PixelArtData = {
          gridSize: gridSize,
          pixelData: pixelData
        }
        
        resolve(result)
      }
      
      img.onerror = (err) => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = imagePath
    })
  } catch (error) {
    console.error('Convert PNG to pixel art data failed:', error)
    throw error
  }
}

export async function upscalePixelArtPng(
  imagePath: string,
  gridSize: number,
  highQuality: boolean = true
): Promise<string> {
  const pixelData = await pngToPixelArtData(imagePath, gridSize)
  const hdPath = await convertPixelArtToPngPath(pixelData, highQuality)
  return hdPath
}

export async function upscalePixelArtPngToBuffer(
  imagePath: string,
  gridSize: number,
  highQuality: boolean = true
): Promise<ArrayBuffer> {
  const pixelData = await pngToPixelArtData(imagePath, gridSize)
  const buffer = await convertPixelArtToPngBuffer(pixelData, highQuality)
  return buffer
}

export async function imageToPixelArtData(
  imagePath: string,
  targetGridSize: number,
  colorPalette?: string[]
): Promise<PixelArtData> {
  try {
    const imageInfo = await getImageInfo(imagePath)
    const { width, height } = imageInfo
    
    const maxDim = Math.max(width, height)
    const scale = targetGridSize / maxDim
    
    const scaledWidth = Math.round(width * scale)
    const scaledHeight = Math.round(height * scale)
    
    const { canvas, ctx } = await createOffscreenCanvas(targetGridSize, targetGridSize)
    
    return new Promise((resolve, reject) => {
      const img = canvas.createImage()
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, targetGridSize, targetGridSize)
        
        const offsetX = Math.round((targetGridSize - scaledWidth) / 2)
        const offsetY = Math.round((targetGridSize - scaledHeight) / 2)
        
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)
        
        const pixelData: string[] = []
        const pixelWidth = targetGridSize / targetGridSize
        const pixelHeight = targetGridSize / targetGridSize
        
        for (let row = 0; row < targetGridSize; row++) {
          for (let col = 0; col < targetGridSize; col++) {
            const x = Math.floor(col * pixelWidth + pixelWidth / 2)
            const y = Math.floor(row * pixelHeight + pixelHeight / 2)
            
            const imageData = ctx.getImageData(x, y, 1, 1)
            const [r, g, b] = imageData.data
            let hexColor = rgbToHex(r, g, b)
            
            if (colorPalette && colorPalette.length > 0) {
              hexColor = findClosestColor(hexColor, colorPalette)
            }
            
            pixelData.push(hexColor)
          }
        }
        
        const result: PixelArtData = {
          gridSize: targetGridSize,
          pixelData: pixelData
        }
        
        resolve(result)
      }
      
      img.onerror = (err) => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = imagePath
    })
  } catch (error) {
    console.error('Convert image to pixel art data failed:', error)
    throw error
  }
}

export async function generatePatternImage(
  data: PixelArtData,
  options: GridDownloadOptions,
  colorSystem: ColorSystem = 'MARD',
  title: string = '拼豆图纸'
): Promise<string> {
  try {
    const { gridSize, pixelData } = data
    const N = gridSize
    const M = gridSize
    const downloadCellSize = 30
    const { showGrid, gridInterval, showCoordinates, showCellNumbers, gridLineColor, includeStats } = options

    const axisLabelSize = showCoordinates ? Math.max(30, Math.floor(downloadCellSize)) : 0
    const statsPadding = 20
    let statsHeight = 0

    const preCalcWidth = N * downloadCellSize + axisLabelSize
    const preCalcAvailableWidth = preCalcWidth - (statsPadding * 2)
    const baseStatsFontSize = 13
    const widthFactor = Math.max(0, preCalcAvailableWidth - 350) / 600
    const statsFontSize = Math.floor(baseStatsFontSize + (widthFactor * 10))

    const extraLeftMargin = showCoordinates ? Math.max(20, statsFontSize * 2) : 0
    const extraRightMargin = showCoordinates ? Math.max(20, statsFontSize * 2) : 0
    const extraTopMargin = showCoordinates ? Math.max(15, statsFontSize) : 0
    const extraBottomMargin = showCoordinates ? Math.max(15, statsFontSize) : 0

    const gridWidth = N * downloadCellSize
    const gridHeight = M * downloadCellSize
    const baseTitleBarHeight = 80
    const initialWidth = gridWidth + axisLabelSize + extraLeftMargin
    const titleBarScale = Math.max(1.0, Math.min(2.0, initialWidth / 1000))
    const titleBarHeight = Math.floor(baseTitleBarHeight * titleBarScale)
    const titleFontSize = Math.max(28, Math.floor(28 * titleBarScale))

    const colorCounts = countColors(pixelData)
    const totalBeadCount = Object.values(colorCounts).reduce((sum, item) => sum + item.count, 0)

    if (includeStats && Object.keys(colorCounts).length > 0) {
      const statsTopMargin = 24
      const numColumns = Math.max(1, Math.min(4, Math.floor(preCalcAvailableWidth / 250)))
      const baseSwatchSize = 18
      const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 20))
      const numRows = Math.ceil(Object.keys(colorCounts).length / numColumns)
      const statsRowHeight = Math.max(swatchSize + 8, 25)
      const titleHeight = 40
      const footerHeight = 40
      statsHeight = titleHeight + (numRows * statsRowHeight) + footerHeight + (statsPadding * 2) + statsTopMargin
    }

    const downloadWidth = gridWidth + (axisLabelSize * 2) + extraLeftMargin + extraRightMargin
    let downloadHeight = titleBarHeight + gridHeight + (axisLabelSize * 2) + statsHeight + extraTopMargin + extraBottomMargin

    const { canvas, ctx } = await createOffscreenCanvas(Math.max(downloadWidth, 300), Math.max(downloadHeight, 300))
    const adjustedCanvas = canvas as any
    adjustedCanvas.width = downloadWidth
    adjustedCanvas.height = downloadHeight

    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, downloadWidth, downloadHeight)

    ctx.fillStyle = '#1F2937'
    ctx.fillRect(0, 0, downloadWidth, titleBarHeight)

    const brandBlockWidth = titleBarHeight * 0.8
    const brandGradient = ctx.createLinearGradient(0, 0, brandBlockWidth, titleBarHeight)
    brandGradient.addColorStop(0, '#6366F1')
    brandGradient.addColorStop(1, '#8B5CF6')
    ctx.fillStyle = brandGradient
    ctx.fillRect(0, 0, brandBlockWidth, titleBarHeight)

    const logoSize = titleBarHeight * 0.4
    const logoX = brandBlockWidth / 2
    const logoY = titleBarHeight / 2
    ctx.fillStyle = '#FFFFFF'
    const beadSize = logoSize / 4
    const beadSpacing = beadSize * 1.2

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const beadX = logoX - logoSize / 2 + col * beadSpacing
        const beadY = logoY - logoSize / 2 + row * beadSpacing
        drawRoundedRect(ctx, beadX, beadY, beadSize, beadSize, beadSize * 0.2)
      }
    }

    const mainTitleFontSize = Math.max(20, Math.floor(titleFontSize * 0.8))
    const subTitleFontSize = Math.max(12, Math.floor(titleFontSize * 0.45))

    ctx.fillStyle = '#FFFFFF'
    ctx.font = `600 ${mainTitleFontSize}px system-ui, sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const titleStartX = brandBlockWidth + titleBarHeight * 0.3
    const mainTitleY = titleBarHeight * 0.4
    ctx.fillText(title ? `${title}（pindou.348349.xyz）` : '拼豆图纸（pindou.348349.xyz）', titleStartX, mainTitleY)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = `400 ${subTitleFontSize}px system-ui, sans-serif`
    const subTitleY = titleBarHeight * 0.65
    ctx.fillText(`${N}x${M} 网格`, titleStartX, subTitleY)

    const fontSize = Math.max(8, Math.floor(downloadCellSize * 0.4))

    if (showCoordinates) {
      ctx.fillStyle = '#F5F5F5'
      ctx.fillRect(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin, gridWidth, axisLabelSize)
      ctx.fillRect(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize + gridHeight, gridWidth, axisLabelSize)
      ctx.fillRect(extraLeftMargin, titleBarHeight + extraTopMargin + axisLabelSize, axisLabelSize, gridHeight)
      ctx.fillRect(extraLeftMargin + axisLabelSize + gridWidth, titleBarHeight + extraTopMargin + axisLabelSize, axisLabelSize, gridHeight)

      ctx.fillStyle = '#333333'
      const axisFontSize = 14
      ctx.font = `${axisFontSize}px sans-serif`

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 0; i < N; i++) {
        if ((i + 1) % gridInterval === 0 || i === 0 || i === N - 1) {
          const numX = extraLeftMargin + axisLabelSize + (i * downloadCellSize) + (downloadCellSize / 2)
          const numY = titleBarHeight + extraTopMargin + (axisLabelSize / 2)
          ctx.fillText((i + 1).toString(), numX, numY)
        }
      }

      for (let i = 0; i < N; i++) {
        if ((i + 1) % gridInterval === 0 || i === 0 || i === N - 1) {
          const numX = extraLeftMargin + axisLabelSize + (i * downloadCellSize) + (downloadCellSize / 2)
          const numY = titleBarHeight + extraTopMargin + axisLabelSize + gridHeight + (axisLabelSize / 2)
          ctx.fillText((i + 1).toString(), numX, numY)
        }
      }

      for (let j = 0; j < M; j++) {
        if ((j + 1) % gridInterval === 0 || j === 0 || j === M - 1) {
          const numX = extraLeftMargin + (axisLabelSize / 2)
          const numY = titleBarHeight + extraTopMargin + axisLabelSize + (j * downloadCellSize) + (downloadCellSize / 2)
          ctx.fillText((j + 1).toString(), numX, numY)
        }
      }

      for (let j = 0; j < M; j++) {
        if ((j + 1) % gridInterval === 0 || j === 0 || j === M - 1) {
          const numX = extraLeftMargin + axisLabelSize + gridWidth + (axisLabelSize / 2)
          const numY = titleBarHeight + extraTopMargin + axisLabelSize + (j * downloadCellSize) + (downloadCellSize / 2)
          ctx.fillText((j + 1).toString(), numX, numY)
        }
      }
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${fontSize}px sans-serif`

    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        const color = pixelData[j * N + i]
        const drawX = extraLeftMargin + i * downloadCellSize + axisLabelSize
        const drawY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize

        if (color !== '#FFFFFF') {
          ctx.fillStyle = color
          ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize)

          if (showCellNumbers) {
            const cellKey = getColorKeyByHex(color, colorSystem)
            ctx.fillStyle = getContrastColor(color)
            ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2)
          }
        } else {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize)
        }

        ctx.strokeStyle = '#DDDDDD'
        ctx.lineWidth = 0.5
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize, downloadCellSize)
      }
    }

    if (showGrid) {
      ctx.strokeStyle = gridLineColor
      ctx.lineWidth = 1.5

      for (let i = gridInterval; i < N; i += gridInterval) {
        const lineX = extraLeftMargin + i * downloadCellSize + axisLabelSize
        ctx.beginPath()
        ctx.moveTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize)
        ctx.lineTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize + M * downloadCellSize)
        ctx.stroke()
      }

      for (let j = gridInterval; j < M; j += gridInterval) {
        const lineY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize
        ctx.beginPath()
        ctx.moveTo(extraLeftMargin + axisLabelSize, lineY)
        ctx.lineTo(extraLeftMargin + axisLabelSize + N * downloadCellSize, lineY)
        ctx.stroke()
      }
    }

    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1.5
    ctx.strokeRect(
      extraLeftMargin + axisLabelSize + 0.5,
      titleBarHeight + extraTopMargin + axisLabelSize + 0.5,
      N * downloadCellSize,
      M * downloadCellSize
    )

    if (includeStats && Object.keys(colorCounts).length > 0) {
      const colorKeys = Object.keys(colorCounts).sort((a, b) => a.localeCompare(b))
      const statsTopMargin = 24
      const statsY = titleBarHeight + extraTopMargin + M * downloadCellSize + (axisLabelSize * 2) + statsPadding + statsTopMargin
      const availableStatsWidth = downloadWidth - (statsPadding * 2)
      const renderNumColumns = Math.max(1, Math.min(4, Math.floor(availableStatsWidth / 250)))
      const baseSwatchSize = 18
      const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 20))
      const itemWidth = Math.floor(availableStatsWidth / renderNumColumns)
      const titleHeight = 30
      const statsRowHeight = Math.max(swatchSize + 8, 25)

      ctx.fillStyle = '#333333'
      ctx.font = `bold ${Math.max(16, statsFontSize)}px sans-serif`
      ctx.textAlign = 'left'
      ctx.fillText('色号统计', statsPadding, statsY + 15)

      ctx.strokeStyle = '#DDDDDD'
      ctx.beginPath()
      ctx.moveTo(statsPadding, statsY + 20)
      ctx.lineTo(downloadWidth - statsPadding, statsY + 20)
      ctx.stroke()

      ctx.font = `${statsFontSize}px sans-serif`

      colorKeys.forEach((key, index) => {
        const rowIndex = Math.floor(index / renderNumColumns)
        const colIndex = index % renderNumColumns
        const itemX = statsPadding + (colIndex * itemWidth)
        const rowY = statsY + titleHeight + (rowIndex * statsRowHeight) + (swatchSize / 2)
        const cellData = colorCounts[key]

        ctx.fillStyle = cellData.color
        ctx.strokeStyle = '#CCCCCC'
        ctx.fillRect(itemX, rowY - (swatchSize / 2), swatchSize, swatchSize)
        ctx.strokeRect(itemX + 0.5, rowY - (swatchSize / 2) + 0.5, swatchSize - 1, swatchSize - 1)

        ctx.fillStyle = '#333333'
        ctx.textAlign = 'left'
        ctx.fillText(getColorKeyByHex(key, colorSystem), itemX + swatchSize + 5, rowY)

        const countText = `${cellData.count} 颗`
        ctx.textAlign = 'right'
        if (renderNumColumns === 1) {
          ctx.fillText(countText, downloadWidth - statsPadding, rowY)
        } else {
          ctx.fillText(countText, itemX + itemWidth - 10, rowY)
        }
      })

      const numRows = Math.ceil(colorKeys.length / renderNumColumns)
      const totalY = statsY + titleHeight + (numRows * statsRowHeight) + 10
      ctx.font = `bold ${statsFontSize}px sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(`总计: ${totalBeadCount} 颗`, downloadWidth - statsPadding, totalY)
    }

    return await canvasToTempFilePath(adjustedCanvas, 0.9)
  } catch (error) {
    console.error('Generate pattern image failed:', error)
    throw error
  }
}

export async function exportPatternToGallery(
  data: PixelArtData,
  options: GridDownloadOptions,
  colorSystem: ColorSystem = 'MARD',
  title: string = '拼豆图纸'
): Promise<void> {
  try {
    Taro.showLoading({ title: '生成图纸中...' })
    const tempFilePath = await generatePatternImage(data, options, colorSystem, title)
    await saveImageToPhotosAlbum(tempFilePath)
    Taro.hideLoading()
    Taro.showToast({ title: '图纸导出成功', icon: 'success' })
  } catch (error) {
    Taro.hideLoading()
    console.error('Export pattern failed:', error)
    throw error
  }
}
