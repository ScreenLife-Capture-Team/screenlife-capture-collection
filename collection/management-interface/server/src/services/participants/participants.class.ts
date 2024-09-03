// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Participant, ParticipantData, ParticipantPatch, ParticipantQuery } from './participants.schema'
import { BadRequest } from '@feathersjs/errors'
import { create, exists, find, get, patch, remove } from '../../firebase'
import { participant } from './participants'
import {
  decryptedItemsCount,
  decryptedManifestExists,
  downloadedItemsCount,
  downloadedManifestExists
} from '../../util'

export type { Participant, ParticipantData, ParticipantPatch, ParticipantQuery }

export interface ParticipantServiceOptions {
  app: Application
}

export interface ParticipantParams extends Params<ParticipantQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ParticipantService<ServiceParams extends ParticipantParams = ParticipantParams>
  implements ServiceInterface<Participant, ParticipantData, ServiceParams, ParticipantPatch>
{
  constructor(public options: ParticipantServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Participant[]> {
    const projectId = _params?.query?.projectId
    if (!projectId) throw new BadRequest('projectId is required')

    const participants = await find<Participant>(`projects/${projectId}/participants`)

    return Promise.all(
      participants.map(async (participant) => {
        const manifests = await find<NonNullable<Participant['manifests']>[number]>(
          `projects/${projectId}/participants/${participant.id}/manifests`
        )

        for (const i in manifests) {
          manifests[i].downloaded = downloadedManifestExists(projectId, participant.id, manifests[i].id)
          manifests[i].decryptedNum = decryptedItemsCount(projectId, participant.id, manifests[i].id)
        }

        return { ...participant, manifests }
      })
    )
  }

  async get(id: Id, _params?: ServiceParams): Promise<Participant> {
    const projectId = _params?.query?.projectId
    if (!projectId) throw new BadRequest('projectId is required')

    const participant = await get<Participant>(id, `projects/${projectId}/participants`)
    const manifests = await find<NonNullable<Participant['manifests']>[number]>(
      `projects/${projectId}/participants/${id}/manifests`
    )

    for (const i in manifests) {
      manifests[i].downloaded = downloadedManifestExists(projectId, participant.id, manifests[i].id)
      manifests[i].decryptedNum = decryptedItemsCount(projectId, participant.id, manifests[i].id)
    }

    return { ...participant, manifests } as any
  }

  async create(data: ParticipantData, params?: ServiceParams): Promise<Participant>
  async create(data: ParticipantData[], params?: ServiceParams): Promise<Participant[]>
  async create(
    data: ParticipantData | ParticipantData[],
    params?: ServiceParams
  ): Promise<Participant | Participant[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)))
    }

    const projectId = params?.query?.projectId
    if (!projectId) throw new BadRequest('projectId is required')

    if (await exists(data.id, `projects/${projectId}/participants`))
      throw new BadRequest(`Participant ${data.id} already exists on project ${projectId}`)

    return create<Participant>(data, `projects/${projectId}/participants`)
  }

  async patch(id: NullableId, data: ParticipantPatch, _params?: ServiceParams): Promise<Participant> {
    const projectId = _params?.query?.projectId
    if (!projectId) throw new BadRequest('projectId is required')

    return patch({ id, ...data }, `projects/${projectId}/participants`)
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<Participant> {
    const projectId = _params?.query?.projectId
    if (!projectId) throw new BadRequest('projectId is required')

    return remove(id?.toString()!, `projects/${projectId}/participants`)
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
