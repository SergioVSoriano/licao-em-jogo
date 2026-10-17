/** Bonequinhos bíblicos em SVG modular (corpo, pele, cabelo, barba, véu/coroa + item icônico). */

type Hair = 'short' | 'long' | 'wild' | 'curly' | 'bald' | 'none'
type Beard = 'none' | 'short' | 'long'
type Head = 'none' | 'veil' | 'crown' | 'turban' | 'band'

export interface AvatarPreset {
  id: string
  name: string
  item: string
  skin: number
  hair: Hair
  hairColor: string
  beard: Beard
  beardColor?: string
  head: Head
  headColor?: string
  robe: number
}

const SKIN = ['#f3cfae', '#e3b089', '#cf9468', '#b07548', '#8d5a35', '#6e4127']
export const ROBES = ['#1c7ed6', '#e5383b', '#4caf1a', '#7b3fe4', '#ffb703', '#c67b3c']
export const ROBES_S = ['#155fa3', '#b3262a', '#3a8a12', '#5a2bb0', '#d48f00', '#9a5c28']
const BLACK = '#2b1d14'
const BROWN = '#5a3a22'
const GRAY = '#a29c93'
const WHITE = '#f2eee6'
const AUBURN = '#8a3f1d'

export const AVATARS: AvatarPreset[] = [
  { id: 'noe', name: 'Noé', item: '🕊️', skin: 2, hair: 'long', hairColor: WHITE, beard: 'long', beardColor: WHITE, head: 'none', robe: 5 },
  { id: 'abraao', name: 'Abraão', item: '⭐', skin: 3, hair: 'short', hairColor: GRAY, beard: 'long', beardColor: GRAY, head: 'band', headColor: '#e5383b', robe: 3 },
  { id: 'sara', name: 'Sara', item: '⛺', skin: 2, hair: 'long', hairColor: BROWN, beard: 'none', head: 'veil', headColor: '#f2e8d8', robe: 1 },
  { id: 'moises', name: 'Moisés', item: '🌊', skin: 3, hair: 'long', hairColor: GRAY, beard: 'long', beardColor: WHITE, head: 'none', robe: 0 },
  { id: 'miria', name: 'Miriã', item: '🪘', skin: 3, hair: 'long', hairColor: BLACK, beard: 'none', head: 'veil', headColor: '#ffb703', robe: 2 },
  { id: 'arao', name: 'Arão', item: '💎', skin: 2, hair: 'short', hairColor: BLACK, beard: 'short', beardColor: BLACK, head: 'turban', headColor: '#ffffff', robe: 0 },
  { id: 'debora', name: 'Débora', item: '🌴', skin: 4, hair: 'long', hairColor: BLACK, beard: 'none', head: 'veil', headColor: '#4caf1a', robe: 4 },
  { id: 'gideao', name: 'Gideão', item: '🏺', skin: 3, hair: 'short', hairColor: BLACK, beard: 'short', beardColor: BLACK, head: 'none', robe: 5 },
  { id: 'rute', name: 'Rute', item: '🌾', skin: 3, hair: 'long', hairColor: AUBURN, beard: 'none', head: 'veil', headColor: '#c67b3c', robe: 4 },
  { id: 'ana', name: 'Ana', item: '🙏', skin: 2, hair: 'long', hairColor: BROWN, beard: 'none', head: 'veil', headColor: '#7b3fe4', robe: 3 },
  { id: 'samuel', name: 'Samuel', item: '🫗', skin: 3, hair: 'short', hairColor: BROWN, beard: 'none', head: 'none', robe: 0 },
  { id: 'davi', name: 'Davi', item: '🐑', skin: 2, hair: 'curly', hairColor: AUBURN, beard: 'none', head: 'crown', robe: 1 },
  { id: 'ester', name: 'Ester', item: '🌟', skin: 3, hair: 'long', hairColor: BLACK, beard: 'none', head: 'crown', robe: 3 },
  { id: 'elias', name: 'Elias', item: '🔥', skin: 4, hair: 'wild', hairColor: BLACK, beard: 'long', beardColor: BLACK, head: 'none', robe: 5 },
  { id: 'eliseu', name: 'Eliseu', item: '🧥', skin: 3, hair: 'bald', hairColor: BROWN, beard: 'short', beardColor: BROWN, head: 'none', robe: 2 },
  { id: 'daniel', name: 'Daniel', item: '🦁', skin: 3, hair: 'short', hairColor: BLACK, beard: 'none', head: 'band', headColor: '#ffb703', robe: 3 },
  { id: 'jonas', name: 'Jonas', item: '🐋', skin: 3, hair: 'short', hairColor: BROWN, beard: 'short', beardColor: BROWN, head: 'none', robe: 0 },
  { id: 'isaias', name: 'Isaías', item: '✨', skin: 2, hair: 'short', hairColor: GRAY, beard: 'long', beardColor: GRAY, head: 'none', robe: 3 },
  { id: 'jeremias', name: 'Jeremias', item: '🪵', skin: 3, hair: 'short', hairColor: BLACK, beard: 'short', beardColor: BLACK, head: 'none', robe: 5 },
  { id: 'maria', name: 'Maria', item: '🤍', skin: 3, hair: 'long', hairColor: BROWN, beard: 'none', head: 'veil', headColor: '#1c7ed6', robe: 0 },
  { id: 'joao', name: 'João Batista', item: '🦗', skin: 4, hair: 'wild', hairColor: BROWN, beard: 'long', beardColor: BROWN, head: 'none', robe: 5 },
  { id: 'pedro', name: 'Pedro', item: '🎣', skin: 3, hair: 'curly', hairColor: GRAY, beard: 'short', beardColor: GRAY, head: 'none', robe: 0 },
  { id: 'paulo', name: 'Paulo', item: '✉️', skin: 2, hair: 'bald', hairColor: BLACK, beard: 'short', beardColor: BLACK, head: 'none', robe: 1 },
  { id: 'lidia', name: 'Lídia', item: '🧵', skin: 2, hair: 'long', hairColor: BLACK, beard: 'none', head: 'veil', headColor: '#7b3fe4', robe: 3 },
]

