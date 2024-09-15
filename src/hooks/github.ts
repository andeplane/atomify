import useFetch from "react-fetch-hook";
import { GithubFile } from "../types";

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
    files_metadata = data.map((file: any) => ({
      title: file.name,
      path: file.path,
      download_url: file.download_url,
      size: file.size,
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
  const data = await response.json();
  let files: GithubFile[] = data.map((file: any) => ({
    title: file.name,
    path: file.path,
    download_url: file.download_url,
    size: file.size,
    type: file.type,
    key: file.path,
    children: [],
  }));
  return files;
};
