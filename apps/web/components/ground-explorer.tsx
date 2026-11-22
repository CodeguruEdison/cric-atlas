"use client";

import {
  filterGrounds,
  type GroundCard as Ground,
  type GroundFilters,
  type PermitRequirement,
  permitRequirementLabels,
} from "@cric-atlas/domain";
import { ArrowRight, MapPin, Search, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { GroundCard } from "./ground-card";
import { Hero } from "./hero";

const FEATURED_COUNT = 8;
const emptyFilters: GroundFilters = { query: "", municipality: "all", permit: "all" };
const quickSearches: { label: string; filters: Partial<GroundFilters> }[] = [
  { label: "Somerset County", filters: { query: "Somerset" } },
  { label: "Franklin Township", filters: { municipality: "Franklin Township" } },
  { label: "Colonial Park", filters: { query: "Colonial Park" } },
  { label: "Permit Required", filters: { permit: "required" } },
];

export function GroundExplorer({ grounds, features }: { grounds: Ground[]; features: ReactNode }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [showAll, setShowAll] = useState(false);
  const municipalities = useMemo(() => [...new Set(grounds.map((g) => g.municipality))].sort(), [grounds]);
  const results = useMemo(() => filterGrounds(grounds, filters), [grounds, filters]);
  const isFiltered = filters.query !== "" || filters.municipality !== "all" || filters.permit !== "all";
  const visible = isFiltered || showAll ? results : results.slice(0, FEATURED_COUNT);
  const update = (next: Partial<GroundFilters>) => setFilters((current) => ({ ...current, ...next }));
  const scrollToResults = () => document.getElementById("grounds")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <Hero>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            scrollToResults();
          }}
          className="mx-auto mt-7 grid max-w-4xl gap-2 rounded-2xl bg-white p-2 text-navy-950 shadow-2xl md:grid-cols-[1fr_220px_auto] md:items-center md:rounded-full"
        >
          <label className="relative block">
            <span className="sr-only">Search grounds</span>
            <Search aria-hidden className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-600" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder="Search ground, town, or county"
              className="h-12 w-full rounded-full bg-transparent pr-3 pl-12 text-base outline-none focus-visible:ring-2 focus-visible:ring-action-600"
            />
          </label>
          <label className="relative block md:border-l md:border-slate-200 md:pl-2">
            <span className="sr-only">Municipality</span>
            <MapPin aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-action-600" />
            <select
              value={filters.municipality}
              onChange={(event) => update({ municipality: event.target.value })}
              className="h-12 w-full rounded-full bg-transparent pr-3 pl-10 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-action-600"
            >
              <option value="all">All Municipalities</option>
              {municipalities.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <button type="submit" className="h-12 rounded-full bg-action-600 px-7 font-semibold text-white hover:bg-blue-800">
            Search Grounds
          </button>
        </form>
        <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-2 rounded-2xl bg-navy-950/35 px-3 py-2 backdrop-blur-sm">
          <span className="text-sm font-semibold">Popular Searches:</span>
          {quickSearches.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setFilters({ ...emptyFilters, ...chip.filters });
                scrollToResults();
              }}
              className="min-h-9 rounded-full bg-white/20 px-3.5 text-sm font-medium hover:bg-white/35"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </Hero>
      {features}
      <section id="grounds" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{isFiltered ? "Search Results" : "Featured Cricket Grounds"}</h2>
            <p aria-live="polite" className="mt-1 text-sm text-slate-600">Showing {visible.length} of {grounds.length} grounds</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label>
              <span className="sr-only">Permit status</span>
              <select
                value={filters.permit}
                onChange={(event) => update({ permit: event.target.value as PermitRequirement | "all" })}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium"
              >
                <option value="all">All permit statuses</option>
                {(Object.keys(permitRequirementLabels) as PermitRequirement[]).map((key) => (
                  <option key={key} value={key}>{permitRequirementLabels[key]}</option>
                ))}
              </select>
            </label>
            {isFiltered ? (
              <button type="button" onClick={() => setFilters(emptyFilters)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-action-600 hover:bg-blue-50">
                <X aria-hidden className="size-4" /> Clear filters
              </button>
            ) : (
              results.length > FEATURED_COUNT && (
                <button type="button" onClick={() => setShowAll((value) => !value)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-action-600 hover:bg-blue-50">
                  {showAll ? "Show Featured" : "View All Grounds"} <ArrowRight aria-hidden className="size-4" />
                </button>
              )
            )}
          </div>
        </div>
        {visible.length > 0 ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((ground) => <li key={ground.id} className="flex"><GroundCard ground={ground} /></li>)}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="font-semibold">No grounds match your search</h3>
            <p className="mt-1 text-sm text-slate-600">Try a different name or clear the filters.</p>
          </div>
        )}
      </section>
    </>
  );
}
