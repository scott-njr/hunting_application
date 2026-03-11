'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Default gear lists ────────────────────────────────────────────────────

type GearItem = { slug: string; label: string }
type Section = {
  id: string
  group: string
  label: string
  color: string
  items: GearItem[]
}

const SECTIONS: Section[] = [
  {
    id: 'archery',
    group: 'Hunting',
    label: 'Archery',
    color: 'text-accent-hover bg-accent-dim border-accent-border',
    items: [
      { slug: 'arch_bow', label: 'Compound / Recurve Bow' },
      { slug: 'arch_arrows', label: 'Arrows (dozen)' },
      { slug: 'arch_quiver', label: 'Quiver' },
      { slug: 'arch_release', label: 'Release Aid' },
      { slug: 'arch_broadheads', label: 'Broadheads' },
      { slug: 'arch_bow_press', label: 'Bow Press / Allen Wrench Kit' },
      { slug: 'arch_rangefinder', label: 'Rangefinder' },
      { slug: 'arch_bow_case', label: 'Bow Case' },
      { slug: 'arch_extra_string', label: 'Extra String / D-loop' },
      { slug: 'arch_peep_sight', label: 'Peep Sight' },
      { slug: 'arch_arrow_puller', label: 'Arrow Puller' },
      { slug: 'arch_gloves', label: 'Shooting Gloves' },
    ],
  },
  {
    id: 'firearm',
    group: 'Hunting',
    label: 'Firearm / Rifle',
    color: 'text-red-400 bg-red-900/30 border-red-500/20',
    items: [
      { slug: 'gun_rifle', label: 'Rifle / Shotgun / Muzzleloader' },
      { slug: 'gun_ammo', label: 'Ammunition (2+ boxes)' },
      { slug: 'gun_sling', label: 'Sling' },
      { slug: 'gun_optic', label: 'Scope / Red Dot' },
      { slug: 'gun_cleaning', label: 'Cleaning Kit' },
      { slug: 'gun_bore_snake', label: 'Bore Snake' },
      { slug: 'gun_bipod', label: 'Bipod / Shooting Sticks' },
      { slug: 'gun_case', label: 'Gun Case / Scabbard' },
      { slug: 'gun_ear_pro', label: 'Ear Protection' },
      { slug: 'gun_speed_loader', label: 'Speed Loader / Extra Mags' },
      { slug: 'gun_snap_caps', label: 'Snap Caps (dry fire)' },
    ],
  },
  {
    id: 'optics_nav',
    group: 'Hunting',
    label: 'Optics & Navigation',
    color: 'text-blue-400 bg-blue-900/30 border-blue-500/20',
    items: [
      { slug: 'opt_binos', label: 'Binoculars' },
      { slug: 'opt_spotter', label: 'Spotting Scope + Tripod' },
      { slug: 'opt_rangefinder', label: 'Rangefinder' },
      { slug: 'nav_gps', label: 'GPS Device (Garmin / onX)' },
      { slug: 'nav_maps', label: 'Paper Topo Maps' },
      { slug: 'nav_compass', label: 'Compass' },
      { slug: 'nav_sat_comm', label: 'Satellite Communicator (inReach / SPOT)' },
    ],
  },
  {
    id: 'camping',
    group: 'Camping',
    label: 'Camping',
    color: 'text-amber-400 bg-amber-900/30 border-amber-500/20',
    items: [
      { slug: 'camp_tent', label: 'Tent' },
      { slug: 'camp_sleeping_bag', label: 'Sleeping Bag' },
      { slug: 'camp_sleeping_pad', label: 'Sleeping Pad' },
      { slug: 'camp_headlamp', label: 'Headlamp + Spare Batteries' },
      { slug: 'camp_matches', label: 'Matches / Lighter / Fire Starter' },
      { slug: 'camp_jetboil', label: 'JetBoil / Camp Stove' },
      { slug: 'camp_fuel', label: 'Fuel Canisters (extra)' },
      { slug: 'camp_water_filter', label: 'Water Filter / Purification Tabs' },
      { slug: 'camp_water_bottle', label: 'Water Bottle / Hydration Pack' },
      { slug: 'camp_backpack', label: 'Backpack (meat capable)' },
      { slug: 'camp_rain_gear', label: 'Rain Gear' },
      { slug: 'camp_base_layer', label: 'Merino / Base Layers' },
      { slug: 'camp_mid_layer', label: 'Mid Layer / Puffy' },
      { slug: 'camp_boots', label: 'Hunting Boots' },
      { slug: 'camp_gaiters', label: 'Gaiters' },
      { slug: 'camp_bear_canister', label: 'Bear Canister / Hang Kit' },
      { slug: 'camp_tarp', label: 'Tarp / Bivy' },
      { slug: 'camp_first_aid', label: 'First Aid Kit' },
    ],
  },
  {
    id: 'basecamp',
    group: 'Basecamp',
    label: 'Basecamp',
    color: 'text-orange-400 bg-orange-900/30 border-orange-500/20',
    items: [
      { slug: 'base_stove', label: 'Propane Camp Stove (2+ burner)' },
      { slug: 'base_propane', label: 'Propane Tanks (extra)' },
      { slug: 'base_table', label: 'Folding Table' },
      { slug: 'base_chairs', label: 'Folding Chairs' },
      { slug: 'base_cooler', label: 'Cooler (large)' },
      { slug: 'base_lantern', label: 'Lantern' },
      { slug: 'base_generator', label: 'Generator / Solar Panel' },
      { slug: 'base_tarp_canopy', label: 'Canopy / Shade Tarp' },
      { slug: 'base_food_storage', label: 'Food Storage Containers' },
      { slug: 'base_camp_sink', label: 'Camp Sink / Water Jug' },
      { slug: 'base_game_bags', label: 'Game Bags' },
      { slug: 'base_meat_saw', label: 'Meat Saw / Axe' },
      { slug: 'base_skinning_knife', label: 'Skinning Knife' },
      { slug: 'base_gambrel', label: 'Gambrel + Hoist' },
      { slug: 'base_meat_pole', label: 'Meat Pole / Game Hanger' },
    ],
  },
  {
    id: 'vehicle',
    group: 'Vehicle',
    label: 'Vehicle',
    color: 'text-cyan-400 bg-cyan-900/30 border-cyan-500/20',
    items: [
      { slug: 'veh_jump_starter', label: 'Jump Starter / Booster Pack' },
      { slug: 'veh_jumper_cables', label: 'Jumper Cables' },
      { slug: 'veh_tire_chains', label: 'Tire Chains' },
      { slug: 'veh_recovery_strap', label: 'Recovery Strap / Snatch Block' },
      { slug: 'veh_hi_lift_jack', label: 'Hi-Lift Jack' },
      { slug: 'veh_air_compressor', label: 'Air Compressor / Tire Inflator' },
      { slug: 'veh_tow_rope', label: 'Tow Rope' },
      { slug: 'veh_shovel', label: 'Shovel (folding)' },
      { slug: 'veh_fuel_can', label: 'Extra Fuel Can' },
      { slug: 'veh_tool_kit', label: 'Basic Tool Kit' },
      { slug: 'veh_first_aid', label: 'Vehicle First Aid Kit' },
      { slug: 'veh_emergency_kit', label: 'Emergency Roadside Kit' },
      { slug: 'veh_phone_charger', label: 'Car Charger / Power Bank' },
      { slug: 'veh_cooler_straps', label: 'Cargo Straps / Tie-Downs' },
    ],
  },
]

