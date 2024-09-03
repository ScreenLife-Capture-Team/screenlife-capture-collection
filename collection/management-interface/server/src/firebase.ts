import { BadRequest } from '@feathersjs/errors'
import { Id } from '@feathersjs/feathers'
import { Firestore } from '@google-cloud/firestore'

const db = new Firestore()

const exists = async (id: Id | undefined | null, servicePath: string) => {
  if (!id) throw new BadRequest('Id is required')

  const docRef = db.doc(`${servicePath}/${id.toString()}`)
  const doc = await docRef.get()

  return doc.exists
}

const get = async <T>(id: Id | undefined | null, servicePath: string) => {
  if (!id) throw new BadRequest('Id is required')

  const docRef = db.doc(`${servicePath}/${id.toString()}`)
  const doc = await docRef.get()

  if (!doc.exists) throw new BadRequest(`Cannot find ${id.toString()}`)

  return { ...doc.data(), id } as T
}

const find = async <T>(servicePath: string) => {
  const colRef = db.collection(`${servicePath}`)

  const docs = await colRef.listDocuments()

  return (await Promise.all(docs.map(async (doc) => await doc.get())))
    .filter((doc) => doc.exists)
    .map((doc) => ({ ...doc.data(), id: doc.id })) as T[]
}

const create = async <T>(data: { id: string } & any, servicePath: string) => {
  const { id, ...rest } = data
  if (!id) throw new BadRequest('Id is required for create')

  const docRef = db.doc(`${servicePath}/${id.toString()}`)
  const doc = await docRef.get()

  if (doc.exists) throw new BadRequest(`Document with id ${id} already exists`)
  await docRef.set({ ...rest })

  const updatedDoc = await docRef.get()

  return updatedDoc.data() as T
}

const patch = async <T>(data: { id: string } & any, servicePath: string) => {
  const { id, ...rest } = data
  if (!id) throw new BadRequest('Id is required for create')

  const docRef = db.doc(`${servicePath}/${id.toString()}`)
  const doc = await docRef.get()

  if (!doc.exists) throw new BadRequest(`Document with id ${id} does not exists`)
  await docRef.set({ ...rest })

  const updatedDoc = await docRef.get()

  return updatedDoc.data() as T
}

const remove = async <T>(id: string, servicePath: string) => {
  if (!id) throw new BadRequest('Id is required for create')

  const docRef = db.doc(`${servicePath}/${id.toString()}`)
  const doc = await docRef.get()

  if (!doc.exists) throw new BadRequest(`Document with id ${id} does not exists`)
  await docRef.delete()

  return doc.data() as T
}

export { get, find, create, exists, patch, remove }
