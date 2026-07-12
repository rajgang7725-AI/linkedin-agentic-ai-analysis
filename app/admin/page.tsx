import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { createSupabaseServerClient } from '@/app/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function updateStatus(analysisId: string, newStatus: string) {
  'use server'
  await supabaseAdmin
    .from('analyses')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', analysisId)
  revalidatePath('/admin')
}

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: analyses, error } = await supabaseAdmin
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
    .order('created_at', { ascending: false })

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 900 }}>
      <h1>Admin Dashboard</h1>
      <p>Logged in as {user.email}</p>

      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      {analyses?.map((a) => (
        <div key={a.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>Status:</strong> {a.status}</p>
          <p><strong>By:</strong> {(a.posts as any)?.author_name}</p>
          <p><strong>Excerpt:</strong> {(a.posts as any)?.excerpt}</p>
          <p><strong>Summary:</strong> {a.summary}</p>
          <p><strong>Commentary:</strong> {a.commentary}</p>
          <p><strong>Difficulty:</strong> {a.difficulty}</p>
          <p>
            <strong>Tags:</strong>{' '}
            {a.analysis_tags?.map((t: any) => t.tags?.name).join(', ')}
          </p>
          <p>
            <strong>Audiences:</strong>{' '}
            {a.analysis_audiences?.map((aud: any) => aud.audiences?.name).join(', ')}
          </p>
          <a href={(a.posts as any)?.linkedin_url} target="_blank" rel="noopener noreferrer">
            View original post →
          </a>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <form action={async () => { 'use server'; await updateStatus(a.id, 'published') }}>
              <button type="submit" disabled={a.status === 'published'} style={{ padding: '0.4rem 0.8rem' }}>
                ✅ Approve & Publish
              </button>
            </form>
            <form action={async () => { 'use server'; await updateStatus(a.id, 'rejected') }}>
              <button type="submit" disabled={a.status === 'rejected'} style={{ padding: '0.4rem 0.8rem' }}>
                ❌ Reject
              </button>
            </form>
            <form action={async () => { 'use server'; await updateStatus(a.id, 'pending_review') }}>
              <button type="submit" disabled={a.status === 'pending_review'} style={{ padding: '0.4rem 0.8rem' }}>
                ↩️ Reset to Pending
              </button>
            </form>
          </div>
        </div>
      ))}
    </main>
  )
}