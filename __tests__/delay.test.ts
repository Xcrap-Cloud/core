import { delay } from "../src"

describe("delay", () => {
    it("should defind", () => {
        expect(delay).toBeDefined()
    })

    it("shold delay 500ms", async () => {
        const time = 500
        const start = Date.now()
        await delay(time)
        const end = Date.now()
        const executedTime = end - start
        expect(executedTime).toBeGreaterThanOrEqual(time)
        expect(time).toBeLessThanOrEqual(executedTime)
    })
})