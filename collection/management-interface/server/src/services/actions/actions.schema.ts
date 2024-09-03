// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ActionsService } from './actions.class'

// Main data model schema
export const actionsSchema = Type.Object(
  {
    action: Type.Union([
      Type.Object({
        type: Type.Literal('download-for-participant'),
        projectId: Type.String(),
        participantId: Type.String()
      }),
      Type.Object({
        type: Type.Literal('unzip-decrypt-for-participant'),
        projectId: Type.String(),
        participantId: Type.String()
      })
    ])
  },
  { $id: 'Actions', additionalProperties: false }
)
export type Actions = Static<typeof actionsSchema>
export const actionsValidator = getValidator(actionsSchema, dataValidator)
export const actionsResolver = resolve<Actions, HookContext<ActionsService>>({})

export const actionsExternalResolver = resolve<Actions, HookContext<ActionsService>>({})

// Schema for creating new entries
export const actionsDataSchema = Type.Pick(actionsSchema, ['action'], {
  $id: 'ActionsData'
})
export type ActionsData = Static<typeof actionsDataSchema>
export const actionsDataValidator = getValidator(actionsDataSchema, dataValidator)
export const actionsDataResolver = resolve<Actions, HookContext<ActionsService>>({})

// Schema for updating existing entries
export const actionsPatchSchema = Type.Partial(actionsSchema, {
  $id: 'ActionsPatch'
})
export type ActionsPatch = Static<typeof actionsPatchSchema>
export const actionsPatchValidator = getValidator(actionsPatchSchema, dataValidator)
export const actionsPatchResolver = resolve<Actions, HookContext<ActionsService>>({})

// Schema for allowed query properties
export const actionsQueryProperties = Type.Pick(actionsSchema, [])
export const actionsQuerySchema = Type.Intersect(
  [
    querySyntax(actionsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ActionsQuery = Static<typeof actionsQuerySchema>
export const actionsQueryValidator = getValidator(actionsQuerySchema, queryValidator)
export const actionsQueryResolver = resolve<ActionsQuery, HookContext<ActionsService>>({})
