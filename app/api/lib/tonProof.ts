import crypto from 'node:crypto'

import { Address } from '@ton/core'
import nacl from 'tweetnacl'

function sha256(buf: Buffer): Buffer {
  return crypto.createHash('sha256').update(buf).digest()
}

function u32le(n: number): Buffer {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(n >>> 0, 0)
  return b
}

function u64le(n: number): Buffer {
  const b = Buffer.alloc(8)
  const v = BigInt(n)
  b.writeBigUInt64LE(v, 0)
  return b
}

function i32be(n: number): Buffer {
  const b = Buffer.alloc(4)
  b.writeInt32BE(n | 0, 0)
  return b
}

function decodePublicKey(input: unknown): Buffer | null {
  if (typeof input !== 'string') return null
  const s = input.trim()
  if (!s) return null
  try {
    if (/^[0-9a-fA-F]{64}$/.test(s)) return Buffer.from(s, 'hex')
    const b = Buffer.from(s, 'base64')
    if (b.length === 32) return b
    return null
  } catch {
    return null
  }
}

function decodeSignature(input: unknown): Buffer | null {
  if (typeof input !== 'string') return null
  const s = input.trim()
  if (!s) return null
  try {
    const b = Buffer.from(s, 'base64')
    return b.length === 64 ? b : null
  } catch {
    return null
  }
}

export type TonProofInput = {
  timestamp: number
  domain: { lengthBytes?: number; value: string }
  signature: string
  payload: string
}

export function extractTonProof(input: unknown): TonProofInput | null {
  if (!input || typeof input !== 'object') return null
  const obj = input as Record<string, unknown>
  const proof = (obj.proof && typeof obj.proof === 'object' ? (obj.proof as Record<string, unknown>) : obj) as Record<
    string,
    unknown
  >

  const timestamp = typeof proof.timestamp === 'number' ? proof.timestamp : Number(proof.timestamp)
  const payload = typeof proof.payload === 'string' ? proof.payload : ''
  const signature = typeof proof.signature === 'string' ? proof.signature : ''
  const domainRaw = proof.domain
  const domainObj = domainRaw && typeof domainRaw === 'object' ? (domainRaw as Record<string, unknown>) : null
  const domainValue = domainObj && typeof domainObj.value === 'string' ? domainObj.value : ''
  const domainLen = domainObj && typeof domainObj.lengthBytes === 'number' ? domainObj.lengthBytes : undefined

  if (!Number.isFinite(timestamp) || timestamp <= 0) return null
  if (!payload || !signature || !domainValue) return null
  return { timestamp, payload, signature, domain: { lengthBytes: domainLen, value: domainValue } }
}

export function verifyTonProof(args: {
  walletAddress: string
  publicKey: unknown
  proof: TonProofInput
  expectedDomain: string
  maxSkewSeconds: number
  nowSeconds: number
}): { ok: true } | { ok: false; reason: string } {
  let addr: Address
  try {
    addr = Address.parse(args.walletAddress)
  } catch {
    return { ok: false, reason: 'invalid_address' }
  }

  const pub = decodePublicKey(args.publicKey)
  if (!pub) return { ok: false, reason: 'missing_public_key' }

  const sig = decodeSignature(args.proof.signature)
  if (!sig) return { ok: false, reason: 'invalid_signature_format' }

  const domain = args.proof.domain.value
  const expected = args.expectedDomain.trim().toLowerCase()
  if (expected && domain.trim().toLowerCase() !== expected) return { ok: false, reason: 'domain_mismatch' }

  const now = args.nowSeconds
  const ts = Math.floor(args.proof.timestamp)
  if (Math.abs(now - ts) > args.maxSkewSeconds) return { ok: false, reason: 'timestamp_out_of_range' }

  const domainBytes = Buffer.from(domain, 'utf8')
  const msg = Buffer.concat([
    Buffer.from('ton-proof-item-v2/', 'utf8'),
    i32be(addr.workChain),
    Buffer.from(addr.hash),
    u32le(domainBytes.length),
    domainBytes,
    u64le(ts),
    Buffer.from(args.proof.payload, 'utf8'),
  ])

  const msgHash = sha256(msg)
  const toSign = Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from('ton-connect', 'utf8'), msgHash])
  const signedHash = sha256(toSign)

  const ok = nacl.sign.detached.verify(new Uint8Array(signedHash), new Uint8Array(sig), new Uint8Array(pub))
  if (!ok) return { ok: false, reason: 'bad_signature' }
  return { ok: true }
}

