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