import { Categories } from "@/enums/Categories";

export default interface GameConfig {
    categories: Categories[];
    timer: number;
    nbOfObjects: number;
}