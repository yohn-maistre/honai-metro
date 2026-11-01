export type DmPeer = {
  id: string
  did: string
  name: string
  deviceId: string
  signatureKey: string
}
export type DmThread = {
  id: string
  sender_id: string
  recipient_id: string
  sender_device: string
  recipient_device: string
  package_id: string
  state: 'preparing' | 'pending' | 'active' | 'closed'
  version: number
  welcome?: string | null
  updated: number
  created: number
  participants: DmPeer[]
  incoming: boolean
  readVersion: number
}
export type DmMessage = {
  id: string
  thread_id: string
  sender_id: string
  client_id: string
  version: number
  ciphertext: string
  created: number
}
export type DeviceState = {
  device: { id: string; signature_key: string } | null
  availablePackages: number
  experimental: true
}
