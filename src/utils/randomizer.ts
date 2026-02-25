import { EmptyArrayError } from "../errors"

export class Randomizer<T> {
    constructor(readonly values: T[]) {
        if (values.length === 0) {
            throw new EmptyArrayError(Randomizer.name)
        }
    }

    random() {
        const arrayLength = this.values.length
        const randomFactor = Math.random()
        const randomIndex = Math.floor(randomFactor * arrayLength)
        return this.values[randomIndex]
    }
}
