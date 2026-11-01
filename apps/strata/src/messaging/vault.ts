import { b64, bytes, type Package, type Pin } from './crypto'
export type LocalMessage = {
  id: string
  thread_id: string
  sender_id: string
  client_id: string
  version: number
  created: number
}
export type LocalThread = {
  rows?: LocalMessage[]
  state: string
  pins: Pin[]
  welcome?: string
  seen: number
  texts: Record<string, string>
  pending?: { clientId: string; ciphertext: string; text: string }
}
export type VaultData = {
  actorId: string
  deviceId: string
  pair: { publicKey: string; privateKey: string }
  packages: Record<string, Package>
  threads: Record<string, LocalThread>
  registration?: { id: string; data: string }[]
}
type Sealed = { version: 1; salt: string; iv: string; ciphertext: string }
const encoder = new TextEncoder(),
  decoder = new TextDecoder()
let data: VaultData | null = null,
  key: CryptoKey | null = null,
  salt = '',
  actor = '',
  release: (() => void) | undefined,
  timer: ReturnType<typeof setTimeout> | undefined
const aad = (id: string) =>
  encoder.encode('strata.dm.vault.v1:' + location.origin + ':' + id)
async function db() {
  return await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('honai-dm-v1', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('vaults')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(Error('Penyimpanan perangkat tidak tersedia.'))
  })
}
async function read(id: string) {
  const d = await db()
  try {
    return await new Promise<Sealed | undefined>((resolve, reject) => {
      const r = d.transaction('vaults').objectStore('vaults').get(id)
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
  } finally {
    d.close()
  }
}
async function write(id: string, value: Sealed) {
  const d = await db()
  try {
    await new Promise<void>((resolve, reject) => {
      const t = d.transaction('vaults', 'readwrite')
      t.objectStore('vaults').put(value, id)
      t.oncomplete = () => resolve()
      t.onerror = () =>
        reject(Error('Kunci belum tersimpan. Tidak ada pesan yang dikirim.'))
      t.onabort = t.onerror
    })
  } finally {
    d.close()
  }
}
async function derive(passphrase: string, value: string) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(value), iterations: 600000 },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}
export async function exists(id: string) {
  return !!(await read(id))
}
async function acquire(id: string) {
  if (release) throw Error('Pesan sudah terbuka.')
  if (!navigator.locks)
    throw Error(
      'Browser ini belum mendukung penguncian pesan. Gunakan browser terbaru.',
    )
  await new Promise<void>((resolve, reject) => {
    void navigator.locks
      .request('strata-dm-v1:' + id, { ifAvailable: true }, async (lock) => {
        if (!lock) {
          reject(Error('Pesan sedang terbuka di tab lain.'))
          return
        }
        await new Promise<void>((done) => {
          release = done
          resolve()
        })
      })
      .catch(reject)
  })
}
export function lock() {
  data = null
  key = null
  salt = ''
  actor = ''
  clearTimeout(timer)
  release?.()
  release = undefined
  window.dispatchEvent(new Event('strata-dm-locked'))
}
function touch() {
  clearTimeout(timer)
  timer = setTimeout(lock, 10 * 60000)
}
export function current() {
  if (!data || !key) throw Error('Buka kunci pesan terlebih dahulu.')
  touch()
  return data
}
export async function unlock(id: string, passphrase: string) {
  await acquire(id)
  try {
    const sealed = await read(id)
    if (!sealed || sealed.version !== 1)
      throw Error('Kunci tidak ada di browser ini.')
    const derived = await derive(passphrase, sealed.salt)
    let raw: ArrayBuffer
    try {
      raw = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: bytes(sealed.iv), additionalData: aad(id) },
        derived,
        bytes(sealed.ciphertext),
      )
    } catch {
      throw Error('Frasa sandi tidak cocok atau penyimpanan rusak.')
    }
    const value = JSON.parse(decoder.decode(raw)) as VaultData
    if (value.actorId !== id) throw Error('Kunci akun tidak cocok.')
    actor = id
    data = value
    key = derived
    salt = sealed.salt
    touch()
    return value
  } catch (e) {
    lock()
    throw e
  }
}
export async function create(id: string, passphrase: string, value: VaultData) {
  if (passphrase.length < 16)
    throw Error('Gunakan frasa sandi minimal 16 karakter.')
  await acquire(id)
  try {
    if (await read(id))
      throw Error('Kunci sudah ada; buka dengan frasa sandimu.')
    actor = id
    salt = b64(crypto.getRandomValues(new Uint8Array(16)))
    key = await derive(passphrase, salt)
    data = value
    await save()
    return value
  } catch (e) {
    lock()
    throw e
  }
}
export async function save() {
  const value = current(),
    iv = crypto.getRandomValues(new Uint8Array(12)),
    sealed = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aad(actor) },
      key!,
      encoder.encode(JSON.stringify(value)),
    )
  try {
    await write(actor, {
      version: 1,
      salt,
      iv: b64(iv),
      ciphertext: b64(new Uint8Array(sealed)),
    })
  } catch (e) {
    lock()
    throw e
  }
}

