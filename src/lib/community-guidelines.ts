/**
 * Community Guidelines — versioned rules for the community forum.
 *
 * To update guidelines after an incident:
 * 1. Edit the GUIDELINES array below (add/modify/remove rules)
 * 2. Bump CURRENT_GUIDELINES_VERSION
 * 3. All users will be re-prompted to accept on next community visit
 */

export const CURRENT_GUIDELINES_VERSION = 1

export type Guideline = {
  title: string
  body: string
}

export const GUIDELINES: Guideline[] = [
  {
    title: 'Be Respectful',
    body: 'Treat all members with respect. No personal attacks, harassment, bullying, or discriminatory language. We are a community of hunters helping each other — act like it.',
  },
  {
    title: 'No Politics or Religion',
    body: 'Keep discussions focused on hunting, the outdoors, and related topics. Political, religious, and other divisive content will be removed without warning.',
  },
  {
    title: 'No Spam or Self-Promotion',
    body: 'No advertising, affiliate links, or commercial promotion without admin approval. This includes guide services, gear brands, and YouTube channels.',
  },
  {
    title: 'Keep It Legal',
    body: 'No discussion of poaching, illegal methods, trespassing, or violations of game laws. If you witness a violation, report it to your state wildlife agency — not the forum.',
  },
  {
    title: 'Share Accurate Information',
    body: 'Be honest in your hunt reports, unit reviews, and advice. Other hunters rely on this intel to plan their seasons. Fabricated or misleading content will be removed.',
  },
  {
    title: 'Respect Privacy',
    body: 'Do not share other members\' personal information, specific hunting spots, or private messages publicly. What someone shares in a DM stays in the DM.',
  },
  {
    title: 'No Graphic or Inappropriate Content',
    body: 'Harvest photos should be tasteful and respectful of the animal. No gratuitous, gory, or shock content. Keep it something you\'d show a new hunter.',
  },
  {
    title: 'Admin Decisions Are Final',
    body: 'Posts or comments violating these guidelines may be removed at admin discretion. Repeated violations may result in temporary or permanent account suspension with no refund of membership fees.',
  },
]
