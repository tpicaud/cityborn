import {
  type ThemeIcon,
  type ThemeIconName,
  ThemeIconNameSchema,
} from '@cityborn/api';

function IconMask({ url }: { url: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-[18px] shrink-0 bg-current"
      style={{ mask: `url("${url}") center / contain no-repeat` }}
    />
  );
}

export function ThemeIconGlyph({ icon }: { icon: ThemeIcon }) {
  return (
    <IconMask url={`data:image/svg+xml,${encodeURIComponent(icon.svg)}`} />
  );
}

export function IconifyIconPreview({ iconName }: { iconName: string }) {
  const parsedIconName: ThemeIconName | undefined =
    ThemeIconNameSchema.safeParse(iconName).data;
  if (!parsedIconName) return null;
  return (
    <IconMask
      url={`https://api.iconify.design/${parsedIconName.replace(':', '/')}.svg`}
    />
  );
}
