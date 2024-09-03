// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'

import type { Application } from '../../declarations'
import type { Operation, OperationData, OperationPatch, OperationQuery } from './operations.schema'
import path from 'path'
import fs, { existsSync, write } from 'fs'
import yauzl from 'yauzl'
import { pipeline, Readable, Writable } from 'stream'
import crypto from 'crypto'
import { Storage } from '@google-cloud/storage'
import { app } from '../../app'
import {
  getDecryptedManifestPath,
  getDownloadedManifestPath,
  getDownloadedManifestsFolderPath
} from '../../util'
import { startOfDay } from 'date-fns'

export type { Operation, OperationData, OperationPatch, OperationQuery }

export interface OperationParams extends KnexAdapterParams<OperationQuery> {}

async function processStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''

    // Handle data chunks
    stream.on('data', (chunk) => {
      data += chunk.toString('hex')
    })

    // Handle stream end
    stream.on('end', () => {
      try {
        // Perform some action on the aggregated data
        // For example, print it out, parse JSON, etc.
        // console.log('Aggregated Data:', data)

        // Resolve the promise
        resolve(data)
      } catch (error) {
        // Handle any errors that occur during processing
        reject(error)
      }
    })

    // Handle stream errors
    stream.on('error', (error) => {
      reject(error)
    })
  })
}

async function decryptStream(
  readStream: Readable,
  key: Buffer,
  filename: string,
  writeStream: Writable
): Promise<void> {
  // const fname = filename.substring(10)
  // const ivBytes = crypto.createHash('sha1').update(fname).digest().toString('hex').slice(0, 7)

  const fileContents = await processStream(readStream)
  // console.log('fileContents', fileContents)

  const cipherText = fileContents.substring(0, fileContents.length - 32)
  const authTag = fileContents.substring(fileContents.length - 32)

  console.log('key', key.toString('hex'))
  console.log('fname', filename)
  console.log('authTag', authTag)
  const ivBytes = Buffer.from(filename.split('_')[2], 'hex')

  console.log('ivBytes', ivBytes.toString('hex'))

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBytes)
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  let decrypted = decipher.update(cipherText, 'hex', 'hex')

  // console.log('decrypted', decrypted)
  decrypted += decipher.final('hex')

  writeStream.write(Buffer.from(decrypted, 'hex'))

  // const decryptedStream = new Readable().wrap(readStream)
  // decryptedStream.pipe(decipher)

  // return decryptedStream

  // readStream.pipe(decipher).pipe(writeStream)
}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class OperationService<ServiceParams extends Params = OperationParams> extends KnexService<
  Operation,
  OperationData,
  OperationParams,
  OperationPatch
> {
  async execute(
    action: 'download' | 'decrypt',
    params:
      | { operationId: number; projectId: string }
      | { operationId: number; projectId: string; participantId: string }
      | { operationId: number; projectId: string; participantId: string; dayTimestamp: number }
      | { operationId: number; projectId: string; participantId: string; manifestId: string }
  ) {
    if ('manifestId' in params) {
      await app.service('operations').patch(params.operationId, { status: 'processing' })
      await this.downloadSingle(params)
      await app.service('operations').patch(params.operationId, { status: 'completed' })
    }

    const participants =
      'participantId' in params
        ? [
            await app
              .service('participants')
              .get(params.participantId, { query: { projectId: params.projectId } })
          ]
        : await app.service('participants').find({ query: { projectId: params.projectId } })

    await app.service('operations').patch(params.operationId, { status: 'processing' })
    for (const participant of participants) {
      const manifests =
        participant.manifests
          ?.filter((m) => m.status === 'finished')
          .filter((m) =>
            'dayTimestamp' in params ? startOfDay(m.createdAt).getTime() === params.dayTimestamp : true
          ) || []

      for (const manifest of manifests) {
        await this.executeSingle(action, {
          projectId: params.projectId,
          participantId: participant.id,
          manifestId: manifest.id
        })
      }
    }
    await app.service('operations').patch(params.operationId, { status: 'completed' })
  }

  async executeSingle(
    action: 'download' | 'decrypt',
    params: { projectId: string; participantId: string; manifestId: string }
  ) {
    if (action === 'download') return this.downloadSingle(params)
    if (action === 'decrypt') return this.decryptSingle(params)
  }

  async downloadSingle(params: { projectId: string; participantId: string; manifestId: string }) {
    const destFolderPath = getDownloadedManifestsFolderPath(params.projectId, params.participantId)
    const destFilePath = getDownloadedManifestPath(params.projectId, params.participantId, params.manifestId)
    if (!fs.existsSync(destFolderPath)) fs.mkdirSync(destFolderPath, { recursive: true })
    console.log('downloading to', destFilePath)

    const storage = new Storage()
    await storage
      .bucket(app.get('bucketId'))
      .file(`${params.projectId}/${params.participantId}/${params.manifestId}.zip`)
      .download({
        destination: destFilePath
      })
  }

  async decryptSingle(params: { projectId: string; participantId: string; manifestId: string }) {
    const unzippedPath = getDecryptedManifestPath(params.projectId, params.participantId, params.manifestId)
    if (!fs.existsSync(unzippedPath)) fs.mkdirSync(unzippedPath, { recursive: true })

    const manifestPath = getDownloadedManifestPath(params.projectId, params.participantId, params.manifestId)
    console.log('decrypting to', unzippedPath)

    const key = Buffer.from(
      fs.readFileSync(path.join('./keys', params.projectId, params.participantId), 'utf-8').trim(),
      'hex'
    )

    yauzl.open(manifestPath, { lazyEntries: true }, function (err, zipfile) {
      if (err) throw err
      zipfile.readEntry()
      zipfile.on('entry', function (entry) {
        console.log('ENTRY', manifestPath, entry.fileName, /\/$/.test(entry.fileName))
        if (/\/$/.test(entry.fileName)) {
          // Directory file names end with '/'.
          // Note that entries for directories themselves are optional.
          // An entry's fileName implicitly requires its parent directories to exist.
          zipfile.readEntry()
        } else {
          // file entry
          const f = fs.createWriteStream(path.join(unzippedPath, entry.fileName))
          zipfile.openReadStream(entry, function (err, readStream) {
            if (err) throw err
            readStream.on('end', function () {
              console.log('-ended', entry.fileName)
              // f.close()
              zipfile.readEntry()
            })
            readStream.on('error', function (err) {
              console.error('ERROR', err)
            })

            decryptStream(readStream, key, entry.fileName, f)

            // const decryptedStream = decryptStream(readStream, key, entry.fileName)
            // pipeline(decryptedStream, f, (err) => {
            //   if (err) {
            //     console.error(err)
            //   } else {
            //     console.log('piping decryption...')
            //   }
            // })
          })
        }
      })
    })
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'operations'
  }
}
