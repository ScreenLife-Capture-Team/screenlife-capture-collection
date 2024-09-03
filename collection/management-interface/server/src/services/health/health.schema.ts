// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { HealthService } from './health.class'

// Main data model schema
export const healthSchema = Type.Object(
  {
    cloudFunctions: Type.Object({
      commonBaseUrl: Type.Optional(Type.String()),
      list: Type.Array(
        Type.Object({
          name: Type.Union([
            Type.Literal('verifyRegistration'),
            Type.Literal('submitManifest'),
            Type.Literal('checkManifest')
          ]),
          detected: Type.Boolean(),
          reachable: Type.Boolean(),
          url: Type.Optional(Type.String())
        })
      )
    }),
    datastore: Type.Object({
      id: Type.String(),
      reachable: Type.Boolean()
    }),
    storage: Type.Object({
      projectId: Type.String(),
      bucketId: Type.String(),
      reachable: Type.Boolean()
    })
  },
  { $id: 'Health', additionalProperties: false }
)
export type Health = Static<typeof healthSchema>
export const healthValidator = getValidator(healthSchema, dataValidator)
export const healthResolver = resolve<Health, HookContext<HealthService>>({})

export const healthExternalResolver = resolve<Health, HookContext<HealthService>>({})

// Schema for creating new entries
export const healthDataSchema = Type.Pick(healthSchema, [], {
  $id: 'HealthData'
})
export type HealthData = Static<typeof healthDataSchema>
export const healthDataValidator = getValidator(healthDataSchema, dataValidator)
export const healthDataResolver = resolve<Health, HookContext<HealthService>>({})

// Schema for updating existing entries
export const healthPatchSchema = Type.Partial(healthSchema, {
  $id: 'HealthPatch'
})
export type HealthPatch = Static<typeof healthPatchSchema>
export const healthPatchValidator = getValidator(healthPatchSchema, dataValidator)
export const healthPatchResolver = resolve<Health, HookContext<HealthService>>({})

// Schema for allowed query properties
export const healthQueryProperties = Type.Pick(healthSchema, [])
export const healthQuerySchema = Type.Intersect(
  [
    querySyntax(healthQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type HealthQuery = Static<typeof healthQuerySchema>
export const healthQueryValidator = getValidator(healthQuerySchema, queryValidator)
export const healthQueryResolver = resolve<HealthQuery, HookContext<HealthService>>({})
