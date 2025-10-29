import { CategoryBuilder } from "@/components/category-builder/category-builder";
import { getCategory } from "./action";

export default async function EditCategory({ params }: { params: { categoryId: string } }) {
    const { categoryId } = await params;
    const category = await getCategory(categoryId)
    return <CategoryBuilder fetchedCategory={category} />
}
