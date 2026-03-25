import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/config";

interface LearnMoreLink {
  label: string;
  url: string;
}

interface Project {
  id: string | number;
  title: string;
  description: string;
  longDescription?: string;
  tags: string[];
  whyJoin: string[];
  learnMore: LearnMoreLink[];
  researcherName?: string;
}

export default function BrowseProjectsAws() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/projects/browse`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { projects?: unknown[] }) => {
        if (cancelled) return;
        const rawProjects = Array.isArray(data?.projects) ? data.projects : [];
        const mapped: Project[] = rawProjects.map((raw) => {
          const p = raw as Record<string, unknown>;
          return {
            id: (p.id as string | number) ?? "",
            title: String(p.title ?? ""),
            description: String(p.description ?? ""),
            longDescription: String(p.longDescription ?? p.description ?? ""),
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
    for (const p of projects) {
      for (const tag of p.tags) tags.add(tag);
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (selectedTags.size > 0) {
      list = list.filter((p) => p.tags.some((t) => selectedTags.has(t)));
    }
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [search, selectedTags, projects]);

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-6xl mx-auto w-full min-h-screen flex flex-col">
        <h1 className="text-4xl font-bold text-white/90 mb-2">Browse Projects (AWS)</h1>
        <p className="text-white/70 mb-4">
          Data source: <code>/api/projects/browse</code> from the AWS <code>projects</code> table.
        </p>

        <div className="mb-6 rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <strong>Schema gaps (currently not stored on submission):</strong> why-be-part-of-this-project bullets,
          learn-more links, and a dedicated long description. This page flags those as placeholders until those
          fields are added to the project schema/submission flow.
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label htmlFor="browse-aws-search" className="sr-only">
            Search projects
          </label>
          <input
            id="browse-aws-search"
            type="search"
            placeholder="Search by name, description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shrink-0 w-full min-w-[200px] max-w-sm px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/95 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
          />
          {allTags.map((tag) => {
            const active = selectedTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  active
                    ? "bg-emerald-500/30 border-emerald-300/50 text-emerald-100"
                    : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {listLoading && <p className="text-white/60">Loading projects from AWS...</p>}
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">
            Failed to load browse data: {loadError}
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto grid gap-5 w-full pb-12"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {!listLoading && filteredProjects.length === 0 ? (
            <p className="col-span-full text-white/60 py-8">
              No AWS-backed projects match your current filters.
            </p>
          ) : (
            filteredProjects.map((proj) => {
              const isExpanded = expandedId === proj.id;
              const missingWhyJoin = proj.whyJoin.length === 0;
              const missingLearnMore = proj.learnMore.length === 0;
              const descriptionBackfill =
                (proj.longDescription ?? "").trim() === (proj.description ?? "").trim();

              return (
                <div
                  key={proj.id}
                  className={`rounded-xl backdrop-blur-sm border transition-all flex flex-col overflow-hidden ${
                    isExpanded
                      ? "bg-white/10 border-white/25 shadow-[0_0_32px_rgba(255,255,255,0.08)]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  }`}
                  onClick={() => !isExpanded && setExpandedId(proj.id)}
                >
                  <div className="p-5" onClick={(e) => isExpanded && e.stopPropagation()}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-semibold text-white/90 m-0">{proj.title}</h2>
                        {proj.researcherName && (
                          <p className="text-white/45 text-xs mt-1 m-0">
                            Lead researcher: {proj.researcherName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {proj.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-white/15 text-white/70 text-xs border border-white/15"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2.5 text-white/70 text-[15px] line-clamp-2">{proj.description}</p>

                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        <p className="text-white/80 text-[15px] leading-relaxed">
                          {proj.longDescription || proj.description}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {descriptionBackfill && (
                            <span className="rounded-md border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-100">
                              Long description currently mirrors description
                            </span>
                          )}
                          {missingWhyJoin && (
                            <span className="rounded-md border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-100">
                              whyJoin not in SQLite submission schema
                            </span>
                          )}
                          {missingLearnMore && (
                            <span className="rounded-md border border-amber-300/30 bg-amber-500/10 px-2 py-1 text-amber-100">
                              learnMore links not in SQLite submission schema
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2">
                            Why be part of this project
                          </h3>
                          {missingWhyJoin ? (
                            <p className="text-white/65 text-[14px] leading-relaxed m-0">
                              Placeholder only: this field is not yet captured at project submission time.
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
                            Learn more
                          </h3>
                          {missingLearnMore ? (
                            <p className="text-white/65 text-[14px] leading-relaxed m-0">
                              Placeholder only: external resource links are not yet stored for submitted projects.
                            </p>
                          ) : (
                            <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
                              {proj.learnMore.map((link, i) => (
                                <li key={i}>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm no-underline transition-colors"
                                  >
                                    {link.label}
                                    <span className="text-xs opacity-70" aria-hidden>↗</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/project/${encodeURIComponent(String(proj.id))}`)}
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-all duration-200 text-sm mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                        >
                          See project details
                          <span aria-hidden>→</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4">
          <Link to="/browse" className="text-white/70 hover:text-white transition-colors no-underline">
            Legacy Browse (with hardcoded fallback)
          </Link>
          <Link to="/" className="text-white/70 hover:text-white transition-colors no-underline">
            Home
          </Link>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
