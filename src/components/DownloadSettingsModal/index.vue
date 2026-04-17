
&lt;template&gt;
  &lt;view v-if="isOpen" class="download-modal"&gt;
    &lt;view class="modal-mask" @tap="handleClose"&gt;&lt;/view&gt;
    &lt;view class="modal-content"&gt;
      &lt;view class="modal-header"&gt;
        &lt;text class="modal-title"&gt;下载图纸设置&lt;/text&gt;
        &lt;view class="close-btn" @tap="handleClose"&gt;
          &lt;text class="close-icon"&gt;✕&lt;/text&gt;
        &lt;/view&gt;
      &lt;/view&gt;

      &lt;view class="modal-body"&gt;
        &lt;view class="setting-item"&gt;
          &lt;text class="setting-label"&gt;显示网格线&lt;/text&gt;
          &lt;switch :checked="tempOptions.showGrid" @change="handleOptionChange('showGrid', $event.detail.value)" /&gt;
        &lt;/view&gt;

        &lt;view v-if="tempOptions.showGrid" class="sub-settings"&gt;
          &lt;view class="setting-item"&gt;
            &lt;text class="setting-label"&gt;网格线间隔&lt;/text&gt;
            &lt;view class="range-container"&gt;
              &lt;slider 
                :min="5" 
                :max="20" 
                :value="tempOptions.gridInterval" 
                :step="1"
                @change="handleOptionChange('gridInterval', $event.detail.value)"
                activeColor="#5271FF"
              /&gt;
              &lt;text class="range-value"&gt;{{ tempOptions.gridInterval }}&lt;/text&gt;
            &lt;/view&gt;
          &lt;/view&gt;

          &lt;view class="setting-item"&gt;
            &lt;text class="setting-label"&gt;网格线颜色&lt;/text&gt;
            &lt;view class="color-picker"&gt;
              &lt;view 
                v-for="colorOpt in gridLineColorOptions" 
                :key="colorOpt.value"
                class="color-item"
                :class="{ active: tempOptions.gridLineColor === colorOpt.value }"
                @tap="handleOptionChange('gridLineColor', colorOpt.value)"
              &gt;
                &lt;view class="color-dot" :style="{ backgroundColor: colorOpt.value }"&gt;&lt;/view&gt;
              &lt;/view&gt;
            &lt;/view&gt;
          &lt;/view&gt;
        &lt;/view&gt;

        &lt;view class="setting-item"&gt;
          &lt;text class="setting-label"&gt;显示坐标数字&lt;/text&gt;
          &lt;switch :checked="tempOptions.showCoordinates" @change="handleOptionChange('showCoordinates', $event.detail.value)" /&gt;
        &lt;/view&gt;

        &lt;view class="setting-item"&gt;
          &lt;text class="setting-label"&gt;显示格内色号&lt;/text&gt;
          &lt;switch :checked="tempOptions.showCellNumbers" @change="handleOptionChange('showCellNumbers', $event.detail.value)" /&gt;
        &lt;/view&gt;

        &lt;view class="setting-item"&gt;
          &lt;text class="setting-label"&gt;包含色号统计&lt;/text&gt;
          &lt;switch :checked="tempOptions.includeStats" @change="handleOptionChange('includeStats', $event.detail.value)" /&gt;
        &lt;/view&gt;
      &lt;/view&gt;

      &lt;view class="modal-footer"&gt;
        &lt;view class="btn cancel-btn" @tap="handleClose"&gt;
          &lt;text class="btn-text"&gt;取消&lt;/text&gt;
        &lt;/view&gt;
        &lt;view class="btn confirm-btn" @tap="handleSave"&gt;
          &lt;text class="btn-text"&gt;下载图纸&lt;/text&gt;
        &lt;/view&gt;
      &lt;/view&gt;
    &lt;/view&gt;
  &lt;/view&gt;
&lt;/template&gt;

&lt;script setup lang="ts"&gt;
import { ref, watch } from 'vue'
import { GridDownloadOptions, gridLineColorOptions } from '@/types/downloadTypes'

interface Props {
  isOpen: boolean
  options: GridDownloadOptions
}

interface Emits {
  (e: 'close'): void
  (e: 'optionsChange', options: GridDownloadOptions): void
  (e: 'download', options: GridDownloadOptions): void
}

const props = defineProps&lt;Props&gt;()
const emit = defineEmits&lt;Emits&gt;()

const tempOptions = ref&lt;GridDownloadOptions&gt;({ ...props.options })

watch(() =&gt; props.options, (newOptions) =&gt; {
  tempOptions.value = { ...newOptions }
})

const handleOptionChange = (key: keyof GridDownloadOptions, value: string | number | boolean) =&gt; {
  tempOptions.value[key] = value as any
}

const handleClose = () =&gt; {
  emit('close')
}

const handleSave = () =&gt; {
  emit('optionsChange', tempOptions.value)
  emit('download', tempOptions.value)
  handleClose()
}
&lt;/script&gt;

&lt;style lang="scss" scoped&gt;
.download-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background-color: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 20px;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  &amp;:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  font-size: 15px;
  color: #333;
}

.sub-settings {
  padding-left: 16px;
  margin-left: 4px;
  border-left: 2px solid #f0f0f0;
  margin-bottom: 20px;
  padding-top: 8px;
}

.range-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 20px;
}

.range-value {
  min-width: 40px;
  text-align: center;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s;

  &amp;.active {
    border-color: #5271FF;
    box-shadow: 0 0 0 3px rgba(82, 113, 255, 0.2);
  }
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
}

.cancel-btn {
  background-color: #f5f5f5;
  .btn-text {
    color: #666;
  }
}

.confirm-btn {
  background-color: #5271FF;
  .btn-text {
    color: #fff;
  }
}
&lt;/style&gt;
