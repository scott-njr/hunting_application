-- Seed the Iron Mile workout for the current week
-- This ensures the Weekly Challenge is visible on production

INSERT INTO weekly_workouts (week_start, title, description, workout_details)
VALUES (
  '2026-03-02',
  'The Iron Mile',
  'A brutal blend of running and strength that tests your engine and your grit. Run a mile, then grind through a heavy barbell and bodyweight complex — repeat until you break or the clock does.',
  '{
    "duration": "35-45 min",
    "equipment": ["barbell", "pull-up bar"],
    "scoring": "time",
    "time_cap_minutes": null,
    "warmup": "5 min easy jog, then 2 rounds: 10 arm circles, 10 leg swings each side, 5 inchworms, 5 empty bar deadlifts",
    "cooldown": "5 min walk, full-body static stretching focusing on hamstrings, hip flexors, and lats",
    "scaling": {
      "rx": {
        "label": "RX",
        "description": "As prescribed — full intensity",
        "movements": [
          { "name": "Run", "reps": "1 mile", "notes": "Outdoor or treadmill — push the pace" },
          { "name": "Deadlift", "reps": "15", "notes": "185 lb / 135 lb" },
          { "name": "Pull-Ups", "reps": "15", "notes": "Strict or kipping" },
          { "name": "Push-Ups", "reps": "25", "notes": "Chest to deck" },
          { "name": "Run", "reps": "800m", "notes": "Half mile — dig deep" },
          { "name": "Deadlift", "reps": "12", "notes": "185 lb / 135 lb" },
          { "name": "Pull-Ups", "reps": "12", "notes": "Strict or kipping" },
          { "name": "Push-Ups", "reps": "20", "notes": "Chest to deck" }
        ]
      },
      "scaled": {
        "label": "Scaled",
        "description": "Modified for intermediate athletes",
        "movements": [
          { "name": "Run", "reps": "1 mile", "notes": "Steady pace — no need to sprint" },
          { "name": "Deadlift", "reps": "15", "notes": "135 lb / 95 lb" },
          { "name": "Ring Rows", "reps": "12", "notes": "Feet forward, body at 45°" },
          { "name": "Push-Ups", "reps": "20", "notes": "Full range of motion" },
          { "name": "Run", "reps": "800m", "notes": "Half mile" },
          { "name": "Deadlift", "reps": "12", "notes": "135 lb / 95 lb" },
          { "name": "Ring Rows", "reps": "10", "notes": "Feet forward, body at 45°" },
          { "name": "Push-Ups", "reps": "15", "notes": "Full range of motion" }
        ]
      },
      "beginner": {
        "label": "Beginner",
        "description": "Entry-level version — focus on form and finishing",
        "movements": [
          { "name": "Run/Walk", "reps": "800m", "notes": "Half mile — run what you can, walk when needed" },
          { "name": "Deadlift", "reps": "12", "notes": "95 lb / 65 lb — focus on flat back" },
          { "name": "Ring Rows", "reps": "8", "notes": "Walk feet back to reduce difficulty" },
          { "name": "Knee Push-Ups", "reps": "15", "notes": "Full range of motion from knees" },
          { "name": "Run/Walk", "reps": "400m", "notes": "Quarter mile" },
          { "name": "Deadlift", "reps": "10", "notes": "95 lb / 65 lb" },
          { "name": "Ring Rows", "reps": "6", "notes": "Walk feet back to reduce difficulty" },
          { "name": "Knee Push-Ups", "reps": "10", "notes": "Full range of motion from knees" }
        ]
      }
    }
  }'::jsonb
)
ON CONFLICT (week_start) DO NOTHING;
