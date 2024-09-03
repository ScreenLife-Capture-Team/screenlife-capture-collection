// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Operation,
  OperationData,
  OperationPatch,
  OperationQuery,
  OperationService
} from './operations.class'

export type { Operation, OperationData, OperationPatch, OperationQuery }

export type OperationClientService = Pick<
  OperationService<Params<OperationQuery>>,
  (typeof operationMethods)[number]
>

export const operationPath = 'operations'

export const operationMethods: Array<keyof OperationService> = ['find', 'get', 'create', 'patch', 'remove']

export const operationClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(operationPath, connection.service(operationPath), {
    methods: operationMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [operationPath]: OperationClientService
  }
}
