import Image from 'next/image';

type PackImagePreviewProps = {
  image: string | undefined;
  size: number;
};

export function PackImagePreview({ image, size }: PackImagePreviewProps) {
  if (!image) {
    return (
      <div
        style={{ width: size, height: size }}
        className="shrink-0 flex items-center justify-center p-1 rounded-md
                   border border-dashed border-gray-400 text-center text-xs text-gray-300"
      >
        Aucun visuel
      </div>
    );
  }

  return (
    <Image
      src={image}
      alt="Visuel du pack"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-md object-cover"
    />
  );
}
