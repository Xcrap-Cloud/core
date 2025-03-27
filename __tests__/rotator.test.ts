import { EmptyArrayError, Rotator } from "../src"

describe("Rotator", () => {
    test("should throw an EmptyArrayError when initialized with an empty array", () => {
        expect(() => new Rotator([])).toThrow(EmptyArrayError)
    })

    test("should return elements in a cyclic order", () => {
        const rotator = new Rotator(["A", "B", "C"])
        expect(rotator.rotate()).toBe("B")
        expect(rotator.rotate()).toBe("C")
        expect(rotator.rotate()).toBe("A")
        expect(rotator.rotate()).toBe("B")
    })

    test("should start at the first element", () => {
        const rotator = new Rotator(["X", "Y", "Z"])
        expect(rotator.current).toBe("X")
    })
})
