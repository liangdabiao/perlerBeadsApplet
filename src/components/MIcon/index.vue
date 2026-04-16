<template>
  <text
    class="material-icons"
    :class="className"
    :style="iconStyle"
    @tap="handleClick"
  >
    {{ iconName }}
  </text>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { theme } from '@/config/theme'

interface MIconProps {
  name: string
  color?: string
  size?: number
  className?: string
}

const props = withDefaults(defineProps<MIconProps>(), {
  color: theme.primaryColor,
  size: 24,
  className: ''
})

const emit = defineEmits<{
  click: []
}>()

const iconName = computed(() => {
  return (props.name || '').replace(/-/g, '_')
})

const iconStyle = computed(() => ({
  color: props.color,
  fontSize: `${props.size}px`,
  width: `${props.size}px`
}))

const handleClick = () => {
  emit('click')
}
</script>
