# 🕷️ Xcrap Core

**Xcrap Core** is the package that includes some essential items of the **Xcrap** Web Scraping framework, such as:

- `ClientInterface` interface to help you understand how to implement an HTTP client;
- `BaseClient` class to extend and create your own HTTP clients;
- `HttpClient` class, which is an HTTP client implementation using Node Core;
- `Randomizer` class to randomize values like UserAgents, Proxies, and Proxy URLs;
- `Rotator` to rotate values such as UserAgents, Proxies, and Proxy URLs;
- `StaticPaginator` to handle calculable pagination URLs;

---
## 📦 Installation

For installation, there are no secrets, just use your preferred dependency manager. Here's an example using NPM:

```
npm i @xcrap/core @xcrap/parser
```

> You need to install `@xcrap/parser` as well because I left it as a `peerDependency`, which means the `@xcrap/core` package needs `@xcrap/parser` as a dependency, but it will use whatever version the user has installed in their project.

---

## 🚀 Usage

### Creating a Custom HTTP Client

```ts
import {
    BaseClient,
    ClientInterface,
    ClientFetchOptions,
    ClientFetchManyOptions,
    BaseClientOptions,
    HttpResponse,
    FaliedAttempt,
    ClientRequestOptions,
    InvalidStatusCodeError,
    defaultUserAgent,
    delay
} from "@xcrap/core"

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

### Using the HttpClient

The `HttpClient` is an implementation that uses Node Core underneath, meaning the `node:http` and `node:https` modules.

Like any HTTP client, it has two methods: `fetch()` to make a request to a specific URL and `fetchMany()` to make requests to multiple URLs at once, with control over concurrency and delays between requests.

#### Example usage

```ts
import { HttpClient } from "@xcrap/core"
import { extract } from "@xcrap/parser"

;(async () => {
    const client = new HttpClient()
    const url = "https://example.com"
    const response = await client.fetch({ url: url })
    const parser = response.asHtmlParser()
    const pageTitle = await parser.parseFist({ query: "title", extractor: extract("innerText") })

    console.log("Page Title:", pageTitle)
})();
```

#### Adding a Proxy

In an HTTP client that extends `BaseClient`, we can add a proxy in the constructor as shown in the following example:

1. **Providing a `proxy` string:**

```ts
const client = new HttpClient({ proxy: "http://47.251.122.81:8888" })
```

2. **Providing a function that will generate a `proxy`:**

```ts
function randomProxy() {
    const proxies = [
        "http://47.251.122.81:8888",
        "http://159.203.61.169:3128"
    ]
    
    const randomIndex = Math.floor(Math.random() * proxies.length)
    
    return proxies[randomIndex]
}

const client = new HttpClient({ proxy: randomProxy })
```

#### Using a Custom User Agent

In a client that extends `BaseClient`, we can also customize the `User-Agent` of requests. This can be done in two ways:

1. **Providing a `userAgent` string:**

```ts
const client = new HttpClient({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36" })
```

2. **Providing a function that will generate a `userAgent`:**

```ts
function randomUserAgent() {
    const userAgents = [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 9_8_4; like Mac OS X) AppleWebKit/603.37 (KHTML, like Gecko)  Chrome/54.0.1244.188 Mobile Safari/601.5",
        "Mozilla/5.0 (Windows NT 10.3;; en-US) AppleWebKit/537.35 (KHTML, like Gecko) Chrome/47.0.1707.185 Safari/601"
    ]
    
    const randomIndex = Math.floor(Math.random() * userAgents.length)
    
    return userAgents[randomIndex]
}

const client = new HttpClient({ userAgent: randomUserAgent })
```

#### Using Custom Proxy URLs

In a client that extends `BaseClient`, we can use proxy URLs. I’m not sure how to explain how they work, but I ended up discovering this type of proxy when I was trying to solve a CORS issue by making a request on the client side, and then I encountered the *CORS Proxy*. Here’s a [template](https://gist.github.com/marcuth/9fbd321b011da44d1287faae31a8dd3a) for one using CloudFlare Workers, in case you want to deploy your own.

Well, we can do this just like we did with the `userAgent`: 

1. **Providing a `proxyUrl` string:**

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

## 🤝 Contributing

- Want to contribute? Follow these steps:
- Fork the repository.
- Create a new branch (git checkout -b feature-new).
- Commit your changes (git commit -m 'Add new feature').
- Push to the branch (git push origin feature-new).
- Open a Pull Request.

## 📝 License

This project is licensed under the MIT License.