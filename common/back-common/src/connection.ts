export type PeerFilter = (peerId: string) => boolean

export type DataMessageListener = (peerId: string, data: string) => void

export interface Connection {
    addDataMessageListener(listener: DataMessageListener): void
    send(peerId: string, message: string): void
    sendToAll(message: string, peerFiler: PeerFilter | undefined): void
}