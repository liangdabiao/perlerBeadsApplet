<template>
  <view class="save-form-page">
    <view class="preview-section">
      <image
        v-if="previewUrl"
        class="preview-image"
        :src="previewUrl"
        :style="{ width: previewSize + 'px', height: previewSize + 'px' }"
        mode="aspectFit"
      />
    </view>
    
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">
          标题<text class="required">*</text>
        </text>
        <input
          class="form-input"
          v-model="formData.title"
          placeholder="请输入作品标题"
          maxlength="50"
        />
      </view>
      
      <view class="form-item">
        <text class="form-label">简介</text>
        <textarea
          class="form-textarea"
          v-model="formData.description"
          placeholder="请输入作品简介（选填）"
          maxlength="200"
        />
      </view>
      
      <view class="form-item">
        <text class="form-label">标签</text>
        <view class="tags-section">
          <view
            v-for="(tag, index) in formData.tags"
            :key="index"
            class="tag-item"
          >
            <text class="tag-text">{{ tag }}</text>
            <view class="tag-close" @tap="handleRemoveTag(index)">
              <text>×</text>
            </view>
          </view>
        </view>
        <view class="tag-input-wrapper">
          <input
            class="tag-input"
            v-model="tagInput"
            placeholder="输入标签后点击添加"
            maxlength="20"
            @confirm="handleAddTag"
          />
          <view class="add-tag-btn" @tap="handleAddTag">
            <text>✛</text>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">状态</text>
        <view class="status-section">
          <view
            :class="['status-item', { active: formData.status === 'unfinished' }]"
            @tap="formData.status = 'unfinished'"
          >
            <text class="status-text">进行中</text>
          </view>
          <view
            :class="['status-item', { active: formData.status === 'finished' }]"
            @tap="formData.status = 'finished'"
          >
            <text class="status-text">已完成</text>
          </view>
        </view>
      </view>
      
      <view class="form-actions">
        <view class="btn btn-secondary" @tap="handleCancel">取消</view>
        <view
          :class="['btn', 'btn-primary', { 'btn-disabled': !canSubmit }]"
          @tap="handleSubmit"
        >
          保存
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { savePixelArt, PixelArtStatus } from '@/utils/storage'
import { arrayBufferToTempFilePath } from '@/utils/pixelArt'
import { useEditorTempStore, EditorTempData } from '@/stores/editorTemp'
import './index.scss'

interface EditorData extends EditorTempData {}

const formData = ref({
  title: '',
  description: '',
  tags: [] as string[],
  status: 'unfinished' as PixelArtStatus
})

const tagInput = ref('')
const editorData = ref<EditorData | null>(null)
const previewSize = ref(200)
const previewUrl = ref('')

const canSubmit = computed(() => {
  return formData.value.title.trim().length > 0 && editorData.value !== null
})

const handleAddTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !formData.value.tags.includes(tag) && formData.value.tags.length < 5) {
    formData.value.tags.push(tag)
    tagInput.value = ''
  } else if (formData.value.tags.length >= 5) {
    Taro.showToast({ title: '最多添加5个标签', icon: 'none' })
  }
}

const handleRemoveTag = (index: number) => {
  formData.value.tags.splice(index, 1)
}

const handleCancel = () => {
  const { clearTempData } = useEditorTempStore()
  clearTempData()
  Taro.navigateBack()
}

const handleSubmit = async () => {
  if (!canSubmit.value || !editorData.value) {
    return
  }
  
  try {
    Taro.showLoading({ title: '保存中...' })
    
    await savePixelArt({
      title: formData.value.title.trim(),
      description: formData.value.description.trim(),
      tags: formData.value.tags,
      status: formData.value.status,
      gridSize: editorData.value.gridSize,
      pngData: editorData.value.pngBuffer,
      pngTempPath: editorData.value.pngTempPath
    })
    
    const { clearTempData } = useEditorTempStore()
    clearTempData()
    
    Taro.hideLoading()
    Taro.showToast({ title: '保存成功', icon: 'success' })
    
    setTimeout(() => {
      Taro.switchTab({
        url: '/pages/profile/index'
      })
    }, 1500)
  } catch (error) {
    console.error('Error saving pixel art:', error)
    Taro.hideLoading()
    Taro.showToast({ title: '保存失败', icon: 'error' })
  }
}

onMounted(async () => {
  const { getTempData } = useEditorTempStore()
  const data = getTempData()
  
  if (data) {
    editorData.value = data
    
    if (data.pngBuffer) {
      try {
        previewUrl.value = data.pngTempPath
        previewSize.value = Math.min(data.gridSize * 10, 200)
      } catch (error) {
        console.error('Failed to convert ArrayBuffer to temp file:', error)
      }
    }
  } else {
    Taro.showToast({ title: '数据加载失败', icon: 'error' })
  }
})
</script>
