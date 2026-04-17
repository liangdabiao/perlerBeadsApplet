import type { ApiService, ApiServiceConfig, RequestConfig } from './types'
import { request, get, post, put, del, patch } from './index'

export function createApiService<T = any>(config: ApiServiceConfig<T>): ApiService<T> {
  const { url: baseUrl } = config

  const buildUrl = (id?: string | number): string => {
    if (id !== undefined) {
      return `${baseUrl}/${id}`
    }
    return baseUrl
  }

  return {
    get: (params?: any, requestConfig?: Partial<RequestConfig>): Promise<T> => {
      return get<T>(baseUrl, params, requestConfig)
    },

    post: (data?: any, requestConfig?: Partial<RequestConfig>): Promise<T> => {
      return post<T>(baseUrl, data, requestConfig)
    },

    put: (data?: any, requestConfig?: Partial<RequestConfig>): Promise<T> => {
      const id = data?.id
      const url = buildUrl(id)
      const { id: _, ...restData } = data || {}
      return put<T>(url, restData, requestConfig)
    },

    delete: (params?: any, requestConfig?: Partial<RequestConfig>): Promise<T> => {
      const id = typeof params === 'string' || typeof params === 'number' ? params : params?.id
      const url = buildUrl(id)
      return del<T>(url, undefined, requestConfig)
    },

    patch: (data?: any, requestConfig?: Partial<RequestConfig>): Promise<T> => {
      const id = data?.id
      const url = buildUrl(id)
      const { id: _, ...restData } = data || {}
      return patch<T>(url, restData, requestConfig)
    },

    request: (requestConfig: RequestConfig): Promise<T> => {
      return request<T>({
        ...requestConfig,
        url: requestConfig.url.startsWith('http') ? requestConfig.url : `${baseUrl}${requestConfig.url}`
      })
    }
  }
}

export function createRestApiService<T extends { id: string | number }>(
  config: ApiServiceConfig<T>
): ApiService<T> & {
  getById: (id: string | number) => Promise<T>
  update: (id: string | number, data: Partial<T>) => Promise<T>
  remove: (id: string | number) => Promise<void>
} {
  const baseService = createApiService<T>(config)
  const { url: baseUrl } = config

  return {
    ...baseService,

    getById: (id: string | number): Promise<T> => {
      return get<T>(`${baseUrl}/${id}`)
    },

    update: (id: string | number, data: Partial<T>): Promise<T> => {
      return put<T>(`${baseUrl}/${id}`, data)
    },

    remove: (id: string | number): Promise<void> => {
      return del<void>(`${baseUrl}/${id}`)
    }
  }
}

export function createCustomApiService<T = any, P = any>(
  url: string,
  methods: {
    get?: (params?: P) => Promise<T>
    post?: (data?: P) => Promise<T>
    put?: (data?: P) => Promise<T>
    delete?: (params?: P) => Promise<T>
    [key: string]: ((...args: any[]) => Promise<any>) | undefined
  }
) {
  const service = createApiService<T>({ url })

  return {
    ...service,
    ...methods
  }
}

export * from './index'
export * from './types'
