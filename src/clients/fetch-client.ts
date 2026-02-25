import { ClientFetchManyOptions, ClientInterface, ClientRequestOptions } from "../interfaces"
import { FaliedAttempt, HttpResponse } from "../http-response"
import { BaseClient, BaseClientOptions } from "./base-client"
import { InvalidStatusCodeError } from "../errors"
import { defaultUserAgent } from "../constants"
import { delay } from "../utils/delay"

export type FetchClientProxy = string

export type FetchClientOptions = BaseClientOptions<FetchClientProxy> & {}

export type FetchClientRequestOptions = RequestInit &
    ClientRequestOptions & {
        url: string
    }

export type FetchClientFetchOptions = FetchClientRequestOptions

export type FetchClientFetchManyOptions = ClientFetchManyOptions<FetchClientRequestOptions>

export class FetchClient extends BaseClient<FetchClientProxy> implements ClientInterface {
    constructor(options: FetchClientOptions = {}) {
        super(options)
    }

    fetch({
        maxRetries = 0,
        retries = 0,
        retryDelay,
        method = "GET",
        ...options
    }: FetchClientRequestOptions): Promise<HttpResponse> {
        const failedAttempts: FaliedAttempt[] = []

        const attemptRequest = async (currentRetry: number): Promise<HttpResponse> => {
            try {
                const url = this.currentProxyUrl ? `${this.currentProxyUrl}${options.url}` : options.url

                const response = await fetch(url, {
                    ...options,
                    method: method,
                    headers: {
                        ...options.headers,
                        "User-Agent":
                            (options.headers as any)?.["User-Agent"] ?? this.currentUserAgent ?? defaultUserAgent,
                    },
                })

                if (!this.isSuccess(response.status)) {
                    throw new InvalidStatusCodeError(response.status)
                }

                // Convert Headers to Record<string, string>
                const headers: Record<string, string> = {}
                response.headers.forEach((value, key) => {
                    headers[key] = value
                })

                return new HttpResponse({
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers,
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
                results: results,
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
