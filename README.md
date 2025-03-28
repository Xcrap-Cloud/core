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
import { BaseClient, ClientInterface, ClientFetchOptions, ClientFetchManyOptions, HttpResponse } from "@xcrap/core"

type CustomClientProxy = string
type CustomClientOptions = BaseClientOptions<CustomClientProxy>
type CustomClientFetchOptions = ClientFetchOptions & {}
type CustomClientFetchManyOptions = ClientFetchManyOptions<CustomClientFetchOptions>

class CustomClient extends BaseClient<CustomClientProxy> implements ClientInterface { 
constructor(options: CustomClientOptions = {}) { 
super(options) 
} 

fetch({ 
maxRetries = 0, 
retries = 0, 
retryDelay, 
method = "GET",
}): Promise<HttpResponse> {...} 

async fetchMany({ requests, concurrency, requestDelay }: CustomFetchManyOptions): Promise<HttpResponse[]> { 
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

#### Using a custom `User-Agent`

In a client that extends from `BaseClient` we can also customize the `User-Agent` of the requests. We can do this in two ways:

1. **By providing a `User-Agent` string:

```ts
const client = new HttpClient({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36" })
```

2. **By providing a function that will generate a `User-Agent`:**

```ts
function randomUserAgent() {
const userAgents = [
"Mozilla/5.0 (iPhone; CPU iPhone OS 9_8_4; like Mac OS X) AppleWebKit/603.37 (KHTML, like Gecko) Chrome/54.0.1244.188 Mobile Safari/601.5", 
"Mozilla/5.0 (Windows NT 10.3;; en-US) AppleWebKit/537.35 (KHTML, like Gecko) Chrome/47.0.1707.185 Safari/601" 
] 

const randomIndex = Math.floor(Math.random() * userAgents.length) 

return userAgents[rnadomIndex]
}

const client = new HttpClient({ userAgent: randomUserAgent })
```