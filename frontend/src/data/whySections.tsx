export const sections = [
  {
    title: 'What is Distributed Computing?',
    body: (
      <>
        <p className="mb-2">
          Distributed computing spreads a single large computational problem across many devices: laptops, desktops, phones, and even Raspberry Pis. Instead of one supercomputer running for years, you get millions of smaller machines each doing a tiny slice of the work and returning results to a central project.
        </p>
        <p className="mb-2">
          This approach is ideal for tasks that can be split into independent chunks: simulating protein folding, searching for prime numbers, analyzing radio telescope data, or training machine-learning models. No single machine needs the full picture; the network assembles the results.
        </p>
        <p>
          The catch has always been getting enough people to participate and keep their devices available. That's where incentive design becomes critical.
        </p>
      </>
    ),
    icon: '◇',
    accent: 'violet',
  },
  {
    title: 'What Works Today',
    body: (
      <>
        <p className="mb-2">
          Platforms like <strong className="text-white/90">BOINC</strong> (Berkeley Open Infrastructure for Network Computing) and <strong className="text-white/90">Folding@home</strong> have been running for decades. They've contributed to published research in areas such as protein folding, disease modeling, climate prediction, and gravitational-wave detection. Researchers get compute they couldn't otherwise afford; volunteers get the satisfaction of contributing to science.
        </p>
        <p>
          These projects prove that the technical model works: tasks can be split, sent to volunteers, and aggregated reliably. The bottleneck isn't the tech. It's sustaining participation at scale over many years without burning out the goodwill of volunteers.
        </p>
      </>
    ),
    icon: '◆',
    accent: 'emerald',
  },
  {
    title: 'The Limitation',
    body: (
      <>
        <p className="mb-2">
          Current volunteer systems depend almost entirely on altruism. People run BOINC or Folding@home because they want to help. That's powerful, but it's also fragile. Participation fluctuates with news cycles, personal motivation, and economic pressure. When life gets busy, the first thing to go is often "background compute for a cause."
        </p>
        <p className="mb-2">
          That makes it hard for researchers to plan. They can't assume a stable, predictable amount of compute month over month. Projects that need sustained capacity over years face an inherent ceiling: how many people will keep donating spare cycles with no tangible return?
        </p>
        <p>
          The question isn't whether volunteer computing is valuable (it is), but whether we can add a layer that makes participation more consistent and scalable without losing the spirit of contributing to science.
        </p>
      </>
    ),
    icon: '▷',
    accent: 'violet',
  },
  {
    title: 'The Constellation Approach',
    body: (
      <>
        <p className="mb-2">
          Constellation keeps everything that works about volunteer computing: the same kind of tasks, the same ability to contribute from your own device. It adds a clear incentive structure. Participants earn rewards for the compute they contribute, so there's a reason to stay involved even when life gets busy or attention shifts.
        </p>
        <p className="mb-2">
          For researchers, that means a more dependable network. Instead of hoping enough volunteers show up, projects can plan around a base of participants who are motivated to keep their devices available. The result is distributed computing that can scale reliably and last for the long term.
        </p>
        <p>
          Constellation doesn't replace volunteer spirit; it gives it a sustainable engine so that more people can participate, more consistently, and more research can get done.
        </p>
      </>
    ),
    icon: '★',
    accent: 'emerald',
  },
];

export const accentBorder: Record<string, string> = {
  violet: 'border-l-violet-400/50',
  emerald: 'border-l-emerald-400/50',
};
