import Taro from '@tarojs/taro'
import type {
  RequestConfig,
  RequestResponse,
  RequestError,
  InterceptorManager,
  ApiResponse
} from './types'

export const interceptorManager: InterceptorManager = {
  request: [],
  response: [],
  error: []
}

export function addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>) {
  interceptorManager.request.push(interceptor)
  return () => {
    const index = interceptorManager.request.indexOf(interceptor)
    if (index > -1) {
      interceptorManager.request.splice(index, 1)
    }
  }
}

export function addResponseInterceptor<T = any>(
  interceptor: (response: RequestResponse<T>) => RequestResponse<T> | Promise<RequestResponse<T>>
) {
  interceptorManager.response.push(interceptor as any)
  return () => {
    const index = interceptorManager.response.indexOf(interceptor as any)
    if (index > -1) {
      interceptorManager.response.splice(index, 1)
    }
  }
}

export function addErrorInterceptor(interceptor: (error: RequestError) => Promise<any>) {
  interceptorManager.error.push(interceptor)
  return () => {
    const index = interceptorManager.error.indexOf(interceptor)
    if (index > -1) {
      interceptorManager.error.splice(index, 1)
    }
  }
}

export async function applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
  let result = config
  for (const interceptor of interceptorManager.request) {
    result = await interceptor(result)
  }
  return result
}

export async function applyResponseInterceptors<T = any>(
  response: RequestResponse<T>
): Promise<RequestResponse<T>> {
  let result = response
  for (const interceptor of interceptorManager.response) {
    result = await interceptor(result)
  }
  return result
}

export async function applyErrorInterceptors(error: RequestError): Promise<any> {
  for (const interceptor of interceptorManager.error) {
    try {
      return await interceptor(error)
    } catch (e) {
      continue
    }
  }
  throw error
}

export function setupDefaultInterceptors() {
  addRequestInterceptor((config) => {
    const token = Taro.getStorageSync('token')
    if (token) {
      config.header = {
        ...config.header,
        Authorization: `Bearer ${token}`
      }
    }
    return config
  })

  addResponseInterceptor((response) => {
    const { statusCode, data } = response as RequestResponse<ApiResponse>

    if (statusCode >= 200 && statusCode < 300) {
      const apiData = data as unknown as ApiResponse
      if (apiData && typeof apiData === 'object' && 'success' in apiData) {
        if (!apiData.success) {
          Taro.showToast({
            title: apiData.message || '请求失败',
            icon: 'none',
            duration: 2000
          })
        }
      }
    } else if (statusCode === 401) {
      Taro.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
        duration: 2000
      })
      Taro.removeStorageSync('token')
    } else if (statusCode >= 500) {
      Taro.showToast({
        title: '服务器错误，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    } else {
      Taro.showToast({
        title: `请求失败: ${statusCode}`,
        icon: 'none',
        duration: 2000
      })
    }

    return response
  })

  addErrorInterceptor(async (error) => {
    console.error('Request Error:', error)
    Taro.showToast({
      title: error.errMsg || '网络请求失败',
      icon: 'none',
      duration: 2000
    })
    throw error
  })
}
