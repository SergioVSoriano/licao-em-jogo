import { firebaseConfigured, firebaseNet } from './firebase'
import { localNet } from './local'
import type { Net } from './types'

export const net: Net = firebaseConfigured ? firebaseNet : localNet
export const isDemo = !firebaseConfigured
export type { HostTransport, PlayerTransport } from './types'
