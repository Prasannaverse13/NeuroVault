/**
 * GitHub API service — real-time repository data retrieval.
 * All functions fetch live data using a stored PAT/OAuth token.
 */

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  updatedAt: string;
  htmlUrl: string;
  private: boolean;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: "open" | "closed";
  author: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
  body: string | null;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  author: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  url: string;
  draft: boolean;
  additions?: number;
  deletions?: number;
}

export interface GitHubSummary {
  repos: GitHubRepo[];
  totalStars: number;
  totalOpenIssues: number;
  languages: string[];
  fetchedAt: string;
}

const authHeader = (token: string) =>
  token.startsWith("github_pat_") ? `Bearer ${token}` : `token ${token}`;

const ghFetch = async (token: string, path: string, params?: Record<string, string>) => {
  const url = new URL(`https://api.github.com${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader(token.trim()),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "NeuroVault-Enterprise/1.0",
    },
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as any;
    throw new Error(`GitHub API ${r.status}: ${err?.message ?? r.statusText}`);
  }
  return r.json();
};

export const getRepositories = async (
  token: string,
  opts: { perPage?: number; sort?: "updated" | "pushed" | "created" | "full_name" } = {},
): Promise<GitHubRepo[]> => {
  const data = await ghFetch(token, "/user/repos", {
    per_page: String(opts.perPage ?? 50),
    sort: opts.sort ?? "updated",
    affiliation: "owner,collaborator,organization_member",
  }) as any[];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? null,
    language: r.language ?? null,
    stargazersCount: r.stargazers_count,
    forksCount: r.forks_count,
    openIssuesCount: r.open_issues_count,
    defaultBranch: r.default_branch,
    updatedAt: r.updated_at,
    htmlUrl: r.html_url,
    private: r.private,
  }));
};

export const getRecentCommits = async (
  token: string,
  repoFullName: string,
  limit = 10,
): Promise<GitHubCommit[]> => {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo format: ${repoFullName}`);
  const data = await ghFetch(token, `/repos/${owner}/${repo}/commits`, {
    per_page: String(limit),
  }) as any[];
  return data.map((c) => ({
    sha: c.sha.slice(0, 8),
    message: c.commit.message.split("\n")[0],
    author: c.commit.author?.name ?? c.author?.login ?? "unknown",
    authorEmail: c.commit.author?.email ?? "",
    date: c.commit.author?.date ?? "",
    url: c.html_url,
  }));
};

export const getRepositoryIssues = async (
  token: string,
  repoFullName: string,
  opts: { state?: "open" | "closed" | "all"; limit?: number } = {},
): Promise<GitHubIssue[]> => {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo format: ${repoFullName}`);
  const data = await ghFetch(token, `/repos/${owner}/${repo}/issues`, {
    state: opts.state ?? "open",
    per_page: String(opts.limit ?? 20),
    pulls: "false",
  }) as any[];
  return data
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      author: i.user?.login ?? "unknown",
      labels: i.labels?.map((l: any) => l.name) ?? [],
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      url: i.html_url,
      body: i.body ? i.body.slice(0, 300) : null,
    }));
};

export const getPullRequests = async (
  token: string,
  repoFullName: string,
  opts: { state?: "open" | "closed" | "all"; limit?: number } = {},
): Promise<GitHubPullRequest[]> => {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo format: ${repoFullName}`);
  const data = await ghFetch(token, `/repos/${owner}/${repo}/pulls`, {
    state: opts.state ?? "open",
    per_page: String(opts.limit ?? 20),
    sort: "updated",
  }) as any[];
  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.merged_at ? "merged" : pr.state,
    author: pr.user?.login ?? "unknown",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at ?? null,
    url: pr.html_url,
    draft: pr.draft ?? false,
  }));
};

export const getRepositorySummary = async (
  token: string,
  repoFullName: string,
): Promise<{ repo: GitHubRepo; commits: GitHubCommit[]; issues: GitHubIssue[]; prs: GitHubPullRequest[] }> => {
  const repos = await getRepositories(token, { perPage: 100 });
  const repo = repos.find((r) => r.fullName === repoFullName);
  if (!repo) throw new Error(`Repository ${repoFullName} not found or not accessible`);
  const [commits, issues, prs] = await Promise.all([
    getRecentCommits(token, repoFullName, 10),
    getRepositoryIssues(token, repoFullName, { state: "open", limit: 10 }),
    getPullRequests(token, repoFullName, { state: "open", limit: 10 }),
  ]);
  return { repo, commits, issues, prs };
};

/**
 * Build a rich text summary of GitHub data for injection into Gemini context.
 */
export const buildGitHubContext = async (
  token: string,
  pinnedRepo?: string,
): Promise<string> => {
  const repos = await getRepositories(token, { perPage: 30, sort: "updated" });
  const topRepos = repos.slice(0, 10);

  const repoList = topRepos
    .map((r) => `  • ${r.fullName} [${r.language ?? "?"}] ★${r.stargazersCount} — ${r.openIssuesCount} open issues — ${r.description ?? "no description"}`)
    .join("\n");

  let detailBlock = "";
  const targetRepo = pinnedRepo ?? topRepos[0]?.fullName;
  if (targetRepo) {
    try {
      const [commits, issues, prs] = await Promise.all([
        getRecentCommits(token, targetRepo, 5),
        getRepositoryIssues(token, targetRepo, { state: "open", limit: 5 }),
        getPullRequests(token, targetRepo, { state: "open", limit: 5 }),
      ]);

      const commitLines = commits.map((c) => `    ${c.sha} ${c.author}: ${c.message}`).join("\n");
      const issueLines = issues.map((i) => `    #${i.number} [${i.labels.join(",")}] ${i.title}`).join("\n");
      const prLines = prs.map((p) => `    #${p.number} ${p.draft ? "[DRAFT] " : ""}${p.title} by @${p.author}`).join("\n");

      detailBlock = `
Focused repository: ${targetRepo}
Recent commits (last 5):
${commitLines || "    (none)"}
Open issues (top 5):
${issueLines || "    (none)"}
Open pull requests (top 5):
${prLines || "    (none)"}`;
    } catch {
      detailBlock = `\nNote: Could not fetch details for ${targetRepo}`;
    }
  }

  return `GitHub Integration — ${repos.length} repositories accessible
Top repositories by last updated:
${repoList}${detailBlock}`;
};
