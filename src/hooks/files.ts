import {useState, useEffect} from 'react'
import localforage from 'localforage'

localforage.config({
    driver      : localforage.INDEXEDDB,
    name        : 'JupyterLite Storage',
    storeName   : 'files', // Should be alphanumeric, with underscores.
    description : 'some description'
});

export const useListSimulations = async () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    
    useEffect(() => {
        (async () => {
            const keys = await localforage.keys()
            const simulations = []

            for (let key of keys) {
                const file = await localforage.getItem(key) as any
                if (file.type === 'directory') {
                    
                }
            }
        })()

    })
}