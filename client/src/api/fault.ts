import request from './request'
import type { FaultRecord, TimelineItem, RepairCase } from '../types/fault'

export function createFault(data: {
  device_name: string
  fault_type: string
  fault_description: string
  reporter_name: string
  reporter_photo_url?: string
}) {
  return request.post<any, { data: FaultRecord }>('/fault/create', data)
}

export function getFaultList(params?: {
  fault_type?: string
  status?: string
  reporter_name?: string
  assignee_name?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) {
  return request.get<any, { data: { list: FaultRecord[]; total: number } }>('/fault/list', { params })
}

export function getFaultDetail(id: number | string) {
  return request.get<any, { data: FaultRecord & { timeline?: TimelineItem[]; repair_case?: RepairCase } }>(`/fault/${id}`)
}

export function acceptFault(id: number | string, operator_name: string) {
  return request.put<any, { data: FaultRecord }>(`/fault/${id}/accept`, { operator_name })
}

export function updateFaultStatus(
  id: number | string,
  data: {
    status: string
    completion_photo_url?: string
    repair_description?: string
    operator_name?: string
  }
) {
  return request.put<any, { data: FaultRecord }>(`/fault/${id}/status`, data)
}

export function submitFeedback(
  id: number | string,
  data: {
    case_applicable: boolean
    feedback_text?: string
    optimization_text?: string
  }
) {
  return request.post<any, { data: FaultRecord }>(`/fault/${id}/feedback`, data)
}
