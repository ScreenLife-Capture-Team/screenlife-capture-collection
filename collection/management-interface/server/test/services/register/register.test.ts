// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'
import { nanoid } from 'nanoid'

describe('register service', () => {
  it('registered the service', () => {
    const service = app.service('register')

    assert.ok(service, 'Registered the service')
  })

  it('can register new participant', async () => {
    const projectId = nanoid()
    const participantId = nanoid()

    await app.service('projects').create({ id: projectId, apiEndpoint: '' })

    const { qrString } = await app.service('register').create({ projectId, participantId })
    console.log('qrString', qrString)
  }).timeout(5000)
})
