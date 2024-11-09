import { tennisList } from "@/data/stars";
import GuessObject from "@/types/GuessObject";

const getLocalObjectList = (): GuessObject[] => {
    return tennisList;
};

export { getLocalObjectList };