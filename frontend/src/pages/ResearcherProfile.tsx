import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

import { API_BASE_URL } from "../api/config";
import { useAuth } from '../context/AuthContext';
import { hasResearcherRole } from '../auth/session';

interface ResearcherStats {
  totalProjects: number;
  completedProjects: number;
  totalContributors: number;
}

interface ResearcherProjectRow {
  id: string;
  researcherId?: string;
  title: string;
  description: string;
  status?: string;
  datasetType?: string;
  funcName?: string;
  chunkSize?: number;
  replicationFactor?: number;
  maxVerificationAttempts?: number;
  tags?: string[];
  codePath?: string;
  datasetPath?: string;
  progress?: number;
  resultUrl?: string | null;
  totalContributors?: number;
  activeContributors?: number;
  totalTasks?: number;
  completedTasks?: number;
  failedTasks?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  totalRuns?: number;
  averageTaskTime?: number | null;
  latestRunId?: string | null;
  latestRunStatus?: string | null;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ResearcherProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<ResearcherStats>({
    totalProjects: 0,
    completedProjects: 0,
    totalContributors: 0,
  });
  const [projects, setProjects] = useState<ResearcherProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const researcherId = user?.user_id ?? null;

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!hasResearcherRole(user.role)) {
      navigate('/profile', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!researcherId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, projectsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/researcher/${researcherId}/stats`),
          fetch(`${API_BASE_URL}/api/researcher/${researcherId}/projects`),
        ]);

        const projectsData = projectsRes.ok ? await projectsRes.json().catch(() => ({})) : {};
        const list = (projectsData.projects || []) as ResearcherProjectRow[];

        if (!cancelled) {
          setProjects(projectsRes.ok ? list : []);
          if (statsRes.ok) {
            const data = await statsRes.json();
            setStats({
              totalProjects: data.totalProjects || 0,
              completedProjects: data.completedProjects || 0,
              totalContributors: data.totalContributors || 0,
            });
          } else if (projectsRes.ok) {
            setStats({
              totalProjects: list.length,
              completedProjects: list.filter((p) => (p.progress ?? 0) >= 100).length,
              totalContributors: list.reduce((sum, p) => sum + (p.totalContributors ?? 0), 0),
            });
          } else {
            setStats({ totalProjects: 0, completedProjects: 0, totalContributors: 0 });
          }
        }
      } catch (err) {
        console.error('Error fetching researcher profile data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [researcherId]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <ConstellationStarfieldBackground>
        <FlowNav />
        <div className="relative z-10 pt-28 text-center text-white/70">Loading…</div>
      </ConstellationStarfieldBackground>
    );
  }

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-5xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-white/90 mb-10 text-center">My Profile</h1>

        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div
              className="w-[150px] h-[150px] rounded-full flex items-center justify-center bg-white/10 border border-white/20"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            >
              <svg viewBox="0 0 24 24" className="w-[70px] h-[70px]" style={{ fill: 'rgba(255,255,255,0.9)' }}>
                <circle cx="12" cy="9" r="4" />
                <path d="M5 19c0-3.2 3-6 7-6s7 2.8 7 6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white/90 m-0">{user?.name ?? 'Researcher'}</h2>
            <p className="text-lg text-white/70 m-0">{user?.email ?? ''}</p>
          </div>

          <div className="flex-1 flex flex-col gap-6 w-full">
            <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-bold text-white/90 m-0 mb-5">Account Information</h3>
              <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                <span className="text-white/70 font-medium">Name</span>
                <span className="text-white/90">{user?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                <span className="text-white/70 font-medium">Email</span>
                <span className="text-white/90">{user?.email ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                <span className="text-white/70 font-medium">Account Type</span>
                <span className="text-white/90">{user?.role ?? '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <div className="text-3xl font-bold text-white/90 mb-1">{loading ? '...' : stats.totalProjects}</div>
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">Projects Submitted</div>
              </div>
              <div className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <div className="text-3xl font-bold text-white/90 mb-1">{loading ? '...' : stats.completedProjects}</div>
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">Completed Projects</div>
              </div>
              <div className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
                <div className="text-3xl font-bold text-white/90 mb-1">{loading ? '...' : stats.totalContributors}</div>
                <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">Total Contributors</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 w-full">
          <h2 className="text-2xl font-bold text-white/90 m-0 mb-4 text-center">My projects</h2>
          <p className="text-white/55 text-sm text-center m-0 mb-8 max-w-2xl mx-auto">
            Submissions from <strong className="text-white/80">Submit a project</strong> are stored here with run progress and stored file paths.
          </p>
          {loading ? (
            <p className="text-center text-white/60">Loading projects…</p>
          ) : projects.length === 0 ? (
            <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/70 m-0 mb-4">No projects yet.</p>
              <Link
                to="/submit"
                className="inline-flex items-center justify-center py-3 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors no-underline"
              >
                Submit a project
              </Link>
            </div>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-6">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white/95 m-0">{p.title}</h3>
                      <p className="text-xs text-white/45 font-mono m-0 mt-1 break-all">{p.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {p.status && (
                        <span className="text-xs uppercase tracking-wide px-2.5 py-1 rounded-lg bg-white/10 text-white/75">
                          {p.status}
                        </span>
                      )}
                      {p.latestRunStatus && (
                        <span className="text-xs uppercase tracking-wide px-2.5 py-1 rounded-lg bg-indigo-500/25 text-indigo-200 border border-indigo-400/30">
                          Run: {p.latestRunStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  {p.description ? (
                    <p className="text-white/70 text-sm leading-relaxed m-0 mb-4 whitespace-pre-wrap">{p.description}</p>
                  ) : null}
                  <div
                    className="h-2 rounded-full bg-white/10 overflow-hidden mb-4"
                    role="progressbar"
                    aria-valuenow={p.progress ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-emerald-500/80 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, p.progress ?? 0))}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/50 m-0 mb-4">
                    Progress: {p.completedTasks ?? 0} / {p.totalTasks ?? 0} tasks ({p.progress ?? 0}%)
                    {p.totalContributors != null ? ` · ${p.totalContributors} contributor(s)` : null}
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm m-0">
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Dataset type</dt>
                      <dd className="text-white/85 m-0 font-medium">{p.datasetType ?? '—'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Function</dt>
                      <dd className="text-white/85 m-0 font-medium">{p.funcName ?? '—'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Rows per task</dt>
                      <dd className="text-white/85 m-0 font-medium">{p.chunkSize ?? '—'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Replication factor</dt>
                      <dd className="text-white/85 m-0 font-medium">{p.replicationFactor ?? '—'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Max verification attempts</dt>
                      <dd className="text-white/85 m-0 font-medium">{p.maxVerificationAttempts ?? '—'}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Runs / latest run</dt>
                      <dd className="text-white/85 m-0 font-medium break-all">
                        {p.totalRuns ?? 0}
                        {p.latestRunId ? ` · ${p.latestRunId}` : ''}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2 sm:col-span-2">
                      <dt className="text-white/50 shrink-0">Tags</dt>
                      <dd className="text-white/85 m-0">
                        {p.tags && p.tags.length > 0 ? p.tags.join(', ') : '—'}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:col-span-2 gap-1">
                      <dt className="text-white/50">Stored code path</dt>
                      <dd className="text-white/75 m-0 font-mono text-xs break-all">{p.codePath || '—'}</dd>
                    </div>
                    <div className="flex flex-col sm:col-span-2 gap-1">
                      <dt className="text-white/50">Stored dataset path</dt>
                      <dd className="text-white/75 m-0 font-mono text-xs break-all">{p.datasetPath || '—'}</dd>
                    </div>
                    {p.resultUrl ? (
                      <div className="flex flex-col sm:col-span-2 gap-1">
                        <dt className="text-white/50">Results</dt>
                        <dd className="text-white/75 m-0 font-mono text-xs break-all">{p.resultUrl}</dd>
                      </div>
                    ) : null}
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Created</dt>
                      <dd className="text-white/85 m-0">{formatWhen(p.createdAt)}</dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="text-white/50 shrink-0">Updated</dt>
                      <dd className="text-white/85 m-0">{formatWhen(p.updatedAt)}</dd>
                    </div>
                    {p.averageTaskTime != null ? (
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <dt className="text-white/50 shrink-0">Avg task time (s)</dt>
                        <dd className="text-white/85 m-0 font-medium">{p.averageTaskTime}</dd>
                      </div>
                    ) : null}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-10">
          <button
            type="button"
            className="py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <Link to="/settings" className="no-underline">
            <button
              type="button"
              className="py-3.5 px-6 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors cursor-pointer"
            >
              Account Settings
            </button>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="py-3.5 px-6 rounded-xl font-medium text-white bg-red-500/80 hover:bg-red-500 border border-red-400/50 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
