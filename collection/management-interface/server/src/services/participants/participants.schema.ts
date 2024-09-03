// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ParticipantService } from './participants.class'

// Main data model schema
export const participantSchema = Type.Object(
  {
    id: Type.String(),
    verified: Type.Boolean(),
    manifests: Type.Optional(
      Type.Array(
        Type.Object({
          id: Type.String(),
          hash: Type.String(),
          status: Type.Union([Type.Literal('active'), Type.Literal('finished')]),
          createdAt: Type.Number(),
          imagesNum: Type.Optional(Type.Number()),

          downloaded: Type.Optional(Type.Boolean()),
          decryptedNum: Type.Optional(Type.Number())
        })
      )
    ),
    deviceMeta: Type.Optional(Type.String())
  },
  { $id: 'Participant', additionalProperties: false }
)
export type Participant = Static<typeof participantSchema>
export const participantValidator = getValidator(participantSchema, dataValidator)
export const participantResolver = resolve<Participant, HookContext<ParticipantService>>({})

export const participantExternalResolver = resolve<Participant, HookContext<ParticipantService>>({})

// Schema for creating new entries
export const participantDataSchema = Type.Pick(participantSchema, ['id'], {
  $id: 'ParticipantData'
})
export type ParticipantData = Static<typeof participantDataSchema>
export const participantDataValidator = getValidator(participantDataSchema, dataValidator)
export const participantDataResolver = resolve<Participant, HookContext<ParticipantService>>({
  verified: async () => false
})

// Schema for updating existing entries
export const participantPatchSchema = Type.Partial(participantSchema, {
  $id: 'ParticipantPatch'
})
export type ParticipantPatch = Static<typeof participantPatchSchema>
export const participantPatchValidator = getValidator(participantPatchSchema, dataValidator)
export const participantPatchResolver = resolve<Participant, HookContext<ParticipantService>>({})

// Schema for allowed query properties
export const participantQueryProperties = Type.Pick(participantSchema, ['id'])
export const participantQuerySchema = Type.Intersect(
  [
    querySyntax(participantQueryProperties),
    // Add additional query properties here
    Type.Object(
      {
        projectId: Type.String()
      },
      { additionalProperties: false }
    )
  ],
  { additionalProperties: false }
)
export type ParticipantQuery = Static<typeof participantQuerySchema>
export const participantQueryValidator = getValidator(participantQuerySchema, queryValidator)
export const participantQueryResolver = resolve<ParticipantQuery, HookContext<ParticipantService>>({})
