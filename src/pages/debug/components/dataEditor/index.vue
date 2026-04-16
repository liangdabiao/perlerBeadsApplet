<template>
  <view class="data-editor">
    <view class="editor-header">
      <text class="editor-title">数据编辑器</text>
      <view class="header-actions">
        <view class="btn btn-primary" @tap="loadData">刷新</view>
        <view class="btn btn-info" @tap="exportData">导出</view>
        <view class="btn btn-warning" @tap="importData">导入</view>
      </view>
    </view>

    <view class="data-stats">
      <text class="stats-text">共 {{ dataList.length }} 条数据</text>
      <text class="stats-size">存储大小: {{ storageSize }}KB</text>
    </view>

    <scroll-view scroll-y class="data-list">
      <view v-if="dataList.length === 0" class="empty-state">
        <text>暂无数据</text>
      </view>
      
      <view 
        v-for="(item, index) in dataList" 
        :key="item.id" 
        class="data-item"
        @tap="editItem(index)"
      >
        <view class="item-header">
          <text class="item-title">{{ item.title || '未命名' }}</text>
          <view class="item-actions">
            <view class="action-btn" @tap.stop="duplicateItem(index)">
              <text class="icon-copy">复制</text>
            </view>
            <view class="action-btn delete" @tap.stop="deleteItem(index)">
              <text class="icon-delete">删除</text>
            </view>
          </view>
        </view>
        <view class="item-meta">
          <text class="meta-tag">{{ item.status === 'finished' ? '已完成' : '进行中' }}</text>
          <text class="meta-tag">{{ item.gridSize }}x{{ item.gridSize }}</text>
          <text class="meta-date">{{ formatDate(item.createdAt) }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="editVisible" class="modal-mask" @tap="closeEdit">
      <view class="modal-content" @tap.stop>
        <view class="panel-header">
          <text class="panel-title">{{ isNewItem ? '新建数据' : '编辑数据' }}</text>
          <view class="panel-close" @tap="closeEdit">
            <text class="close-icon">×</text>
          </view>
        </view>

        <view  class="panel-content">
          <view class="form-item">
            <text class="form-label">标题</text>
            <input 
              v-model="editForm.title" 
              class="form-input" 
              placeholder="请输入标题"
            />
          </view>

          <view class="form-item">
            <text class="form-label">描述</text>
            <textarea 
              v-model="editForm.description" 
              class="form-textarea" 
              placeholder="请输入描述"
              :maxlength="500"
            />
          </view>

          <view class="form-item">
            <text class="form-label">标签 (逗号分隔)</text>
            <input 
              v-model="editForm.tagsText" 
              class="form-input" 
              placeholder="标签1, 标签2"
            />
          </view>

          <view class="form-item">
            <text class="form-label">状态</text>
            <view class="form-radio-group">
              <view 
                :class="['radio-item', { active: editForm.status === 'unfinished' }]"
                @tap="editForm.status = 'unfinished'"
              >
                <text>进行中</text>
              </view>
              <view 
                :class="['radio-item', { active: editForm.status === 'finished' }]"
                @tap="editForm.status = 'finished'"
              >
                <text>已完成</text>
              </view>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">网格大小</text>
            <input 
              v-model.number="editForm.gridSize" 
              class="form-input" 
              type="number"
              placeholder="网格大小"
            />
          </view>

          <view class="form-item">
            <text class="form-label">ID</text>
            <input 
              v-model="editForm.id" 
              class="form-input" 
              placeholder="自动生成"
              :disabled="!isNewItem"
            />
          </view>

          <view class="form-item">
            <text class="form-label">创建时间</text>
            <input 
              v-model="editForm.createdAt" 
              class="form-input" 
              :disabled="true"
            />
          </view>

          <view class="form-item">
            <text class="form-label">更新时间</text>
            <input 
              v-model="editForm.updatedAt" 
              class="form-input" 
              :disabled="true"
            />
          </view>

          <view class="form-item">
            <text class="form-label">缩略图路径</text>
            <input 
              v-model="editForm.pngTempPath" 
              class="form-input" 
              placeholder="缩略图临时路径"
            />
          </view>

          <view class="form-item">
            <text class="form-label">PNG数据 (Base64)</text>
            <view class="png-preview">
              <text class="png-length">{{ editForm.pngData ? editForm.pngData.length : 0 }} 字符</text>
              <view class="btn-small" @tap="copyPngData">复制</view>
            </view>
          </view>
        </view>

        <view class="panel-footer">
          <view class="btn btn-default" @tap="closeEdit">取消</view>
          <view class="btn btn-primary" @tap="saveItem">保存</view>
        </view>
      </view>
    </view>

    <view v-if="importVisible" class="modal-mask" @tap="importVisible = false">
      <view class="modal-content modal-import" @tap.stop>
        <text class="import-title">导入数据</text>
        <textarea 
          v-model="importText" 
          class="import-textarea" 
          placeholder="请粘贴JSON数据"
          :maxlength="-1"
        />
        <view class="import-actions">
          <view class="btn btn-default" @tap="importVisible = false">取消</view>
          <view class="btn btn-primary" @tap="confirmImport">导入</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { getPixelArtList, PixelArtItemStorage, generateId } from '@/utils/storage'
import './index.scss'

const STORAGE_KEY = 'pixel_art_gallery'

const dataList = ref<PixelArtItemStorage[]>([])
const storageSize = ref(0)
const editVisible = ref(false)
const importVisible = ref(false)
const importText = ref('')
const editIndex = ref(-1)
const isNewItem = ref(false)

const editForm = ref({
  id: '',
  title: '',
  description: '',
  tagsText: '',
  status: 'unfinished' as 'unfinished' | 'finished',
  gridSize: 16,
  pngData: '',
  pngTempPath: '',
  createdAt: '',
  updatedAt: ''
})

const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const loadData = async () => {
  try {
    const list = await getPixelArtList()
    dataList.value = list
    
    const info = Taro.getStorageInfoSync()
    storageSize.value = info.currentSize
  } catch (e) {
    Taro.showToast({ title: '加载失败', icon: 'none' })
  }
}

const editItem = (index: number) => {
  editIndex.value = index
  isNewItem.value = false
  const item = dataList.value[index]
  
  editForm.value = {
    id: item.id,
    title: item.title,
    description: item.description || '',
    tagsText: item.tags?.join(', ') || '',
    status: item.status,
    gridSize: item.gridSize,
    pngData: item.pngData || '',
    pngTempPath: item.pngTempPath || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
  
  editVisible.value = true
}

const closeEdit = () => {
  editVisible.value = false
  editIndex.value = -1
}

const saveItem = async () => {
  try {
    const now = new Date().toISOString()
    const item: PixelArtItemStorage = {
      id: editForm.value.id || generateId(),
      title: editForm.value.title || '未命名',
      description: editForm.value.description,
      tags: editForm.value.tagsText.split(',').map(t => t.trim()).filter(Boolean),
      status: editForm.value.status,
      gridSize: editForm.value.gridSize,
      pngData: editForm.value.pngData,
      pngTempPath: editForm.value.pngTempPath,
      createdAt: editForm.value.createdAt || now,
      updatedAt: now
    }

    if (isNewItem.value) {
      dataList.value.unshift(item)
    } else if (editIndex.value >= 0) {
      dataList.value[editIndex.value] = item
    }

    await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(dataList.value) })
    
    Taro.showToast({ title: '保存成功', icon: 'success' })
    closeEdit()
    loadData()
  } catch (e) {
    Taro.showToast({ title: '保存失败', icon: 'none' })
  }
}

