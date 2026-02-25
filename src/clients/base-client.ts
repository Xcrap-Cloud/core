import { HttpResponse } from "../http-response"
import { defaultUserAgent } from "../constants"
import { delay } from "../utils/delay"

export type ProxyUrlFuction = () => string
export type ProxyFunction<ProxyReturn = any> = () => ProxyReturn
export type UserAgentFunction = () => string

export type BaseClientOptions<Proxy> = {
    proxyUrl?: string | ProxyUrlFuction
    proxy?: Proxy | ProxyFunction<Proxy>
    userAgent?: string | UserAgentFunction
}

export type ExecuteRequestOptions = {
    request: any
    index: number
    requestDelay?: number
    results: HttpResponse[]
}
export class BaseClient<Proxy> {
    public readonly proxy?: Proxy | ProxyFunction<Proxy>
    public readonly userAgent?: string | UserAgentFunction
    public readonly proxyUrl?: string | ProxyUrlFuction

    public constructor({ proxy, userAgent, proxyUrl }: BaseClientOptions<Proxy>) {
        this.proxy = proxy
        this.userAgent = userAgent ?? defaultUserAgent
        this.proxyUrl = proxyUrl
    }

    protected get currentProxyUrl(): string | undefined {
        const currentProxyUrl = typeof this.proxyUrl === "function" ? this.proxyUrl() : this.proxyUrl

        return currentProxyUrl
    }

    protected get currentUserAgent(): string | undefined {
        const currentUserAgent = typeof this.userAgent === "function" ? this.userAgent() : this.userAgent

        return currentUserAgent
    }

    protected get currentProxy(): string | ReturnType<ProxyFunction<Proxy>> | undefined {
        const currentProxy = typeof this.proxy === "function" ? (this.proxy as ProxyFunction)() : this.proxy

        return currentProxy
    }

    protected shouldThrottle(executing: Promise<void>[], concurrency?: number): boolean {
        return concurrency !== undefined && executing.length >= concurrency
    }

    protected cleanCompletedPromises(executing: Promise<void>[]): void {
        for (let i = executing.length - 1; i >= 0; i--) {
            executing[i].then(() => executing.splice(i, 1)).catch(() => executing.splice(i, 1))
        }
    }

    protected async handleConcurrency(executing: Promise<void>[]): Promise<void> {
        await Promise.race(executing)
        this.cleanCompletedPromises(executing)
    }

    protected async executeRequest({ index, request, results, requestDelay }: ExecuteRequestOptions): Promise<void> {
        if (requestDelay !== undefined && requestDelay > 0 && index > 0) {
            await delay(requestDelay)
        }

        if ("fetch" in this && typeof this.fetch === "function") {
            results[index] = await this.fetch(request)
        }
    }

    protected isSuccess(statusCode: number): boolean {
        return statusCode >= 200 && statusCode < 300
    }
}