export const AVATAR_BY_ID: Record<string, AvatarPreset> = Object.fromEntries(AVATARS.map((a) => [a.id, a]))

export function Avatar({
  id,
  color,
  size = 64,
  mood = 'happy',
  showItem = true,
  className = '',
  style,
}: {
  id: string
  color?: number
  size?: number | string
  mood?: 'happy' | 'sad' | 'wow' | 'sleep'
  showItem?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const a = AVATAR_BY_ID[id] ?? AVATARS[0]
  const robeIdx = color ?? a.robe
  const robe = ROBES[robeIdx % ROBES.length]
  const robeS = ROBES_S[robeIdx % ROBES.length]
  const skin = SKIN[a.skin]
  const hc = a.hairColor
  const bc = a.beardColor ?? hc
  return (
    <svg viewBox="0 0 100 110" width={size} height={typeof size === 'number' ? size * 1.1 : undefined} className={className} style={style} aria-label={a.name}>
      <ellipse cx="50" cy="104" rx="28" ry="5" fill="rgba(0,0,0,.18)" />
      {/* hair behind */}
      {(a.hair === 'long' || a.hair === 'wild') && a.head !== 'veil' && (
        <path d={a.hair === 'wild' ? 'M24 40 Q18 70 30 78 L70 78 Q82 70 76 40 Z' : 'M27 40 Q24 68 32 74 L68 74 Q76 68 73 40 Z'} fill={hc} />
      )}
      {a.head === 'veil' && <path d="M24 42 Q22 20 50 14 Q78 20 76 42 L82 86 Q50 92 18 86 Z" fill={a.headColor} stroke="rgba(0,0,0,.08)" strokeWidth="1" />}
      {/* body */}
      <path d="M26 100 Q24 76 34 66 Q50 58 66 66 Q76 76 74 100 Z" fill={robe} />
      <path d="M26 100 Q25 92 26 88 L74 88 Q75 92 74 100 Z" fill={robeS} opacity=".9" />
      <path d="M42 66 L50 80 L58 66" fill="none" stroke={robeS} strokeWidth="3" strokeLinecap="round" />
      <rect x="31" y="80" width="38" height="5" rx="2.5" fill="rgba(255,255,255,.35)" />
      <circle cx="28" cy="86" r="5" fill={skin} />
      <circle cx="72" cy="86" r="5" fill={skin} />
      {/* head */}
      <circle cx="50" cy="42" r="21" fill={skin} />
      <circle cx="29.5" cy="44" r="4" fill={skin} />
      <circle cx="70.5" cy="44" r="4" fill={skin} />
      {/* hair front */}
      {a.hair === 'short' && <path d="M29 40 Q30 19 50 18 Q70 19 71 40 Q64 28 50 29 Q36 28 29 40 Z" fill={hc} />}
      {(a.hair === 'long' || a.hair === 'wild') && a.head !== 'veil' && (
        <path d={a.hair === 'wild' ? 'M27 44 Q24 14 50 15 Q78 14 73 44 Q70 30 62 27 Q55 33 48 27 Q40 33 34 28 Q29 34 27 44 Z' : 'M29 42 Q29 18 50 18 Q71 18 71 42 Q66 27 50 27 Q34 27 29 42 Z'} fill={hc} />
      )}
      {a.hair === 'curly' && (
        <g fill={hc}>
          <circle cx="34" cy="30" r="7" />
          <circle cx="43" cy="24" r="7" />
          <circle cx="53" cy="22" r="7" />
          <circle cx="62" cy="25" r="7" />
          <circle cx="68" cy="32" r="6" />
          <circle cx="31" cy="38" r="5" />
        </g>
      )}
      {a.hair === 'bald' && (
        <g fill={hc}>
          <path d="M29 44 Q28 34 33 32 L34 46 Z" />
          <path d="M71 44 Q72 34 67 32 L66 46 Z" />
          <ellipse cx="43" cy="27" rx="6" ry="3" fill="rgba(255,255,255,.35)" />
        </g>
      )}
      {a.head === 'veil' && <path d="M29 44 Q28 20 50 19 Q72 20 71 44 Q66 30 50 30 Q34 30 29 44 Z" fill={a.headColor} />}
      {a.head === 'veil' && a.hair !== 'none' && <path d="M33 34 Q50 26 67 34 Q60 31 50 31 Q40 31 33 34 Z" fill={hc} />}
      {a.head === 'turban' && <path d="M28 36 Q30 14 50 14 Q70 14 72 36 Q60 30 50 30 Q40 30 28 36 Z" fill={a.headColor} stroke="#d9d2c4" strokeWidth="1.5" />}
      {a.head === 'band' && <rect x="29" y="30" width="42" height="5" rx="2.5" fill={a.headColor} />}
      {a.head === 'crown' && (
        <path d="M33 26 L36 12 L43 21 L50 9 L57 21 L64 12 L67 26 Z" fill="#ffc83d" stroke="#d48f00" strokeWidth="1.5" strokeLinejoin="round" />
      )}
      {/* beard */}
      {a.beard === 'short' && <path d="M33 48 Q36 66 50 67 Q64 66 67 48 Q62 56 50 56 Q38 56 33 48 Z" fill={bc} />}
      {a.beard === 'long' && <path d="M31 46 Q32 78 50 84 Q68 78 69 46 Q63 57 50 57 Q37 57 31 46 Z" fill={bc} />}
      {/* face */}
      {mood === 'sleep' ? (
        <g stroke="#2a1d14" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M38 44 Q42 47 46 44" />
          <path d="M54 44 Q58 47 62 44" />
        </g>
      ) : (
        <g>
          <ellipse cx="42" cy="43" rx="3.4" ry={mood === 'wow' ? 4.6 : 4} fill="#2a1d14" />
          <ellipse cx="58" cy="43" rx="3.4" ry={mood === 'wow' ? 4.6 : 4} fill="#2a1d14" />
          <circle cx="43.2" cy="41.6" r="1.2" fill="#fff" />
          <circle cx="59.2" cy="41.6" r="1.2" fill="#fff" />
        </g>
      )}
      <circle cx="36" cy="50" r="3.2" fill="#ff7a7a" opacity=".35" />
      <circle cx="64" cy="50" r="3.2" fill="#ff7a7a" opacity=".35" />
      {a.beard !== 'long' &&
        (mood === 'sad' ? (
          <path d="M45 55 Q50 51 55 55" stroke="#2a1d14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ) : mood === 'wow' ? (
          <ellipse cx="50" cy="54" rx="3" ry="3.6" fill="#2a1d14" />
        ) : (
          <path d="M44 52 Q50 58 56 52" stroke="#2a1d14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ))}
      {a.beard === 'long' && mood !== 'sad' && <path d="M45 54 Q50 57 55 54" stroke="#2a1d14" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6" />}
      {showItem && (
        <g>
          <circle cx="80" cy="84" r="13" fill="#fff" stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
          <text x="80" y="89.5" fontSize="15" textAnchor="middle">
            {a.item}
          </text>
        </g>
      )}
    </svg>
  )
}
