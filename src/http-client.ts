import { URL } from "node:url"
import https from "node:https"
import http from "node:http"

import { ClientFetchManyOptions, ClientInterface, ClientRequestOptions } from "./interfaces"
import { BaseClient, BaseClientOptions } from "./base-client"
import { FaliedAttempt, HttpResponse } from "./http-response"
import { delay } from "./utils/delay"

export type HttpClientProxy = string

export type HttpClientOptions = BaseClientOptions<HttpClientProxy> & {}

export type HttpClientRequestOptions = http.RequestOptions & ClientRequestOptions & {
    url: string
    redirectCount?: number
    followRedirects?: boolean
}

export type HttpClientFetchOptions = HttpClientRequestOptions

export type HttpFetchManyOptions = ClientFetchManyOptions<HttpClientRequestOptions>

export class HttpClient extends BaseClient<HttpClientProxy> implements ClientInterface {
    constructor(options: HttpClientOptions = {}) {
        super(options)
    }

    fetch({
        maxRetries = 0,
        retries = 0,
        retryDelay,
        method = "GET",
        redirectCount = 0,
        followRedirects = true,
        ...options
    }: HttpClientFetchOptions): Promise<HttpResponse> {
        const failedAttempts: FaliedAttempt[] = []

        const attemptRequest = async (currentRetry: number): Promise<HttpResponse> => {
            try {
                return new Promise((resolve, reject) => {
                    const url = this.currentProxyUrl ? `${this.currentProxyUrl}${options.url}` : options.url
                    const urlObject = new URL(url)
                    
                    const lib = urlObject.protocol === "http:" ? http : https

                    const request = lib.request(urlObject, options, (res) => {
                        let data = ""

                        if (followRedirects && [301, 302, 303, 307, 308].includes(res.statusCode!) && res.headers.location) {
                            if (redirectCount >= 5) {
                                return reject(new Error("Too many redirects"))
                            }

                            const newUrl = new URL(res.headers.location, urlObject).href

                            return resolve(
                                this.fetch({
                                    ...options,
                                    url: newUrl,
                                    redirectCount: redirectCount + 1
                                })
                            )
                        }
                        
                        res.on("data", (chunk) => data += chunk)
        
                        res.on("end", () => resolve(
                            new HttpResponse({
                                body: data,
                                headers: res.headers,
                                status: res.statusCode || 200,
                                statusText: res.statusMessage || "ok",
                                attempts: currentRetry + 1,
                                failedAttempts: failedAttempts,
                            })
                        ))
                    })
        
                    request.on("error", reject)
        
                    request.end()
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
                    failedAttempts,
                })
            }
        }

        return attemptRequest(retries)
    }

    async fetchMany({ requests, concurrency, requestDelay }: HttpFetchManyOptions): Promise<HttpResponse[]> {
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