<template>
  <view class="editor-page">

    <MenuBar
      @undo="handleUndo"
      @redo="handleRedo"
      @clear="handleClear"
      @save="handleSave"
      @export="handleExport"
      @import="handleImport"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
    />
    
    <view class="canvas-wrapper" id="canvasWrapper">
      <DrawPanel
        ref="drawPanelRef"
        :grid-size="gridSize"
        :current-color="currentColor"
        :current-tool="currentTool"
        :canvas-width="canvasWidth"
        :canvas-height="canvasHeight"
        :hide-mode="hideCanvas"
        @update:pixel-data="handlePixelDataUpdate"
      />
    </view>
    
    <ToolArea
      v-model="currentColor"
      :grid-size="gridSize"
      @update:grid-size="handleGridSizeChange"
      @tool-change="handleToolChange"
      @canvas-visible-change="setCanvasVisible"
      @color-set-change="handleColorSetChange"
    />
    <CustomTabBar />
    
    <canvas type="2d" id="exportCanvas" style="position: fixed; left: -9999px; top: -9999px; width: 256px; height: 256px;"></canvas>
    
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import Taro from '@tarojs/taro'
import CustomTabBar from '@/custom-tab-bar/index.vue'
import MenuBar from './components/menu/index.vue'
import DrawPanel from './components/drawPanel/index.vue'
import ToolArea from './components/toolArea/index.vue'
import MIcon from '@/components/MIcon/index.vue'
import { exportPixelArtToGallery, convertPixelArtToPngBuffer ,convertPixelArtToPngPath,arrayBufferToTempFilePath, pngToPixelArtData, imageToPixelArtData} from '@/utils/pixelArt'
import { useEditorTempStore,EditorTempData } from '@/stores/editorTemp'
import { base64ToArrayBuffer } from '@/utils/base64'
import './index.scss'


const drawPanelRef = ref<InstanceType<typeof DrawPanel> | null>(null)
const currentColor = ref('#C4634E')
const gridSize = ref(16)
const currentTool = ref('brush')
const pixelData = ref<string[]>([])
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const hideCanvas = ref(false)
const currentColorPalette = ref<string[]>([])

const historyStack = ref<string[][]>([])
const historyIndex = ref(-1)
const MAX_HISTORY = 50

const handleBack = () => {
  Taro.navigateBack()
}

const saveToHistory = () => {
  const currentData = [...pixelData.value]
  
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
  }
  
  historyStack.value.push(currentData)
  
  if (historyStack.value.length > MAX_HISTORY) {
    historyStack.value.shift()
  } else {
    historyIndex.value++
  }
}

const handleUndo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    const prevData = historyStack.value[historyIndex.value]
    if (prevData && drawPanelRef.value) {
      drawPanelRef.value.setPixelData(prevData)
      pixelData.value = prevData
    }
  } else {
    Taro.showToast({ title: '无法撤销', icon: 'none', duration: 1000 })
  }
}

const handleRedo = () => {
  if (historyIndex.value < historyStack.value.length - 1) {
    historyIndex.value++
    const nextData = historyStack.value[historyIndex.value]
    if (nextData && drawPanelRef.value) {
      drawPanelRef.value.setPixelData(nextData)
      pixelData.value = nextData
    }
  } else {
    Taro.showToast({ title: '无法重做', icon: 'none', duration: 1000 })
  }
}

const handleClear = () => {
  if (drawPanelRef.value) {
    drawPanelRef.value.clearCanvas()
  }
}

const handleSave = async () => {
  try {
    Taro.showLoading({ title: '处理中...' })
    
    const pngBuffer = await convertPixelArtToPngBuffer({
      gridSize: gridSize.value,
      pixelData: pixelData.value
    }, false)

    let pngTempPath = await convertPixelArtToPngPath({
      gridSize: gridSize.value,
      pixelData: pixelData.value
    }, true)
    
    const { setTempData } = useEditorTempStore()
    setTempData({
      gridSize: gridSize.value,
      pngBuffer: pngBuffer,
      pngTempPath: pngTempPath
    })
    
    Taro.hideLoading()
    Taro.navigateTo({
      url: '/pages/saveForm/index'
    })
  } catch (error) {
    Taro.hideLoading()
    Taro.showToast({ title: '处理失败', icon: 'error' })
  }
}

