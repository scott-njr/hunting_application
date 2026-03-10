import React from 'react'
import { Document, Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HuntPlanPDFProps {
  plan: {
    title: string
    hunt_type: string | null
    state_name: string
    state: string
    species: string
    season: string
    year: number
    unit: string | null
    status: string
    trip_start_date: string | null
    trip_end_date: string | null
    trip_days: number | null
    budget: string | null
    terrain_difficulty: string | null
    fly_or_drive: string | null
    base_camp: string | null
    base_camp_state: string | null
    notes: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
  }
  members: {
    display_name: string
    email: string | null
    phone: string | null
    role: string
    tag_status: string | null
  }[]
  locations: {
    label: string
    description: string | null
    lat: number | null
    lng: number | null
    scout_report: {
      text?: string
      sections?: { key: string; title: string; rows: { label: string; value: string }[] }[]
    } | null
  }[]
  gearItems: { name: string; category: string | null; brand: string | null }[]
  ownerName: string
  ownerEmail: string
}

// ─── Label maps ──────────────────────────────────────────────────────────────

const HUNT_TYPE_LABELS: Record<string, string> = {
  group_draw: 'Group Draw',
  otc: 'OTC / No Draw',
  out_of_state: 'Out of State',
  in_state: 'In State',
  solo: 'Solo Hunt',
}

const SPECIES_LABELS: Record<string, string> = {
  elk: 'Elk', mule_deer: 'Mule Deer', whitetail: 'Whitetail', pronghorn: 'Pronghorn',
  black_bear: 'Black Bear', mountain_lion: 'Mountain Lion', bighorn_sheep: 'Bighorn Sheep',
  mountain_goat: 'Mountain Goat', moose: 'Moose', turkey: 'Turkey',
  waterfowl: 'Waterfowl', upland: 'Upland Birds',
}

const WEAPON_LABELS: Record<string, string> = {
  rifle: 'Rifle', archery: 'Archery', muzzleloader: 'Muzzleloader',
  shotgun: 'Shotgun', handgun: 'Handgun', any: 'Any Legal',
}

const BUDGET_LABELS: Record<string, string> = {
  under_500: 'Under $500', '500_2000': '$500 – $2,000', '2000_5000': '$2,000 – $5,000',
  '5000_15000': '$5,000 – $15,000', '15000_plus': '$15,000+',
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', booked: 'Booked', completed: 'Completed', cancelled: 'Cancelled',
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sage = '#5a7a4a'
const darkGreen = '#3d5a30'

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  // Header
  header: { marginBottom: 20 },
  brand: { fontSize: 8, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: darkGreen, marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#666' },
  // Sections
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11, fontFamily: 'Helvetica-Bold', color: sage, textTransform: 'uppercase',
    letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 4, marginBottom: 8,
  },
  // Detail rows
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, fontSize: 9, color: '#666', fontFamily: 'Helvetica-Bold' },
  value: { flex: 1, fontSize: 10, color: '#1a1a1a' },
  // Tables
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f0', padding: 6, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#555', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  tableCell: { fontSize: 9 },
  // Location cards
  locCard: { marginBottom: 12, padding: 10, backgroundColor: '#fafaf8', borderWidth: 0.5, borderColor: '#ddd', borderRadius: 3 },
  locLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  locDesc: { fontSize: 9, color: '#555', marginBottom: 4 },
  locCoords: { fontSize: 8, color: '#888' },
  // Gear checklist
  gearCategory: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: sage, marginTop: 6, marginBottom: 3 },
  gearItem: { flexDirection: 'row', marginBottom: 2, marginLeft: 8 },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: '#999', marginRight: 6, marginTop: 1 },
  gearText: { fontSize: 9 },
  gearBrand: { fontSize: 8, color: '#888' },
  // Emergency
  emergencyBox: { padding: 10, backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#e8c8c8', borderRadius: 3, marginTop: 8 },
  emergencyTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#c44', marginBottom: 4 },
  // Footer
  footer: { position: 'absolute', bottom: 25, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#aaa' },
  // Notes
  notes: { fontSize: 9, color: '#333', lineHeight: 1.5 },
  // Scout report
  scoutSection: { marginLeft: 8, marginTop: 4 },
  scoutRow: { flexDirection: 'row', marginBottom: 2 },
  scoutLabel: { width: 100, fontSize: 8, color: '#666' },
  scoutValue: { flex: 1, fontSize: 8, color: '#333' },
  // Map
  mapImage: { width: '100%', height: 180, borderRadius: 3, marginBottom: 6, objectFit: 'cover' as const },
  // Divider
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#ddd', marginVertical: 8 },
  // None text
  none: { fontSize: 9, color: '#999', fontStyle: 'italic' },
})

