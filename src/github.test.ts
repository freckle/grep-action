import * as gh from '@actions/github'

import type {Annotation} from './github.js'
import {createCheck, getClient, listPullRequestFiles} from './github.js'

const {mockContext} = vi.hoisted(() => {
  return {
    mockContext: {
      payload: {} as {pull_request?: {head: {sha: string}}},
      sha: 'contextsha',
      repo: {owner: 'freckle', repo: 'grep-action'},
      issue: {number: 42}
    }
  }
})

vi.mock(import('@actions/github'), () => {
  return {
    getOctokit: vi.fn((token: string) => ({token})),
    context: mockContext
  } as never
})

vi.mock(import('@actions/core'), () => {
  return {info: vi.fn()} as never
})

function makeAnnotations(n: number): Annotation[] {
  return Array.from({length: n}, (_, i) => ({
    path: 'src/main.ts',
    start_line: i + 1,
    end_line: i + 1,
    annotation_level: 'notice' as const,
    message: 'message',
    title: 'title',
    raw_details: 'raw'
  }))
}

function makeClient() {
  const create = vi.fn(async () => ({data: {id: 99}}))
  const update = vi.fn(async () => ({}))
  const merge = vi.fn((options: object) => ({merged: options}))
  const paginate = vi.fn(async () => [{filename: 'src/a.ts'}, {filename: 'src/b.ts'}])

  return {
    client: {
      rest: {
        checks: {create, update},
        pulls: {listFiles: {endpoint: {merge}}}
      },
      paginate
    },
    create,
    update,
    merge,
    paginate
  }
}

beforeEach(() => {
  mockContext.payload = {}
})

test('getClient builds an Octokit from the token', () => {
  const client = getClient('_token_')

  expect(gh.getOctokit).toHaveBeenCalledWith('_token_')
  expect(client).toEqual({token: '_token_'})
})

test('createCheck posts annotations against the context sha', async () => {
  const {client, create, update} = makeClient()
  const annotations = makeAnnotations(2)

  await createCheck(client as never, 'Grep results', annotations, 'success')

  expect(create).toHaveBeenCalledWith({
    owner: 'freckle',
    repo: 'grep-action',
    name: 'Grep results',
    head_sha: 'contextsha',
    status: 'completed',
    conclusion: 'success',
    output: {
      title: '2 result(s) found by grep',
      summary: '',
      annotations
    }
  })
  expect(update).not.toHaveBeenCalled()
})

test('createCheck prefers the pull request head sha', async () => {
  mockContext.payload = {pull_request: {head: {sha: 'prsha'}}}
  const {client, create} = makeClient()

  await createCheck(client as never, 'Grep results', makeAnnotations(1), 'failure')

  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({head_sha: 'prsha', conclusion: 'failure'})
  )
})

test('createCheck batches annotations beyond the 50 per-request limit', async () => {
  const {client, create, update} = makeClient()
  const annotations = makeAnnotations(120)

  await createCheck(client as never, 'Grep results', annotations, 'failure')

  // 50 on create, then 50 + 20 across two updates
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      output: expect.objectContaining({annotations: annotations.slice(0, 50)})
    })
  )
  expect(update).toHaveBeenCalledTimes(2)
  expect(update).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      check_run_id: 99,
      output: expect.objectContaining({annotations: annotations.slice(50, 100)})
    })
  )
  expect(update).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      check_run_id: 99,
      output: expect.objectContaining({annotations: annotations.slice(100, 120)})
    })
  )
})

test('listPullRequestFiles returns the paginated filenames', async () => {
  const {client, merge, paginate} = makeClient()

  const files = await listPullRequestFiles(client as never)

  expect(merge).toHaveBeenCalledWith({
    owner: 'freckle',
    repo: 'grep-action',
    pull_number: 42
  })
  expect(paginate).toHaveBeenCalledWith({
    merged: {owner: 'freckle', repo: 'grep-action', pull_number: 42}
  })
  expect(files).toEqual(['src/a.ts', 'src/b.ts'])
})
