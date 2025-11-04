import { Category } from "./Category.js";

export interface GameConfig {
    categories: Category[];
    timer: number;
    nbOfObjects: number;
}