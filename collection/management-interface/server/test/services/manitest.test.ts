// For more information about this file see https://dove.feathersjs.com/guides/cli/app.test.html
import assert from 'assert'
import axios from 'axios'
import { nanoid } from 'nanoid'
import { app } from '../../src/app'
import { createMD5 } from '../util'
import fs from 'fs'

describe('Feathers application tests', () => {
  const apiEndpoint = 'https://asia-southeast1-screenlife-test-31052024.cloudfunctions.net'
  const projectId = `project-${nanoid(8)}`
  const testFilePath = 'mock-assets/two_images.zip'

  before(async () => {
    await app.service('projects').create({ id: projectId, apiEndpoint })
  })

  it('manifest submission', async () => {
    const participantId = `participant-${nanoid(8)}`

    const { qrString } = await app.service('register').create({ projectId, participantId })

    const res = await axios.post(`${apiEndpoint}/submitManifest`, {
      projectId,
      participantId,
      hash: 'test'
    })

    assert.equal(!!res.data.manifestId, true)
  }).timeout(10000)

  it.only('manifest checking', async () => {
    const participantId = `participant-${nanoid(8)}`

    const { qrString } = await app.service('register').create({ projectId, participantId })

    const fileHash = await createMD5(testFilePath)
    console.log('got file hash', fileHash)

    console.log('submitting manifest..')
    const res = await axios.post(`${apiEndpoint}/submitManifest`, {
      projectId,
      participantId,
      hash: fileHash
    })

    console.log('submitManifest result', res?.data)

    console.log('reading file..')
    const fileData = fs.readFileSync(testFilePath)

    console.log('sending file..')
    try {
      await axios.put(res.data.url, fileData, {
        headers: {
          'Content-Type': 'application/zip'
        }
      })
    } catch (err: any) {
      console.error('err', JSON.stringify(err))
      throw err
    }

    console.log('checking manifest..')
    const res2 = await axios.post(`${apiEndpoint}/checkManifest`, {
      projectId,
      participantId,
      manifestId: res.data.manifestId
    })

    console.log('checkManifest result', res2?.data)

    assert.equal(res2.data.message, 'matched')
  }).timeout(10000)
})
