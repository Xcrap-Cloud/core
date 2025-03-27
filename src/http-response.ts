import { HtmlParser, JsonParser } from "@xcrap/parser"

export type HttpResponseOptions = {
    status: number
    statusText: string
    body: any
    headers: Record<string, any>
    attempts?: number
    failedAttempts?: Array<{ error: string; timestamp: Date }>
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

    constructor({
        body,
        status,
        statusText,
        headers = {},
        attempts = 1,
        failedAttempts = []
    }: HttpResponseOptions) {
        this.status = status
        this.statusText = statusText
        this.body = body
        this.attempts = attempts
        this.failedAttempts = failedAttempts

        this.headers = Object.fromEntries(
            Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)])
        )
    }

    isSuccess(): boolean {
        return this.status >= 200 && this.status < 300
    }

    getHeader(name: string): string | undefined {
        return this.headers[name.toLowerCase()]
    }

    text(): string {
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

    asJsonParser(): JsonParser {
        const contentType = this.getHeader("content-type") || ""
        if (!contentType.includes("application/json") && typeof this.body !== "object") {
            try {
                return new JsonParser(JSON.parse(this.text()))
            } catch (e) {
                throw new Error("Response body is not valid JSON")
            }
        }

        return new JsonParser(this.body)
    }

    asHtmlParser(): HtmlParser {
        const contentType = this.getHeader("content-type") || ""

        if (!contentType.includes("text/html") && typeof this.body !== "string") {
            throw new Error("Response body is not valid HTML")
        }

        return new HtmlParser(this.body)
    }

    getFailedAttemptsCount(): number {
        return this.failedAttempts.length
    }

    hadRetries(): boolean {
        return this.failedAttempts.length > 0
    }
}