export const INTERACT_RADIUS  = 4.5;
export const PLAYER_SPEED    = 14;
export const PLAYER_SPRINT   = 22;
export const ROOM_W = 28;
export const ROOM_H = 6;
export const ROOM_D = 28;
export const ROOM_BOUND = 12.5;

// ─── Multi-room navigation bounds ─────────────────────────────────────────────
export function isInAllowedZone(x: number, z: number): boolean {
  if (Math.abs(x) <= 12.5 && Math.abs(z) <= 12.5) return true;  // main cryo lab
  if (x >= -22 && x <= -12.5 && Math.abs(z) <= 2.4) return true; // west corridor
  if (x >= -50 && x <= -22  && Math.abs(z) <= 12.5) return true;  // garden room
  if (x >= 12.5 && x <= 22  && Math.abs(z) <= 2.4)  return true;  // east corridor
  if (x >= 22  && x <= 50   && Math.abs(z) <= 12.5) return true;  // generator room
  return false;
}

export function detectRoom(x: number, _z: number): string {
  if (x <= -22) return 'garden';
  if (x >= 22)  return 'generator';
  if (x < -12.5) return 'corridor';
  if (x > 12.5)  return 'corridor';
  return 'cryolab';
}

// ─── Radiation zones ──────────────────────────────────────────────────────────
export interface RadZone { x: number; z: number; radius: number; maxRads: number; label: string; }

export const RAD_ZONES: RadZone[] = [
  { x: 13,  z: 4,   radius: 6, maxRads: 8, label: 'MAINFRAME COOLANT LEAK'    },
  { x: -12, z: -8,  radius: 5, maxRads: 5, label: 'CRYO FLUID CONTAMINATION'  },
  { x: 12,  z: -8,  radius: 5, maxRads: 4, label: 'REACTOR BLEED'              },
  { x: 0,   z: -13, radius: 3, maxRads: 3, label: 'CRYO TUBE DISCHARGE'        },
  { x: 36,  z: 0,   radius: 9, maxRads: 7, label: 'REACTOR CORE RADIATION'     },
];

// ─── Terminal types ───────────────────────────────────────────────────────────
export interface TerminalDef { id: string; x: number; y: number; label: string; color: string; }
export interface Terminal3DDef {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  label: string;
}

export const TERMINALS_3D: Terminal3DDef[] = [
  // Main Cryo Lab
  { id: 'cryo',      position: [0,   1.5, -13],  rotation: [0, 0, 0],              color: '#00aaff', label: 'CRYO SYSTEM CONTROL'   },
  { id: 'security',  position: [-13, 1.5, -4],   rotation: [0, Math.PI / 2, 0],    color: '#ff4444', label: 'VAULT SECURITY'         },
  { id: 'research',  position: [13,  1.5, -4],   rotation: [0, -Math.PI / 2, 0],   color: '#44ff44', label: 'RESEARCH TERMINAL B-7'  },
  { id: 'medical',   position: [-13, 1.5, 4],    rotation: [0, Math.PI / 2, 0],    color: '#44aaff', label: 'MEDICAL STATION ALPHA'  },
  { id: 'mainframe', position: [13,  1.5, 4],    rotation: [0, -Math.PI / 2, 0],   color: '#ffaa00', label: 'MAINFRAME ACCESS'        },
  // Garden / Hydroponics (west, at x=-49, faces east = rotation +Math.PI/2)
  { id: 'garden',    position: [-49, 1.5, 0],    rotation: [0, Math.PI / 2, 0],    color: '#44ff88', label: 'HYDROPONICS CONTROL'    },
  // Generator / Reactor (east, at x=49, faces west = rotation -Math.PI/2)
  { id: 'reactor',   position: [49,  1.5, 0],    rotation: [0, -Math.PI / 2, 0],   color: '#ff6600', label: 'REACTOR CORE SYSTEMS'   },
];

export const TERMINAL_MARKET: Record<string, string> = {
  cryo:      'BTC-USD',
  security:  'ETH-USD',
  research:  'SOL-USD',
  medical:   'DOGE-USD',
  mainframe: 'BTC-USD',
  garden:    'XRP-USD',
  reactor:   'AVAX-USD',
};

