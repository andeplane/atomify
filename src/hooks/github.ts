import useFetch from "react-fetch-hook";
import { GithubFile } from "../types";

interface GithubContentItem {
  name: string;
  path: string;
  download_url: string | null;
  size: number;
  type: "file" | "dir";
}

export const useListDirectory = (
  user: string,
  repository: string,
  directory: string,
) => {
  const url = `https://api.github.com/repos/${user}/${repository}/contents/${directory}`;
  const { isLoading, data } = useFetch(url, {
    formatter: (response) => response.json(),
  });
  let files_metadata: GithubFile[] = [];
  if (data) {
    files_metadata = (data as GithubContentItem[]).map((file) => ({
      title: file.name,
      path: file.path,
      download_url: file.download_url ?? undefined,
      size: file.size,
      type: file.type,
      key: file.path,
      expanded: false,
      isLeaf: file.type === "file",
      children: [],
    }));
  }
  return { isLoading, files_metadata };
};

export const retrievePath = async (
  user: string,
  repository: string,
  directory: string,
) => {
  const url = `https://api.github.com/repos/${user}/${repository}/contents/${directory}`;
  const response = await fetch(url, {
    headers: {
      Authorization: "Bearer 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",
    },
  });
  const data = (await response.json()) as GithubContentItem[];
  let files: GithubFile[] = data.map((file) => ({
    title: file.name,
    path: file.path,
    download_url: file.download_url ?? undefined,
    size: file.size,
    type: file.type,
    key: file.path,
    expanded: false,
    isLeaf: file.type === "file",
    children: [],
  }));
  return files;
};
