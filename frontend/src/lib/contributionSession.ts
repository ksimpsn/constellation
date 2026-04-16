/**
 * Tracks which project the volunteer started contributing from on this browser/device.
 * Used so we can show "Stop contributing" after refresh and pair UI with local Ray teardown.
 */
const STORAGE_KEY = "constellation_active_contribution";

export type ActiveContribution = {
  projectId: string;
  userId: string;
  startedAt: string;
};

export function readActiveContribution(): ActiveContribution | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<ActiveContribution>;
    if (
      typeof data.projectId === "string" &&
      typeof data.userId === "string" &&
      typeof data.startedAt === "string"
    ) {
      return data as ActiveContribution;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setActiveContribution(projectId: string, userId: string): void {
  const payload: ActiveContribution = {
    projectId,
    userId,
    startedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearActiveContribution(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isContributingToProject(projectId: string, userId: string): boolean {
  const s = readActiveContribution();
  return s !== null && s.projectId === String(projectId) && s.userId === userId;
}
