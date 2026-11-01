import {
  createGroup,
  joinGroup,
  createCommit,
  createApplicationMessage,
  processPrivateMessage,
  generateKeyPackageWithKey,
  defaultCapabilities,
  emptyPskIndex,
  encodeMlsMessage,
  decodeMlsMessage,
  encodeGroupState,
  decodeGroupState,
  getCiphersuiteImpl,
  getCiphersuiteFromName,
  zeroOutUint8Array,
  type ClientState,
  type KeyPackage,
  type PrivateKeyPackage,
} from 'ts-mls'
import { defaultClientConfig } from 'ts-mls/clientConfig.js'
import { getGroupMembers } from 'ts-mls/clientState.js'
export const suite = 'MLS_128_DHKEMP256_AES128GCM_SHA256_P256' as const
export const b64 = (a: Uint8Array) =>
  btoa(Array.from(a, (n) => String.fromCharCode(n)).join(''))
export const bytes = (a: string) =>
  Uint8Array.from(atob(a), (c) => c.charCodeAt(0))
export type Pin = { id: string; deviceId: string; signatureKey: string }
export type Package = {
  id: string
  data: string
  privateKeys: {
    initPrivateKey: string
    hpkePrivateKey: string
    signaturePrivateKey: string
  }
}
const text = new TextEncoder(),
  str = new TextDecoder('utf-8', { fatal: true })
const implementation = getCiphersuiteImpl(getCiphersuiteFromName(suite))
const identity = (pin: Pick<Pin, 'id' | 'deviceId'>) =>
  JSON.stringify([pin.id, pin.deviceId])
