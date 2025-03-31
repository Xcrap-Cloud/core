import { BaseClient, ClientInterface, ClientFetchOptions, ClientFetchManyOptions, BaseClientOptions, HttpResponse, FaliedAttempt, ClientRequestOptions, InvalidStatusCodeError, defaultUserAgent } from "./src"
import { delay } from "./src/utils/delay"

type FetchClientProxy = string

type FetchClientOptions = BaseClientOptions<FetchClientProxy>

type FetchClientFetchOptions = ClientFetchOptions & ClientRequestOptions & RequestInit & {
    url: string
}

type FetchClientFetchManyOptions = ClientFetchManyOptions<FetchClientFetchOptions>

export class FetchClient extends BaseClient<FetchClientProxy> implements ClientInterface {
    constructor(options: FetchClientOptions = {}) {
        super(options)
    }

    async fetch({
        maxRetries = 0,
        retries = 0,
        retryDelay,
        method = "GET",
        ...options
    }: FetchClientFetchOptions): Promise<HttpResponse> {
        const failedAttempts: FaliedAttempt[] = []

        const attemptRequest = async (currentRetry: number): Promise<HttpResponse> => {
            try {
                const url = this.currentProxyUrl ? `${this.currentProxyUrl}${options.url}` : options.url

                const response = await fetch(url, {
                    ...options,
                    method: method,
                    headers: {
                        ...options.headers,
                        "User-Agent": options.headers?.["User-Agent"] ?? this.userAgent ?? defaultUserAgent,
                    },
                })

                if (!this.isSuccess(response.status)) {
                    throw new InvalidStatusCodeError(response.status)
                }

                return new HttpResponse({
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    body: await response.text(),
                    attempts: currentRetry + 1,
                    failedAttempts: failedAttempts,
                })
                
            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error"
                failedAttempts.push({ error: errorMessage, timestamp: new Date() })

                if (currentRetry < maxRetries) {
                    if (retryDelay !== undefined && retryDelay > 0) {
                        await delay(retryDelay)
                    }

                    return await attemptRequest(currentRetry + 1)
                }

                return new HttpResponse({
                    status: error.response?.status || 500,
                    statusText: error.response?.statusText || "Request Failed",
                    body: error.response?.data || errorMessage,
                    headers: error.response?.headers || {},
                    attempts: currentRetry + 1,
                    failedAttempts: failedAttempts,
                })
            }
        }

        return attemptRequest(retries)
    }

    async fetchMany({ requests, concurrency, requestDelay }: FetchClientFetchManyOptions): Promise<HttpResponse[]> {
        const results: HttpResponse[] = []
        const executing: Promise<void>[] = []

        for (let i = 0; i < requests.length; i++) {
            const promise = this.executeRequest({
                request: requests[i],
                index: i,
                requestDelay: requestDelay,
                results: results
            }).then(() => undefined)

            executing.push(promise)

            if (this.shouldThrottle(executing, concurrency)) {
                await this.handleConcurrency(executing)
            }
        }

        await Promise.all(executing)

        return results
    }
}