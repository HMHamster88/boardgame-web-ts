import type { ServerInfo } from 'boardgame-web-common/back'

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

export function isLoopbackHost(hostname: string = window.location.hostname): boolean {
    return loopbackHosts.has(hostname)
}

function stripTrailingSlash(url: string): string {
    return url.replace(/\/+$/, '')
}

export async function fetchServerInfo(): Promise<ServerInfo | null> {
    try {
        const response = await fetch('/server-info', { cache: 'no-store' })
        if (!response.ok) {
            return null
        }
        return await response.json() as ServerInfo
    } catch {
        return null
    }
}

export async function resolveShareBaseUrl(
    origin: string = window.location.origin,
    hostname: string = window.location.hostname
): Promise<string> {
    const info = await fetchServerInfo()

    if (info?.publicUrl) {
        return stripTrailingSlash(info.publicUrl)
    }

    if (info && isLoopbackHost(hostname) && info.lanUrls.length > 0) {
        return stripTrailingSlash(info.lanUrls[0]!)
    }

    return origin
}

export function buildShareUrl(baseUrl: string, path: string): string {
    const normalizedBase = stripTrailingSlash(baseUrl)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return normalizedBase + normalizedPath
}
