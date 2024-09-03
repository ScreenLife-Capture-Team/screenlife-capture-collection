// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Participant,
  ParticipantData,
  ParticipantPatch,
  ParticipantQuery,
  ParticipantService
} from './participants.class'

export type { Participant, ParticipantData, ParticipantPatch, ParticipantQuery }

export type ParticipantClientService = Pick<
  ParticipantService<Params<ParticipantQuery>>,
  (typeof participantMethods)[number]
>

export const participantPath = 'participants'

export const participantMethods: Array<keyof ParticipantService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const participantClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(participantPath, connection.service(participantPath), {
    methods: participantMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [participantPath]: ParticipantClientService
  }
}
