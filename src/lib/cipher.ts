import crypto from 'node:crypto'

const ENCRYPTION_PASSWORD = process.env.WALLET_ENCRYPTION_PASSWORD

export function encryptPrivateKey(privateKey: string) {
  if (!ENCRYPTION_PASSWORD) {
    throw new Error('WALLET_ENCRYPTION_PASSWORD is not provided in .env')
  }
  const salt = crypto.randomBytes(16)
  const key = crypto.pbkdf2Sync(ENCRYPTION_PASSWORD, salt, 100000, 32, 'sha256')

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  let encrypted = cipher.update(privateKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  const combined =
    salt.toString('hex') +
    iv.toString('hex') +
    authTag.toString('hex') +
    encrypted

  return combined
}

export function decryptPrivateKey(encrypted: string) {
  if (!ENCRYPTION_PASSWORD) {
    throw new Error('WALLET_ENCRYPTION_PASSWORD is not provided in .env')
  }
  try {
    const salt = Buffer.from(encrypted.slice(0, 32), 'hex')
    const iv = Buffer.from(encrypted.slice(32, 64), 'hex')
    const authTag = Buffer.from(encrypted.slice(64, 96), 'hex')
    const encryptedData = encrypted.slice(96)

    const key = crypto.pbkdf2Sync(
      ENCRYPTION_PASSWORD,
      salt,
      100000,
      32,
      'sha256',
    )

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch {
    throw new Error('Failed to decrypt private key')
  }
}
