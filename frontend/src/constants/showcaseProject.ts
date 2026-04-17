/**
 * Demo project (UI-only): dense constellation + synthetic stats for project details.
 */
export const SHOWCASE_PROJECT_ID = "constellation-showcase";

export const showcaseProjectBrowse = {
  id: SHOWCASE_PROJECT_ID,
  title: "LMC Shell Atlas — Community Sky Map",
  description:
    "A wide-area survey in the Large Magellanic Cloud: volunteers triage faint circumstellar shells " +
    "and arcs in survey cutouts. The map below links every contributor as a star—find the bright " +
    "yellow point that marks you when you're contributing.",
  tags: [
    "Physics & astronomy",
    "Open science",
    "Image / signal processing",
    "Citizen science",
    "Community",
  ],
  researcherName: "Dr. Elena Okonkwo",
  researcherId: "e.okonkwo",
  whyJoin: [
    "Join one of the largest active contributor meshes on the platform.",
    "Every classification improves the public release catalog.",
    "Your worker shows up as the highlighted star on the map when connected.",
  ],
  learnMore: [
    {
      label: "Large Magellanic Cloud",
      url: "https://en.wikipedia.org/wiki/Large_Magellanic_Cloud",
    },
    {
      label: "Citizen astronomy",
      url: "https://en.wikipedia.org/wiki/Citizen_science",
    },
  ],
};

/** Rich stats so the constellation uses many points (Delaunay + spanning tree). */
export function getShowcaseProjectStats() {
  const b = showcaseProjectBrowse;
  return {
    id: SHOWCASE_PROJECT_ID,
    progress: 84,
    participantCount: 96,
    totalContributors: 95,
    activeContributors: 18,
    completedContributors: 82,
    totalTasks: 5100,
    completedTasks: 4288,
    failedTasks: 14,
    totalRuns: 140,
    averageTaskTime: 38.2,
    status: "active",
    latestRunId: undefined as string | undefined,
    latestRunStatus: "running",
    createdAt: "2024-08-15T10:00:00",
    updatedAt: "2026-03-20T14:00:00",
    totalChunks: 920,
    verifiedChunks: 774,
    failedVerifications: 2,
    researcherId: b.researcherId,
    title: b.title,
    description: b.description,
    tags: [...b.tags],
    whyJoin: [...b.whyJoin],
    learnMore: b.learnMore.map((x) => ({ ...x })),
    replicationFactor: 2,
    maxVerificationAttempts: 2,
    datasetType: "fits",
    awsTotalChunks: 920,
    awsChunksCompleted: 774,
  };
}
