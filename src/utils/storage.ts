import Taro from '@tarojs/taro'
import { arrayBufferToBase64, base64ToArrayBuffer } from './base64'

export type PixelArtStatus = 'unfinished' | 'finished'

export interface PixelArtItem {
  id: string
  title: string
  description: string
  tags: string[]
  status: PixelArtStatus
  gridSize: number
  pngData: ArrayBuffer
  pngTempPath: string
  createdAt: string
  updatedAt: string
}

export interface PixelArtItemStorage {
  id: string
  title: string
  description: string
  tags: string[]
  status: PixelArtStatus
  gridSize: number
  pngData: string // 原始像素画经过png压缩的base64编码
  pngTempPath: string // 缩略图地址
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'pixel_art_gallery'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export async function savePixelArt(item: Omit<PixelArtItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<PixelArtItemStorage[]> {
  const now = new Date().toISOString()
  const newItem: PixelArtItemStorage = {
    ...item,  
    pngData: arrayBufferToBase64(item.pngData),
    status: item.status || 'unfinished',
    id: generateId(),
    createdAt: now,
    updatedAt: now
  }

  const list = await getPixelArtList()
  list.unshift(newItem)
  
  // const storageList: PixelArtItemStorage[] = list.map(item => ({
  //   ...item,
  //   pngData: arrayBufferToBase64(item.pngData)
  // }))
  const storageList: PixelArtItemStorage[] = list
  await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(storageList) })
  
  return list
}

export async function updatePixelArt(id: string, updates: Partial<Omit<PixelArtItemStorage, 'id' | 'createdAt'>>): Promise<PixelArtItemStorage | null> {
  const list = await getPixelArtList()
  const index = list.findIndex(item => item.id === id)
  
  if (index === -1) {
    return null
  }
  
  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  // const storageList: PixelArtItemStorage[] = list.map(item => ({
  //   ...item,
  //   pngData: arrayBufferToBase64(item.pngData)
  // }))
  const storageList: PixelArtItemStorage[] = list
  await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(storageList) })
  
  return list[index]
}

export async function getPixelArtList(): Promise<PixelArtItemStorage[]> {
  try {
    const data = await Taro.getStorage({ key: STORAGE_KEY })
    const storageList: PixelArtItemStorage[] = JSON.parse(data.data || '[]')
    return storageList
  } catch {
    return []
  }
}

export async function getPixelArtById(id: string): Promise<PixelArtItemStorage | null> {
  const list = await getPixelArtList()
  return list.find(item => item.id === id) || null
}

export async function deletePixelArt(id: string): Promise<boolean> {
  const list = await getPixelArtList()
  const filteredList = list.filter(item => item.id !== id)
  
  if (filteredList.length === list.length) {
    return false
  }
  
  // const storageList: PixelArtItemStorage[] = filteredList.map(item => ({
  //   ...item,
  //   pngData: arrayBufferToBase64(item.pngData)
  // }))
  const storageList: PixelArtItemStorage[] = filteredList
  await Taro.setStorage({ key: STORAGE_KEY, data: JSON.stringify(storageList) })
  return true
}
