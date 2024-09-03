// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Register, RegisterData, RegisterPatch, RegisterQuery } from './register.schema'

import { generateKeyPairSync } from 'crypto'
import fs from 'fs'
import path from 'path'
import { logger } from '../../logger'
import { app } from '../../app'
import zlib from 'zlib'
import crypto from 'crypto'
import { BadRequest } from '@feathersjs/errors'

export type { Register, RegisterData, RegisterPatch, RegisterQuery }

export interface RegisterServiceOptions {
  app: Application
}

export interface RegisterParams extends Params<RegisterQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class RegisterService<ServiceParams extends RegisterParams = RegisterParams>
  implements ServiceInterface<Register, RegisterData, ServiceParams, RegisterPatch>
{
  constructor(public options: RegisterServiceOptions) {}

  async create(data: RegisterData, params?: ServiceParams): Promise<Register> {
    const { projectId, participantId } = data

    logger.info('Checking projectId..')
    const project = await app.service('projects').get(projectId)

    logger.info('Creating participant..')
    await app.service('participants').create({ id: participantId }, { query: { projectId } })

    logger.info('Generating key..')
    const key = crypto.randomBytes(32).toString('hex')

    const keysPath = './keys'
    const folderPath = path.join(keysPath, projectId)
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true })

    const filePath = path.join(folderPath, participantId)

    logger.info(`Writing to ${filePath}..`)
    fs.writeFileSync(filePath, key)

    logger.info('Done.')

    const health = await app.service('health').find()
    const url = health.cloudFunctions.commonBaseUrl

    if (!url) throw new BadRequest('No Common Base URL')

    const obj = {
      e: url,
      p: projectId,
      i: participantId,
      k: key
    }

    return {
      qrString: JSON.stringify(obj)
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
