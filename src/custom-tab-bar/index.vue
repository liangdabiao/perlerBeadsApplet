<template>
  <view class="bottom-nav-container">
    <view class="nav-pill">
      <view
        v-for="(item, index) in list"
        :key="index"
        :class="['nav-item', { active: selected === index }]"
        @tap="switchTab(item)"
      >
        <MIcon 
          :name="item.icon" 
          :size="20" 
          :color="selected === index ? '#FFFFFF' : '#B5B0A8'"
        />
        <text class="nav-label">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import MIcon from '@/components/MIcon/index.vue'
import './index.scss'

interface TabBarItem {
  pagePath: string
  text: string
  icon: string
}

const list = ref<TabBarItem[]>([
  {
    pagePath: 'pages/profile/index',
    text: '作品',
    icon: 'image'
  },
  {
    pagePath: 'pages/editor/index',
    text: '编辑',
    icon: 'edit'
  }
])

const selected = ref(0)

const switchTab = (item: TabBarItem) => {
  const url = '/' + item.pagePath
  Taro.switchTab({ url })
}

const updateSelected = () => {
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const route = currentPage.route || ''
  const index = list.value.findIndex(item => item.pagePath === route)
  if (index !== -1) {
    selected.value = index
  }
}

onMounted(() => {
  updateSelected()
})
</script>
