import { profile } from "@/data";

export const revalidate = 21600;

type Day = { date: string; contributionCount: number };
type Collection = {
  totalCommitContributions: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: { contributionDays: Day[] }[];
  };
};

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      totalCommitContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

async function fetchCollection(): Promise<Collection | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { login: profile.github } }),
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { user: { contributionsCollection: Collection } | null };
    };
    return json.data?.user?.contributionsCollection ?? null;
  } catch {
    return null;
  }
}

function streaks(days: Day[]) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.contributionCount > 0) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  // Today may still be empty without breaking the streak.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current++;
    else if (i !== days.length - 1) break;
  }
  return { current, longest };
}

const BG = "#0c0c0c";
const BORDER = "#1f1f1f";
const FG = "#ededed";
const MUTED = "#8a8a8a";
const ACCENT = "#17b4ff";
const FONT = "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

function metric(x: number, value: string, label: string) {
  return `<text x="${x}" y="110" fill="${ACCENT}" font-size="30" font-weight="600" font-family="${FONT}">${value}</text>
<text x="${x}" y="134" fill="${MUTED}" font-size="13" font-family="${FONT}">${label}</text>`;
}

function card(title: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195" role="img" aria-label="${title}">
<rect x="0.5" y="0.5" width="494" height="194" rx="10" fill="${BG}" stroke="${BORDER}"/>
<text x="25" y="48" fill="${FG}" font-size="18" font-weight="600" font-family="${FONT}">${title}</text>
${body}
</svg>`;
}

function unavailable(title: string) {
  return card(
    title,
    `<text x="25" y="110" fill="${MUTED}" font-size="14" font-family="${FONT}">Stats unavailable right now.</text>`
  );
}

function svgResponse(svg: string) {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(req: Request) {
  const card_ = new URL(req.url).searchParams.get("card") === "streak" ? "streak" : "stats";
  const c = await fetchCollection();

  if (card_ === "streak") {
    if (!c) return svgResponse(unavailable("Contribution Streak"));
    const days = c.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
    const { current, longest } = streaks(days);
    return svgResponse(
      card(
        "Contribution Streak",
        metric(25, `${current}`, "Current streak") +
          metric(190, `${longest}`, "Longest streak") +
          metric(355, `${c.contributionCalendar.totalContributions}`, "Last year")
      )
    );
  }

  if (!c) return svgResponse(unavailable("GitHub Stats"));
  return svgResponse(
    card(
      "GitHub Stats",
      metric(25, `${c.contributionCalendar.totalContributions}`, "Contributions") +
        metric(190, `${c.totalCommitContributions}`, "Commits") +
        metric(355, `${Math.max(0, ...c.contributionCalendar.weeks.flatMap((w) => w.contributionDays).map((d) => d.contributionCount))}`, "Best day")
    )
  );
}
