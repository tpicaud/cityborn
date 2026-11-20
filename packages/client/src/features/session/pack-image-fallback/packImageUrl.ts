export function selectPackImageUrl({
  image,
  failedImageUrl,
}: {
  image: string | undefined;
  failedImageUrl: string | undefined;
}): string | undefined {
  return image === failedImageUrl ? undefined : image;
}
