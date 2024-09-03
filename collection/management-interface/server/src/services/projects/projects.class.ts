// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Project, ProjectData, ProjectPatch, ProjectQuery } from './projects.schema'
import { create, find, get, patch, remove } from '../../firebase'
import { Participant } from '../participants/participants.schema'

export type { Project, ProjectData, ProjectPatch, ProjectQuery }

export interface ProjectServiceOptions {
  app: Application
}

export interface ProjectParams extends Params<ProjectQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ProjectService<ServiceParams extends ProjectParams = ProjectParams>
  implements ServiceInterface<Project, ProjectData, ServiceParams, ProjectPatch>
{
  constructor(public options: ProjectServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Project[]> {
    const projects = await find<Project>('projects')
    return Promise.all(
      projects.map(async (project) => {
        const participants = await find<Participant>(`projects/${project.id}/participants`)
        return { ...project, participants }
      })
    )
  }

  async get(id: Id, _params?: ServiceParams): Promise<Project> {
    const project = await get<Project>(id, 'projects')
    const participants = await find<Participant>(`projects/${project.id}/participants`)
    return { ...project, participants }
  }

  async create(data: ProjectData, params?: ServiceParams): Promise<Project>
  async create(data: ProjectData[], params?: ServiceParams): Promise<Project[]>
  async create(data: ProjectData | ProjectData[], params?: ServiceParams): Promise<Project | Project[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)))
    }

    return create<Project>(data, 'projects')
  }

  async patch(id: NullableId, data: ProjectPatch, _params?: ServiceParams): Promise<Project> {
    return patch({ id, ...data }, 'projects')
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<Project> {
    return remove(id?.toString()!, 'projects')
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
