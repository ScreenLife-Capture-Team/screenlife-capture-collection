// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Actions, ActionsData, ActionsPatch, ActionsQuery } from './actions.schema'
import { app } from '../../app'
import { Storage } from '@google-cloud/storage'
import path from 'path'
import fs, { ReadStream } from 'fs'
import yauzl from 'yauzl'
import { Readable, pipeline } from 'stream'
import crypto from 'crypto'

export type { Actions, ActionsData, ActionsPatch, ActionsQuery }

export interface ActionsServiceOptions {
  app: Application
}

export interface ActionsParams extends Params<ActionsQuery> {}
// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ActionsService<ServiceParams extends ActionsParams = ActionsParams>
  implements ServiceInterface<Actions, ActionsData, ServiceParams, ActionsPatch>
{
  constructor(public options: ActionsServiceOptions) {}

  async create(data: ActionsData, params?: ServiceParams): Promise<Actions> {
    const downloadsPath = './downloads'

    if (data.action.type === 'download-for-participant') {
      console.log(`Downloading for participant ${data.action.participantId}`)
      const participant = await app
        .service('participants')
        .get(data.action.participantId, { query: { projectId: data.action.projectId } })

      const manifests = participant.manifests?.filter((m) => m.status === 'finished')

      for (const [i, manifest] of Object.entries(manifests || [])) {
        console.log(`downloading manifest ${manifest.id} ${parseInt(i) + 1}/${manifests?.length}`)
        console.log('manifest', manifest)
      }
    }

    if (data.action.type === 'unzip-decrypt-for-participant') {
      console.log(`Unzipping and decrypting for participant ${data.action.participantId}`)
      const downloadedManifestsPath = path.join(
        downloadsPath,
        data.action.projectId,
        data.action.participantId
      )

      const downloadedManifestsNames = fs.readdirSync(downloadedManifestsPath)

      for (const manifestName of downloadedManifestsNames) {
        console.log(`Unzipping ${manifestName}`)
      }
    }

    return data
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
