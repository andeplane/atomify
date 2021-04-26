//@ts-ignore
import listContent from 'list-github-dir-content'
import { useEffect, useState } from 'react';

export const useListDirectory = (user: string, repository: string, directory: string) => {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  
  useEffect(() => {
    (async () => {
      setLoading(true)
      const filesArray = await listContent.viaContentsApi({
        user,
        repository,
        directory,
        token: process.env.GH_TOKEN
      });
      setLoading(false)
      setFiles(filesArray)
    })()
  }, [directory, repository, user])
  return {loading, files}
}