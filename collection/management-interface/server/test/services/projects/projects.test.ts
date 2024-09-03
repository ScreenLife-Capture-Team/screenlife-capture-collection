// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'
import { nanoid } from 'nanoid'

describe('projects service', () => {
  it('registered the service', () => {
    const service = app.service('projects')

    assert.ok(service, 'Registered the service')
  })

  it('can create, get, find', async () => {
    const service = app.service('projects')

    const findRes = await service.find()
    const originalCount = findRes.length

    const uuid = nanoid()
    await service.create({ id: uuid, apiEndpoint: '' })

    // Would throw if unable to get
    await service.get(uuid)

    const findRes2 = await service.find()
    const newCount = findRes2.length

    assert.equal(newCount, originalCount + 1)
  }).timeout(5000)
})
