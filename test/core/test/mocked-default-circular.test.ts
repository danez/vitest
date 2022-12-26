import { expect, it, vi } from 'vitest'
import circularA from '../src/circularDefaultA'

vi.mock('../src/circularDefaultB')

it('circular', () => {
  circularA()

  expect(1).toBe(1)
})
