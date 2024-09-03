// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  operationDataValidator,
  operationPatchValidator,
  operationQueryValidator,
  operationResolver,
  operationExternalResolver,
  operationDataResolver,
  operationPatchResolver,
  operationQueryResolver
} from './operations.schema'

import type { Application, HookContext } from '../../declarations'
import { Operation, OperationService, getOptions } from './operations.class'
import { operationPath, operationMethods } from './operations.shared'

export * from './operations.class'
export * from './operations.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const operation = (app: Application) => {
  // Register our service on the Feathers application
  app.use(operationPath, new OperationService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: operationMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(operationPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(operationExternalResolver),
        schemaHooks.resolveResult(operationResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(operationQueryValidator),
        schemaHooks.resolveQuery(operationQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(operationDataValidator),
        schemaHooks.resolveData(operationDataResolver)
      ],
      patch: [
        schemaHooks.validateData(operationPatchValidator),
        schemaHooks.resolveData(operationPatchResolver)
      ],
      remove: []
    },
    after: {
      all: [],
      create: [
        async (context: HookContext) => {
          const operation = (await context.result) as Operation
          const payload = JSON.parse(operation.payload as unknown as string) as Operation['payload']

          app.service('operations').execute(payload.action, { ...payload.params, operationId: operation.id })
        }
      ]
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [operationPath]: OperationService
  }
}
