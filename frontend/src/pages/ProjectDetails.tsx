import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FlowNav from "../components/FlowNav";
import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import { API_BASE_URL } from "../api/config";
import { useGoBack } from "../hooks/useGoBack";

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

const normalize = (value: string): string => value.trim().toLowerCase();

export default function ProjectDetails() {
  const goBack = useGoBack();
  const { projectName } = useParams<{ projectName: string }>();
  const requestedProject = decodeURIComponent(projectName ?? "");

  const [project, setProject] = useState<Project | null>(null);
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

        const match =
          mapped.find((p) => normalize(p.title) === normalize(requestedProject)) ??
          mapped.find((p) => String(p.id) === requestedProject) ??
          null;

        if (!match) {
          setLoadError("Project not found.");
          setProject(null);
          return;
        }

        setProject(match);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load project details";
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedProject]);

  const safeProjectTitle = useMemo(() => {
    if (project?.title?.trim()) return project.title;
    if (requestedProject.trim()) return requestedProject;
    return "Project";
  }, [project?.title, requestedProject]);

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />

      <div className="relative z-10 px-6 pt-24 pb-16 max-w-5xl mx-auto w-full min-h-screen">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-base font-medium px-4 py-2.5 rounded-lg border border-white/40 hover:border-white/60 transition-colors bg-transparent cursor-pointer font-inherit"
        >
          {"<-"} Back
        </button>

        <div className="mt-6 rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-md p-6 sm:p-8">
          {listLoading ? (
            <p className="text-white/70">Loading project details...</p>
          ) : loadError ? (
            <div>
              <h1 className="text-2xl font-semibold text-white/95 mt-0 mb-3">
                {safeProjectTitle}
              </h1>
              <p className="text-red-200 m-0">{loadError}</p>
              <Link
                to="/browse"
                className="inline-flex items-center justify-center gap-2 mt-5 px-4 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium no-underline transition-all duration-200 text-sm"
              >
                Return to browse
              </Link>
            </div>
          ) : project ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">
                  Project details
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold text-white/95 mt-0 mb-2">
                  {project.title}
                </h1>
                {project.researcherName && (
                  <p className="text-white/60 text-sm m-0">
                    Lead researcher: {project.researcherName}
                  </p>
                )}
              </div>

              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-white/15 text-white/80 text-xs border border-white/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider m-0">
                  Overview
                </h2>
                <p className="text-white/80 text-[15px] leading-relaxed m-0">
                  {project.longDescription?.trim() || project.description}
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider m-0">
                  Why be part of this project
                </h2>
                {project.whyJoin.length > 0 ? (
                  <ul className="list-none p-0 m-0 space-y-2">
                    {project.whyJoin.map((reason, index) => (
                      <li
                        key={`${reason}-${index}`}
                        className="flex gap-2 text-white/75 text-[14px] leading-relaxed"
                      >
                        <span className="text-emerald-400/90 shrink-0">*</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/65 text-[14px] leading-relaxed m-0">
                    This project does not yet include structured whyJoin notes.
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider m-0">
                  Learn more
                </h2>
                {project.learnMore.length > 0 ? (
                  <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
                    {project.learnMore.map((link, index) => (
                      <li key={`${link.url}-${index}`}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm no-underline transition-colors"
                        >
                          {link.label}
                          <span className="text-xs opacity-70" aria-hidden>
                            -&gt;
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/65 text-[14px] leading-relaxed m-0">
                    No external links are provided for this project yet.
                  </p>
                )}
              </section>

              <div className="pt-3">
                <Link
                  to="/volunteer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium no-underline transition-all duration-200 text-sm"
                >
                  Contribute CPU to this project
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-white/70">Project not found.</p>
          )}
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
