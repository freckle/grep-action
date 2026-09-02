import * as core from '@actions/core'

import type {Pattern} from './config.js'
import type {AnnotationLevel} from './github.js'
import * as github from './github.js'
import type {GrepResult} from './grep.js'
import {Reporter} from './reporter.js'

vi.mock(import('@actions/core'), () => {
  return {
    notice: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    setFailed: vi.fn()
  } as never
})

vi.mock(import('./github.js'), () => {
  return {createCheck: vi.fn()} as never
})

function makePattern(overrides: Partial<Pattern> = {}): Pattern {
  return {
    id: null,
    pattern: 'abc',
    syntax: 'basic',
    binaryFiles: 'binary',
    paths: ['**/*'],
    pathsIgnore: [],
    level: 'notice',
    title: 'Found abc',
    message: 'Some message',
    ...overrides
  }
}

function makeResult(overrides: Partial<GrepResult> = {}): GrepResult {
  return {
    input: 'src/main.ts:32:  abc',
    path: 'src/main.ts',
    line: 32,
    ...overrides
  }
}

// onFinish only forwards this to the mocked createCheck
const client = {} as never

test('exceedsFailureThreshold', () => {
  const reporter = new Reporter(false, 'warning')

  expect(reporter.exceedsFailureThreshold('notice')).toBe(false)
  expect(reporter.exceedsFailureThreshold('warning')).toBe(true)
  expect(reporter.exceedsFailureThreshold('failure')).toBe(true)
})

test('onResult builds an annotation from the pattern and result', () => {
  const reporter = new Reporter(true, 'failure')

  reporter.onResult(makePattern(), makeResult())

  expect(reporter.annotations).toEqual([
    {
      path: 'src/main.ts',
      start_line: 32,
      end_line: 32,
      annotation_level: 'notice',
      message: 'Some message',
      title: 'Found abc',
      raw_details: 'src/main.ts:32:  abc'
    }
  ])
})

test('onResult falls back to a default message and empty title', () => {
  const reporter = new Reporter(true, 'failure')

  reporter.onResult(makePattern({message: null, title: ''}), makeResult())

  expect(reporter.annotations[0].message).toBe('Flagged in freckle/grep-action')
  expect(reporter.annotations[0].title).toBe('')
})

test('onResult does not report inline when creating a new Check', () => {
  const reporter = new Reporter(true, 'failure')

  reporter.onResult(makePattern(), makeResult())

  expect(core.notice).not.toHaveBeenCalled()
  expect(core.warning).not.toHaveBeenCalled()
  expect(core.error).not.toHaveBeenCalled()
})

test.for([
  ['notice', 'notice'],
  ['warning', 'warning'],
  ['failure', 'error']
] as [AnnotationLevel, 'notice' | 'warning' | 'error'][])(
  'onResult reports %s inline via core.%s',
  ([level, fn]) => {
    const reporter = new Reporter(false, 'failure')

    reporter.onResult(makePattern({level}), makeResult())

    expect(core[fn]).toHaveBeenCalledWith('Some message', {
      title: 'Found abc',
      file: 'src/main.ts',
      startLine: 32,
      endLine: 32
    })
  }
)

test('onResult sets a failure conclusion at or above the threshold', () => {
  const reporter = new Reporter(false, 'warning')

  reporter.onResult(makePattern({level: 'notice'}), makeResult())
  expect(reporter.conclusion).toBe('success')

  reporter.onResult(makePattern({level: 'warning'}), makeResult())
  expect(reporter.conclusion).toBe('failure')
})

test('onFinish fails the job on a failure conclusion', async () => {
  const reporter = new Reporter(false, 'notice')

  reporter.onResult(makePattern({level: 'failure'}), makeResult())
  await reporter.onFinish(client)

  expect(core.setFailed).toHaveBeenCalledWith('Failing due to grep results')
  expect(github.createCheck).not.toHaveBeenCalled()
})

test('onFinish is a no-op when nothing met the threshold', async () => {
  const reporter = new Reporter(false, 'failure')

  reporter.onResult(makePattern({level: 'notice'}), makeResult())
  await reporter.onFinish(client)

  expect(core.setFailed).not.toHaveBeenCalled()
  expect(github.createCheck).not.toHaveBeenCalled()
})

test('onFinish creates a Check when configured to', async () => {
  const reporter = new Reporter(true, 'failure')

  reporter.onResult(makePattern({level: 'failure'}), makeResult())
  await reporter.onFinish(client)

  expect(core.setFailed).not.toHaveBeenCalled()
  expect(github.createCheck).toHaveBeenCalledWith(
    client,
    'Grep results',
    reporter.annotations,
    'failure'
  )
})
