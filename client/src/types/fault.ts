export type FaultStatus = 'pending' | 'dispatched' | 'accepted' | 'repairing' | 'completed'

export interface FaultRecord {
  id: number
  fault_no: string
  device_name: string
  fault_type: string
  fault_description: string
  reporter_name: string
  reporter_photo_url?: string
  status: FaultStatus
  assignee_name?: string
  assignee_name_2?: string
  shift_id?: number
  case_id?: number
  case_applicable?: boolean
  feedback_text?: string
  optimization_text?: string
  completion_photo_url?: string
  repair_description?: string
  dify_conversation_id?: string
  created_at: string
  dispatched_at?: string
  accepted_at?: string
  completed_at?: string
  updated_at: string
}

export interface RepairCase {
  id: number
  fault_name: string
  fault_type: string
  device_name?: string
  case_content: string
  source: string
}

export interface TimelineItem {
  action: string
  time: string
  operator?: string
}

export const FAULT_TYPE_MAP: Record<string, string> = {
  mechanical: '机械故障',
  electrical: '电气故障',
  hydraulic: '液压故障',
  software: '软件故障',
}

export const FAULT_STATUS_MAP: Record<FaultStatus, string> = {
  pending: '待派单',
  dispatched: '已派单',
  accepted: '已接单',
  repairing: '维修中',
  completed: '已完成',
}

export const FAULT_STATUS_COLOR_MAP: Record<FaultStatus, string> = {
  pending: 'info',
  dispatched: 'warning',
  accepted: '',
  repairing: 'warning',
  completed: 'success',
}
