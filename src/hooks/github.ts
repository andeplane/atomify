//@ts-ignore
import listContent from 'list-github-dir-content'
import useFetch from "react-fetch-hook";
import {GithubFile} from 'types'

export const useListDirectory = (user: string, repository: string, directory: string) => {
  const url = `https://api.github.com/repos/${user}/${repository}/contents/${directory}`
  const { isLoading, data } = useFetch(url, {formatter: (response) => response.json()})
  console.log(isLoading, data)
  let files: GithubFile[] = []
  if (data) {
    files = data.map( (file: any) => (
      {
        name: file.name, 
        path: file.path, 
        downloadUrl: file.download_url, 
        size: file.size
      }
    ))
  }
  return {isLoading, files}
}