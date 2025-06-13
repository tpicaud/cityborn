import { Categories } from "@/enums/Categories";

export interface GameConfig {
    categories: Categories[];
    timer: number;
    nbOfObjects: number;
}