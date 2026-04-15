import Link from "next/link";
import { getVisiblePages } from "@/lib/pagination";

type PaginationNavProps = {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
};

function PaginationLinks({
  currentPage,
  totalPages,
  getPageHref,
  fullPaginationThreshold,
}: PaginationNavProps & { fullPaginationThreshold: number }) {
  const visiblePages = getVisiblePages(
    currentPage,
    totalPages,
    fullPaginationThreshold
  );

  return (
    <div className="join whitespace-nowrap">
      {currentPage === 1 ? (
        <button
          type="button"
          className="btn btn-sm btn-outline join-item"
          disabled
        >
          Previous
        </button>
      ) : (
        <Link
          href={getPageHref(currentPage - 1)}
          className="btn btn-sm btn-outline join-item"
        >
          Previous
        </Link>
      )}

      {visiblePages.map((page, index) => {
        const previousPage = visiblePages[index - 1];
        const needsGap = previousPage !== undefined && page - previousPage > 1;

        return (
          <span key={page} className="contents">
            {needsGap && (
              <span
                aria-hidden="true"
                className="btn btn-sm join-item btn-disabled pointer-events-none"
              >
                ...
              </span>
            )}

            {page === currentPage ? (
              <button
                type="button"
                aria-current="page"
                className="btn btn-sm join-item btn-primary"
                disabled
              >
                {page}
              </button>
            ) : (
              <Link href={getPageHref(page)} className="btn btn-sm join-item btn-ghost">
                {page}
              </Link>
            )}
          </span>
        );
      })}

      {currentPage === totalPages ? (
        <button
          type="button"
          className="btn btn-sm btn-outline join-item"
          disabled
        >
          Next
        </button>
      ) : (
        <Link
          href={getPageHref(currentPage + 1)}
          className="btn btn-sm btn-outline join-item"
        >
          Next
        </Link>
      )}
    </div>
  );
}

function MobilePagination({
  currentPage,
  totalPages,
  getPageHref,
}: PaginationNavProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages, 4);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          const needsGap = previousPage !== undefined && page - previousPage > 1;

          return (
            <span key={page} className="contents">
              {needsGap && (
                <span
                  aria-hidden="true"
                  className="btn btn-sm btn-disabled pointer-events-none"
                >
                  ...
                </span>
              )}

              {page === currentPage ? (
                <button
                  type="button"
                  aria-current="page"
                  className="btn btn-sm btn-primary"
                  disabled
                >
                  {page}
                </button>
              ) : (
                <Link href={getPageHref(page)} className="btn btn-sm btn-ghost">
                  {page}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-start gap-3">
        {currentPage === 1 ? (
          <button type="button" className="btn btn-sm btn-outline" disabled>
            Previous
          </button>
        ) : (
          <Link
            href={getPageHref(currentPage - 1)}
            className="btn btn-sm btn-outline"
          >
            Previous
          </Link>
        )}

        {currentPage === totalPages ? (
          <button type="button" className="btn btn-sm btn-outline" disabled>
            Next
          </button>
        ) : (
          <Link
            href={getPageHref(currentPage + 1)}
            className="btn btn-sm btn-outline"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PaginationNav({
  currentPage,
  totalPages,
  getPageHref,
}: PaginationNavProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-base-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm opacity-70">
        Page {currentPage} of {totalPages}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="max-w-full overflow-x-auto pb-1 self-start sm:self-auto"
        >
          <div className="sm:hidden">
            <MobilePagination
              currentPage={currentPage}
              totalPages={totalPages}
              getPageHref={getPageHref}
            />
          </div>
          <div className="hidden sm:block">
            <PaginationLinks
              currentPage={currentPage}
              totalPages={totalPages}
              getPageHref={getPageHref}
              fullPaginationThreshold={5}
            />
          </div>
        </nav>
      )}
    </div>
  );
}
