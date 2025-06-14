import { Categories } from "../enums/Categories.js";

export interface GameConfig {
    categories: Categories[];
    timer: number;
    nbOfObjects: number;
}