// Jitsu — the placeholder ninja mascot, built from primitive shapes only.
// Mood: 'happy' | 'wow' | 'calm' | 'sleep' | 'cheer'

function Jitsu({ size = 120, mood = 'happy', color, accent, ring = false }) {
  const skin   = color  || '#FFD23F';     // headband color (yellow default)
  const body   = '#2A2D5F';                // ninja gi (navy)
  const face   = '#FFE3B3';                // skin
  const stripe = accent || '#FF4F8B';      // headband accent

  // Eyes
  const eyes = {
    happy: ['M 38 60 q 6 -8 12 0', 'M 70 60 q 6 -8 12 0'],   // ^ ^ closed-happy
    wow:   null,                                              // O O
    calm:  ['M 38 62 h 12', 'M 70 62 h 12'],                  // — —
    sleep: ['M 38 62 q 6 -4 12 0', 'M 70 62 q 6 -4 12 0'],
    cheer: ['M 38 58 q 6 -10 12 0', 'M 70 58 q 6 -10 12 0'],
  }[mood];

  // Mouth
  const mouth = {
    happy: 'M 52 78 q 8 8 16 0',
    wow:   null,    // small O
    calm:  'M 54 80 h 12',
    sleep: 'M 54 80 q 6 4 12 0',
    cheer: 'M 48 76 q 12 14 24 0',
  }[mood];

  const blush = mood === 'happy' || mood === 'cheer';

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: 'block' }}>
      {ring && (
        <circle cx="60" cy="60" r="58" fill="none" stroke={stripe} strokeWidth="3" strokeDasharray="5 6" opacity="0.5"/>
      )}

      {/* Body / gi peeking */}
      <ellipse cx="60" cy="108" rx="38" ry="14" fill={body}/>
      <rect x="36" y="90" width="48" height="16" rx="8" fill={body}/>

      {/* Head */}
      <circle cx="60" cy="60" r="34" fill={face}/>

      {/* Ears */}
      <circle cx="26" cy="62" r="5" fill={face}/>
      <circle cx="94" cy="62" r="5" fill={face}/>

      {/* Headband */}
      <rect x="22" y="42" width="76" height="14" rx="3" fill={skin}/>
      <rect x="22" y="46" width="76" height="3" fill={stripe} opacity="0.5"/>
      {/* Headband knot trailing right */}
      <path d="M 96 44 Q 110 48 108 60 Q 104 56 100 56 Z" fill={skin}/>
      <path d="M 100 56 Q 114 60 112 72" stroke={skin} strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Headband logo dot */}
      <circle cx="60" cy="49" r="3.5" fill={stripe}/>

      {/* Eyes */}
      {mood === 'wow' ? (
        <g>
          <circle cx="44" cy="62" r="5" fill={body}/>
          <circle cx="76" cy="62" r="5" fill={body}/>
          <circle cx="42" cy="60" r="1.4" fill="#fff"/>
          <circle cx="74" cy="60" r="1.4" fill="#fff"/>
        </g>
      ) : (
        eyes && eyes.map((d, i) => (
          <path key={i} d={d} stroke={body} strokeWidth="3.2" fill="none" strokeLinecap="round"/>
        ))
      )}

      {/* Blush */}
      {blush && (
        <g opacity="0.6">
          <ellipse cx="38" cy="74" rx="4.5" ry="2.6" fill={stripe}/>
          <ellipse cx="82" cy="74" rx="4.5" ry="2.6" fill={stripe}/>
        </g>
      )}

      {/* Mouth */}
      {mood === 'wow' ? (
        <ellipse cx="60" cy="80" rx="4" ry="5" fill={body}/>
      ) : (
        mouth && <path d={mouth} stroke={body} strokeWidth="3" fill="none" strokeLinecap="round"/>
      )}

      {/* Z's for sleep */}
      {mood === 'sleep' && (
        <g fill={body} opacity="0.7" fontFamily='"Fredoka", system-ui' fontWeight="700">
          <text x="92" y="30" fontSize="14">z</text>
          <text x="100" y="20" fontSize="10">z</text>
        </g>
      )}
    </svg>
  );
}

// Small badge version (head only, no body) for inline use
function JitsuBadge({ size = 40, mood = 'happy', color, accent }) {
  const skin = color || '#FFD23F';
  const body = '#2A2D5F';
  const face = '#FFE3B3';
  const stripe = accent || '#FF4F8B';
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="34" fill={face}/>
      <rect x="6" y="28" width="68" height="11" rx="2.5" fill={skin}/>
      <circle cx="40" cy="33.5" r="3" fill={stripe}/>
      {mood === 'wow' ? (
        <g>
          <circle cx="28" cy="48" r="4" fill={body}/>
          <circle cx="52" cy="48" r="4" fill={body}/>
        </g>
      ) : (
        <g stroke={body} strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M 22 47 q 6 -7 12 0"/>
          <path d="M 46 47 q 6 -7 12 0"/>
        </g>
      )}
      <path d="M 32 60 q 8 6 16 0" stroke={body} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

window.Jitsu = Jitsu;
window.JitsuBadge = JitsuBadge;
