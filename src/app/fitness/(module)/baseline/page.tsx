import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BaselineLogForm } from '@/components/fitness/baseline/baseline-log-form'
import { BaselineHistory, type BaselineTest } from '@/components/fitness/baseline/baseline-history'
import { BaselineChart } from '@/components/fitness/baseline/baseline-chart'
import { BaselineProtocol } from '@/components/fitness/baseline/baseline-protocol'
import { ClipboardCheck, Hash } from 'lucide-react'

export default async function BaselinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tests } = await supabase
    .from('baseline_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('tested_at', { ascending: false })

  const baselineTests = (tests ?? []) as BaselineTest[]
  const hasHistory = baselineTests.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-accent" />
        <h1 className="text-primary font-bold text-xl">Baseline Fitness Test</h1>
      </div>

      {/* Left: History + Log Form (70%) | Right: Tests Completed + Protocol (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">
          {hasHistory ? (
            <BaselineHistory tests={baselineTests} />
          ) : (
            <div className="rounded-lg border border-subtle bg-surface p-4 text-center text-muted text-sm">
              Log your first baseline test to start tracking progress.
            </div>
          )}
          <BaselineLogForm />
          {hasHistory && <BaselineChart tests={baselineTests} />}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Tests completed count */}
          <div className="rounded-lg border border-subtle bg-surface p-4 flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/15">
              <Hash className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-primary font-bold text-lg">{baselineTests.length}</div>
              <div className="text-muted text-xs">
                {baselineTests.length === 1 ? 'Test Completed' : 'Tests Completed'}
              </div>
            </div>
          </div>
          <BaselineProtocol />
        </div>
      </div>
    </div>
  )
}
