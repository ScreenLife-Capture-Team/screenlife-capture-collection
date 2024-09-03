// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'
import { nanoid } from 'nanoid'

describe('participants service', () => {
  it('registered the service', () => {
    const service = app.service('participants')

    assert.ok(service, 'Registered the service')
  })

  it('can create, get, find', async () => {
    const projectsService = app.service('projects')
    const participantsService = app.service('participants')

    // Setup new project
    const projectUuid = nanoid()
    await projectsService.create({ id: projectUuid, apiEndpoint: '' })

    // Test participant-related functions
    const findRes = await participantsService.find({ query: { projectId: projectUuid } })
    const originalCount = findRes.length

    const participantUuid = nanoid()
    await participantsService.create({ id: participantUuid }, { query: { projectId: projectUuid } })

    // Would throw if unable to get
    await participantsService.get(participantUuid, { query: { projectId: projectUuid } })

    const findRes2 = await participantsService.find({ query: { projectId: projectUuid } })
    const newCount = findRes2.length

    assert.equal(newCount, originalCount + 1)
  }).timeout(5000)
})