const GROUP_ORDER = ['Hunting', 'Camping', 'Basecamp', 'Vehicle']

// ─── Component ─────────────────────────────────────────────────────────────

export default function GearPage() {
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Hunting')
  const [showNeedsOnly, setShowNeedsOnly] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadChecklist() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) { if (!cancelled) setLoading(false); return }
      const { data } = await supabase.from('hunting_gear_checklist').select('item_slug').eq('user_id', user.id)
      if (!cancelled) {
        if (data) setOwned(new Set(data.map(r => r.item_slug)))
        setLoading(false)
      }
    }
    loadChecklist()
    return () => { cancelled = true }
  }, [])

  async function toggleItem(slug: string) {
    if (toggling) return
    setToggling(slug)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setToggling(null); return }
    const isOwned = owned.has(slug)
    if (isOwned) {
      await supabase.from('hunting_gear_checklist').delete().eq('user_id', user.id).eq('item_slug', slug)
      setOwned(prev => { const next = new Set(prev); next.delete(slug); return next })
    } else {
      await supabase.from('hunting_gear_checklist').insert({ user_id: user.id, item_slug: slug })
      setOwned(prev => new Set(prev).add(slug))
    }
    setToggling(null)
  }

  const totalItems = SECTIONS.reduce((n, s) => n + s.items.length, 0)
  const totalOwned = SECTIONS.reduce((n, s) => n + s.items.filter(i => owned.has(i.slug)).length, 0)
  const totalNeeded = totalItems - totalOwned
  const totalPct = totalItems === 0 ? 0 : (totalOwned / totalItems) * 100
  const barColor = totalPct >= 80 ? 'bg-green-500' : totalPct >= 50 ? 'bg-yellow-400' : 'bg-red-500'
  const textColor = totalPct >= 80 ? 'text-accent-hover' : totalPct >= 50 ? 'text-yellow-400' : 'text-red-400'

  const groupedSections = GROUP_ORDER.map(g => ({ group: g, sections: SECTIONS.filter(s => s.group === g) }))

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-accent-hover" />
          <h1 className="text-2xl font-bold text-primary">Gear Checklist</h1>
        </div>
        <button onClick={() => setShowNeedsOnly(v => !v)} className={cn('text-xs px-3 py-1.5 rounded border transition-colors', showNeedsOnly ? 'bg-amber-900/40 text-amber-300 border-amber-500/40' : 'bg-elevated text-secondary border-default hover:text-primary')}>{showNeedsOnly ? `Showing needs (${totalNeeded})` : 'Show needs only'}</button>
      </div>
      <p className="text-secondary text-sm mb-4">Check off gear you own. Uncheck = still need it.</p>

      {!loading && (
        <div className="flex items-center gap-4 mb-6 bg-elevated border border-subtle rounded-lg px-4 py-3">
          <div className="flex-1 bg-base rounded-full h-2 overflow-hidden"><div className={`${barColor} h-2 rounded-full transition-all duration-300`} style={{ width: `${totalPct}%` }} /></div>
          <span className={`text-sm font-semibold shrink-0 ${textColor}`}>{totalOwned} / {totalItems}</span>
          {totalNeeded > 0 && <span className={`text-xs shrink-0 ${textColor}`}>{totalNeeded} to get</span>}
        </div>
      )}

      {loading ? (
        <div className="text-muted text-sm text-center py-16">Loading…</div>
      ) : (
        <div className="space-y-3">
          {groupedSections.map(({ group, sections }) => {
            const isOpen = expandedGroup === group
            const groupItems = sections.flatMap(s => s.items)
            const groupOwned = groupItems.filter(i => owned.has(i.slug)).length
            const groupNeeded = groupItems.length - groupOwned
            const gPct = groupItems.length === 0 ? 0 : (groupOwned / groupItems.length) * 100
            const gBar = gPct >= 80 ? 'bg-green-500' : gPct >= 50 ? 'bg-yellow-400' : 'bg-red-500'
            return (
              <div key={group} className="glass-card border border-subtle rounded-lg">
                <button onClick={() => setExpandedGroup(isOpen ? null : group)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-elevated transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-primary font-semibold text-sm">{group}</span>
                    <span className="text-muted text-xs">{groupOwned}/{groupItems.length} ready</span>
                    {groupNeeded > 0 && <span className="text-xs text-amber-400/80">{groupNeeded} needed</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-elevated rounded-full h-1.5 overflow-hidden"><div className={`${gBar} h-1.5 rounded-full transition-all`} style={{ width: `${gPct}%` }} /></div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-subtle px-5 py-3 space-y-3">
                    {sections.map(section => {
                      const visibleItems = showNeedsOnly ? section.items.filter(i => !owned.has(i.slug)) : section.items
                      if (showNeedsOnly && visibleItems.length === 0) return null
                      const sectionOwned = section.items.filter(i => owned.has(i.slug)).length
                      return (
                        <div key={section.id}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border', section.color)}>{section.label}</span>
                            <span className="text-muted text-xs">{sectionOwned}/{section.items.length}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0">
                            {visibleItems.map(item => {
                              const isOwned = owned.has(item.slug)
                              return (
                                <button key={item.slug} onClick={() => toggleItem(item.slug)} disabled={toggling === item.slug}
                                  className={cn('flex items-center gap-2 px-1 py-1 rounded text-left transition-colors text-xs', isOwned ? 'text-accent-hover' : 'text-secondary hover:text-primary')}>
                                  <span className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors', isOwned ? 'bg-accent border-accent' : 'border-default')}>
                                    {isOwned && <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                  </span>
                                  <span className={isOwned ? 'line-through opacity-60' : ''}>{item.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-muted text-xs mt-6">Gear checklist saves automatically. Items can still be added to hunt plans from the Hunts page.</p>
    </div>
  )
}
