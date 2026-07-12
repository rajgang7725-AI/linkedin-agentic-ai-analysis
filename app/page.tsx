import { supabase } from '@/app/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase
    .from('analyses')
    .select(`
      id,
      summary,
      commentary,
      difficulty,
      status,
      posts ( linkedin_url, author_name, excerpt ),
      analysis_tags ( tags ( name ) ),
      analysis_audiences ( audiences ( name ) )
    `)

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Published Analyses</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {!error && data?.length === 0 && <p>No published analyses found.</p>}
      {data?.map((a) => (
        <div key={a.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>By:</strong> {a.posts?.author_name}</p>
          <p><strong>Excerpt:</strong> {a.posts?.excerpt}</p>
          <p><strong>Summary:</strong> {a.summary}</p>
          <p><strong>Commentary:</strong> {a.commentary}</p>
          <p><strong>Difficulty:</strong> {a.difficulty}</p>
        </div>
      ))}
    </main>
  )
}