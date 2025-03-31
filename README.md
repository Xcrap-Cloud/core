# 🕷️ Xcrap Core

**Xcrap Core** is the package that encompasses some essential items of the Web Scraping framework **Xcrap**, such as:

- `ClientInterface` interface so you know what an HTTP client should look like and implement;
- `BaseClient` class so you can extend and create your own HTTP clients;
- `HttpClient` class which is an implementation of an HTTP client using Node Core;
- `Randomizer` class to randomize values ​​such as UserAgents, Proxies and Proxy URLs;
- `Rotator` to rotate values ​​such as UserAgets, Proxies and Proxy URLs;
- `StaticPaginator` to handle calculable pagination URLs;

---
## 📦 Installation

For installation, there are no secrets, use the dependency manager of your preference. Here is an example of what it would look like using NPM:

```
npm i @xcrap/core @xcrap/parser
```

You need to install `@xcrap/parser` as well because I left it as `peerDependency`, which means that the `@xcrap/core` package needs `@xcrap/parser` as a dependency, but it will use whatever the user has installed in the project.

---

## 🚀 Usage

### Creating a custom HTTP client

```ts
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
```

### Using HttpClient

`HttpClient` is an implementation that uses Node Core under the hood, that is, the `node:http` and `node:https` modules.

Like any HTTP client, it has two methods: `fetch()` to make a request for a specific URL and `fetchMany()` to make requests for multiple URLs at the same time, being able to control concurrency and delays between requests.

#### Usage example

```ts
import { HttpClient } from "@xcrap/core"
import { extract } from "@xcrap/parser"

;(async() => { 
    const client = new HttpClient() 
    const url = "https://example.com" 
    const response = await client.fetch({ url: url }) 
    const parser = response.asHtmlParser() 
    const pageTitle = await parser.parseFist({ query: "title", extractor: extract("innerText") }) 

    console.log("Page Title:", pageTitle)
})();
```

#### Adding a proxy

In an HTTP client that extends from `BaseClient` we can add a proxy in the constructor as we can see in the following example:

```ts
```

#### Using a custom User Agent

In a client that extends from `BaseClient` we can also customize the `User-Agent` of the requests. We can do this in two ways:

1. **By providing a `userAgent` string:

```ts
const client = new HttpClient({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36" })
```

2. **By providing a function that will generate a `userAgent`:**

```ts
function randomUserAgent() {
    const userAgents = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 9_8_4; like Mac OS X) AppleWebKit/603.37 (KHTML, like Gecko) Chrome/54.0.1244.188 Mobile Safari/601.5", "Mozilla/5.0 (Windows NT 10.3;; en-US) AppleWebKit/537.35 (KHTML, like Gecko) Chrome/47.0.1707.185 Safari/601"
    ]

    const randomIndex = Math.floor(Math.random() * userAgents.length)

    return userAgents[randomIndex]
}

const client = new HttpClient({ userAgent: randomUserAgent })
```

#### Using custom Proxy URL

In a client that extends `BaseClient` we can use proxy URLs, I don't know how to explain to you how they work, but I kind of discovered this kind of porxy when I was trying to solve the CORS problem by making a request on the client side, and then I met the *CORS Proxy*. Here I have a [template](https://gist.github.com/marcuth/9fbd321b011da44d1287faae31a8dd3a) for one for CloudFlare Workers in case you want to roll your own.

Well, we can do it the same way we did with `userAgent`:

1. **Providing a `proxyUrl` string:

```ts
const client = new HttpClient({ proxyUrl: "https://my-proxy-app.my-username.workers.dev" })
```

2. **Providing a function that will generate a `proxyUrl`:**

```ts
function randomProxyUrl() {
    const proxyUrls = [
        "https://my-proxy-app.my-username-1.workers.dev",
        "https://my-proxy-app.my-username-2.workers.dev"
    ]

    const randomIndex = Math.floor(Math.random() * proxyUrls.length)

    return proxyUrls[randomIndex]
}

const client = new HttpClient({ proxyUrl: randomProxyUrl })
```