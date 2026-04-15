"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CharityLogo from "@/components/CharityLogo";
import { getVisiblePages } from "@/lib/pagination";
import { searchCharities } from "@/lib/charity-search";

interface Charity {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  logoUrl: string | null;
  website: string;
  charityNavigatorScore: number;
  isDefault: boolean;
}

interface CharitySelectorProps {
  charities: Charity[];
  currentCharityId: string;
}

function CharityPaginationButtons({
  currentPage,
  totalPages,
  onPageChange,
  fullPaginationThreshold,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  fullPaginationThreshold: number;
}) {
  const visiblePages = getVisiblePages(
    currentPage,
    totalPages,
    fullPaginationThreshold
  );

  return (
    <div className="join whitespace-nowrap">
      <button
        className="btn btn-sm btn-outline join-item"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </button>

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

            <button
              className={`btn btn-sm join-item ${
                currentPage === page ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => onPageChange(page)}
              disabled={currentPage === page}
            >
              {page}
            </button>
          </span>
        );
      })}

      <button
        className="btn btn-sm btn-outline join-item"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

function CharityMobilePagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
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

              <button
                className={`btn btn-sm ${
                  currentPage === page ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => onPageChange(page)}
                disabled={currentPage === page}
              >
                {page}
              </button>
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-start gap-3">
        <button
          className="btn btn-sm btn-outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <button
          className="btn btn-sm btn-outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function CharitySelector({
  charities,
  currentCharityId,
}: CharitySelectorProps) {
  const charitiesPerPage = 5;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCharityId, setSelectedCharityId] = useState(currentCharityId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const handleSelectCharity = async (charityId: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/user/charity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ charityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update charity selection");
      }

      setSelectedCharityId(charityId);
      router.refresh(); // Refresh server components to show updated data
    } catch (error) {
      console.error("Error selecting charity:", error);
      alert("Failed to update charity selection. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredCharities = searchCharities(charities, searchQuery);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCharities.length / charitiesPerPage)
  );
  const startIndex = (currentPage - 1) * charitiesPerPage;
  const paginatedCharities = filteredCharities.slice(
    startIndex,
    startIndex + charitiesPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div>
      {/* Search Input */}
      <div className="form-control mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-base-content/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search charities by name, category, or description..."
            className="input input-bordered w-full border border-base-300 bg-base-100 pl-12 pr-12 shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/40 hover:text-base-content"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-base-content/60 mb-4">
        {filteredCharities.length === charities.length
          ? `Showing all ${charities.length} charities`
          : `Found ${filteredCharities.length} of ${charities.length} charities`}
      </div>

      {filteredCharities.length > 0 && (
        <div className="text-sm text-base-content/60 mb-4">
          Showing {startIndex + 1}-
          {Math.min(startIndex + paginatedCharities.length, filteredCharities.length)}{" "}
          of {filteredCharities.length}
        </div>
      )}

      {/* Charity List */}
      <div className="space-y-4">
        {filteredCharities.length === 0 ? (
          <div className="text-center py-12 bg-base-200 rounded-lg">
            <div className="font-semibold mb-1">No charities found</div>
            <div className="text-sm text-base-content/60">
              Try adjusting your search query
            </div>
          </div>
        ) : (
          paginatedCharities.map((charity) => {
            const isSelected = charity.id === selectedCharityId;

            return (
              <div
                key={charity.id}
                className={`card border-2 transition-all ${
                  isSelected
                    ? "border-[#B56DFF] bg-gradient-to-br from-[#B56DFF]/10 to-[#E5D4FF]/30"
                    : "border-base-300 bg-base-100 hover:border-base-content/20"
                }`}
              >
                <div className="card-body">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-start justify-between gap-4 w-full sm:w-auto">
                      <CharityLogo
                        name={charity.name}
                        logoUrl={charity.logoUrl}
                        size="lg"
                        className="flex-shrink-0"
                      />

                      <div className="flex-shrink-0 sm:hidden ml-auto">
                        {isSelected ? (
                          <button className="btn btn-success btn-sm" disabled>
                            Selected
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline btn-primary btn-sm"
                            onClick={() => handleSelectCharity(charity.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              "Select"
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Charity Info */}
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-base-content/70">
                            {charity.fullName}
                          </div>
                        </div>
                        {charity.isDefault && (
                          <div className="badge badge-primary badge-sm">
                            Default
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-base-content/70 mb-3">
                        {charity.description}
                      </p>

                      <div className="mt-1 space-y-3 text-xs sm:text-sm">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="badge badge-outline badge-sm">
                            {charity.category}
                          </div>
                          {charity.charityNavigatorScore > 0 && (
                            <div className="inline-flex items-center gap-1 rounded-full bg-base-200 px-3 py-1 font-medium">
                              <span className="text-base-content/70">
                                Charity Navigator
                              </span>
                              <span className="text-success font-bold">
                                {charity.charityNavigatorScore}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                          <Link
                            href={charity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary"
                          >
                            Visit Website →
                          </Link>
                          <Link
                            href={`/charities/${charity.id}`}
                            className="link link-hover"
                          >
                            View Impact →
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Select Button - desktop only */}
                    <div className="hidden sm:block flex-shrink-0">
                      {isSelected ? (
                        <button className="btn btn-success btn-sm" disabled>
                          Selected
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline btn-primary btn-sm"
                          onClick={() => handleSelectCharity(charity.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            "Select"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredCharities.length > charitiesPerPage && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-base-content/60">
            Page {currentPage} of {totalPages}
          </div>
          <div className="max-w-full overflow-x-auto pb-1 self-start sm:self-auto">
            <div className="sm:hidden">
              <CharityMobilePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            <div className="hidden sm:block">
              <CharityPaginationButtons
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                fullPaginationThreshold={5}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
