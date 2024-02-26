import { v5, NIL } from 'uuid'

export const getUsernameUUID = (username?: string) => (username ? v5(username, NIL) : window.crypto.randomUUID())
