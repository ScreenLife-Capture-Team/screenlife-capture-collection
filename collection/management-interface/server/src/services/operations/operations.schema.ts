// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { OperationService } from './operations.class'

// Main data model schema
export const operationSchema = Type.Object(
  {
    id: Type.Number(),
    createdAt: Type.Number(),
    status: Type.Union([Type.Literal('queued'), Type.Literal('processing'), Type.Literal('completed')]),
    payload: Type.Union([
      Type.Object({
        action: Type.Literal('download'),
        params: Type.Union([
          Type.Object({ projectId: Type.String() }),
          Type.Object({ projectId: Type.String(), participantId: Type.String() }),
          Type.Object({ projectId: Type.String(), participantId: Type.String(), manifestId: Type.String() }),
          Type.Object({ projectId: Type.String(), participantId: Type.String(), dayTimestamp: Type.Number() })
        ])
      }),
      Type.Object({
        action: Type.Literal('decrypt'),
        params: Type.Union([
          Type.Object({ projectId: Type.String() }),
          Type.Object({ projectId: Type.String(), participantId: Type.String() }),
          Type.Object({ projectId: Type.String(), participantId: Type.String(), manifestId: Type.String() }),
          Type.Object({ projectId: Type.String(), participantId: Type.String(), dayTimestamp: Type.Number() })
        ])
      })
    ]),
    description: Type.String(),
    message: Type.Optional(Type.String()),
    details: Type.Optional(Type.String())
  },
  { $id: 'Operation', additionalProperties: false }
)
export type Operation = Static<typeof operationSchema>
export const operationValidator = getValidator(operationSchema, dataValidator)
export const operationResolver = resolve<Operation, HookContext<OperationService>>({
  payload: async (value) => JSON.parse(value as unknown as string)
})

export const operationExternalResolver = resolve<Operation, HookContext<OperationService>>({})

// Schema for creating new entries
export const operationDataSchema = Type.Pick(operationSchema, ['payload', 'description'], {
  $id: 'OperationData'
})
export type OperationData = Static<typeof operationDataSchema>
export const operationDataValidator = getValidator(operationDataSchema, dataValidator)
export const operationDataResolver = resolve<Operation, HookContext<OperationService>>({
  createdAt: async () => Date.now(),
  status: async () => 'queued' as const
})

// Schema for updating existing entries
export const operationPatchSchema = Type.Partial(operationSchema, {
  $id: 'OperationPatch'
})
export type OperationPatch = Static<typeof operationPatchSchema>
export const operationPatchValidator = getValidator(operationPatchSchema, dataValidator)
export const operationPatchResolver = resolve<Operation, HookContext<OperationService>>({})

// Schema for allowed query properties
export const operationQueryProperties = Type.Pick(operationSchema, ['id', 'createdAt', 'status'])
export const operationQuerySchema = Type.Intersect(
  [
    querySyntax(operationQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type OperationQuery = Static<typeof operationQuerySchema>
export const operationQueryValidator = getValidator(operationQuerySchema, queryValidator)
export const operationQueryResolver = resolve<OperationQuery, HookContext<OperationService>>({})
