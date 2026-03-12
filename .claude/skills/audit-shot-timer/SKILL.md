---
name: audit-shot-timer
description: Run a comprehensive functionality audit of the shot timer system. Covers detection, timing, scoring, courses, beep, review, history, and match integration.
argument-hint: "[focus-area | all]"
user-invocable: true
---

Run a comprehensive shot timer functionality audit covering all subsystems.

Arguments: $ARGUMENTS
(Optional — a focus area like `detection`, `scoring`, `review`, `beep`, `courses`, `history`, `match`, or `all`. Defaults to `all`.)

## Architecture Overview

The shot timer is the most complex feature in the firearms module. It has these subsystems:

### Core Files

**State Machine & Detection:**
- `src/components/firearms/shot-timer/use-shot-timer.ts` — Timer reducer: phases (idle → waiting_delay → running → stopped → review), string management, scoring
- `src/components/firearms/shot-timer/use-shot-detection.ts` — Web Audio API amplitude + frequency analysis, Schmitt trigger, beep rejection
- `src/components/firearms/shot-timer/use-beep.ts` — OscillatorNode beep generation (start beep 1000Hz, par beep 1200Hz)
- `src/components/firearms/shot-timer/shot-timer-types.ts` — All types, constants, sensitivity thresholds, frequency band config

**UI Components:**
- `src/components/firearms/shot-timer/shot-timer-client.tsx` — Main orchestrator (session lifecycle, view switching, API calls)
- `src/components/firearms/shot-timer/timer-display.tsx` — Large time display, string/shot counters, mic indicator
- `src/components/firearms/shot-timer/timer-controls.tsx` — Mode selector, Start/Stop/Reset/NextString/EnterScores buttons
- `src/components/firearms/shot-timer/timer-settings-panel.tsx` — Sensitivity, delay mode, delay range, par times
- `src/components/firearms/shot-timer/shot-string-list.tsx` — Prev/Next string review navigation
- `src/components/firearms/shot-timer/shot-string-detail.tsx` — Summary grid (shots, total, HF, par) + waveform + shot table
- `src/components/firearms/shot-timer/shot-waveform.tsx` — SVG seismic amplitude plot with shot/par markers
- `src/components/firearms/shot-timer/course-of-fire.tsx` — Course template CRUD panel
- `src/components/firearms/shot-timer/scoring-modal.tsx` — USPSA-style hit zone scoring (A/B/C/D/M + penalties)
- `src/components/firearms/shot-timer/session-history.tsx` — Past sessions list with load/delete/export
- `src/components/firearms/shot-timer/calibration-mode.tsx` — Live frequency analysis for tuning detection
- `src/components/firearms/shot-timer/band-indicator.tsx` — 5-band frequency energy bars
- `src/components/firearms/shot-timer/mic-consent-modal.tsx` — Microphone permission consent
- `src/components/firearms/shot-timer/spy-mode-overlay.tsx` — White flash for spy mode
- `src/components/firearms/shot-timer/calculator.tsx` — Match math utility
- `src/components/firearms/shot-timer/export-button.tsx` — Session data export

**API Routes:**
- `src/app/api/firearms/shot-timer/route.ts` — Session list (GET) + create (POST)
- `src/app/api/firearms/shot-timer/[sessionId]/route.ts` — Session detail (GET), update (PATCH), delete (DELETE)
- `src/app/api/firearms/shot-timer/[sessionId]/strings/route.ts` — String upsert (POST)
- `src/app/api/firearms/shot-timer/courses/route.ts` — Course template CRUD
- `src/app/api/firearms/shot-timer/[sessionId]/export/route.ts` — Export endpoint

**Pages:**
- `src/app/firearms/(module)/shot-timer/page.tsx` — Solo timer page
- `src/app/firearms/(module)/matches/[matchId]/timer/[memberId]/page.tsx` — Match timer page

**Database (migrations 0075-0078):**
- `firearms_shot_session` — Sessions with mode, sensitivity, scoring columns
- `firearms_shot_string` — Individual strings with shots_ms, amplitudes, splits
- `firearms_course_of_fire` — Reusable course templates
- `firearms_match` + `firearms_match_member` — Competition system

### Key Constants & Thresholds
- `SENSITIVITY_THRESHOLDS`: level 1=230, 2=210, 3=195, 4=180, 5=165, 6=150, 7=135, 8=132 (amplitude 0-255)
- `BEEP_IGNORE_MS`: Grace period after start to avoid beep false positives (currently 300ms)
- `SHOT_DEBOUNCE_MS`: 80ms minimum between shots
- `BEEP_ENERGY_RATIO_THRESHOLD`: 0.55 — beep rejection ratio
- Schmitt trigger re-arm at 60% of threshold
- Default sensitivity: level 5

### Timer Phase Flow
```
idle → (START) → waiting_delay → (DELAY_COMPLETE + beep) → running → (STOP/auto-stop) → stopped
                                                                                              ↓
                                                                              review (Prev/Next navigation)
```

