// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { RegisterService } from './register.class'

// Main data model schema
export const registerSchema = Type.Object(
  {
    qrString: Type.String()
  },
  { $id: 'Register', additionalProperties: false }
)
export type Register = Static<typeof registerSchema>
export const registerValidator = getValidator(registerSchema, dataValidator)
export const registerResolver = resolve<Register, HookContext<RegisterService>>({})

export const registerExternalResolver = resolve<Register, HookContext<RegisterService>>({})

// Schema for creating new entries
export const registerDataSchema = Type.Object(
  {
    projectId: Type.String(),
    participantId: Type.String()
  },
  {
    $id: 'RegisterData'
  }
)
export type RegisterData = Static<typeof registerDataSchema>
export const registerDataValidator = getValidator(registerDataSchema, dataValidator)
export const registerDataResolver = resolve<Register, HookContext<RegisterService>>({})

// Schema for updating existing entries
export const registerPatchSchema = Type.Partial(registerSchema, {
  $id: 'RegisterPatch'
})
export type RegisterPatch = Static<typeof registerPatchSchema>
export const registerPatchValidator = getValidator(registerPatchSchema, dataValidator)
export const registerPatchResolver = resolve<Register, HookContext<RegisterService>>({})

// Schema for allowed query properties
export const registerQueryProperties = Type.Pick(registerSchema, [])
export const registerQuerySchema = Type.Intersect(
  [
    querySyntax(registerQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type RegisterQuery = Static<typeof registerQuerySchema>
export const registerQueryValidator = getValidator(registerQuerySchema, queryValidator)
export const registerQueryResolver = resolve<RegisterQuery, HookContext<RegisterService>>({})
