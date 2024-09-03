// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  participantDataValidator,
  participantPatchValidator,
  participantQueryValidator,
  participantResolver,
  participantExternalResolver,
  participantDataResolver,
  participantPatchResolver,
  participantQueryResolver
} from './participants.schema'

import type { Application } from '../../declarations'
import { ParticipantService, getOptions } from './participants.class'
import { participantPath, participantMethods } from './participants.shared'

export * from './participants.class'
export * from './participants.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const participant = (app: Application) => {
  // Register our service on the Feathers application
  app.use(participantPath, new ParticipantService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: participantMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(participantPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(participantExternalResolver),
        schemaHooks.resolveResult(participantResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(participantQueryValidator),
        schemaHooks.resolveQuery(participantQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(participantDataValidator),
        schemaHooks.resolveData(participantDataResolver)
      ]
      // patch: [
      //   schemaHooks.validateData(participantPatchValidator),
      //   schemaHooks.resolveData(participantPatchResolver)
      // ],
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
    [participantPath]: ParticipantService
  }
}
