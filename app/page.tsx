import { supabase } from '@/app/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('tags').select('*')

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Supabase Connection Test</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {!error && (
        <p>
          ✅ Connected successfully. Found {data?.length ?? 0} rows in the
          "tags" table (expected: 0, since we haven't added any yet).
        </p>
      )}
    </main>
  )
}