# 🕷️ Xcrap Core

**Xcrap Core** is the package that includes some essential items of the **Xcrap** Web Scraping framework, such as:

- `ClientInterface` interface to help you understand how to implement an HTTP client;
- `BaseClient` class to extend and create your own HTTP clients;
- `HttpClient` class, which is an HTTP client implementation using Node Core;
- `FetchClient` class, which is an HTTP client implementation using the Fetch API;
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

### Using the FetchClient

The `FetchClient` uses the native `fetch` API. It allows you to make HTTP requests using the modern `fetch` interface, suitable for environments where `undici` or native fetch is available.

#### Example usage

```ts
import { FetchClient } from "@xcrap/core"

;(async () => {
    const client = new FetchClient()
    const response = await client.fetch({ url: "https://example.com" })
    console.log("Status:", response.status)
    console.log("Body:", response.text)
})();
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