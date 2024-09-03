import crypto from 'crypto'
import fs from 'fs'

export const createMD5 = (filePath: string) => {
  return new Promise((res, rej) => {
    const hash = crypto.createHash('md5')

    const rStream = fs.createReadStream(filePath)
    rStream.on('data', (data) => {
      hash.update(data)
    })
    rStream.on('end', () => {
      res(hash.digest('base64'))
    })
  })
}
