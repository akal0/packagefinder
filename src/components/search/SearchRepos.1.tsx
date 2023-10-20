"use client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { CornerDownLeft, ExternalLink, Loader2 } from "lucide-react"
import { useAction } from "next-safe-action/hook"
import { ElementRef, FormEvent, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Select, SelectTrigger } from "../ui/select"
import { SearchReposProps } from "./SearchRepos"

export const SearchRepos = ({ searchRepos }: SearchReposProps) => {
	const formRef = useRef<ElementRef<"form">>(null)

	const { execute, result, status } = useAction(searchRepos, {
		onError: (error) => {
			if (error.serverError) {
				toast.error(error.serverError)
				return
			}

			toast.error(
				"Searching the repos has failed. Please try again later."
			)
		},
	})

	useEffect(() => {
		if (result.data && "error" in result.data) {
			toast.error(result.data.error)
		}
	}, [result.data])

	const repos = result.data && Array.isArray(result.data) ? result.data : []

	const onSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const formData = new FormData(e.currentTarget)
		const input = Object.fromEntries(formData)

		console.log(formData)
		console.log(input)

		if (!input.dependencies) {
			toast.error("Please enter some dependencies.")
			return
		}

		const existingDependencies = localStorage.getItem("dependencies")

		if (!existingDependencies) {
			localStorage.setItem("dependencies", input.dependencies as string)
		}

		if (existingDependencies) {
			localStorage.setItem(
				"dependencies",
				(existingDependencies + " " + input.dependencies) as string
			)
		}

		execute({ query: input.dependencies as string })
	}

	return (
		<div className="flex flex-col py-8 gap-y-8">
			<div className="flex flex-col gap-y-3 text-center">
				<h1 className="text-3xl font-bold tracking-wide">
					Streamlining your development process
				</h1>
				<p className="text-gray-300 tracking-wide">
					Find repos that utilise the packages that you require in
					your projects
				</p>
			</div>

			<div>
				<form
					ref={formRef}
					onSubmit={onSubmit}
					className="bg-slate-700 rounded-xl shadow-lg h-fit flex flex-row px-2 items-center w-full"
				>
					<input
						type="text"
						name="dependencies"
						placeholder="react-dnd axios"
						className="bg-transparent text-white placeholder:text-gray-300 ring-0 outline-none resize-none py-3 px-3 font-mono text-sm h-10 w-full transition-all duration-300"
					/>

					<button
						type="submit"
						disabled={status === "executing"}
						aria-disabled={status === "executing"}
						className="text-white rounded-lg hover:bg-white/25 focus:bg-white/25 w-8 h-8 aspect-square flex items-center justify-center ring-0 outline-0"
					>
						{status === "executing" ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<CornerDownLeft size={16} className="-ml-px" />
						)}
					</button>
				</form>

				<Select>
					<SelectTrigger>
						<SelectValue placeholder="" />
					</SelectTrigger>
				</Select>
			</div>

			{repos.length > 0 && (
				<ul className="pt-6 gap-6 flex-col grid md:grid-cols-3 ">
					{repos.map(({ repository, metadata }) => (
						<li key={metadata.package_json_url}>
							<a
								target="_blank"
								rel="noopener noreferrer"
								href={metadata.package_json_url}
								className="borders shadow-md hover:-translate-y-0.5 transition-transform duration-150 flex flex-col md:flex-row flex-nowrap py-4 px-3 items-center rounded-xl gap-x-2.5 bg-slate-800 hover:bg-slate-700 w-[325px] md:w-full relative group"
							>
								<Avatar className="w-8 h-8 rounded-[calc(12px-3px)] overflow-hidden">
									<AvatarImage
										src={repository.owner?.avatar_url}
										className="h-8 w-8 "
									/>
									<AvatarFallback className="h-8 w-8">
										{repository.full_name.slice(0, 1)}
									</AvatarFallback>
								</Avatar>

								<div className="flex flex-col gap-y-1 truncate shrink pt-4 md:pt-0">
									<h3
										className="font-mono text-sm truncate max-w-[250px] text-center md:text-start"
										title={repository.full_name}
									>
										{repository.full_name}
									</h3>

									<p className="text-xs truncate max-w-[200px] mx-auto md:max-w-full text-gray-500 px-4 py-2 md:py-0 md:px-0">
										{metadata.matched_fragment}
									</p>
								</div>

								<div
									className={cn(
										"w-8 h-8 aspect-square md:ml-auto flex shrink-0 items-center justify-center"
									)}
								>
									<span className="sr-only">
										Go to repository
									</span>
									<ExternalLink className="w-4 h-4" />
								</div>
							</a>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
