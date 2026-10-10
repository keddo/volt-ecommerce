import { useRef, type ChangeEvent } from "react";
import { resolveImageUrl } from "../../lib/imageUrl";

export interface ImageGridItem {
  key: string;
  url: string;
}

interface ImageGridProps {
  images: ImageGridItem[];
  onAddFiles: (files: File[]) => void;
  onRemove: (key: string) => void;
  uploading?: boolean;
}

export function ImageGrid({ images, onAddFiles, onRemove, uploading }: ImageGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onAddFiles(files);
    e.target.value = "";
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((img) => (
        <div key={img.key} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-white/10">
          <img src={resolveImageUrl(img.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(img.key)}
            className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-xl bg-black/70 text-xs text-white group-hover:flex"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-surface-muted hover:border-accent hover:text-white disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "+ Add image"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
