import useFetch from "react-fetch-hook";
import {GithubFile} from 'types'

export const useListDirectory = (user: string, repository: string, directory: string) => {
  const url = `https://api.github.com/repos/${user}/${repository}/contents/${directory}`
  const { isLoading, data } = useFetch(url, {formatter: (response) => response.json()})
  let files_metadata: GithubFile[] = []
  if (data) {
    files_metadata = data.map( (file: any) => (
      {
        name: file.name, 
        path: file.path, 
        download_url: file.download_url, 
        size: file.size
      }
    ))
  }
  return {isLoading, files_metadata}
}