export const TERMINALS: TerminalDef[] = [
  { id: 'cryo',      x: 0, y: 0, label: 'CRYO SYSTEM CONTROL',   color: '#00aaff' },
  { id: 'security',  x: 0, y: 0, label: 'VAULT SECURITY',         color: '#ff4444' },
  { id: 'research',  x: 0, y: 0, label: 'RESEARCH TERMINAL B-7',  color: '#44ff44' },
  { id: 'medical',   x: 0, y: 0, label: 'MEDICAL STATION ALPHA',  color: '#44aaff' },
  { id: 'mainframe', x: 0, y: 0, label: 'MAINFRAME ACCESS',        color: '#ffaa00' },
  { id: 'garden',    x: 0, y: 0, label: 'HYDROPONICS CONTROL',     color: '#44ff88' },
  { id: 'reactor',   x: 0, y: 0, label: 'REACTOR CORE SYSTEMS',   color: '#ff6600' },
];

export const TERMINAL_CONTENT: Record<string, { title: string; lines: string[] }> = {
  cryo: {
    title: 'VAULT-TEC CRYOGENIC SYSTEM v4.7.3',
    lines: [
      '> VAULT 63 - CRYO CHAMBER STATUS',
      '  Current Date: 2287.10.23',
      '  Last Maintenance: ERROR - LOG CORRUPTED',
      '',
      '> ACTIVE PODS: 1/12',
      '  POD STATUS: MALFUNCTION - EMERGENCY OVERRIDE',
      '',
      '> SUBJECT: VAULT DWELLER',
      '  Entry Date:    2077.10.23',
      '  Elapsed Time:  210 YEARS 0 DAYS',
      '  Exit Status:   THAWED - MANUAL OVERRIDE',
      '',
      '> SYSTEM MESSAGE:',
      '  All other pods: CRITICAL FAILURE',
      '  Cryo fluid drained. Life signs: NEGATIVE',
      '  Reason for failure: UNKNOWN',
      '',
      '  You are the only one left.',
    ],
  },
  security: {
    title: 'VAULT-TEC UNIFIED SECURITY SYSTEM',
    lines: [
      '> VAULT 63 - SECURITY STATUS REPORT',
      '  Last Security Sweep: ERROR (210 yrs ago)',
      '',
      '> VAULT POPULATION: 1',
      '  Original Population: 117',
      '  Threat Level: UNKNOWN',
      '',
      '> SYSTEM STATUS:',
      '  Camera Systems:   OFFLINE',
      '  Turret Network:   OFFLINE',
      '  Door Locks:       DISENGAGED',
      '  Alarm System:     OFFLINE',
      '',
      '> SECURITY LOG - FINAL ENTRIES:',
      '  2079.03.16 - Disturbance reported in Sector C',
      '  2079.03.20 - VAULT SECURITY OFFLINE',
      '',
      '  Power was rerouted to cryo systems.',
      '  No security updates since 2079.',
    ],
  },
  research: {
    title: 'VAULT-TEC RESEARCH DIVISION - CLASSIFIED',
    lines: [
      '> PROJECT HELIX - CRYOGENIC STUDY',
      '',
      '  Test subjects entered stasis:  117',
      '  Observation target period:     200 years',
      '  Study objective: [CLASSIFIED]',
      '  Current status: STUDY TERMINATED',
      '',
      '> RESEARCHER NOTES:',
      '  "Subject metabolism shows remarkable',
      '   preservation after 50+ year intervals.',
      '   All biometrics nominal pre-freeze."',
      '                       - Dr. Chamberlain',
      '',
      '> FINAL LOG (Dr. Chamberlain, 2079.04.01):',
      '  "The Overseer has left the vault.',
      '   Power failing. I cannot stop it.',
      '   If anyone reads this - I am sorry.',
      '   The project was never what they said."',
    ],
  },
  medical: {
    title: 'VAULT-TEC MEDICAL SYSTEMS - STATION A',
    lines: [
      '> PATIENT DIAGNOSTIC REPORT',
      '  Date: 2287.10.23',
      '',
      '> PATIENT: VAULT DWELLER',
      '  Blood Pressure:     118/72  (NORMAL)',
      '  Heart Rate:          68 bpm (NORMAL)',
      '  Radiation Level:      0 rads (CLEAR)',
      '  Core Temperature:   98.6 °F (NORMAL)',
      '  Cryo Duration:      210 years',
      '',
      '> POST-CRYO ASSESSMENT:',
      '  Muscle atrophy:          MINIMAL',
      '  Cognitive function:      INTACT',
      '  Memory retention:        INTACT',
      '  Temporal disorientation: EXPECTED',
      '',
      '> PHYSICIAN NOTES:',
      '  Standard reorientation protocol advised.',
      '  Estimated recovery time: 24 hours.',
      '  Pip-Boy systems nominal. All vitals clear.',
    ],
  },
  mainframe: {
    title: 'VAULT-TEC MAINFRAME — AI TRADING CORE',
    lines: [
      '> NEXT-GEN AI TRADING SYSTEM v3.1.0',
      '  Classification: EYES ONLY',
      '  Node: VAULT-63-MAINFRAME',
      '',
      '> BOT STATUS: [ FETCHING... ]',
      '  Connect your dashboard via Pip-Boy',
      '  TRADE screen to see live data here.',
      '',
      '> PORTFOLIO OVERVIEW:',
      '  Balance:    see Pip-Boy TRADE tab',
      '  Total P&L:  see Pip-Boy TRADE tab',
      '  Daily P&L:  see Pip-Boy TRADE tab',
      '',
      '> SYSTEM NOTES:',
      '  The AI core runs 24/7, scanning',
      '  market patterns across all sectors.',
      '  Signals are transmitted to Pip-Boy.',
      '',
      '> SECURITY NOTICE:',
      '  Unauthorized access is prohibited.',
      '  All trades logged for audit review.',
      '  Vault-Tec takes no liability for',
      '  market losses incurred post-war.',
    ],
  },
  garden: {
    title: 'VAULT-TEC HYDROPONICS BAY — SECTOR G',
    lines: [
      '> HYDROPONICS STATUS — LEVEL 2',
      '  System Online: 210 years continuous',
      '  Last Harvest:  ERROR — LOG MISSING',
      '',
      '> GROW BAYS: 12 active / 12 total',
      '  UV Spectrum:   OPTIMAL  (380–780 nm)',
      '  Water pH:      6.3  (TARGET 6.5)',
      '  Nutrient Mix:  VAULT-TEC FORMULA 7B',
      '',
      '> CROP STATUS:',
      '  Mutfruit:         THRIVING',
      '  Tato:             STABLE',
      '  Corn (pre-war):   MUTATED — STILL EDIBLE',
      '  Razorgrain:       OVERGROWN — NEEDS TRIM',
      '',
      '> WATER RECYCLE:',
      '  Efficiency: 94.7%   (EXCELLENT)',
      '  Last filter change: 210 years ago',
      '',
      '> NOTE FROM OVERSEER (2079):',
      '  "If you read this, eat the mutfruit.',
      '   It tastes awful. Eat it anyway.',
      '   The garden will outlast all of us."',
    ],
  },
  reactor: {
    title: 'VAULT-TEC REACTOR CORE — LEVEL 1',
    lines: [
      '> FUSION REACTOR STATUS',
      '  Model: Vault-Tec Mark IV Fusion Core',
      '  Online since: 2077.10.23',
      '  Runtime: 210 years 0 days',
      '',
      '> POWER OUTPUT:',
      '  Current:   87.4 MW   (TARGET 90 MW)',
      '  Stability: 91.2%     (WARNING: DEGRADED)',
      '  Fuel rod:  6.3% remaining',
      '',
      '> COOLANT SYSTEMS:',
      '  Primary loop:    NOMINAL',
      '  Secondary loop:  WARNING — PRESSURE HIGH',
      '  Tertiary:        OFFLINE (non-critical)',
      '',
      '> RADIATION LEVELS:',
      '  Core chamber:    340 rads/hr  [DANGER]',
      '  Control room:    4.2 rads/hr  [CAUTION]',
      '  Perimeter:       0.8 rads/hr  [LOW]',
      '',
      '> MAINTENANCE LOG:',
      '  Last inspection: 2079.01.12',
      '  "Fuel cell approaching end of life.',
      '   Estimated failure: 50–100 years."',
      '',
      '  SYSTEM NOTE: 210 years elapsed.',
      '  Fuel cell operating on reserve power.',
      '  Reactor shutdown imminent.',
    ],
  },
};
