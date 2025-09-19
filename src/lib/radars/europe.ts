import { RadarSite } from './types';

// Country-specific radar lists for Europe.
// Note: Only verified Swiss sites populated here. Add more countries as needed.

export const CH_RADARS: RadarSite[] = [
  { id: 'SW41',   name: 'Albis (Zurich area)',     lat: 47.28, lon: 8.51 },
  { id: 'SW42',   name: 'La Dôle (Geneva area)',   lat: 46.43, lon: 6.10 },
  { id: 'SW43',   name: 'Monte Lema (Ticino)',     lat: 46.04, lon: 8.83 },
  { id: 'CH3048', name: 'Plaine Morte (Valais)',   lat: 46.38, lon: 7.50 },
  { id: 'OSAA',   name: 'Weissfluhgipfel (GR)',    lat: 46.83, lon: 9.81 },
];

// Scaffold for other countries (populate with verified RainViewer IDs and coordinates)
export const DE_RADARS: RadarSite[] = [];
export const AT_RADARS: RadarSite[] = [];
export const FR_RADARS: RadarSite[] = [];
export const IT_RADARS: RadarSite[] = [];
export const ES_RADARS: RadarSite[] = [];
export const PL_RADARS: RadarSite[] = [];
export const CZ_RADARS: RadarSite[] = [];
export const SK_RADARS: RadarSite[] = [];
export const HU_RADARS: RadarSite[] = [];
export const SI_RADARS: RadarSite[] = [];
export const HR_RADARS: RadarSite[] = [];
export const RO_RADARS: RadarSite[] = [];
export const BG_RADARS: RadarSite[] = [];
export const GR_RADARS: RadarSite[] = [];
export const NL_RADARS: RadarSite[] = [];
export const BE_RADARS: RadarSite[] = [];
export const LU_RADARS: RadarSite[] = [];
export const DK_RADARS: RadarSite[] = [];
export const SE_RADARS: RadarSite[] = [];
export const NO_RADARS: RadarSite[] = [];
export const FI_RADARS: RadarSite[] = [];
export const EE_RADARS: RadarSite[] = [];
export const LV_RADARS: RadarSite[] = [];
export const LT_RADARS: RadarSite[] = [];
export const IE_RADARS: RadarSite[] = [];
export const GB_RADARS: RadarSite[] = [];
export const PT_RADARS: RadarSite[] = [];
export const IS_RADARS: RadarSite[] = [];
export const UA_RADARS: RadarSite[] = [];
export const MD_RADARS: RadarSite[] = [];
export const BY_RADARS: RadarSite[] = [];
export const RS_RADARS: RadarSite[] = [];
export const BA_RADARS: RadarSite[] = [];
export const ME_RADARS: RadarSite[] = [];
export const MK_RADARS: RadarSite[] = [];
export const AL_RADARS: RadarSite[] = [];
export const MT_RADARS: RadarSite[] = [];
export const CY_RADARS: RadarSite[] = [];

export const COUNTRY_RADARS: Record<string, RadarSite[]> = {
  CH: CH_RADARS,
  DE: DE_RADARS,
  AT: AT_RADARS,
  FR: FR_RADARS,
  IT: IT_RADARS,
  ES: ES_RADARS,
  PL: PL_RADARS,
  CZ: CZ_RADARS,
  SK: SK_RADARS,
  HU: HU_RADARS,
  SI: SI_RADARS,
  HR: HR_RADARS,
  RO: RO_RADARS,
  BG: BG_RADARS,
  GR: GR_RADARS,
  NL: NL_RADARS,
  BE: BE_RADARS,
  LU: LU_RADARS,
  DK: DK_RADARS,
  SE: SE_RADARS,
  NO: NO_RADARS,
  FI: FI_RADARS,
  EE: EE_RADARS,
  LV: LV_RADARS,
  LT: LT_RADARS,
  IE: IE_RADARS,
  GB: GB_RADARS,
  PT: PT_RADARS,
  IS: IS_RADARS,
  UA: UA_RADARS,
  MD: MD_RADARS,
  BY: BY_RADARS,
  RS: RS_RADARS,
  BA: BA_RADARS,
  ME: ME_RADARS,
  MK: MK_RADARS,
  AL: AL_RADARS,
  MT: MT_RADARS,
  CY: CY_RADARS,
};

// Flattened list of all European radars
export const EU_RADARS: RadarSite[] = Object.values(COUNTRY_RADARS).flat();