const handleExport = async () => {
  try {
    const data = {
      gridSize: gridSize.value,
      pixelData: pixelData.value,
      createdAt: new Date().toISOString()
    }
    
    Taro.showLoading({ title: '导出中...' })
    await exportPixelArtToGallery(data,true)
    Taro.hideLoading()
    Taro.showToast({ title: '导出成功', icon: 'success' })
  } catch (error) {
    Taro.hideLoading()
    Taro.showToast({ title: '导出失败', icon: 'error' })
  }
}

const handleImport = () => {
  Taro.chooseImage({
    count: 1,
    sizeType: ['original'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      Taro.showLoading({ title: '处理中...' })
      
      try {
        const result = await imageToPixelArtData(
          tempFilePath, 
          gridSize.value, 
          currentColorPalette.value.length > 0 ? currentColorPalette.value : undefined
        )
        
        if (result.gridSize !== gridSize.value) {
          gridSize.value = result.gridSize
          pixelData.value = result.pixelData
          historyStack.value = []
          historyIndex.value = -1
        } else {
          pixelData.value = result.pixelData
        }
        
        nextTick(() => {
          if (drawPanelRef.value) {
            drawPanelRef.value.setPixelData(pixelData.value)
          }
          saveToHistory()
        })
        
        Taro.hideLoading()
        Taro.showToast({ title: '导入成功', icon: 'success' })
      } catch (error) {
        Taro.hideLoading()
        Taro.showToast({ title: '导入失败', icon: 'error' })
        console.error('Import failed:', error)
      }
    },
    fail: (err) => {
      console.log('Choose image cancelled or failed:', err)
    }
  })
}

const handleColorSetChange = (colors: string[]) => {
  currentColorPalette.value = colors
}

const handleZoomIn = () => {
  if (drawPanelRef.value) {
    drawPanelRef.value.zoomIn()
  }
}

const handleZoomOut = () => {
  if (drawPanelRef.value) {
    drawPanelRef.value.zoomOut()
  }
}

const handlePixelDataUpdate = (data: string[]) => {
  pixelData.value = data
  saveToHistory()
}

const handleGridSizeChange = (size: number) => {
  gridSize.value = size
  pixelData.value = new Array(size * size).fill('#FFFFFF')
  historyStack.value = []
  historyIndex.value = -1
}

const handleToolChange = (tool: string) => {
  currentTool.value = tool
}

const setCanvasVisible = (visible: boolean) => {
  hideCanvas.value = !visible
}

const calculateCanvasSize = () => {
  const query = Taro.createSelectorQuery()
  query.select('#canvasWrapper').boundingClientRect()
  query.exec((res) => {
    if (res && res[0]) {
      canvasWidth.value = res[0].width
      canvasHeight.value = res[0].height
    }
  })
}


const initPixel = async () => {
    
  const { getTempData ,clearTempData} = useEditorTempStore()
  const tempData = getTempData()
  
  if (tempData) {
    gridSize.value = tempData.gridSize
    const tempFilePath = await arrayBufferToTempFilePath(tempData.pngBuffer)
    const editorData = await pngToPixelArtData(tempFilePath, tempData.gridSize)
    console.log('editorData',editorData);
    pixelData.value = editorData.pixelData
    gridSize.value = editorData.gridSize
    clearTempData()
  } else {
    const initialData = new Array(gridSize.value * gridSize.value).fill('#FFFFFF')
    pixelData.value = initialData
  }

    saveToHistory()
  nextTick(() => {
    calculateCanvasSize()
    if (tempData && drawPanelRef.value) {
      drawPanelRef.value.setPixelData(pixelData.value)
    }
  })
}

onMounted(() => {

  initPixel()
  

})

defineExpose({
  setCanvasVisible
})
</script>
