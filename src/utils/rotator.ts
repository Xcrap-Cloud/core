import { EmptyArrayError } from "../errors"

export class Rotator {
    currentIndex = 0

    constructor(readonly values: string[]) {
        if (values.length === 0) {
            throw new EmptyArrayError(Rotator.name)
        }
    }

    get current() {
        return this.values[this.currentIndex]
    }

    rotate() {
        this.currentIndex = (this.currentIndex + 1) % this.values.length
        return this.values[this.currentIndex]
    }
}