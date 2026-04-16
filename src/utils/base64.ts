import Taro from '@tarojs/taro'

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Taro.arrayBufferToBase64(buffer)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return Taro.base64ToArrayBuffer(base64)
}
