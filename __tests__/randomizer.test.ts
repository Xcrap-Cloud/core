import { Randomizer, EmptyArrayError } from "../src"

describe("Randomizer", () => {
    test("should throw an EmptyArrayError when initialized with an empty array", () => {
        expect(() => new Randomizer([])).toThrow(EmptyArrayError);
    });

    test("should return an element from the provided array", () => {
        const values = ["A", "B", "C", "D"]
        const randomizer = new Randomizer(values)
        
        const result = randomizer.random()
        expect(values).toContain(result)
    })

    test("should return different values over multiple calls", () => {
        const values = ["X", "Y", "Z"]
        const randomizer = new Randomizer(values)

        const results = new Set()

        for (let i = 0; i < 100; i++) {
            results.add(randomizer.random())
        }

        expect(results.size).toBeGreaterThan(1)
    })
})
