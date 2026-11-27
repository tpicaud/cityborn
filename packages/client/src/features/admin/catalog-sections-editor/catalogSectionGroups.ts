import type { CatalogSection, Theme } from '@cityborn/api';

export type CatalogSectionGroup = {
  key: string;
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
      title: allPacksFilterTitle,
      sections: sections.filter(
        (section: CatalogSection) => section.themeId === null,
      ),
    },
    ...themes.map(
      (theme: Theme): CatalogSectionGroup => ({
        key: theme.id,
        title: theme.name,
        sections: sections.filter(
          (section: CatalogSection) => section.themeId === theme.id,
        ),
      }),
    ),
  ];
}