### Scoring (USPSA-style)
- Alpha=5pts, Bravo=4pts, Charlie=3pts, Delta=1pt, Miss=-10pts
- Procedurals: -10pts each
- Hit Factor = totalPoints / (totalTime in seconds)
- Status: review (normal), dq (disqualified), dnf (did not finish)

## Audit Checklist

### 1. Shot Detection (`detection`)

Read `use-shot-detection.ts` and `shot-timer-types.ts`. Check:

- [ ] **Sensitivity thresholds**: Are all 8 levels defined? Do they span a reasonable range for phone/laptop mics?
- [ ] **Schmitt trigger**: Is hysteresis correctly implemented? Re-arm at 60% of trigger?
- [ ] **Beep rejection**: Does `isBeepLike()` correctly identify narrowband 1000Hz signals without rejecting broadband gunshots?
- [ ] **Grace period**: Is `BEEP_IGNORE_MS` short enough to catch fast first shots but long enough to ignore beep reverb?
- [ ] **Debounce**: Is 80ms reasonable? Too short = echoes register as shots. Too long = rapid fire misses shots.
- [ ] **Amplitude sampling**: Does the 50ms interval provide sufficient waveform resolution?
- [ ] **AudioContext lifecycle**: Is the context properly created, resumed, and cleaned up?
- [ ] **Stream cleanup**: Are media tracks stopped on unmount? Is RAF cancelled?
- [ ] **Ref staleness**: Are frequently-changing values (sensitivity, callbacks) properly kept in refs to avoid stale closures?
- [ ] **Edge case**: What happens if mic is unplugged during detection?

### 2. Timer State Machine (`timing`)

Read `use-shot-timer.ts`. Check:

- [ ] **Phase transitions**: Are all transitions valid? Can you reach an invalid state?
- [ ] **Auto-stop**: When `shotsPerString` is set, does detection stop after the right count?
- [ ] **String completion**: Is `buildCompletedString()` capturing all data correctly?
- [ ] **Split computation**: Are `computeSplitTimes()` results correct (shot[i] - shot[i-1])?
- [ ] **Hit factor**: Is the calculation `points / (totalTimeMs / 1000)` correct?
- [ ] **Review navigation**: Does Prev/Next preserve the current phase (stopped/idle) during active sessions?
- [ ] **reviewIndex**: Is it kept in bounds? Does it auto-point to the latest string when a new one completes?
- [ ] **MAX limits**: MAX_SHOTS_PER_STRING=99, MAX_STRINGS_PER_SESSION=10 — are they enforced?
- [ ] **RESET_COURSE**: Does it fully clear all state back to string 1?
- [ ] **LOAD_SESSION**: Does loading a saved session set correct review state?
- [ ] **Delay timer**: Is the timeout properly cleared on stop/unmount?
- [ ] **RAF loop**: Is the animation frame for elapsed time properly managed?

### 3. Scoring System (`scoring`)

Read `scoring-modal.tsx` and scoring-related code in `shot-timer-client.tsx`. Check:

- [ ] **Point calculation**: A=5, B=4, C=3, D=1, M=-10, procedural=-10. Is the math correct?
- [ ] **Shot count validation**: Does it correctly compare total hits to strings × shotsPerString?
- [ ] **Hit factor**: Computed as points / (totalTime / 1000). Null for DQ/DNF.
- [ ] **DQ/DNF mutual exclusion**: Can both be checked simultaneously?
- [ ] **Submit flow**: Does scoring data get saved to the session via PATCH?
- [ ] **Results display**: After submission, is a detailed breakdown shown (per-string times, hit zones, totals)?
- [ ] **Session auto-end**: Is the session properly ended (ended_at, total_strings) when scoring completes?
- [ ] **History refresh**: Does the sessions list update after scoring so it appears in history?

### 4. Start Beep & Audio (`beep`)

Read `use-beep.ts` and beep-related code in `shot-timer-client.tsx`. Check:

- [ ] **AudioContext warmup**: Is `warmUp()` called AND awaited during a user gesture (click)?
- [ ] **Start beep**: 200ms @ 1000Hz square wave. Does it play reliably?
- [ ] **Par beep**: 100ms @ 1200Hz. Is it distinguishable from start beep?
- [ ] **Spy mode**: No beep, only white flash. Is beep correctly suppressed?
- [ ] **Stopwatch mode**: Start beep but no shot detection. Correct?
- [ ] **Gain envelope**: Quick fade-out to avoid click? `linearRampToValueAtTime(0, endTime)`
- [ ] **Mobile compatibility**: iOS Safari requires user gesture to create AudioContext. Is this handled?
- [ ] **Separate contexts**: Beep uses its own AudioContext (not shared with detection). Any conflict?

### 5. String Review (`review`)

