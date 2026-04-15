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
  const closeDialog = () => dialogRef.current?.close();

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

      <dialog
        ref={dialogRef}
        className="lightbox-dialog fixed inset-0 m-0 h-screen max-h-none w-screen max-w-none overflow-y-auto bg-transparent p-4 md:p-6"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          aria-label="Close backdrop"
          className="fixed inset-0 z-0 bg-gray-900/55 backdrop-blur-[2px]"
          onClick={closeDialog}
        />

        <div className="relative z-10 w-fit max-w-[min(92vw,1100px)]">
          <div className="relative inline-block overflow-hidden rounded-2xl">
            <h3 id={titleId} className="sr-only">
              {alt}
            </h3>

          <button
            type="button"
            className="btn btn-sm btn-circle absolute right-3 top-3 z-20 border-white bg-white text-base-content shadow-md hover:bg-base-100"
            aria-label="Close"
            onClick={closeDialog}
          >
            ✕
          </button>

          {/* Use a plain img to guarantee full-size rendering. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="block max-h-[85vh] max-w-full w-auto h-auto rounded-2xl object-contain shadow-2xl"
          />
          </div>
        </div>
      </dialog>
    </>
  );
}
