import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import PageFooter from "../components/PageFooter";
import { API_BASE_URL } from "../api/config";
import TagMultiselectDropdown from "../components/TagMultiselectDropdown";
import { PROJECT_TAG_OPTIONS } from "../constants/projectTags";

interface LearnMoreLink {
  label: string;
  url: string;
}

interface Project {
  id: string | number;
  title: string;
  description: string;
  tags: string[];
  whyJoin: string[];
  learnMore: LearnMoreLink[];
  researcherName?: string;
}

export default function BrowseProjectsAws() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/projects/browse`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const detail =
            typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : r.statusText || String(r.status);
          throw new Error(detail);
        }
        return data;
      })
      .then((data: { projects?: unknown[] }) => {
        if (cancelled) return;
        const rawProjects = Array.isArray(data?.projects) ? data.projects : [];
        const mapped: Project[] = rawProjects.map((raw) => {
          const p = raw as Record<string, unknown>;
          return {
            id: (p.id as string | number) ?? "",
            title: String(p.title ?? ""),
            description: String(p.description ?? ""),
            tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
            whyJoin: Array.isArray(p.whyJoin) ? (p.whyJoin as string[]) : [],
            learnMore: Array.isArray(p.learnMore)
              ? (p.learnMore as LearnMoreLink[])
              : [],
            researcherName:
              typeof p.researcherName === "string" ? p.researcherName : undefined,
          };
        });
        setProjects(mapped);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load browse projects";
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const t of PROJECT_TAG_OPTIONS) tags.add(t);
    for (const p of projects) {
      for (const tag of p.tags) tags.add(tag);
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (selectedTags.size > 0) {
      list = list.filter((p) => p.tags.some((t) => selectedTags.has(t)));
    }
    for (const term of searchTerms) {
      const q = term.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [searchTerms, selectedTags, projects]);

  const commitSearchFilter = () => {
    const t = searchInput.trim();
    if (!t) return;
    setSearchTerms((prev) =>
      prev.some((x) => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t]
    );
    setSearchInput("");
  };

  const removeSearchTerm = (term: string) => {
    setSearchTerms((prev) => prev.filter((x) => x !== term));
  };

  const removeTagFilter = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });
  };

  const selectedTagsSorted = useMemo(
    () => [...selectedTags].sort((a, b) => a.localeCompare(b)),
    [selectedTags]
  );

  const hasActiveFilters = searchTerms.length > 0 || selectedTags.size > 0;

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-24 pb-16 max-w-6xl mx-auto w-full min-h-screen">
        <h1 className="text-4xl font-bold text-white/90 mb-4">Browse Projects</h1>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label htmlFor="browse-aws-search" className="sr-only">
            Search projects
          </label>
          <input
            id="browse-aws-search"
            type="search"
            placeholder="Type text, press Enter to add a search filter…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSearchFilter();
              }
            }}
            className="shrink-0 w-full min-w-[200px] max-w-sm px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/95 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
          />
          <TagMultiselectDropdown
            options={allTags}
            selected={selectedTags}
            onChange={setSelectedTags}
            buttonLabel="Filter by tags"
            emptyHint="No tags match your search."
            clearAllLabel="Clear tag filters"
            showSelectedChips={false}
          />
        </div>

        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 shrink-0">
              Filters
            </span>
            <div className="flex flex-wrap gap-2 min-w-0">
              {searchTerms.map((term) => (
                <span
                  key={`q:${term}`}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-sky-500/20 border border-sky-400/35 text-sky-100 text-xs max-w-full"
                >
                  <span className="text-sky-200/80 shrink-0">Search</span>
                  <span className="truncate" title={term}>
                    {term}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSearchTerm(term)}
                    className="p-0.5 rounded-md hover:bg-white/10 text-white/90 leading-none border-0 bg-transparent cursor-pointer font-inherit shrink-0"
                    aria-label={`Remove search filter ${term}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedTagsSorted.map((tag) => (
                <span
                  key={`t:${tag}`}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/35 text-emerald-100 text-xs max-w-full"
                >
                  <span className="text-emerald-200/80 shrink-0">Tag</span>
                  <span className="truncate" title={tag}>
                    {tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTagFilter(tag)}
                    className="p-0.5 rounded-md hover:bg-white/10 text-white/90 leading-none border-0 bg-transparent cursor-pointer font-inherit shrink-0"
                    aria-label={`Remove tag filter ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {listLoading && <p className="text-white/60">Loading projects...</p>}
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">
            Failed to load browse data: {loadError}
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto grid gap-5 w-full pb-12 items-stretch"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {!listLoading && filteredProjects.length === 0 ? (
            <p className="col-span-full text-white/60 py-8">
              No projects match your current filters.
            </p>
          ) : (
            filteredProjects.map((proj) => {
              const isExpanded = expandedId === proj.id;
              const missingWhyJoin = proj.whyJoin.length === 0;
              const missingLearnMore = proj.learnMore.length === 0;

              return (
                <div
                  key={proj.id}
                  className={`rounded-xl backdrop-blur-sm border transition-all flex flex-col overflow-hidden ${
                    isExpanded
                      ? "h-auto min-h-0 bg-white/10 border-white/25 shadow-[0_0_32px_rgba(255,255,255,0.08)]"
                      : "h-[288px] bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  }`}
                  onClick={() => !isExpanded && setExpandedId(proj.id)}
                >
                  <div
                    className={`p-5 ${isExpanded ? "" : "flex flex-col h-full min-h-0 overflow-hidden"}`}
                    onClick={(e) => isExpanded && e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-semibold text-white/90 m-0 line-clamp-2 break-words">
                          {proj.title}
                        </h2>
                        {proj.researcherName && (
                          <p
                            className="text-white/45 text-xs mt-1 m-0 truncate"
                            title={proj.researcherName}
                          >
                            Lead researcher: {proj.researcherName}
                          </p>
                        )}
                      </div>
                      {isExpanded && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(null);
                          }}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Close"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-0 max-h-[2.75rem] overflow-hidden shrink-0">
                      {proj.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/15 text-white/70 text-xs border border-white/15 max-w-full truncate"
                          title={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {!isExpanded ? (
                      <>
                        <p className="mt-2.5 text-white/70 text-[15px] line-clamp-3 min-h-0 flex-1 break-words">
                          {proj.description}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(proj.id);
                          }}
                          className="mt-auto pt-3 shrink-0 w-full px-4 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white/95 text-sm font-medium transition-colors text-center cursor-pointer"
                        >
                          Learn more
                        </button>
                      </>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <p className="text-white/80 text-[15px] leading-relaxed">{proj.description}</p>

                        <div>
                          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2">
                            Why be part of this project
                          </h3>
                          {missingWhyJoin ? (
                            <p className="text-white/65 text-[14px] leading-relaxed m-0">
                              No reasons listed yet for this project.
                            </p>
                          ) : (
                            <ul className="list-none p-0 m-0 space-y-1.5">
                              {proj.whyJoin.map((reason, i) => (
                                <li key={i} className="flex gap-2 text-white/75 text-[14px] leading-relaxed">
                                  <span className="text-emerald-400/90 shrink-0">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2">
                            External resources
                          </h3>
                          {missingLearnMore ? (
                            <p className="text-white/65 text-[14px] leading-relaxed m-0">
                              No external links listed for this project.
                            </p>
                          ) : (
                            <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
                              {proj.learnMore.map((link, i) => (
                                <li key={i}>
                                  {link.url ? (
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm no-underline transition-colors"
                                    >
                                      {link.label}
                                      <span className="text-xs opacity-70" aria-hidden>
                                        ↗
                                      </span>
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/80 text-sm">
                                      {link.label}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <Link
                          to={`/project/${encodeURIComponent(String(proj.id))}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium no-underline transition-all duration-200 text-sm mt-2"
                        >
                          View project details
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <PageFooter className="w-full" />
      </div>
    </ConstellationStarfieldBackground>
  );
}
