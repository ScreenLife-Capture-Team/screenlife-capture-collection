// For more information about this file see https://dove.feathersjs.com/guides/cli/client.html
import { feathers } from '@feathersjs/feathers'
import type { TransportConnection, Application } from '@feathersjs/feathers'
import authenticationClient from '@feathersjs/authentication-client'
import type { AuthenticationClientOptions } from '@feathersjs/authentication-client'

import { healthClient } from './services/health/health.shared'
export type { Health, HealthData, HealthQuery, HealthPatch } from './services/health/health.shared'

import { operationClient } from './services/operations/operations.shared'
export type {
  Operation,
  OperationData,
  OperationQuery,
  OperationPatch
} from './services/operations/operations.shared'

import { actionsClient } from './services/actions/actions.shared'
export type { Actions, ActionsData, ActionsQuery, ActionsPatch } from './services/actions/actions.shared'

import { registerClient } from './services/register/register.shared'
export type {
  Register,
  RegisterData,
  RegisterQuery,
  RegisterPatch
} from './services/register/register.shared'

import { participantClient } from './services/participants/participants.shared'
export type {
  Participant,
  ParticipantData,
  ParticipantQuery,
  ParticipantPatch
} from './services/participants/participants.shared'

import { projectClient } from './services/projects/projects.shared'
export type { Project, ProjectData, ProjectQuery, ProjectPatch } from './services/projects/projects.shared'

export interface Configuration {
  connection: TransportConnection<ServiceTypes>
}

export interface ServiceTypes {}

export type ClientApplication = Application<ServiceTypes, Configuration>

/**
 * Returns a typed client for the management-interface-server app.
 *
 * @param connection The REST or Socket.io Feathers client connection
 * @param authenticationOptions Additional settings for the authentication client
 * @see https://dove.feathersjs.com/api/client.html
 * @returns The Feathers client application
 */
export const createClient = <Configuration = any,>(
  connection: TransportConnection<ServiceTypes>,
  authenticationOptions: Partial<AuthenticationClientOptions> = {}
) => {
  const client: ClientApplication = feathers()

  client.configure(connection)
  client.configure(authenticationClient(authenticationOptions))
  client.set('connection', connection)

  client.configure(projectClient)
  client.configure(participantClient)
  client.configure(registerClient)
  client.configure(actionsClient)
  client.configure(operationClient)
  client.configure(healthClient)
  return client
}
