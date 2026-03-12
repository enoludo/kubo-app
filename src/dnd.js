// Shared drag state — avoids dataTransfer serialization issues
export const dnd = {
  payload: null,
  set(data)  { this.payload = data },
  clear()    { this.payload = null },
}