const deleteItem = async (index: number) => {
  Taro.showModal({
    title: '确认删除',
    content: `确定要删除「${dataList.value[index].title}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        dataList.value.splice(index, 1)
        await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(dataList.value) })
        Taro.showToast({ title: '删除成功', icon: 'success' })
        loadData()
      }
    }
  })
}

const duplicateItem = async (index: number) => {
  const item = { ...dataList.value[index] }
  const now = new Date().toISOString()
  item.id = generateId()
  item.title = item.title + ' (副本)'
  item.createdAt = now
  item.updatedAt = now
  
  dataList.value.unshift(item)
  await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(dataList.value) })
  Taro.showToast({ title: '复制成功', icon: 'success' })
  loadData()
}

const exportData = () => {
  const jsonStr = JSON.stringify(dataList.value, null, 2)
  Taro.setClipboardData({
    data: jsonStr,
    success: () => {
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  })
}

const importData = () => {
  importText.value = ''
  importVisible.value = true
}

const confirmImport = async () => {
  try {
    const data = JSON.parse(importText.value)
    if (!Array.isArray(data)) {
      throw new Error('数据格式错误')
    }
    
    Taro.showModal({
      title: '导入确认',
      content: `将导入 ${data.length} 条数据，是否覆盖现有数据？`,
      success: async (res) => {
        if (res.confirm) {
          await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(data) })
          importVisible.value = false
          Taro.showToast({ title: '导入成功', icon: 'success' })
          loadData()
        }
      }
    })
  } catch (e) {
    Taro.showToast({ title: 'JSON格式错误', icon: 'none' })
  }
}

const copyPngData = () => {
  if (editForm.value.pngData) {
    Taro.setClipboardData({
      data: editForm.value.pngData.substring(0, 10000),
      success: () => {
        Taro.showToast({ title: '已复制(截取)', icon: 'success' })
      }
    })
  }
}

const addNewItem = () => {
  isNewItem.value = true
  const now = new Date().toISOString()
  
  editForm.value = {
    id: generateId(),
    title: '',
    description: '',
    tagsText: '',
    status: 'unfinished',
    gridSize: 16,
    pngData: '',
    pngTempPath: '',
    createdAt: now,
    updatedAt: now
  }
  
  editVisible.value = true
}

onMounted(() => {
  loadData()
})

defineExpose({
  addNewItem
})
</script>
