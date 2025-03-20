import { Result } from "@/types/Results"

export default interface Player {
    id: string
    results: Result[]
    connected?: boolean
}