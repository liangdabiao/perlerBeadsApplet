import { defineStore } from 'pinia'
import { ref } from 'vue'
import Taro from '@tarojs/taro'

export interface UserInfo {
  avatarUrl: string
  nickName: string
  openId?: string
}

const DEFAULT_AVATAR = 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'
const STORAGE_KEY = 'user_info'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = ref(false)

  const loadUserInfo = () => {
    try {
      const data = Taro.getStorageSync(STORAGE_KEY)
      if (data) {
        userInfo.value = JSON.parse(data)
        isLoggedIn.value = true
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const saveUserInfo = (info: UserInfo) => {
    try {
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(info))
      userInfo.value = info
      isLoggedIn.value = true
    } catch (error) {
      console.error('保存用户信息失败:', error)
    }
  }

  const clearUserInfo = () => {
    try {
      Taro.removeStorageSync(STORAGE_KEY)
      userInfo.value = null
      isLoggedIn.value = false
    } catch (error) {
      console.error('清除用户信息失败:', error)
    }
  }

  const getAvatar = () => {
    return userInfo.value?.avatarUrl || DEFAULT_AVATAR
  }

  const getNickName = () => {
    return userInfo.value?.nickName || '请登录'
  }

  const wechatLogin = async () => {
    try {
      const loginRes = await Taro.login()
      if (loginRes.code) {
        const userInfoRes = await Taro.getUserProfile({
          desc: '用于完善用户资料'
        })
        
        if (userInfoRes.userInfo) {
          const userData: UserInfo = {
            avatarUrl: userInfoRes.userInfo.avatarUrl,
            nickName: userInfoRes.userInfo.nickName
          }
          saveUserInfo(userData)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('微信登录失败:', error)
      return false
    }
  }

  const logout = () => {
    clearUserInfo()
  }

  return {
    userInfo,
    isLoggedIn,
    loadUserInfo,
    saveUserInfo,
    clearUserInfo,
    getAvatar,
    getNickName,
    wechatLogin,
    logout
  }
})
