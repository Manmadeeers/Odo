export function getFormString(formData: FormData, name: string) {
  return String(formData.get(name) ?? '')
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}
