import request from './request'

export function uploadPhoto(
  file: File,
  faultId?: number | string,
  photoType?: string
) {
  const formData = new FormData()
  formData.append('photo', file)
  if (faultId !== undefined) {
    formData.append('fault_id', String(faultId))
  }
  if (photoType) {
    formData.append('photo_type', photoType)
  }

  return request.post<any, { data: { url: string } }>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
