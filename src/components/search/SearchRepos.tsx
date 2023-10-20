"use client"

import { searchRepos } from "@/actions/searchRepos"
import { cn } from "@/lib/utils"

import { CornerDownLeft, ExternalLink, Loader2, Trash2 } from "lucide-react"
import { ElementRef, FormEvent, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useAction } from "next-safe-action/hook"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface SearchReposProps {
	searchRepos: typeof searchRepos
}

const SearchRepos = ({ searchRepos }: SearchReposProps) => {
	const formRef = useRef<ElementRef<"form">>(null)
	const inputRef = useRef<ElementRef<"input">>(null)
	const router = useRouter()

	const [dependencies, setDependencies] = useState<string[] | null>(
		[] || null
	)

	const [error, setError] = useState<boolean>(false)

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
		onSuccess: () => {
			toast.loading("Searching for repos...")
		},
	})

	useEffect(() => {
		if (result.data && "error" in result.data) {
			toast.error(result.data.error)
		}

		if (
			result.data &&
			Array.isArray(result.data) &&
			result.data.length > 0
		) {
			toast.success("Repo successfully found!")
			setError(false)
		}

		if (
			result.data &&
			Array.isArray(result.data) &&
			result.data.length === 0
		) {
			toast.error("Repo wasn't successfully found.")
			setError(true)
		}
	}, [result.data])

	const repos = result.data && Array.isArray(result.data) ? result.data : []

	useEffect(() => {
		let dependencies = localStorage
			.getItem("dependencies")
			?.trim()
			.split(" ")

		if (!dependencies) return

		dependencies = dependencies.filter((item) => item !== "")

		setDependencies(dependencies)
	}, [])

	const onSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const formData = new FormData(e.currentTarget)
		const input = Object.fromEntries(formData)

		if (!input.dependencies) {
			toast.error("Please enter some dependencies.")
			return
		}

		const existingDependencies = localStorage.getItem("dependencies")

		if (!existingDependencies) {
			localStorage.setItem("dependencies", input.dependencies as string)

			let newDependencies = localStorage
				.getItem("dependencies")!
				.split(" ")

			setDependencies(newDependencies)
		}

		if (existingDependencies) {
			const dependencies = existingDependencies.split(" ")
			let inputDependencies = input.dependencies as string

			let filteredDependencies = inputDependencies
				.split(" ")
				.filter((item) => !dependencies.includes(item))

			localStorage.setItem(
				"dependencies",
				(existingDependencies + " " + filteredDependencies) as string
			)

			let newDependencies = localStorage
				.getItem("dependencies")!
				.split(" ")

			newDependencies = newDependencies.filter((item) => item !== "")

			setDependencies(newDependencies)
		}

		execute({ query: input.dependencies as string })
	}

	const deletePackage = () => {
		const delPackage = inputRef.current?.value

		let arr = dependencies?.filter((item) => item !== delPackage)

		toast.success("Package deleted from recents.")

		setDependencies(arr!)

		localStorage.setItem(
			"dependencies",
			arr?.toString().replaceAll(",", " ")!
		)

		router.refresh()
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

			<div className="flex flex-col md:flex-row items-center gap-y-4 gap-x-4 mt-4">
				<form
					ref={formRef}
					onSubmit={onSubmit}
					className="bg-slate-700 rounded-md shadow-lg h-fit flex flex-row px-2 items-center w-full"
				>
					<input
						type="text"
						ref={inputRef}
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

				{dependencies && (
					<Select
						onValueChange={(value: string) => {
							toast.success(
								`${value} has been pasted into the search bar.`
							)
							inputRef.current!.value = value
						}}
					>
						<SelectTrigger className="md:max-w-[300px] px-6 font-mono border-none py-5 hover:-translate-y-1.5 hover:bg-slate-700 bg-slate-800 transition-all">
							<SelectValue />
						</SelectTrigger>

						<SelectContent className="bg-slate-800 text-white border-none py-2 font-mono md:max-w-[300px]">
							<SelectItem
								className="px-5"
								disabled
								value="default"
							>
								Choose a package
							</SelectItem>
							{dependencies.map((item, id) => (
								<SelectItem
									key={item}
									value={item}
									className="px-5 cursor-pointer"
								>
									{item}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				<div className="bg-slate-800 hover:-translate-y-1.5 hover:bg-slate-700  transition-all py-2.5 px-4 rounded-sm cursor-pointer">
					<Trash2 className="h-5 w-5" onClick={deletePackage} />
				</div>
			</div>

			{repos.length > 0 && (
				<>
					<ul className="pt-2 gap-6 flex-col grid md:grid-cols-3 ">
						{repos.map(({ repository, metadata }) => (
							<li key={metadata.package_json_url}>
								<a
									target="_blank"
									rel="noopener noreferrer"
									href={metadata.package_json_url}
									className="borders shadow-md hover:-translate-y-0.5 transition-transform duration-150 flex flex-col md:flex-row flex-nowrap py-2 px-3 items-center rounded-xl gap-x-2.5 bg-slate-800 hover:bg-slate-700 w-[325px] md:w-full relative group"
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
				</>
			)}

			{error && (
				<div className="bg-slate-700 rounded-md py-6 text-center uppercase tracking-widest text-sm">
					Sorry, no repos were found with this package
				</div>
			)}
		</div>
	)
}

export default SearchRepos
