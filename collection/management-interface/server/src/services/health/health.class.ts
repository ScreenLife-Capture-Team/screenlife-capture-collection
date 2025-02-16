// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Health, HealthData, HealthPatch, HealthQuery } from './health.schema'

import { CloudFunctionsServiceClient } from '@google-cloud/functions'
import { ServicesClient } from '@google-cloud/run'
import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import { app } from '../../app'
import { URL } from 'url'

export type { Health, HealthData, HealthPatch, HealthQuery }

export interface HealthServiceOptions {
  app: Application
}

export interface HealthParams extends Params<HealthQuery> {
  ignoreError?: boolean
}

function getBaseUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.protocol}//${parsedUrl.host}`
  } catch (error) {
    throw new Error('Invalid URL')
  }
}

type CloudFunctions = Health['cloudFunctions']
type CloudFunctionName = Health['cloudFunctions']['list'][number]['name']

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class HealthService<ServiceParams extends HealthParams = HealthParams>
  implements ServiceInterface<Health, HealthData, ServiceParams, HealthPatch>
{
  constructor(public options: HealthServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Health> {
    const cloudFunctions: CloudFunctions['list'] = []
    let cloudFunctionBaseApiUrl = undefined
    try {
      const expectedFunctionNames = ['verifyRegistration', 'submitManifest', 'checkManifest'] as const
      for (const name of expectedFunctionNames)
        cloudFunctions.push({ name: name, detected: false, reachable: false, url: undefined })

      // Try 2nd gen functions first
      try {
        const client = new ServicesClient()
        const projectId = await client.getProjectId()
        const parent = `projects/${projectId}/locations/asia-southeast1`
        const [services] = await client.listServices({ parent })
        if (!services || services.length === 0) throw new Error('No Gen 2')

        for (const service of services) {
          const functionName = service.labels?.['goog-drz-cloudfunctions-id']?.toLowerCase() || null
          const urls = service.urls || []

          if (functionName && urls.length > 0) {
            const index = cloudFunctions.findIndex((cf) => cf.name.toLowerCase() === functionName)
            const url = urls.find((url) => url.includes('cloudfunctions.net'))
            if (index !== -1 && url) {
              try {
                const response = await fetch(url)
                cloudFunctions[index] = {
                  name: cloudFunctions[index].name,
                  detected: true,
                  reachable: response.status === 400,
                  url
                }
              } catch (err) {
                console.error(`Failed to reach function ${functionName} at ${url}:`, err)
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to check 2nd gen functions, falling back to 1st gen:', err)
        // Fall back to 1st gen functions
        const client = new CloudFunctionsServiceClient()
        const parent = `projects/${await client.getProjectId()}/locations/-`
        const [functions] = await client.listFunctions({ pageSize: 1000, parent })

        for (const func of functions) {
          if (func.entryPoint && cloudFunctions.find((cf) => cf.name === func.entryPoint)) {
            const url = func.httpsTrigger!.url!.toString()
            const response = await fetch(url)
            const success = response.status === 400

            const index = cloudFunctions.findIndex((cf) => cf.name === func.entryPoint)
            cloudFunctions[index] = {
              name: func.entryPoint as CloudFunctionName,
              detected: true,
              reachable: success,
              url
            }
          }
        }
      }

      const s = new Set<string>()
      for (const cf of cloudFunctions) s.add(cf.url ? getBaseUrl(cf.url) : '')
      if (s.size === 1 && !s.has('')) cloudFunctionBaseApiUrl = Array.from(s)[0] as string
    } catch (err: any) {
      console.error(err)
      _params!.ignoreError = true
      throw 'ERROR: WHILE LISTING CLOUD FUNCTIONS'
    }

    let datastore: undefined | Health['datastore']
    try {
      const db = new Firestore()
      await db.listCollections()
      datastore = { id: db.databaseId, reachable: true }
    } catch (err: any) {
      console.log('')
      console.error(err)
      _params!.ignoreError = true
      throw 'ERROR: WHILE CHECKING CLOUD DATASTORE'
    }

    let storage: undefined | Health['storage']
    try {
      const _storage = new Storage()
      const bucketId = app.get('bucketId')
      const [buckets] = await _storage.getBuckets({ prefix: bucketId })

      storage = {
        projectId: await _storage.getProjectId(),
        bucketId,
        reachable: !!buckets.length
      }
    } catch (err: any) {
      console.log('')
      console.error(err)
      _params!.ignoreError = true
      throw 'ERROR: WHILE CHECKING CLOUD BUCKET'
    }

    return {
      cloudFunctions: {
        list: cloudFunctions,
        commonBaseUrl: cloudFunctionBaseApiUrl
      },
      datastore,
      storage
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
