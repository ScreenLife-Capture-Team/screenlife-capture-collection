import { health } from './health/health'
import { operation } from './operations/operations'
import { actions } from './actions/actions'
import { register } from './register/register'
import { participant } from './participants/participants'
import { project } from './projects/projects'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  app.configure(health)
  app.configure(operation)
  app.configure(actions)
  app.configure(register)
  app.configure(participant)
  app.configure(project)
  // All services will be registered here
}
