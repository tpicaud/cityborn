import type { CatalogSection } from '@cityborn/api';
import {
  areCatalogSectionPacksEditable,
  type CatalogSectionsManagement,
  isCatalogSectionDeletable,
} from '@cityborn/client/admin';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  type OrderedListPosition,
  OrderedListRow,
} from '../ordered-list-editor';
import { CatalogSectionPackEditor } from './catalog-section-pack-editor';

export function CatalogSectionRow({
  section,
  editor,
  position,
}: {
  section: CatalogSection;
  editor: CatalogSectionsManagement;
  position: OrderedListPosition;
}) {
  const [isShowingPacks, setIsShowingPacks] = useState<boolean>(false);
  const packEditorId: string = `catalog-section-packs-${section.id}`;
  const packCount: number = section.packIds.length;
  const arePacksEditable: boolean = areCatalogSectionPacksEditable(section);
  return (
    <OrderedListRow
      item={section}
      editor={editor}
      position={position}
      idPrefix="catalog-section"
      nameLabel="Nom de la section"
      submitLabel="Valider la section"
      editLabel={`Renommer ${section.name}`}
      deletionQuestion={`Supprimer « ${section.name} » ?`}
      isDeletable={isCatalogSectionDeletable(section)}
      details={
        arePacksEditable && (
          <span className="text-zinc-400 text-sm">
            {packCount} pack{packCount > 1 ? 's' : ''}
          </span>
        )
      }
      actions={
        arePacksEditable && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsShowingPacks(!isShowingPacks)}
            aria-expanded={isShowingPacks}
            aria-controls={packEditorId}
            aria-label={`Packs de ${section.name}`}
          >
            <Package size={18} />
          </Button>
        )
      }
    >
      {isShowingPacks && (
        <div id={packEditorId}>
          <CatalogSectionPackEditor section={section} isBusy={editor.isBusy} />
        </div>
      )}
    </OrderedListRow>
  );
}
