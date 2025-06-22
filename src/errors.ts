export class TrackingError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "TrackingError"
    }
}

export class PageParsingFailureError extends TrackingError {
    constructor() {
        super("Failed to parse current or last page from the response.")
        this.name = "PageParsingFailureError"
    }
}

export class InvalidPageValueError extends TrackingError {
    constructor() {
        super("Parsed page values are not valid numbers.")
        this.name = "InvalidPageValueError"
    }
}

export class StaticPaginatorError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "StaticPaginatorError"
    }
}

export class InvalidUrlError extends StaticPaginatorError {
    constructor(url: string) {
        super(`The provided URL does not contain the string {page}: ${url}`)
        this.name = "InvalidUrlError"
    }
}

export class InvalidPageError extends StaticPaginatorError {
    constructor(page: number, minPage: number, lastPage: number) {
        super(`The given page ${page} is outside the allowed range [${minPage}, ${lastPage}]`)
        this.name = "InvalidPageError"
    }
}

export class PageOutOfRangeError extends StaticPaginatorError {
    constructor(page: number, minPage: number, lastPage: number) {
        super(`Page ${page} is outside the allowed range [${minPage}, ${lastPage}]`)
        this.name = "PageOutOfRangeError"
    }
}

export class EmptyArrayError extends Error {
    constructor(name: string) {
        super(`${name} cannot receive empty arrays`)
        this.name = "EmptyArrayError"
    }
}

export class InvalidStatusCodeError extends Error {
    public statusCode: number
    public url?: string

    constructor(statusCode: number, url?: string) {
        super(`Request failed with invalid status code: ${statusCode}`)
        this.statusCode = statusCode
        this.url = url

        Object.setPrototypeOf(this, InvalidStatusCodeError.prototype)
    }
}

export class InvalidJsonBody extends Error {
    constructor(message: string = "Invalid JSON body.") {
        super(message)
        this.name = "InvalidJsonBody"
    }
}

export class InvalidHtmlBody extends Error {
    constructor(message: string = "Invalid HTML body.") {
        super(message)
        this.name = "InvalidHtmlBody"
    }
}

export class InvalidMarkdownBody extends Error {
    constructor(message: string = "Invalid Markdown body.") {
        super(message)
        this.name = "InvalidMarkdownBody"
    }
}