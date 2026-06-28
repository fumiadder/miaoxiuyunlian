import request from './request'

export interface LoginResult {
  id: number
  name: string
  role: 'reporter' | 'worker'
  is_admin: boolean
  token: string
}

export function login(name: string, password: string) {
  return request.post('/auth/login', { name, password }).then((r: any) => {
    if (r.code !== 0) {
      throw new Error(r.message || '登录失败')
    }
    return r.data
  })
}

export function getUsers() {
  return request.get('/auth/users').then(r => r.data)
}

export function createUser(data: { name: string; password: string; role: string; is_admin?: boolean }) {
  return request.post('/auth/users', data).then(r => r.data)
}

export function updateUser(id: number, data: { name?: string; password?: string; role?: string; is_admin?: boolean }) {
  return request.put(`/auth/users/${id}`, data).then(r => r.data)
}

export function deleteUser(id: number) {
  return request.delete(`/auth/users/${id}`).then(r => r.data)
}
