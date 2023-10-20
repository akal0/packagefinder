"use server"

import type { Octokit } from "@octokit/rest"
import z from "zod"

import { action } from "@/lib/safe-action"

const searchSchema = z.object({
    query: z.string().min(1, { message: "Please make sure you enter a valid query." })
})

// Creating a type safe server action for searching repos using Octokit - Github API.

export const searchRepos = action(searchSchema, async ({ query }) => {

    try {

        const q = query + ' filename:"package.json"'

        const response = await fetch(
            `https://api.github.com/search/code?q=${encodeURIComponent(q)}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/vnd.github.text-match+json",
                    Authorization: `token ${process.env.GITHUB_API_TOKEN}`
                }
            }
        )

        if (response.status !== 200) {
            return {
                error: "Internal Server Error"
            }
        }

        const remainingRequests = response.headers.get("x-ratelimit-remaining");

        if (remainingRequests && parseInt(remainingRequests) < 1) {
            return { 
                error: "Rate limit has been exceeded. Please try again later!"                
            }
        }

        const data = (await response.json()) as Awaited<ReturnType<Octokit["search"]["code"]>>["data"]

        const repos = data.items.map(( repo ) => {
            const matchedIndex = repo.text_matches?.[0].matches?.[0].indices?.[0];

            return {
                repository: repo.repository,
                metadata: {
                    package_json_url: repo.html_url,
                    matched_fragment: matchedIndex ? repo.text_matches?.[0].fragment?.substring( matchedIndex - 1 ) : ""
                }
            }
        })

        return repos

    } catch (error) {

        console.log("Search error: ", error)

        return {
            error: "Internal Server Error"
        }

    }

})