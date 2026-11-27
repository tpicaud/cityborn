import type { CatalogSection, Theme, ThemeId } from '@cityborn/api';

export const allPacksFilterValue: '' = '';

export type CatalogSectionGroup = {
  key: string;
  filterValue: typeof allPacksFilterValue | ThemeId;
  title: string;
  sections: CatalogSection[];
};

const allPacksFilterTitle: string = 'Tous';

export function createCatalogSectionGroups({
  sections,
  themes,
}: {
  sections: CatalogSection[];
  themes: Theme[];
}): CatalogSectionGroup[] {
  return [
    {
      key: 'all',
      filterValue: allPacksFilterValue,
      title: allPacksFilterTitle,
      sections: sections.filter(
        (section: CatalogSection) => section.themeId === null,
      ),
    },
    ...themes.map(
      (theme: Theme): CatalogSectionGroup => ({
        key: theme.id,
        filterValue: theme.id,
        title: theme.name,
        sections: sections.filter(
          (section: CatalogSection) => section.themeId === theme.id,
        ),
      }),
    ),
  ];
}
