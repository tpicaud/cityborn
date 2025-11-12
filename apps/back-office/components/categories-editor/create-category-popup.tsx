import { CreateCategory } from '@cityborn/types';
import * as Ariakit from '@ariakit/react';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export function CreateCategoryDialog({
  handleCreateCategory,
}: {
  handleCreateCategory: (createCategory: CreateCategory) => Promise<void>;
}) {
  const dialog = Ariakit.useDialogStore();
  const [createCategory, setCreateCategory] = useState<CreateCategory>({
    name: '',
    description: '',
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      await handleCreateCategory(createCategory);
      dialog.hide();
      setCreateCategory({ name: '', description: '', isPublished: false });
    } catch (error) {
      alert('Erreur lors de la création de la catégorie');
      console.error(error);
    }
  };

  return (
    <div className="w-full">
      <Button variant="primary" onClick={dialog.show}>
        <Plus />
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
          <Ariakit.DialogHeading className="text-center font-bold">
            Nouvelle catégorie
          </Ariakit.DialogHeading>

          {/* Le formulaire à l'intérieur du Dialog */}
          <form
            onSubmit={handleSubmit}
            className="w-full h-full flex flex-col gap-4 mt-4"
          >
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              value={createCategory.name}
              onChange={(e) =>
                setCreateCategory({ ...createCategory, name: e.target.value })
              }
              placeholder="e.g. Sport"
              className="bg-white text-gray-800 rounded-md p-2 w-full"
              required
            />

            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              value={createCategory.description}
              onChange={(e) =>
                setCreateCategory({
                  ...createCategory,
                  description: e.target.value,
                })
              }
              placeholder="e.g. Tous les meilleurs sportifs du monde"
              className="bg-white text-gray-800 rounded-md p-2 w-full"
            />

            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={dialog.hide} variant="outline">
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="default"
                onClick={handleSubmit}
              >
                Créer
              </Button>
            </div>
          </form>
        </div>
      </Ariakit.Dialog>
    </div>
  );
}