// ─── Helper components ───────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  )
}

function formatDate(d: string | null): string | null {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function staticMapUrl(lat: number, lng: number): string {
  // OpenStreetMap static map — no API key required
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=13&size=600x300&markers=${lat},${lng},ol-marker`
}

// ─── Document ────────────────────────────────────────────────────────────────

export function HuntPlanDocument({ plan, members, locations, gearItems, ownerName, ownerEmail }: HuntPlanPDFProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Group gear by category
  const gearByCategory: Record<string, { name: string; brand: string | null }[]> = {}
  for (const g of gearItems) {
    const cat = g.category || 'Other'
    if (!gearByCategory[cat]) gearByCategory[cat] = []
    gearByCategory[cat].push(g)
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page} wrap>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>Lead the Wild by Praevius</Text>
          <Text style={s.title}>{plan.title}</Text>
          <Text style={s.subtitle}>
            {STATUS_LABELS[plan.status] ?? plan.status} — {plan.year}
            {plan.hunt_type ? ` — ${HUNT_TYPE_LABELS[plan.hunt_type] ?? plan.hunt_type}` : ''}
          </Text>
        </View>

        {/* Hunt Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hunt Summary</Text>
          <DetailRow label="State" value={plan.state_name} />
          <DetailRow label="Unit / GMU" value={plan.unit} />
          <DetailRow label="Species" value={SPECIES_LABELS[plan.species] ?? plan.species} />
          <DetailRow label="Weapon / Season" value={WEAPON_LABELS[plan.season] ?? plan.season} />
          <DetailRow label="Trip Dates" value={
            plan.trip_start_date && plan.trip_end_date
              ? `${formatDate(plan.trip_start_date)} – ${formatDate(plan.trip_end_date)}`
              : plan.trip_start_date ? formatDate(plan.trip_start_date) : null
          } />
          <DetailRow label="Duration" value={plan.trip_days ? `${plan.trip_days} days` : null} />
          <DetailRow label="Travel" value={plan.fly_or_drive === 'fly' ? 'Fly' : plan.fly_or_drive === 'drive' ? 'Drive' : null} />
          <DetailRow label="Base Camp" value={
            plan.base_camp
              ? plan.base_camp_state ? `${plan.base_camp}, ${plan.base_camp_state}` : plan.base_camp
              : null
          } />
          <DetailRow label="Budget" value={plan.budget ? (BUDGET_LABELS[plan.budget] ?? plan.budget) : null} />
          <DetailRow label="Terrain" value={plan.terrain_difficulty ? plan.terrain_difficulty.charAt(0).toUpperCase() + plan.terrain_difficulty.slice(1) : null} />
          {plan.notes && (
            <View style={{ marginTop: 8 }}>
              <Text style={s.label}>Notes</Text>
              <Text style={s.notes}>{plan.notes}</Text>
            </View>
          )}
        </View>

        {/* Hunt Party */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hunt Party</Text>
          <View style={s.row}>
            <Text style={s.label}>Plan Owner</Text>
            <Text style={s.value}>{ownerName} ({ownerEmail})</Text>
          </View>
          <View style={s.divider} />
          {members.length > 0 ? (
            <View>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: 120 }]}>Name</Text>
                <Text style={[s.tableHeaderCell, { width: 140 }]}>Email</Text>
                <Text style={[s.tableHeaderCell, { width: 90 }]}>Phone</Text>
                <Text style={[s.tableHeaderCell, { width: 70 }]}>Role</Text>
              </View>
              {members.map((m, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={[s.tableCell, { width: 120 }]}>{m.display_name}</Text>
                  <Text style={[s.tableCell, { width: 140 }]}>{m.email ?? '—'}</Text>
                  <Text style={[s.tableCell, { width: 90 }]}>{m.phone ?? '—'}</Text>
                  <Text style={[s.tableCell, { width: 70, textTransform: 'capitalize' }]}>{m.role}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.none}>No party members added.</Text>
          )}

          {(plan.emergency_contact_name || plan.emergency_contact_phone) && (
            <View style={s.emergencyBox}>
              <Text style={s.emergencyTitle}>Emergency Contact</Text>
              {plan.emergency_contact_name && (
                <View style={s.row}>
                  <Text style={s.label}>Name</Text>
                  <Text style={s.value}>{plan.emergency_contact_name}</Text>
                </View>
              )}
              {plan.emergency_contact_phone && (
                <View style={s.row}>
                  <Text style={s.label}>Phone</Text>
                  <Text style={s.value}>{plan.emergency_contact_phone}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Locations — each location gets full treatment with map + complete scout report */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Locations</Text>
          {locations.length > 0 ? (
            locations.map((loc, i) => (
              <View key={i} style={s.locCard} wrap={false}>
                <Text style={s.locLabel}>{loc.label}</Text>
                {loc.description && <Text style={s.locDesc}>{loc.description}</Text>}
                {loc.lat != null && loc.lng != null && (
                  <View style={{ marginBottom: 6 }}>
                    <Image src={staticMapUrl(loc.lat, loc.lng)} style={s.mapImage} />
                    <Text style={s.locCoords}>{loc.lat.toFixed(5)}°N, {loc.lng.toFixed(5)}°W</Text>
                    <Link src={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} style={{ fontSize: 8, color: sage }}>
                      Open in Google Maps
                    </Link>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={s.none}>No locations added.</Text>
          )}
        </View>

        {/* Full Scout Reports — separate section so they can flow across pages */}
        {locations.some(loc => loc.scout_report) && (
          <View style={s.section} break>
            <Text style={s.sectionTitle}>Scout Reports</Text>
            {locations.filter(loc => loc.scout_report).map((loc, i) => (
              <View key={i} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: darkGreen, marginBottom: 6 }}>
                  {loc.label}{loc.description ? ` — ${loc.description}` : ''}
                </Text>
                {loc.lat != null && loc.lng != null && (
                  <Text style={{ fontSize: 8, color: '#888', marginBottom: 6 }}>{loc.lat.toFixed(5)}°N, {loc.lng.toFixed(5)}°W</Text>
                )}
                {loc.scout_report?.sections && loc.scout_report.sections.length > 0 ? (
                  loc.scout_report.sections.map((section, si) => (
                    <View key={si} style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: sage, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {section.title}
                      </Text>
                      {section.rows.map((row, ri) => (
                        <View key={ri} style={s.scoutRow}>
                          <Text style={s.scoutLabel}>{row.label}</Text>
                          <Text style={s.scoutValue}>{row.value}</Text>
                        </View>
                      ))}
                    </View>
                  ))
                ) : loc.scout_report?.text ? (
                  <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.5 }}>
                    {loc.scout_report.text}
                  </Text>
                ) : null}
                {i < locations.filter(loc => loc.scout_report).length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* Gear Checklist */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Gear Checklist</Text>
          {gearItems.length > 0 ? (
            Object.entries(gearByCategory).map(([category, items]) => (
              <View key={category}>
                <Text style={s.gearCategory}>{category}</Text>
                {items.map((g, i) => (
                  <View key={i} style={s.gearItem}>
                    <View style={s.checkbox} />
                    <Text style={s.gearText}>{g.name}</Text>
                    {g.brand && <Text style={s.gearBrand}>  ({g.brand})</Text>}
                  </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={s.none}>No gear selected for this hunt.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated by Lead the Wild — {generatedDate}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
