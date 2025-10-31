import { supabase } from './db';

export interface LengthWeightPoint {
  length: number;
  weight: number;
}

export interface FishSpeciesDetails {
  id: string;
  code: string;
  name_en: string;
  name_pl: string;
  name_de: string;
  latin_name: string;
  group_name: string;
  min_length: number;
  max_length: number;
  max_weight: number;
  description_pl: string | null;
  description_en: string | null;
  description_de: string | null;
  habitat_pl: string | null;
  habitat_en: string | null;
  habitat_de: string | null;
  feeding_pl: string | null;
  feeding_en: string | null;
  feeding_de: string | null;
  spawning_pl: string | null;
  spawning_en: string | null;
  spawning_de: string | null;
  legal_size: number | null;
  protected_period_start: string | null;
  protected_period_end: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  length_weight_data: LengthWeightPoint[] | null;
}

export async function getFishSpecies(): Promise<FishSpeciesDetails[]> {
  try {
    const { data, error } = await supabase
      .from('fish_species')
      .select('*')
      .order('name_en');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fish species:', error);
    return [];
  }
}

export async function getFishSpeciesByCode(code: string): Promise<FishSpeciesDetails | null> {
  try {
    const { data, error } = await supabase
      .from('fish_species')
      .select('*')
      .eq('code', code)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching fish species:', error);
    return null;
  }
}

export function calculateSuggestedWeight(
  length: number,
  lengthWeightData: LengthWeightPoint[] | null | undefined,
  minWeight: number = 0.25
): number {
  if (!lengthWeightData || lengthWeightData.length === 0) {
    return minWeight;
  }

  const sortedData = [...lengthWeightData].sort((a, b) => a.length - b.length);

  if (length <= sortedData[0].length) {
    return Math.max(sortedData[0].weight, minWeight);
  }

  if (length >= sortedData[sortedData.length - 1].length) {
    return sortedData[sortedData.length - 1].weight;
  }

  for (let i = 0; i < sortedData.length - 1; i++) {
    const point1 = sortedData[i];
    const point2 = sortedData[i + 1];

    if (length >= point1.length && length <= point2.length) {
      const lengthDiff = point2.length - point1.length;
      const weightDiff = point2.weight - point1.weight;
      const ratio = (length - point1.length) / lengthDiff;
      const interpolatedWeight = point1.weight + (weightDiff * ratio);
      return Math.round(interpolatedWeight * 10) / 10;
    }
  }

  return minWeight;
}