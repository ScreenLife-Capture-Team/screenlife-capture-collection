// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  actionsDataValidator,
  actionsPatchValidator,
  actionsQueryValidator,
  actionsResolver,
  actionsExternalResolver,
  actionsDataResolver,
  actionsPatchResolver,
  actionsQueryResolver
} from './actions.schema'

import type { Application } from '../../declarations'
import { ActionsService, getOptions } from './actions.class'
import { actionsPath, actionsMethods } from './actions.shared'

export * from './actions.class'
export * from './actions.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const actions = (app: Application) => {
  // Register our service on the Feathers application
  app.use(actionsPath, new ActionsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: actionsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(actionsPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(actionsExternalResolver), schemaHooks.resolveResult(actionsResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(actionsQueryValidator), schemaHooks.resolveQuery(actionsQueryResolver)],
      // find: [],
      // get: [],
      create: [schemaHooks.validateData(actionsDataValidator), schemaHooks.resolveData(actionsDataResolver)]
      // patch: [schemaHooks.validateData(actionsPatchValidator), schemaHooks.resolveData(actionsPatchResolver)],
      // remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [actionsPath]: ActionsService
  }
}