Read `shot-string-list.tsx`, `shot-string-detail.tsx`, and review logic in `shot-timer-client.tsx`. Check:

- [ ] **Navigation**: Prev/Next buttons work and don't change phase during active session
- [ ] **Bounds checking**: Can't go below 0 or above strings.length - 1
- [ ] **Detail display**: Shows shots, total time, hit factor, par hit, waveform, shot table with splits
- [ ] **Splits always visible**: Every string review shows the shot table with Time/Split/Amp columns
- [ ] **Waveform**: Renders SVG from amplitudeSamples with shot markers and par lines
- [ ] **Empty state**: "No strings recorded yet" when no strings exist
- [ ] **Visibility**: Review section shows in stopped, idle, and review phases

### 6. Courses of Fire (`courses`)

Read `course-of-fire.tsx` and course loading in `shot-timer-client.tsx`. Check:

- [ ] **CRUD**: Create, edit, delete, list all work via API
- [ ] **Loading**: Does loading a course correctly set shotsPerString, totalStringsInCourse, delay settings, par times?
- [ ] **Auto-stop**: After loading, does the timer auto-stop at shotsPerString shots?
- [ ] **Course complete**: After totalStringsInCourse strings, does "Enter Scores" button appear?
- [ ] **Validation**: strings_count 1-10, shots_per_string 1-99, delay times >= 0
- [ ] **Course name**: Is it shown in the timer display and saved to the session?

### 7. Session History (`history`)

Read `session-history.tsx` and history-related code in `shot-timer-client.tsx`. Check:

- [ ] **List**: Shows sessions ordered by date with mode, strings, sensitivity, points
- [ ] **Load**: Can load a saved session for review (shows strings, waveforms)
- [ ] **Delete**: Deletes session (cascades strings via FK)
- [ ] **Export**: Export button works
- [ ] **Scoring data**: After scoring submission, session appears in history with all scoring data
- [ ] **Course name**: History entries show the course name if one was used

### 8. Match Integration (`match`)

Read match timer page and match context code. Check:

- [ ] **Context injection**: Match settings auto-load on mount (course, delay, par times)
- [ ] **Shooter banner**: Shows match name, shooter name, shoot order / total
- [ ] **Session linkage**: match_id and match_member_id saved to session
- [ ] **Navigation**: After session end, navigates back to match detail page
- [ ] **Course override**: Match course settings override any manually loaded course

### 9. UI/UX (`ux`)

Check across all components:

- [ ] **Controls visibility**: Start/Stop/Reset/NextString/EnterScores show at the right phases
- [ ] **Mode selector**: Disabled when not idle
- [ ] **Settings panel**: Only shows when idle
- [ ] **Save/Discard prompt**: Shows after string completion, clears after action
- [ ] **Loading states**: Saving session shows disabled state
- [ ] **Error display**: Mic errors and session errors shown prominently
- [ ] **Mobile layout**: Components render well on small screens
- [ ] **Mic indicator**: Shows listening state during detection

### 10. API & Database (`api`)

Read all API routes. Check:

- [ ] **Auth**: All routes check `supabase.auth.getUser()`
- [ ] **Response format**: Uses `apiOk()`/`apiDone()`/`apiError()` helpers
- [ ] **Validation**: Input validated before DB operations
- [ ] **RLS**: Users can only access their own sessions/strings/courses
- [ ] **Upsert**: String saving upserts on (session_id, string_number)
- [ ] **Cascade**: Session delete cascades strings
- [ ] **Types**: database.types.ts matches the actual schema

## Output

```
## Shot Timer Audit — <focus-area>
Date: <current date>

### Summary
- Subsystems checked: X/10
- Issues found: X (Y critical, Z warnings)
- Tests: <pass/fail count if applicable>

### Critical Issues
Issues that cause broken functionality:

| # | Subsystem | File:Line | Issue | Fix |
|---|-----------|-----------|-------|-----|

### Warnings
Issues that degrade UX or could cause edge-case failures:

| # | Subsystem | File:Line | Issue | Suggestion |
|---|-----------|-----------|-------|------------|

### Checklist Results
<Subsystem>: X/Y passed
- [x] Item that passed
- [ ] Item that failed — <details>

### Fixes Applied
(If asked to fix, list changes made)

| # | File | Change |
|---|------|--------|
```

## Rules

- Read every file listed in the Architecture Overview — do not skip any
- Follow the full call chain: UI handler → state action → API route → DB operation
- Check both happy path and error/edge cases
- For detection issues, analyze the threshold math and timing constants
- For state machine issues, trace every possible phase transition
- Pay special attention to mobile browser compatibility (AudioContext, mic permissions)
- Do NOT fix issues unless `$ARGUMENTS` contains "fix" — this is an audit
- If `$ARGUMENTS` contains "fix", fix critical issues and list them in "Fixes Applied"
- When checking a specific focus area, still read the types file and client orchestrator for context
