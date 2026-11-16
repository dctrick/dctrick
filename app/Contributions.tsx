type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
type Resp = { total: Record<string, number>; contributions: Day[] };

async function getContributions(user: string): Promise<Resp | null> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${user}?y=last`,
      { next: { revalidate: 60 * 60 * 6 } }
    );
    if (!res.ok) return null;
    return (await res.json()) as Resp;
  } catch {
    return null;
  }
}

export default async function Contributions({ user }: { user: string }) {
  const data = await getContributions(user);

  if (!data || data.contributions.length === 0) {
    return (
      <p className="muted">
        Couldn&apos;t load contributions right now.{" "}
        <a href={`https://github.com/${user}`}>See them on GitHub →</a>
      </p>
    );
  }

  const days = data.contributions;
  const total = days.reduce((s, d) => s + d.count, 0);
  const best = days.reduce((m, d) => Math.max(m, d.count), 0);

  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else if (i !== days.length - 1) break;
  }

  const pad = new Date(days[0].date).getUTCDay();
  const cells: (Day | null)[] = [...Array(pad).fill(null), ...days];

  return (
    <div>
      <div className="stats">
        <div><strong>{total}</strong><span>contributions this year</span></div>
        <div><strong>{streak}</strong><span>day streak</span></div>
        <div><strong>{best}</strong><span>best day</span></div>
      </div>
      <div className="graph-wrap">
        <div className="graph">
          {cells.map((d, i) =>
            d ? (
              <span
                key={d.date}
                className={`cell l${d.level}`}
                title={`${d.count} on ${d.date}`}
              />
            ) : (
              <span key={`p${i}`} className="cell empty" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
