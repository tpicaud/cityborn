import * as Ariakit from '@ariakit/react';
import {
  type ApiResult,
  type Category,
  type CreateCategory,
  CreateCategorySchema,
} from '@cityborn/api';
import { toAppError, useError } from '@cityborn/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';

const CREATE_CATEGORY_FORM_FIELDS = [
  'name',
  'description',
  'isPublished',
  'parentId',
] as const satisfies readonly (keyof CreateCategory)[];

function isCreateCategoryFormField(
  path: string,
): path is (typeof CREATE_CATEGORY_FORM_FIELDS)[number] {
  return (CREATE_CATEGORY_FORM_FIELDS as readonly string[]).includes(path);
}

export function CreateCategoryDialog({
  handleCreateCategory,
}: {
  handleCreateCategory: (
    createCategory: CreateCategory,
  ) => Promise<ApiResult<Category>>;
}) {
  const dialog = Ariakit.useDialogStore();
  const { invokeError } = useError();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategory>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: { name: '', description: '', isPublished: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await handleCreateCategory(values);
    if (result.ok) {
      dialog.hide();
      reset();
      return;
    }

    const fieldErrors = result.error.fieldErrors;
    if (!fieldErrors || fieldErrors.length === 0) {
      invokeError(toAppError(result.error));
      return;
    }

    for (const fieldError of fieldErrors) {
      if (isCreateCategoryFormField(fieldError.path)) {
        setError(fieldError.path, { message: fieldError.message });
        continue;
      }
      invokeError(fieldError.message);
    }
  });

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

          <form
            onSubmit={onSubmit}
            className="w-full h-full flex flex-col gap-4 mt-4"
          >
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              {...register('name')}
              placeholder="e.g. Sport"
              className="bg-white text-gray-800 rounded-md p-2 w-full"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}

            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              {...register('description')}
              placeholder="e.g. Tous les meilleurs sportifs du monde"
              className="bg-white text-gray-800 rounded-md p-2 w-full"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => dialog.hide()} variant="outline">
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={isSubmitting}
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
