export interface ScheduleMember {
  id: number
  name: string
  phone?: string
  is_available: boolean
}

export interface Shift {
  shift_id: number
  shift_name: string
  shift_start: string
  shift_end: string
  members: ScheduleMember[]
}

export interface ScheduleData {
  date: string
  shifts: Shift[]
  current_shift: {
    shift_id: number
    shift_name: string
  }
}
