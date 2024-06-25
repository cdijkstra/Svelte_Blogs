export type Categories = 'DevOps'|'Azure'|'jq'|'Jmespath'|'Pipelines'

export type Post = {
    title: string
	date: string
	description: string
	tags: Categories[]
	slug: string
}
