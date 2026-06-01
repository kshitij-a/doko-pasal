'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Test() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    supabase.from('products').select('id, name').limit(3).then(({ data, error }) => {
      setData(data)
      setError(error)
    })
  }, [])

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>
      <p><b>URL:</b> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p className="mt-4"><b>Products found:</b></p>
      <pre className="bg-gray-100 p-4 rounded mt-2">{JSON.stringify(data, null, 2)}</pre>
      <p className="mt-4 text-red-500"><b>Error:</b> {JSON.stringify(error)}</p>
    </div>
  )
}