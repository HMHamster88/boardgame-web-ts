import os from 'os'
import type { ServerInfo } from 'boardgame-web-common/back'

const virtualInterfaceMarkers = [
    'virtual',
    'vbox',
    'vmware',
    'docker',
    'wsl',
    'hyper-v',
    'vethernet',
    'host-only',
    'tailscale',
    'vpn',
    'tun',
    'tap'
]

function isPrivateIPv4(address: string): boolean {
    const parts = address.split('.').map(Number)
    if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
        return false
    }
    const first = parts[0]!
    const second = parts[1]!
    return first === 10
        || (first === 172 && second >= 16 && second <= 31)
        || (first === 192 && second === 168)
}

function isVirtualInterface(interfaceName: string): boolean {
    const name = interfaceName.toLowerCase()
    return virtualInterfaceMarkers.some(marker => name.includes(marker))
}

function interfacePriority(interfaceName: string): number {
    const name = interfaceName.toLowerCase()
    if (name.includes('wlan') || name.includes('wifi') || name.includes('wi-fi')) {
        return 0
    }
    if (name.startsWith('en') || name.startsWith('eth') || name.includes('ethernet')) {
        return 1
    }
    return 2
}

export function getLanUrls(port: string | number): string[] {
    const addresses: Array<{ interfaceName: string; address: string }> = []

    for (const [interfaceName, interfaces] of Object.entries(os.networkInterfaces())) {
        if (isVirtualInterface(interfaceName)) {
            continue
        }
        for (const network of interfaces ?? []) {
            if (String(network.family) !== 'IPv4' || network.internal || !isPrivateIPv4(network.address)) {
                continue
            }
            addresses.push({ interfaceName, address: network.address })
        }
    }

    addresses.sort((a, b) =>
        interfacePriority(a.interfaceName) - interfacePriority(b.interfaceName)
        || a.address.localeCompare(b.address)
    )

    return [...new Set(addresses.map(({ address }) => `http://${address}:${port}`))]
}

export function getPublicUrl(): string | null {
    const value = process.env.PUBLIC_URL?.trim()
    if (!value) {
        return null
    }
    const normalized = value.replace(/\/+$/, '')
    return /^https?:\/\//i.test(normalized) ? normalized : null
}

export function getServerInfo(port: string | number): ServerInfo {
    return {
        publicUrl: getPublicUrl(),
        lanUrls: getLanUrls(port)
    }
}
