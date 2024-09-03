// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Register, RegisterData, RegisterPatch, RegisterQuery, RegisterService } from './register.class'

export type { Register, RegisterData, RegisterPatch, RegisterQuery }

export type RegisterClientService = Pick<
  RegisterService<Params<RegisterQuery>>,
  (typeof registerMethods)[number]
>

export const registerPath = 'register'

export const registerMethods: Array<keyof RegisterService> = ['create']

export const registerClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(registerPath, connection.service(registerPath), {
    methods: registerMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [registerPath]: RegisterClientService
  }
}
