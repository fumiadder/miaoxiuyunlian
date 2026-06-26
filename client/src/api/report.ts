import request from './request'
import type { FaultRecord } from '../types/fault'

export function getFaultStats(params?: {
  start_date?: string
  end_date?: string
}) {
  return request.get<any, { data: { by_type: Record<string, number>; by_status: Record<string, number> } }>(
    '/report/fault-stats',
    { params }
  )
}

export function getSparePartsConsumption(params?: {
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) {
  return request.get<any, { data: { list: any[]; total: number } }>(
    '/report/spare-parts-consumption',
    { params }
  )
}

export function getDispatchDetail(params?: {
  start_date?: string
  end_date?: string
  status?: string
  page?: number
  page_size?: number
}) {
  return request.get<any, { data: { list: FaultRecord[]; total: number } }>(
    '/report/dispatch-detail',
    { params }
  )
}
