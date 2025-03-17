export const setItem = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const getItem = <T>(key: string): T | null => {
  const item = localStorage.getItem(key)
  return item ? (JSON.parse(item) as T) : null
}

export const removeItem = (key: string) => {
  localStorage.removeItem(key)
}
