// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Actions, ActionsData, ActionsPatch, ActionsQuery, ActionsService } from './actions.class'

export type { Actions, ActionsData, ActionsPatch, ActionsQuery }

export type ActionsClientService = Pick<ActionsService<Params<ActionsQuery>>, (typeof actionsMethods)[number]>

export const actionsPath = 'actions'

export const actionsMethods: Array<keyof ActionsService> = ['create']

export const actionsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(actionsPath, connection.service(actionsPath), {
    methods: actionsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [actionsPath]: ActionsClientService
  }
}
