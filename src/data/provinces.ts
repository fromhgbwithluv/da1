import provincesData from './provinces.json' with { type: 'json' };

export interface WardItem {
  code: string;
  name: string;
  fullName: string;
  unit: string;
}

export interface ProvinceItem {
  code: string;
  name: string;
  fullName: string;
  codeName: string;
  unit: string;
  wards: WardItem[];
}

export const PROVINCES: ProvinceItem[] = provincesData as ProvinceItem[];

export function normalizeVietnamese(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

export function getProvinceByCode(code: string): ProvinceItem | undefined {
  return PROVINCES.find((p) => p.code === code);
}

export function getWardsByProvinceCode(provinceCode: string): WardItem[] {
  const prov = getProvinceByCode(provinceCode);
  return prov ? prov.wards : [];
}

export function getWardByCode(provinceCode: string, wardCode: string): WardItem | undefined {
  const wards = getWardsByProvinceCode(provinceCode);
  return wards.find((w) => w.code === wardCode);
}

export function detectProvinceFromLocation(locationStr: string): ProvinceItem | undefined {
  if (!locationStr) return undefined;
  const norm = normalizeVietnamese(locationStr);

  // Check HCM first
  if (
    norm.includes('ho chi minh') ||
    norm.includes('hcm') ||
    norm.includes('sai gon') ||
    norm.includes('tphcm')
  ) {
    return PROVINCES.find((p) => p.code === '79');
  }

  // Check Ha Noi
  if (norm.includes('ha noi') || norm.includes('hanoi') || norm.includes('hn')) {
    return PROVINCES.find((p) => p.code === '01');
  }

  // Check Da Nang
  if (norm.includes('da nang') || norm.includes('danang')) {
    return PROVINCES.find((p) => p.code === '48');
  }

  // Check remaining provinces by name and fullName
  for (const prov of PROVINCES) {
    const normName = normalizeVietnamese(prov.name);
    const normFullName = normalizeVietnamese(prov.fullName);
    if (norm.includes(normName) || norm.includes(normFullName)) {
      return prov;
    }
  }

  return undefined;
}

export function detectWardFromLocation(provinceCode: string, locationStr: string): WardItem | undefined {
  if (!locationStr) return undefined;
  const wards = getWardsByProvinceCode(provinceCode);
  const norm = normalizeVietnamese(locationStr);

  // Sort by length descending to match most specific ward name first
  const sorted = [...wards].sort((a, b) => b.name.length - a.name.length);
  for (const ward of sorted) {
    const normName = normalizeVietnamese(ward.name);
    const normFullName = normalizeVietnamese(ward.fullName);
    if (norm.includes(normFullName) || norm.includes(normName)) {
      return ward;
    }
  }

  return undefined;
}
