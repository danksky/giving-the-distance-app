import Link from "next/link";

type PaginationNavProps = {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);

  for (
    let page = Math.max(1, currentPage - 1);
    page <= Math.min(totalPages, currentPage + 1);
    page += 1
  ) {
    pages.add(page);
  }

  if (currentPage <= 4) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
    pages.add(5);
  }

  if (currentPage >= totalPages - 3) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
    pages.add(totalPages - 4);
  }

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export default function PaginationNav({
  currentPage,
  totalPages,
  getPageHref,
}: PaginationNavProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages);

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
          <div className="join whitespace-nowrap">
            {currentPage === 1 ? (
              <button type="button" className="btn btn-sm join-item" disabled>
                Previous
              </button>
            ) : (
              <Link
                href={getPageHref(currentPage - 1)}
                className="btn btn-sm join-item"
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
                    <Link
                      href={getPageHref(page)}
                      className="btn btn-sm join-item btn-ghost"
                    >
                      {page}
                    </Link>
                  )}
                </span>
              );
            })}

            {currentPage === totalPages ? (
              <button type="button" className="btn btn-sm join-item" disabled>
                Next
              </button>
            ) : (
              <Link
                href={getPageHref(currentPage + 1)}
                className="btn btn-sm join-item"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
