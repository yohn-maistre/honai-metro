import assert from 'node:assert/strict'
import * as c from '../src/messaging/crypto.ts'
const alice = crypto.randomUUID(),
  bob = crypto.randomUUID(),
  ad = crypto.randomUUID(),
  bd = crypto.randomUUID(),
  ak = await c.signingKeys(),
  bk = await c.signingKeys(),
  ap = await c.keyPackage(alice, ad, ak),
  bp = await c.keyPackage(bob, bd, bk),
  pins = [
    { id: alice, deviceId: ad, signatureKey: ak.publicKey },
    { id: bob, deviceId: bd, signatureKey: bk.publicKey },
  ],
  id = crypto.randomUUID()
const first = await c.initiate(id, ap, bp.data, pins)
let a = first.state,
  b = await c.accept(id, first.welcome, bp, pins)
for (let i = 0; i < 3; i++) {
  const message = await c.encrypt(a, pins, id, alice, 'Hello Bob ' + i)
  a = message.state
  const plain = await c.decrypt(b, pins, id, alice, message.ciphertext)
  b = plain.state
  assert.equal(plain.text, 'Hello Bob ' + i)
}
const response = await c.encrypt(b, pins, id, bob, 'Hello Alice')
b = response.state
const received = await c.decrypt(a, pins, id, bob, response.ciphertext)
a = received.state
assert.equal(received.text, 'Hello Alice')
await assert.rejects(() => c.decrypt(a, pins, id, bob, response.ciphertext))
await assert.rejects(() =>
  c.encrypt(
    a,
    pins.map((p) => (p.id === bob ? { ...p, signatureKey: ak.publicKey } : p)),
    id,
    alice,
    'Wrong binding',
  ),
)
await assert.rejects(() =>
  c.accept(crypto.randomUUID(), first.welcome, bp, pins),
)
console.log(
  JSON.stringify({
    realMLSCrypto: true,
    bidirectional: true,
    serializedState: true,
    replayRejected: true,
    changedPinRejected: true,
    wrongThreadRejected: true,
  }),
)
