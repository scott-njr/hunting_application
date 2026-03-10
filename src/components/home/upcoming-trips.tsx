import Link from 'next/link'
import { MapPin, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpcomingTrip {
  id: string
  title: string
  state: string
  species: string
  unit: string | null
  status: 'planning' | 'applied' | 'booked'
  trip_start_date: string | null
  trip_end_date: string | null
  trip_days: number | null
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Dates TBD'
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (!end || start === end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

export function UpcomingTrips({ trips }: { trips: UpcomingTrip[] }) {
  if (trips.length === 0) {
    return (
      <div className="rounded-lg border border-subtle bg-surface p-5 text-center">
        <p className="text-muted text-sm">No upcoming hunts or trips planned.</p>
        <Link href="/hunting/hunts" className="text-accent text-xs hover:text-accent-hover mt-2 inline-block">
          Plan a hunt &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {trips.map(trip => (
        <Link
          key={trip.id}
          href="/hunting/hunts"
          className="block rounded-lg border border-subtle bg-surface p-4 hover:border-default transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span className="text-primary font-medium text-sm truncate">{trip.title}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-secondary">
                <span>{trip.state} · {trip.species}{trip.unit ? ` · Unit ${trip.unit}` : ''}</span>
              </div>
            </div>
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded flex-shrink-0',
              trip.status === 'booked' ? 'bg-accent/15 text-accent' : trip.status === 'applied' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
            )}>
              {trip.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
            <Calendar className="h-3 w-3" />
            <span>{formatDateRange(trip.trip_start_date, trip.trip_end_date)}</span>
            {trip.trip_days && <span>· {trip.trip_days} day{trip.trip_days !== 1 ? 's' : ''}</span>}
          </div>
        </Link>
      ))}
    </div>
  )
}
