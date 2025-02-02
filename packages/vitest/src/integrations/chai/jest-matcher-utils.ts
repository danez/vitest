// we are using only the ones needed by @testing-library/jest-dom
// if you need more, just ask

import c from 'picocolors'
import type { PrettyFormatOptions } from 'pretty-format'
import { format as prettyFormat, plugins as prettyFormatPlugins } from 'pretty-format'
import { unifiedDiff } from '../../utils/diff'
import type { DiffOptions, MatcherHintOptions } from '../../types/matcher-utils'

export const EXPECTED_COLOR = c.green
export const RECEIVED_COLOR = c.red
export const INVERTED_COLOR = c.inverse
export const BOLD_WEIGHT = c.bold
export const DIM_COLOR = c.dim

const {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormatPlugins

const PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
]

export function matcherHint(
  matcherName: string,
  received = 'received',
  expected = 'expected',
  options: MatcherHintOptions = {},
) {
  const {
    comment = '',
    expectedColor = EXPECTED_COLOR,
    isDirectExpectCall = false, // seems redundant with received === ''
    isNot = false,
    promise = '',
    receivedColor = RECEIVED_COLOR,
    secondArgument = '',
    secondArgumentColor = EXPECTED_COLOR,
  } = options
  let hint = ''
  let dimString = 'expect' // concatenate adjacent dim substrings

  if (!isDirectExpectCall && received !== '') {
    hint += DIM_COLOR(`${dimString}(`) + receivedColor(received)
    dimString = ')'
  }

  if (promise !== '') {
    hint += DIM_COLOR(`${dimString}.`) + promise
    dimString = ''
  }

  if (isNot) {
    hint += `${DIM_COLOR(`${dimString}.`)}not`
    dimString = ''
  }

  if (matcherName.includes('.')) {
    // Old format: for backward compatibility,
    // especially without promise or isNot options
    dimString += matcherName
  }
  else {
    // New format: omit period from matcherName arg
    hint += DIM_COLOR(`${dimString}.`) + matcherName
    dimString = ''
  }

  if (expected === '') {
    dimString += '()'
  }
  else {
    hint += DIM_COLOR(`${dimString}(`) + expectedColor(expected)
    if (secondArgument)
      hint += DIM_COLOR(', ') + secondArgumentColor(secondArgument)
    dimString = ')'
  }

  if (comment !== '')
    dimString += ` // ${comment}`

  if (dimString !== '')
    hint += DIM_COLOR(dimString)

  return hint
}

const SPACE_SYMBOL = '\u{00B7}' // middle dot

// Instead of inverse highlight which now implies a change,
// replace common spaces with middle dot at the end of any line.
const replaceTrailingSpaces = (text: string): string =>
  text.replace(/\s+$/gm, spaces => SPACE_SYMBOL.repeat(spaces.length))

export function stringify(object: unknown, maxDepth = 10, { maxLength, ...options }: PrettyFormatOptions & { maxLength?: number } = {}): string {
  const MAX_LENGTH = maxLength ?? 10000
  let result

  try {
    result = prettyFormat(object, {
      maxDepth,
      escapeString: false,
      // min: true,
      plugins: PLUGINS,
      ...options,
    })
  }
  catch {
    result = prettyFormat(object, {
      callToJSON: false,
      maxDepth,
      escapeString: false,
      // min: true,
      plugins: PLUGINS,
      ...options,
    })
  }

  return result.length >= MAX_LENGTH && maxDepth > 1
    ? stringify(object, Math.floor(maxDepth / 2))
    : result
}

export const printReceived = (object: unknown): string =>
  RECEIVED_COLOR(replaceTrailingSpaces(stringify(object)))
export const printExpected = (value: unknown): string =>
  EXPECTED_COLOR(replaceTrailingSpaces(stringify(value)))

// TODO: do something with options
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function diff(a: any, b: any, options?: DiffOptions) {
  return unifiedDiff(stringify(b), stringify(a))
}