// Origin moves are explicit, passphrase-encrypted file transfers. Never send this
// envelope to the forum server or accept it as an authentication credential.
export async function localVaultIds(): Promise<string[]> {
  const d = await db()
  try {
    return await new Promise((resolve, reject) => {
      const r = d.transaction('vaults').objectStore('vaults').getAllKeys()
      r.onsuccess = () =>
        resolve(r.result.filter((id): id is string => typeof id === 'string'))
      r.onerror = () => reject(r.error)
    })
  } finally {
    d.close()
  }
}
export async function exportVault(id: string): Promise<string> {
  lock()
  await acquire(id)
  try {
    const sealed = await read(id)
    if (!sealed) throw Error('Tidak ada kunci di browser ini.')
    return JSON.stringify({
      format: 'etnos-encrypted-vault',
      version: 1,
      origin: location.origin,
      actorId: id,
      sealed,
    })
  } finally {
    lock()
  }
}
export async function importVault(
  id: string,
  text: string,
  passphrase: string,
) {
  if (text.length > 8 * 1024 * 1024) throw Error('Berkas terlalu besar.')
  const value = JSON.parse(text)
  if (
    value?.format !== 'etnos-encrypted-vault' ||
    value.version !== 1 ||
    value.actorId !== id ||
    ![location.origin, 'https://strata-preview.giyaibo.workers.dev'].includes(
      value.origin,
    )
  )
    throw Error('Cadangan bukan milik akun atau asal ini.')
  const sealed = value.sealed as Sealed
  const valid = (s: unknown, length?: number): s is string =>
    typeof s === 'string' &&
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      s,
    ) &&
    (!length || bytes(s).length === length)
  if (
    sealed?.version !== 1 ||
    !valid(sealed.salt, 16) ||
    !valid(sealed.iv, 12) ||
    !valid(sealed.ciphertext)
  )
    throw Error('Format cadangan tidak cocok.')
  const derived = await derive(passphrase, sealed.salt)
  let clear: ArrayBuffer
  try {
    clear = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: bytes(sealed.iv),
        additionalData: encoder.encode(
          'strata.dm.vault.v1:' + value.origin + ':' + id,
        ),
      },
      derived,
      bytes(sealed.ciphertext),
    )
  } catch {
    throw Error('Frasa sandi tidak cocok atau cadangan rusak.')
  }
  const recovered = JSON.parse(decoder.decode(clear)) as VaultData
  if (
    recovered.actorId !== id ||
    typeof recovered.deviceId !== 'string' ||
    typeof recovered.pair?.privateKey !== 'string' ||
    typeof recovered.pair?.publicKey !== 'string' ||
    !recovered.threads ||
    !recovered.packages
  )
    throw Error('Kunci akun tidak cocok.')
  // create() takes the actor lock, rejects overwrites and seals afresh to this
  // origin. Imported ratchet state must not be used on two active devices.
  await create(id, passphrase, recovered)
  lock()
}
