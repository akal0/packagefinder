"use client"

import { searchRepos } from "@/actions/searchRepos"
import SearchRepos from "@/components/search/SearchRepos"
import { Github } from "lucide-react"
import Link from "next/link"

export const runtime = "edge"

export default function Home() {
	return (
		<main className="max-w-7xl mx-auto">
			<nav className="flex flex-col items-center gap-y-4 md:flex-row justify-between py-8">
				<h1 className="text-3xl font-bold">
					package<span className="text-red-400">finder</span>
				</h1>

				<Link href="#">
					<Github />
				</Link>
			</nav>

			<div className="px-8 md:py-8 md:px-0">
				<SearchRepos searchRepos={searchRepos} />
			</div>
		</main>
	)
}
