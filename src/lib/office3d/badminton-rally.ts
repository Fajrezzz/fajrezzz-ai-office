/**
 * RALLY BADMINTON DETERMINISTIK (LAPANGAN ATAP)
 *
 * Keluhan Bos: "di atap karakter badminton dibuat asli memukul kok-nya kena".
 * Sebelumnya shuttlecock terbang dengan fase sendiri sementara raket mengayun
 * dengan fase lain, jadi kok selalu lewat jauh dari raket.
 *
 * Sekarang satu sumber fase untuk semuanya:
 *  - shuttlecock terbang dari titik kontak raket kiri (−X) ke titik kontak raket kanan (+X)
 *    dan sebaliknya, dengan parabola yang benar (apex di tengah lapangan, melewati net).
 *  - pemain mengayun TEPAT saat kok tiba: backswing → strike → follow-through,
 *    sehingga pada detik kontak posisi kepala raket = posisi kok.
 */

export const RALLY_CYCLE_SEC = 2.4; // durasi satu lintasan kok
export const RALLY_PLAYER_X = 2.65; // pusat pemain dari net
export const RALLY_CONTACT_X = 1.95; // titik kontak raket terhadap net
export const RALLY_CONTACT_Y = 2.06; // tinggi kontak (smash/clear)
export const RALLY_NET_Y = 1.55;

const RACKET_IDLE = -0.75;
const RACKET_BACK = -1.95;
const RACKET_FWD = 0.55;

const mod = (value: number, period: number) => ((value % period) + period) % period;

/** Jarak waktu bertanda ke kontak terdekat; positif = belum terjadi. */
export function signedTimeToContact(
  t: number,
  contactOffsetSec: number,
  cycleSec: number = RALLY_CYCLE_SEC
): number {
  const period = cycleSec * 2;
  const raw = contactOffsetSec - t;
  return mod(raw + period / 2, period) - period / 2;
}

/** Sudut raket terhadap kontak (radian). Kontinu di semua batas window. */
export function racketAngleAt(timeToContactSec: number): number {
  const d = timeToContactSec;
  if (d > 0.1) {
    const k = Math.min(1, (0.55 - d) / 0.45);
    return RACKET_IDLE + (RACKET_BACK - RACKET_IDLE) * Math.max(0, k);
  }
  if (d > -0.1) {
    const k = (0.1 - d) / 0.2;
    return RACKET_BACK + (RACKET_FWD - RACKET_BACK) * k;
  }
  const k = Math.min(1, (-d - 0.1) / 0.35);
  return RACKET_FWD + (RACKET_IDLE - RACKET_FWD) * k;
}

/** Kilatan impact 0..1 saat raket benar-benar mengenai kok. */
export function impactFlashAt(timeToContactSec: number): number {
  const d = Math.abs(timeToContactSec);
  if (d >= 0.09) return 0;
  return 1 - d / 0.09;
}

export interface RallyPlayerState {
  /** sudut ayun raket (rotation.x) */
  racketAngle: number;
  /** condong badan saat memukul */
  lean: number;
  /** langkah samping/geser (meter, lokal terhadap posisi pemain) */
  stepX: number;
  stepZ: number;
  /** 0..1 seberapa besar tenaga ayunan saat ini */
  swing: number;
  /** fase langkah kaki untuk animasi lari kecil */
  legPhase: number;
}

export interface BadmintonRallyFrame {
  shuttle: { x: number; y: number; z: number; pitch: number; roll: number };
  left: RallyPlayerState;
  right: RallyPlayerState;
  impact: number;
  shotIndex: number;
  /** lintasan ke arah +X (kiri → kanan) atau sebaliknya */
  direction: 1 | -1;
}

function playerState(
  timeToContact: number,
  side: -1 | 1,
  t: number,
  shuttleZ: number
): RallyPlayerState {
  const angle = racketAngleAt(timeToContact);
  const swing = Math.min(
    1,
    Math.max(0, 1 - Math.max(0, timeToContact) / 0.55) +
      Math.max(0, 1 - Math.max(0, -timeToContact) / 0.3)
  );
  const receiving = timeToContact > 0 && timeToContact < 0.6;
  return {
    racketAngle: angle,
    lean: receiving ? 0.12 * (1 - timeToContact / 0.6) : -0.05 * swing,
    // geser ke arah kok yang datang (supaya raket benar-benar menjangkau)
    stepX: side * (receiving ? -0.1 * (1 - timeToContact / 0.6) : 0) + side * -0.02,
    stepZ: shuttleZ * 0.45,
    swing: Math.min(1, swing),
    legPhase: t * 3.1 + (side === -1 ? 0 : Math.PI),
  };
}

/**
 * Satu frame rally. Dipakai useFrame di `RooftopBadmintonCourt`.
 */
export function computeRally(
  t: number,
  cycleSec: number = RALLY_CYCLE_SEC
): BadmintonRallyFrame {
  const period = cycleSec * 2;
  const tw = mod(t, period);
  const direction: 1 | -1 = tw < cycleSec ? 1 : -1; // 1 = kok menuju +X
  const u = (tw < cycleSec ? tw : tw - cycleSec) / cycleSec; // 0..1 progres terbang
  const shotIndex = Math.floor(t / cycleSec);

  const fromX = direction === 1 ? -RALLY_CONTACT_X : RALLY_CONTACT_X;
  const toX = -fromX;
  const x = fromX + (toX - fromX) * u;

  // Variasi tinggi tiap pukulan (clear tinggi vs drive datar) — deterministik
  const apexVariation = 0.95 + ((shotIndex * 137) % 100) / 100 * 0.85;
  const contactY = RALLY_CONTACT_Y + Math.sin(shotIndex * 1.7) * 0.12;
  const y = contactY + 4 * apexVariation * u * (1 - u) - Math.sin(Math.PI * u) * 0.0;

  // Kok sedikit melengkung ke samping mengikuti posisi penerima
  const z = Math.sin(Math.PI * u) * Math.sin(shotIndex * 0.9 + 0.4) * 0.85;

  // Orientasi: kepala kok (cone) selalu mengarah ke tujuan, badan kok turun saat menukik
  const vy = 4 * apexVariation * (1 - 2 * u);
  const pitch = Math.atan2(vy, Math.abs(toX - fromX)) * -1;

  const dRight = signedTimeToContact(t, cycleSec, cycleSec); // kontak kanan saat tw = cycle
  const dLeft = signedTimeToContact(t, 0, cycleSec); // kontak kiri saat tw = 0

  const left = playerState(dLeft, -1, t, z);
  const right = playerState(dRight, 1, t, z);

  return {
    shuttle: {
      x,
      y: Math.max(RALLY_NET_Y + 0.12, y),
      z,
      pitch,
      roll: Math.sin(t * 6.2) * 0.25,
    },
    left,
    right,
    impact: Math.max(impactFlashAt(dLeft), impactFlashAt(dRight)),
    shotIndex,
    direction,
  };
}

/** Posisi kepala raket (world) untuk verifikasi kontak & spark impact. */
export function racketTipPosition(side: -1 | 1): { x: number; y: number } {
  return { x: side * RALLY_CONTACT_X, y: RALLY_CONTACT_Y };
}
