import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface EditorTempData {
  gridSize: number
  pngBuffer: ArrayBuffer
  pngTempPath: string
}

export const useEditorTempStore = defineStore('editorTemp', () => {
  const tempData = ref<EditorTempData | null>(null)

  const setTempData = (data: EditorTempData) => {
    tempData.value = data
  }

  const getTempData = () => {
    return tempData.value
  }

  const clearTempData = () => {
    tempData.value = null
  }

  return {
    tempData,
    setTempData,
    getTempData,
    clearTempData
  }
})
