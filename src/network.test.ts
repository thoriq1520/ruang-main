import assert from 'node:assert/strict'
import test from 'node:test'
import {createPeerLeaveGrace} from './network.ts'

test('peer yang tersambung kembali tidak dianggap keluar', () => {
  const scheduled = new Map<number, () => void>()
  const cleared: number[] = []
  let timerId = 0
  const expired: string[] = []
  const grace = createPeerLeaveGrace(
    (peerId) => expired.push(peerId),
    12_000,
    {
      set: (callback) => {
        const id = ++timerId
        scheduled.set(id, callback)
        return id
      },
      clear: (id) => {
        cleared.push(id)
        scheduled.delete(id)
      },
    },
  )

  assert.equal(grace.disconnect('peer-a'), true)
  assert.equal(grace.disconnect('peer-a'), false)
  assert.equal(grace.reconnect('peer-a'), true)
  assert.deepEqual(cleared, [1])
  assert.deepEqual(expired, [])
})

test('peer dihapus sekali setelah grace period habis', () => {
  const scheduled = new Map<number, () => void>()
  let timerId = 0
  const expired: string[] = []
  const grace = createPeerLeaveGrace(
    (peerId) => expired.push(peerId),
    12_000,
    {
      set: (callback) => {
        const id = ++timerId
        scheduled.set(id, callback)
        return id
      },
      clear: (id) => scheduled.delete(id),
    },
  )

  grace.disconnect('peer-a')
  scheduled.get(1)?.()

  assert.deepEqual(expired, ['peer-a'])
  assert.equal(grace.reconnect('peer-a'), false)
})
