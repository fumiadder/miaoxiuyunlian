import request from './request'
import type { ScheduleData } from '../types/schedule'

export function getSchedule(date?: string) {
  return request.get<any, { data: ScheduleData }>('/schedule', { params: date ? { date } : {} })
}

export function getCurrentAssignees() {
  return request.get<any, { data: { members: { name: string; phone?: string }[] } }>('/schedule/current-assignees')
}

export function addSchedule(data: {
  date: string
  shift_id: number
  name: string
  phone?: string
}) {
  return request.post<any, { data: any }>('/schedule', data)
}

export function updateSchedule(id: number | string, data: {
  name?: string
  phone?: string
  is_available?: boolean
}) {
  return request.put<any, { data: any }>(`/schedule/${id}`, data)
}

export function deleteSchedule(id: number | string) {
  return request.delete<any, { data: any }>(`/schedule/${id}`)
}
