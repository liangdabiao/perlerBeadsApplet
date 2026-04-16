export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
  data?: any
  params?: any
  header?: Record<string, string>
  timeout?: number
  dataType?: string
  responseType?: string
  enableCache?: boolean
  enableHttp2?: boolean
  enableQuic?: boolean
  enableCacheSet?: boolean
  enableHttpDNS?: boolean
  httpDNSServiceId?: string
  enableChunked?: boolean
  forceCellularNetwork?: boolean
}

export interface RequestResponse<T = any> {
  data: T
  statusCode: number
  header: Record<string, string>
  cookies?: string[]
  profile?: any
}

export interface RequestError {
  errMsg: string
  errno?: number
}

export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>

export type ResponseInterceptor<T = any> = (
  response: RequestResponse<T>
) => RequestResponse<T> | Promise<RequestResponse<T>>

export type ErrorInterceptor = (error: RequestError) => Promise<any>

export interface InterceptorManager {
  request: RequestInterceptor[]
  response: ResponseInterceptor[]
  error: ErrorInterceptor[]
}

export interface ApiServiceConfig<T = any> {
  url: string
  baseUrl?: string
  method?: RequestConfig['method']
  defaultData?: Partial<T>
}

export interface ApiService<T = any> {
  get: (params?: any, config?: Partial<RequestConfig>) => Promise<T>
  post: (data?: any, config?: Partial<RequestConfig>) => Promise<T>
  put: (data?: any, config?: Partial<RequestConfig>) => Promise<T>
  delete: (params?: any, config?: Partial<RequestConfig>) => Promise<T>
  patch: (data?: any, config?: Partial<RequestConfig>) => Promise<T>
  request: (config: RequestConfig) => Promise<T>
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}
