import { describe, expect, test } from 'vitest'
import { getToken, initAuth, removeToken, setToken } from '../auth'

describe('auth storage safety', () => {
  test('does not crash when storage is unavailable', () => {
    const originalStorage = globalThis.localStorage

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => { throw new Error('Storage unavailable') },
        setItem: () => { throw new Error('Storage unavailable') },
        removeItem: () => { throw new Error('Storage unavailable') }
      }
    })

    expect(() => getToken()).not.toThrow()
    expect(() => setToken('abc')).not.toThrow()
    expect(() => initAuth()).not.toThrow()
    expect(() => removeToken()).not.toThrow()

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalStorage
    })
  })
})
