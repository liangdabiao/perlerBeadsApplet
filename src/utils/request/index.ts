import Taro from '@tarojs/taro'
import type {
  RequestConfig,
  RequestResponse,
  ApiResponse
} from './types'
import {
  applyRequestInterceptors,
  applyResponseInterceptors,
  applyErrorInterceptors,
  setupDefaultInterceptors
} from './interceptors'

const DEFAULT_CONFIG: Partial<RequestConfig> = {
  method: 'GET',
  timeout: 30000,
  dataType: 'json',
  header: {
    'Content-Type': 'application/json'
  }
}

let baseURL = ''

export function setBaseURL(url: string) {
  baseURL = url
}

export function getBaseURL(): string {
  return baseURL
}

export async function request<T = any>(config: RequestConfig): Promise<T> {
  try {
    const mergedConfig: RequestConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      header: {
        ...DEFAULT_CONFIG.header,
        ...config.header
      }
    }

    if (!mergedConfig.url.startsWith('http')) {
      mergedConfig.url = `${baseURL}${mergedConfig.url}`
    }

    const processedConfig = await applyRequestInterceptors(mergedConfig)

    const response = await Taro.request<ApiResponse<T>>({
      url: processedConfig.url,
      method: processedConfig.method,
      data: processedConfig.data,
      header: processedConfig.header,
      timeout: processedConfig.timeout,
      dataType: processedConfig.dataType as any,
      responseType: processedConfig.responseType as any,
      enableCache: processedConfig.enableCache,
      enableHttp2: processedConfig.enableHttp2,
      enableQuic: processedConfig.enableQuic
    })

    const processedResponse = await applyResponseInterceptors(response as RequestResponse<ApiResponse<T>>)

    const apiData = processedResponse.data as ApiResponse<T>

    if (apiData && typeof apiData === 'object' && 'success' in apiData) {
      if (apiData.success) {
        return apiData.data
      } else {
        throw new Error(apiData.message || '请求失败')
      }
    }

    return processedResponse.data as unknown as T
  } catch (error: any) {
    const requestError = {
      errMsg: error.errMsg || error.message || '未知错误',
      errno: error.errno
    }
    return applyErrorInterceptors(requestError)
  }
}

export function get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'GET',
    data: params,
    ...config
  })
}

export function post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...config
  })
}

export function put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...config
  })
}

export function del<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'DELETE',
    data: params,
    ...config
  })
}

export function patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'PATCH',
    data,
    ...config
  })
}

export function uploadFile<T = any>(
  url: string,
  filePath: string,
  name: string = 'file',
  formData?: Record<string, any>,
  config?: Partial<RequestConfig>
): Promise<T> {
  const uploadUrl = url.startsWith('http') ? url : `${baseURL}${url}`

  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: uploadUrl,
      filePath,
      name,
      formData,
      header: {
        ...DEFAULT_CONFIG.header,
        ...config?.header
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data) as ApiResponse<T>
          if (data.success) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch {
          resolve(res.data as unknown as T)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export function downloadFile(
  url: string,
  config?: Partial<RequestConfig>
): Promise<string> {
  const downloadUrl = url.startsWith('http') ? url : `${baseURL}${url}`

  return new Promise((resolve, reject) => {
    Taro.downloadFile({
      url: downloadUrl,
      header: {
        ...DEFAULT_CONFIG.header,
        ...config?.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error(`下载失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export function initRequest(config: { baseURL: string; setupInterceptors?: boolean }) {
  setBaseURL(config.baseURL)
  if (config.setupInterceptors !== false) {
    setupDefaultInterceptors()
  }
}

export * from './types'
export * from './interceptors'
