import path from 'path'
import fs from 'fs'

const downloadsPath = './downloads'
const decryptedPath = './unzipped'

export const getDownloadedManifestsFolderPath = (projectId: string, participantId: string) =>
  path.join(downloadsPath, projectId, participantId)

export const getDownloadedManifestPath = (projectId: string, participantId: string, manifestId: string) =>
  path.join(downloadsPath, projectId, participantId, `${manifestId}.zip`)

export const getDecryptedManifestPath = (projectId: string, participantId: string, manifestId: string) =>
  path.join(decryptedPath, projectId, participantId, manifestId)

export const downloadedManifestExists = (projectId: string, participantId: string, manifestId: string) =>
  fs.existsSync(getDownloadedManifestPath(projectId, participantId, manifestId))

export const decryptedManifestExists = (projectId: string, participantId: string, manifestId: string) =>
  fs.existsSync(getDecryptedManifestPath(projectId, participantId, manifestId))

export const downloadedItemsCount = (projectId: string, participantId: string, manifestId: string) =>
  fs.existsSync(getDownloadedManifestPath(projectId, participantId, manifestId))
    ? fs.readdirSync(getDownloadedManifestPath(projectId, participantId, manifestId)).length
    : 0

export const decryptedItemsCount = (projectId: string, participantId: string, manifestId: string) =>
  fs.existsSync(getDecryptedManifestPath(projectId, participantId, manifestId))
    ? fs.readdirSync(getDecryptedManifestPath(projectId, participantId, manifestId)).length
    : 0
