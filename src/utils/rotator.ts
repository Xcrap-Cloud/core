import { EmptyArrayError } from "../errors"

export class Rotator<T> {
    currentIndex = 0

    constructor(readonly values: T[]) {
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
