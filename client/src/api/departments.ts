import request from './request'

export interface Department {
  id: number
  name: string
  description: string
  sort_order: number
  created_at: string
}

export function getDepartments() {
  return request.get('/departments').then(r => r.data)
}

export function createDepartment(data: { name: string; description?: string; sort_order?: number }) {
  return request.post('/departments', data).then(r => r.data)
}

export function updateDepartment(id: number, data: { name?: string; description?: string; sort_order?: number }) {
  return request.put(`/departments/${id}`, data).then(r => r.data)
}

export function deleteDepartment(id: number) {
  return request.delete(`/departments/${id}`).then(r => r.data)
}
