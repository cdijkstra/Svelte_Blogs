export type Categories = 'DevOps'|'Azure'|'jq'|'Jmespath'|'Pipelines'

export type Post = {
    title: string
	date: string
	tags: Categories[]
    image: string
	summary: string
	slug: string
}
