// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  registerDataValidator,
  registerPatchValidator,
  registerQueryValidator,
  registerResolver,
  registerExternalResolver,
  registerDataResolver,
  registerPatchResolver,
  registerQueryResolver
} from './register.schema'

import type { Application } from '../../declarations'
import { RegisterService, getOptions } from './register.class'
import { registerPath, registerMethods } from './register.shared'

export * from './register.class'
export * from './register.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const register = (app: Application) => {
  // Register our service on the Feathers application
  app.use(registerPath, new RegisterService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: registerMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(registerPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(registerExternalResolver),
        schemaHooks.resolveResult(registerResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(registerQueryValidator),
        schemaHooks.resolveQuery(registerQueryResolver)
      ],
      create: [schemaHooks.validateData(registerDataValidator), schemaHooks.resolveData(registerDataResolver)]
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
    [registerPath]: RegisterService
  }
}
