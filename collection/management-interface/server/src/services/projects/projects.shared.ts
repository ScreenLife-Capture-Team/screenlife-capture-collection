// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Project, ProjectData, ProjectPatch, ProjectQuery, ProjectService } from './projects.class'

export type { Project, ProjectData, ProjectPatch, ProjectQuery }

export type ProjectClientService = Pick<ProjectService<Params<ProjectQuery>>, (typeof projectMethods)[number]>

export const projectPath = 'projects'

export const projectMethods: Array<keyof ProjectService> = ['find', 'get', 'create', 'patch', 'remove']

export const projectClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(projectPath, connection.service(projectPath), {
    methods: projectMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [projectPath]: ProjectClientService
  }
}