const config = (pins: Pin[]) => ({
  ...defaultClientConfig,
  keyRetentionConfig: {
    retainKeysForGenerations: 0,
    retainKeysForEpochs: 0,
    maximumForwardRatchetSteps: 1000,
  },
  authService: {
    async validateCredential(
      c: Parameters<
        typeof defaultClientConfig.authService.validateCredential
      >[0],
      key: Uint8Array,
    ) {
      return (
        c.credentialType === 'basic' &&
        pins.some(
          (p) =>
            str.decode(c.identity) === identity(p) &&
            b64(key) === p.signatureKey,
        )
      )
    },
  },
})
function message(encoded: string) {
  const data = bytes(encoded),
    parsed = decodeMlsMessage(data, 0)
  if (!parsed || parsed[1] !== data.length)
    throw Error('Format pesan tidak valid.')
  return parsed[0]
}
function kp(value: Package | string): KeyPackage {
  const m = message(typeof value === 'string' ? value : value.data)
  if (m.wireformat !== 'mls_key_package' || m.keyPackage.cipherSuite !== suite)
    throw Error('Paket kunci tidak didukung.')
  return m.keyPackage
}
const privateKeys = (p: Package): PrivateKeyPackage => ({
  initPrivateKey: bytes(p.privateKeys.initPrivateKey),
  hpkePrivateKey: bytes(p.privateKeys.hpkePrivateKey),
  signaturePrivateKey: bytes(p.privateKeys.signaturePrivateKey),
})
function validate(state: ClientState, id: string, pins: Pin[]) {
  if (
    str.decode(state.groupContext.groupId) !== id ||
    state.groupContext.cipherSuite !== suite
  )
    throw Error('Identitas percakapan tidak cocok.')
  const members = getGroupMembers(state)
  if (
    members.length !== 2 ||
    members.some(
      (m) =>
        m.credential.credentialType !== 'basic' ||
        !pins.some(
          (p) =>
            m.credential.credentialType === 'basic' &&
            str.decode(m.credential.identity) === identity(p) &&
            b64(m.signaturePublicKey) === p.signatureKey,
        ),
    )
  )
    throw Error('Kunci peserta berubah. Pesan tidak dibuka.')
}
export async function signingKeys() {
  const p = await (await implementation).signature.keygen()
  return { publicKey: b64(p.publicKey), privateKey: b64(p.signKey) }
}
export async function keyPackage(
  id: string,
  deviceId: string,
  pair: { publicKey: string; privateKey: string },
): Promise<Package> {
  const cs = await implementation,
    now = BigInt(Math.floor(Date.now() / 1000)),
    p = await generateKeyPackageWithKey(
      {
        credentialType: 'basic',
        identity: text.encode(identity({ id, deviceId })),
      },
      defaultCapabilities(),
      { notBefore: now - 3600n, notAfter: now + 7n * 86400n },
      [],
      { publicKey: bytes(pair.publicKey), signKey: bytes(pair.privateKey) },
      cs,
    )
  return {
    id: crypto.randomUUID(),
    data: b64(
      encodeMlsMessage({
        version: 'mls10',
        wireformat: 'mls_key_package',
        keyPackage: p.publicPackage,
      }),
    ),
    privateKeys: {
      initPrivateKey: b64(p.privatePackage.initPrivateKey),
      hpkePrivateKey: b64(p.privatePackage.hpkePrivateKey),
      signaturePrivateKey: b64(p.privatePackage.signaturePrivateKey),
    },
  }
}
export function serialize(state: ClientState) {
  return b64(encodeGroupState(state))
}
export function restore(encoded: string, pins: Pin[], id: string) {
  const data = bytes(encoded),
    parsed = decodeGroupState(data, 0)
  if (!parsed || parsed[1] !== data.length)
    throw Error('Keadaan percakapan rusak.')
  const state = { ...parsed[0], clientConfig: config(pins) }
  validate(state, id, pins)
  return state
}
export async function initiate(
  id: string,
  own: Package,
  peer: string,
  pins: Pin[],
) {
  const cs = await implementation,
    state = await createGroup(
      text.encode(id),
      kp(own),
      privateKeys(own),
      [],
      cs,
      config(pins),
    ),
    commit = await createCommit(
      { state, cipherSuite: cs },
      {
        extraProposals: [
          { proposalType: 'add', add: { keyPackage: kp(peer) } },
        ],
        ratchetTreeExtension: true,
      },
    )
  if (!commit.welcome) throw Error('Sesi belum dapat dibuat.')
  validate(commit.newState, id, pins)
  const encoded = serialize(commit.newState),
    welcome = b64(
      encodeMlsMessage({
        version: 'mls10',
        wireformat: 'mls_welcome',
        welcome: commit.welcome,
      }),
    )
  commit.consumed.forEach(zeroOutUint8Array)
  return { state: encoded, welcome }
}
export async function accept(
  id: string,
  welcome: string,
  own: Package,
  pins: Pin[],
) {
  const m = message(welcome)
  if (m.wireformat !== 'mls_welcome') throw Error('Undangan tidak valid.')
  const state = await joinGroup(
    m.welcome,
    kp(own),
    privateKeys(own),
    emptyPskIndex,
    await implementation,
    undefined,
    undefined,
    config(pins),
  )
  validate(state, id, pins)
  return serialize(state)
}
export async function encrypt(
  state: string,
  pins: Pin[],
  threadId: string,
  from: string,
  body: string,
) {
  if (!body.trim() || body.length > 6000)
    throw Error('Pesan harus berisi 1–6000 karakter.')
  const result = await createApplicationMessage(
    restore(state, pins, threadId),
    text.encode(JSON.stringify({ threadId, from, body })),
    await implementation,
  )
  const next = serialize(result.newState),
    ciphertext = b64(
      encodeMlsMessage({
        version: 'mls10',
        wireformat: 'mls_private_message',
        privateMessage: result.privateMessage,
      }),
    )
  result.consumed.forEach(zeroOutUint8Array)
  return { state: next, ciphertext }
}
export async function decrypt(
  state: string,
  pins: Pin[],
  threadId: string,
  peerId: string,
  ciphertext: string,
) {
  const m = message(ciphertext)
  if (m.wireformat !== 'mls_private_message')
    throw Error('Pesan terenkripsi diperlukan.')
  const result = await processPrivateMessage(
    restore(state, pins, threadId),
    m.privateMessage,
    emptyPskIndex,
    await implementation,
    () => 'reject',
  )
  if (result.kind !== 'applicationMessage')
    throw Error('Perubahan peserta tidak didukung.')
  const body = JSON.parse(str.decode(result.message))
  if (
    body.threadId !== threadId ||
    body.from !== peerId ||
    typeof body.body !== 'string' ||
    body.body.length > 6000
  )
    throw Error('Identitas pesan tidak cocok.')
  validate(result.newState, threadId, pins)
  const next = serialize(result.newState)
  result.consumed.forEach(zeroOutUint8Array)
  return { state: next, text: body.body as string }
}
export async function fingerprint(pins: Pin[]) {
  const canonical = pins
    .map((p) => [p.id, p.deviceId, p.signatureKey])
    .sort((a, b) => a[0].localeCompare(b[0]))
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        text.encode(JSON.stringify(canonical)),
      ),
    ),
    (n) => n.toString(16).padStart(2, '0'),
  )
    .join('')
    .match(/.{1,4}/g)!
    .join(' ')
}
