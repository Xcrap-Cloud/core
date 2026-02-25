import { HtmlParser, JsonParser, MarkdownParser } from "@xcrap/extractor"

import { InvalidHtmlBody, InvalidJsonBody, InvalidMarkdownBody } from "./errors"

export type HttpResponseOptions = {
    status: number
    statusText: string
    body: any
    headers: Record<string, any>
    attempts?: number
    failedAttempts?: Array<{
        error: string
        timestamp: Date
    }>
}

export type FaliedAttempt = {
    error: string
    timestamp: Date
}

export class HttpResponse {
    readonly status: number
    readonly statusText: string
    readonly body: any
    readonly headers: Record<string, string>
    readonly attempts: number
    readonly failedAttempts: FaliedAttempt[]

    constructor({ body, status, statusText, headers = {}, attempts = 1, failedAttempts = [] }: HttpResponseOptions) {
        this.status = status
        this.statusText = statusText
        this.body = body
        this.attempts = attempts
        this.failedAttempts = failedAttempts

        this.headers = Object.fromEntries(
            Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]),
        )
    }

    isSuccess(): boolean {
        return this.status >= 200 && this.status < 300
    }

    getHeader(name: string): string | undefined {
        return this.headers[name.toLowerCase()]
    }

    get text(): string {
        if (this.body === null || this.body === undefined) {
            return ""
        }

        if (typeof this.body === "string") {
            return this.body
        }

        if (typeof this.body === "object") {
            return JSON.stringify(this.body)
        }

        return String(this.body)
    }

    asJsonParser(ignoreHeader: boolean = false): JsonParser {
        const contentType = this.getHeader("content-type") || ""
        const isJsonHeader = contentType.includes("application/json")

        if (!ignoreHeader && !isJsonHeader && typeof this.body !== "object") {
            try {
                const validJson = JSON.parse(this.text)
                const validJsonString = JSON.stringify(validJson)
                return new JsonParser(validJsonString)
            } catch (e) {
                throw new InvalidJsonBody("Response body is not valid JSON")
            }
        }

        return new JsonParser(this.body)
    }

    asMarkdownParser(ignoreHeader: boolean = false): MarkdownParser {
        const contentType = this.getHeader("content-type") || ""
        const isMarkdownHeader = contentType.includes("text/markdown") || contentType.includes("text/x-markdown")

        if (!ignoreHeader && !isMarkdownHeader && typeof this.body !== "string") {
            throw new InvalidMarkdownBody("Response body is not valid Markdown")
        }

        return new MarkdownParser(this.body)
    }

    asHtmlParser(ignoreHeader: boolean = false): HtmlParser {
        const contentType = this.getHeader("content-type") || ""
        const isHtmlHeader = !contentType.includes("text/html")

        if (!ignoreHeader && !isHtmlHeader && typeof this.body !== "string") {
            throw new InvalidHtmlBody("Response body is not valid HTML")
        }

        return new HtmlParser(this.body)
    }

    asParser<T>(constructor: new (body: any) => T): T {
        return new constructor(this.body)
    }

    getFailedAttemptsCount(): number {
        return this.failedAttempts.length
    }

    hadRetries(): boolean {
        return this.failedAttempts.length > 0
    }
}
