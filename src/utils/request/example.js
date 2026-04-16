// 在 app.ts 中初始化
import { initRequest } from '@/utils/request'

initRequest({
  baseURL: 'https://api.example.com',
  setupInterceptors: true
})

// 方式1: 直接使用
import { get, post } from '@/utils/request'

const data = await get('/api/user', { id: 1 })
const result = await post('/api/user', { name: 'test' })

// 方式2: 创建API服务 (已在 src/config/api.ts 中使用)
import { createApiService } from '@/utils/request/apiConfig'

const userService = createApiService<User>({
  url: '/api/users'
})

const users = await userService.get()
const user = await userService.post({ name: 'test' })
const updated = await userService.put({ id: 1, name: 'updated' })
await userService.delete(1)