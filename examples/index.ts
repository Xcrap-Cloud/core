import { extract } from "@xcrap/parser";
import { HttpClient } from "../src/http-client"

;(async () => {
    const client = new HttpClient()

    const response = await client.fetch({ url: "http://deetlist.com/dragoncity/events/race" })
    const parser = response.asHtmlParser()
    const title = await parser.parseFirst({ query: "title", extractor: extract("innerText") })
    console.log(title)
})();