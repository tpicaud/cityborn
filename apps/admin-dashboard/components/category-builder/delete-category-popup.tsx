import { CreateCategory } from "@cityborn/types";
import * as Ariakit from "@ariakit/react";
import { Button } from "../ui/Button";
import { CircleAlert, Plus, Trash } from "lucide-react";
import { useState } from "react";
import Loader from "../ui/Loader";

export function DeleteCategoryPopup({
    handleDeleteCategory,
}: {
    handleDeleteCategory: () => Promise<void>;
}) {
    const dialog = Ariakit.useDialogStore();
    const [createCategory, setCreateCategory] = useState<CreateCategory>({
        name: "",
        description: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            await handleDeleteCategory();
            dialog.hide();
        } catch (error) {
            alert('Erreur lors de la suppression de la catégorie');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center">
            <Button size="sm" variant="destructive" onClick={dialog.show}>
                <Trash size={20} />
            </Button>
            

            <Ariakit.Dialog
                store={dialog}
                portal={false}
                backdrop={<div className="fixed bg-black/40 backdrop-blur-sm z-40" />}
                className="fixed z-60 flex flex-col items-center justify-center w-md
                           top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                           bg-background rounded-xl
                           focus:outline-none"
            >
                <div className="h-full w-full p-6">
                    <Ariakit.DialogHeading className="flex flex-col gap-2 items-center text-center">
                        <CircleAlert strokeWidth={2.75} size={32} className="h-full text-red-700"/>
                        <div><p className="font-bold">Action irréversible</p><p>Etes-vous sûr de vouloir supprimer la catégorie ?</p></div>
                    </Ariakit.DialogHeading>
                    <div className="flex justify-center gap-2 mt-4">
                        <Button onClick={dialog.hide} variant="outline">
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteCategory}>
                            {isLoading ? <Loader /> : <p>Supprimer</p>}
                        </Button>
                    </div>
                </div>
            </Ariakit.Dialog >
        </div>
    );
}