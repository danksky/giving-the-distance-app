"use client";

import { useRef } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  /** Container classes for the thumbnail wrapper (must define size if using `fill`). */
  containerClassName?: string;
  /** Classes applied to the thumbnail image. */
  imageClassName?: string;
  /** Whether to use `next/image` fill behavior for the thumbnail. */
  fill?: boolean;
  /** Optional sizes for responsive images. */
  sizes?: string;
};

function toDomId(input: string) {
  return (
    "lb-" +
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80)
  );
}

export default function LightboxImage({
  src,
  alt,
  containerClassName,
  imageClassName,
  fill = true,
  sizes,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = toDomId(`${src}-${alt}`);

  return (
    <>
      <button
        type="button"
        className={containerClassName || ""}
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={`View full image: ${alt}`}
      >
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={imageClassName}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={800}
            height={800}
            sizes={sizes}
            className={imageClassName}
          />
        )}
      </button>

      <dialog ref={dialogRef} className="modal" aria-labelledby={titleId}>
        <div className="modal-box max-w-5xl p-2">
          <div className="flex items-start justify-between gap-4 px-2 pt-2">
            <h3 id={titleId} className="font-semibold">
              {alt}
            </h3>
            <form method="dialog">
              <button className="btn btn-sm" aria-label="Close">
                Close
              </button>
            </form>
          </div>

          <div className="p-2">
            {/* Use a plain img to guarantee full-size rendering. */}
            <img src={src} alt={alt} className="w-full h-auto rounded" />
          </div>
        </div>

        {/* Clicking the backdrop closes the modal */}
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close backdrop">close</button>
        </form>
      </dialog>
    </>
  );
}
