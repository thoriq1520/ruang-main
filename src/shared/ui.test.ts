import assert from 'node:assert/strict'
import test from 'node:test'
import {requestAdSafely} from './ui.ts'

test('kegagalan AdSense tidak memblokir interaksi aplikasi', () => {
  const adWindow = {
    adsbygoogle: {
      push() {
        throw new Error('All ins elements already have ads')
      },
    },
  }

  assert.doesNotThrow(() => requestAdSafely(adWindow))
})

test('antrean AdSense dibuat ketika script belum dimuat', () => {
  const adWindow: {adsbygoogle?: {push(value: unknown): unknown}} = {}

  requestAdSafely(adWindow)

  assert.ok(adWindow.adsbygoogle)
})
