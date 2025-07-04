import useFetch from "react-fetch-hook";
import { GithubFile } from "../types";

// Minimal subset of the GitHub REST API response for the
// "Get repository content" endpoint (https://docs.github.com/en/rest/repos/contents#get-repository-content).
// We only include the fields that this code accesses.
interface GitHubContentResponse {
  name: string;
  path: string;
  download_url: string | null;
  size: number;
  type: "file" | "dir" | "symlink" | "submodule";
}

export const useListDirectory = (
  user: string,
  repository: string,
  directory: string,
) => {
  const url = `https://api.github.com/repos/${user}/${repository}/contents/${directory}`;
  const { isLoading, data } = useFetch<GitHubContentResponse[]>(url, {
    formatter: (response) => response.json(),
  });

  const files_metadata: GithubFile[] = (data ?? []).map((file) => ({
    title: file.name,
    path: file.path,
    key: file.path,
    download_url: file.download_url ?? "",
    size: file.size,
    type: file.type === "dir" ? "dir" : "file",
    expanded: false,
    isLeaf: file.type !== "dir",
    children: [],
  }));

  return { isLoading, files_metadata };
};

export const retrievePath = async (
  user: string,
  repository: string,
  directory: string,
  /** Optional personal access token to increase the GitHub API rate-limit. */
  token?: string,
) => {
  const url = `https://api.github.com/repos/${user}/${repository}/contents/${directory}`;

  /*
   * For public repositories the GitHub REST API does not require authentication.
   * However, unauthenticated requests are limited to 60 / hour which can be too
   * restrictive for heavy use. Instead of hard-coding a long-lived personal
   * access token in the client bundle (which is both insecure and inflexible),
   * we let callers pass in a token at runtime – for instance via an environment
   * variable or UI settings – and only attach the Authorization header when a
   * token is supplied.
   */
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  const data: GitHubContentResponse[] = await response.json();

  const files: GithubFile[] = data.map((file) => ({
    title: file.name,
    path: file.path,
    key: file.path,
    download_url: file.download_url ?? "",
    size: file.size,
    type: file.type === "dir" ? "dir" : "file",
    expanded: false,
    isLeaf: file.type !== "dir",
    children: [],
  }));

  return files;
};
