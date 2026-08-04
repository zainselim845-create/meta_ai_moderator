// Free 100% - Web Crypto API Encryption - $0

export async function encryptFree(text: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode((process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'domya-32-chars-encryption-key!@#').slice(0,32)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode('domya-salt-v1'), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text))
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  })
}

export async function decryptFree(encryptedStr: string): Promise<string> {
  const { iv, data } = JSON.parse(encryptedStr)
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode((process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'domya-32-chars-encryption-key!@#').slice(0,32)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode('domya-salt-v1'), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, new Uint8Array(data))
  return dec.decode(decrypted)
}
