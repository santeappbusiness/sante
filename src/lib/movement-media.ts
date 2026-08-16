/**
 * Curated demonstrations, one per movement, chosen and checked by hand.
 *
 * This is editorial application data and nothing else. It is deliberately not
 * part of the domain contract, not in the database, and not something Luna can
 * see or choose from. The model picks movements; a person picked these videos.
 * That separation is the point: a model that could name a URL could name a
 * wrong one, and there is no safe way to check that at request time.
 *
 * How each entry was verified, in this order:
 *
 *   1. The id came off a real YouTube search result page, never from memory.
 *   2. oEmbed confirmed the video exists and reported its actual channel.
 *   3. The watch page's own `playableInEmbed` flag confirmed the owner allows
 *      embedding, and `playabilityStatus` confirmed it is not private, blocked
 *      or region-locked. A title alone proves nothing about either.
 *   4. Title, description and duration were read to confirm the video shows
 *      the movement Santé actually describes.
 *
 * Sources are health systems, physiotherapy services and clinical education
 * providers, because this is a wellness product and the instruction on screen
 * should come from someone qualified to give it. Nothing here sells weight
 * loss, and nothing here tells a woman to push through pain.
 *
 * Coverage is partial on purpose. A movement with no entry keeps its written
 * instructions and offers no demonstration, which is the honest outcome. Do
 * not add an entry to fill a gap without running it through the four steps
 * above.
 */

export type MovementMedia = {
  movementId: string;
  youtubeId: string;
  title: string;
  channel: string;
  /** Trim to the technique itself where the video opens with a preamble. */
  startSeconds?: number;
  endSeconds?: number;
  /** ISO date the checks above were last run. */
  verifiedAt: string;
};

const VERIFIED = "2026-08-16";

export const MOVEMENT_MEDIA: MovementMedia[] = [
  /* Maya's baseline session. */
  {
    movementId: "mv_walk",
    youtubeId: "9wl_AiNhYP0",
    title: "How to march on the spot",
    channel: "Rehab My Patient",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_lunge",
    youtubeId: "3zVrh37QqC8",
    title: "How to Do Lunges: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_squat",
    youtubeId: "L61HQqjYFdQ",
    title: "How to Do Squats: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_step_up",
    youtubeId: "1hiWQ7pehjQ",
    title: "Build your stair climbing power with step-ups",
    channel: "Mayo Clinic",
    verifiedAt: VERIFIED,
  },

  /* The gentlest movements, which is what a low-capacity day reaches for. */
  {
    movementId: "mv_breath",
    youtubeId: "Mg2ar-7_HfA",
    title: "Diaphragmatic breathing",
    channel: "NewYork-Presbyterian Hospital",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_neck",
    youtubeId: "5lbe9oZbpDs",
    title: "Deskercise — Neck and Shoulder Stretches",
    channel: "Mayo Clinic",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_hips",
    youtubeId: "sJvRbQawUps",
    title: "Seated figure 4 hip opener",
    channel: "Northwell Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_wrist",
    youtubeId: "wRSk1_C6yOM",
    title: "Wrist circles",
    channel: "Rehab My Patient",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_shoulder_roll",
    youtubeId: "X7NtgY9kCCM",
    title: "How to do shoulder rolls",
    channel: "Rehab My Patient",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_side_bend",
    youtubeId: "Vko-SJok-fk",
    title: "How to do a standing side bend",
    channel: "Cleveland Clinic",
    verifiedAt: VERIFIED,
  },

  /* Quiet strength and sensory-friendly strength, end to end. */
  {
    movementId: "mv_sit_stand",
    youtubeId: "qveKmiXEkIQ",
    title: "How to Do a Sit to Stand: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_wall_push",
    youtubeId: "wIPJvBQs7RA",
    title: "How to Do Wall Push Ups: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_wall_sit",
    youtubeId: "cWTZ8Am1Ee0",
    title: "How to Do a Wall Sit Exercise",
    channel: "MedBridge",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_hip_hinge",
    youtubeId: "2W_gXhut5S8",
    title: "How to Do a Hip Hinge: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_heel_raise",
    youtubeId: "4rgR6KtyHzI",
    title: "Standing double heel raises",
    channel: "NHS inform",
    verifiedAt: VERIFIED,
  },

  /* Common swaps and floor work. */
  {
    movementId: "mv_cat_cow",
    youtubeId: "1Y0YjXS9sKI",
    title: "How to Do a Cat Cow Stretch: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_child",
    youtubeId: "LZgABs0IggM",
    title: "How to Do a Child's Pose: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_glute_bridge",
    youtubeId: "R1OXPHRqehw",
    title: "How to do a glute bridge",
    channel: "Cleveland Clinic",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_dead_bug",
    youtubeId: "GbSC02oU3To",
    title: "How to Do a Dead Bug: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_bird_dog",
    youtubeId: "xEDnlOxeJH4",
    title: "How to Do the Bird Dog Exercise: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_pelvic_tilt",
    youtubeId: "N3OQinBE5Ac",
    title: "How to Do Pelvic Tilts: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_march",
    youtubeId: "9wl_AiNhYP0",
    title: "How to march on the spot",
    channel: "Rehab My Patient",
    verifiedAt: VERIFIED,
  },
  {
    movementId: "mv_split_squat",
    youtubeId: "qW5OGJ62ZjY",
    title: "How to Do a Split Squat: A Guide from Physical Therapists",
    channel: "Hinge Health",
    verifiedAt: VERIFIED,
  },
];

const BY_MOVEMENT = new Map(MOVEMENT_MEDIA.map((m) => [m.movementId, m]));

export function mediaForMovement(movementId: string): MovementMedia | null {
  return BY_MOVEMENT.get(movementId) ?? null;
}

export function hasMedia(movementId: string): boolean {
  return BY_MOVEMENT.has(movementId);
}

/**
 * The embed URL, built only when someone has actually asked to watch.
 *
 * youtube-nocookie, no related videos from other channels at the end, inline
 * rather than forced fullscreen, and captions on where the video has them.
 *
 * `autoplay` here means "start when the iframe is created", and the iframe is
 * only ever created by a press. Calm mode still opts out: one more press is a
 * small cost next to something starting to move on its own.
 */
/** Where to send someone whose network or browser blocks the embed. */
export function watchUrl(media: MovementMedia): string {
  const t = media.startSeconds ? `&t=${media.startSeconds}` : "";
  return `https://www.youtube.com/watch?v=${media.youtubeId}${t}`;
}

export function embedUrl(media: MovementMedia, quiet = false): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    cc_load_policy: "1",
    autoplay: quiet ? "0" : "1",
  });
  if (media.startSeconds !== undefined) params.set("start", String(media.startSeconds));
  if (media.endSeconds !== undefined) params.set("end", String(media.endSeconds));
  return `https://www.youtube-nocookie.com/embed/${media.youtubeId}?${params.toString()}`;
}
