import { createApiService } from '@/utils/request/apiConfig'

// export interface UserFile {
//   id: string
//   title: string
//   coverImage: string
//   status: 'finished' | 'unfinished'
//   likeCount: number
//   createdAt?: number
//   updatedAt?: number
// }


export interface UserFile {
  id: string
  title: string
  coverImage: string
  likeCount: number
  date: string
  height: number
  createdAt?: number
  updatedAt?: number
}


export const fileService = createApiService<UserFile>({
  url: '/api/files'
})
