import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FishData {
  name_pl?: string;
  name_en?: string;
  name_de?: string;
  latin_name?: string;
  min_length?: number;
  max_length?: number;
  max_weight?: number;
  description_pl?: string;
  description_en?: string;
  description_de?: string;
  habitat_pl?: string;
  habitat_en?: string;
  habitat_de?: string;
  feeding_pl?: string;
  feeding_en?: string;
  feeding_de?: string;
  spawning_pl?: string;
  spawning_en?: string;
  spawning_de?: string;
  legal_size?: number;
  protected_period_start?: string;
  protected_period_end?: string;
  image_url?: string;
  thumbnail_url?: string;
  group_name?: string;
  source_url?: string;
}

function extractSectionContent(html: string, sectionTitle: string): string {
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionRegex = new RegExp(`<h[34][^>]*>\\s*${escapedTitle}\\s*<\\/h[34]>([\\s\\S]*?)(?=<h[234][^>]*>|<div[^>]*class="[^"]*margin-top|$)`, 'i');
  const match = html.match(sectionRegex);

  if (match && match[1]) {
    const content = match[1];
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs = content.match(paragraphRegex) || [];
    const cleanedParagraphs = paragraphs
      .map(p => {
        let text = p.replace(/<[^>]+>/g, '').trim();
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/\s+/g, ' ');
        return text;
      })
      .filter(p => p.length > 10);

    return cleanedParagraphs.join(' ');
  }

  return '';
}

function extractRTWData(html: string, url: string): FishData {
  const data: FishData = { source_url: url };

  try {
    const h1Match = html.match(/<h1[^>]*>([^<(]+)(?:\([^)]+\))?<\/h1>/i);
    if (h1Match) {
      data.name_pl = h1Match[1].trim();
    }

    const h2Match = html.match(/<h2[^>]*>([^<(]+)\(([^)]+)\)<\/h2>/i);
    if (h2Match) {
      if (!data.name_pl) {
        data.name_pl = h2Match[1].trim();
      }
      data.latin_name = h2Match[2].trim();
    }

    if (!data.latin_name) {
      const latinMatch = html.match(/\(([A-Z][a-z]+\s+[a-z]+)\)/i);
      if (latinMatch) {
        data.latin_name = latinMatch[1].trim();
      }
    }

    const budowaContent = extractSectionContent(html, 'Budowa zewnętrzna');
    if (budowaContent) {
      data.description_pl = budowaContent;

      const lengthMatches = budowaContent.match(/(\d+)\s*cm/gi);
      if (lengthMatches && lengthMatches.length > 0) {
        const lengths = lengthMatches.map(m => parseInt(m));
        data.max_length = Math.max(...lengths);
        data.min_length = Math.min(...lengths);
      }

      const weightMatches = budowaContent.match(/(\d+(?:[.,]\d+)?)\s*kg/gi);
      if (weightMatches && weightMatches.length > 0) {
        const weights = weightMatches.map(m => parseFloat(m.replace(',', '.')));
        data.max_weight = Math.max(...weights);
      }
    }

    const wystepowanieContent = extractSectionContent(html, 'Występowanie');
    if (wystepowanieContent) {
      data.habitat_pl = wystepowanieContent;
    }

    const trybZyciaContent = extractSectionContent(html, 'Tryb życia');
    if (trybZyciaContent) {
      data.spawning_pl = trybZyciaContent;
    }

    const odzywianieContent = extractSectionContent(html, 'Odżywianie');
    if (odzywianieContent) {
      data.feeding_pl = odzywianieContent;
    }

    const legalSizeRegex = /Wymiar ochronny:\s*(?:do\s*)?(\d+)\s*cm/i;
    const legalSizeMatch = html.match(legalSizeRegex);
    if (legalSizeMatch) {
      data.legal_size = parseInt(legalSizeMatch[1]);
    }

    const protectionPeriodRegex = /Okres ochronny:\s*od\s*(\d+)\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s*do\s*(\d+)\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)/i;
    const protectionPeriodMatch = html.match(protectionPeriodRegex);
    if (protectionPeriodMatch) {
      const monthMap: { [key: string]: string } = {
        'stycznia': '01', 'lutego': '02', 'marca': '03', 'kwietnia': '04',
        'maja': '05', 'czerwca': '06', 'lipca': '07', 'sierpnia': '08',
        'września': '09', 'października': '10', 'listopada': '11', 'grudnia': '12'
      };

      const startMonth = monthMap[protectionPeriodMatch[2].toLowerCase()];
      const endMonth = monthMap[protectionPeriodMatch[4].toLowerCase()];

      if (startMonth && endMonth) {
        data.protected_period_start = `2024-${startMonth}-${protectionPeriodMatch[1].padStart(2, '0')}`;
        data.protected_period_end = `2024-${endMonth}-${protectionPeriodMatch[3].padStart(2, '0')}`;
      }
    }

    const imageMatch = html.match(/<img[^>]*src=["']([^"']*\.(?:jpg|jpeg|png|gif|webp))["']/i);
    if (imageMatch) {
      let imageUrl = imageMatch[1];
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      data.image_url = imageUrl;
      data.thumbnail_url = imageUrl;
    }

    if (data.name_pl) {
      const lowercaseName = data.name_pl.toLowerCase();
      if (lowercaseName.includes('szczupak') || lowercaseName.includes('okoń') ||
          lowercaseName.includes('sandacz') || lowercaseName.includes('sum')) {
        data.group_name = 'predatory';
      } else if (lowercaseName.includes('pstrąg') || lowercaseName.includes('lipień')) {
        data.group_name = 'salmonid';
      } else {
        data.group_name = 'freshwater';
      }
    }

  } catch (error) {
    console.error('[Parser] Error extracting RTW data:', error);
  }

  return data;
}

function extractGenericData(html: string, url: string): FishData {
  const data: FishData = { source_url: url };

  try {
    const latinMatch = html.match(/\b([A-Z][a-z]+\s+[a-z]+)\b/);
    if (latinMatch) {
      data.latin_name = latinMatch[1];
    }

    const numberMatches = html.match(/\b(\d+)\s*(?:cm|centimeter)/gi);
    if (numberMatches && numberMatches.length > 0) {
      const numbers = numberMatches.map(m => parseInt(m));
      data.max_length = Math.max(...numbers);
      data.min_length = Math.min(...numbers);
    }

    const weightMatches = html.match(/\b(\d+(?:[.,]\d+)?)\s*(?:kg|kilogram)/gi);
    if (weightMatches && weightMatches.length > 0) {
      const weights = weightMatches.map(m => parseFloat(m.replace(',', '.')));
      data.max_weight = Math.max(...weights);
    }

    const imageMatch = html.match(/<img[^>]*src=["']([^"']+(?:jpg|jpeg|png|gif))["']/i);
    if (imageMatch) {
      let imageUrl = imageMatch[1];
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      data.image_url = imageUrl;
      data.thumbnail_url = imageUrl;
    }

  } catch (error) {
    console.error('[Parser] Error extracting generic data:', error);
  }

  return data;
}

async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return '';
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pl&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FishDataBot/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`[Translation] Failed to translate to ${targetLang}:`, response.statusText);
      return text;
    }

    const data = await response.json();

    if (data && data[0] && Array.isArray(data[0])) {
      const translatedParts = data[0].map((part: any) => part[0]).filter(Boolean);
      return translatedParts.join('');
    }

    return text;
  } catch (error) {
    console.error(`[Translation] Error translating to ${targetLang}:`, error);
    return text;
  }
}

async function translateFishData(data: FishData): Promise<FishData> {
  console.log('[Translation] Starting translation process...');

  const fieldsToTranslate = [
    { field: 'description_pl', enField: 'description_en', deField: 'description_de' },
    { field: 'habitat_pl', enField: 'habitat_en', deField: 'habitat_de' },
    { field: 'feeding_pl', enField: 'feeding_en', deField: 'feeding_de' },
    { field: 'spawning_pl', enField: 'spawning_en', deField: 'spawning_de' },
  ];

  for (const { field, enField, deField } of fieldsToTranslate) {
    const polishText = data[field as keyof FishData] as string;

    if (polishText && polishText.trim().length > 0) {
      console.log(`[Translation] Translating ${field}...`);

      const [englishText, germanText] = await Promise.all([
        translateText(polishText, 'en'),
        translateText(polishText, 'de'),
      ]);

      data[enField as keyof FishData] = englishText as any;
      data[deField as keyof FishData] = germanText as any;

      console.log(`[Translation] Translated ${field} to EN and DE`);
    }
  }

  if (data.name_pl && !data.name_en) {
    console.log('[Translation] Translating fish name...');
    const [nameEn, nameDe] = await Promise.all([
      translateText(data.name_pl, 'en'),
      translateText(data.name_pl, 'de'),
    ]);
    data.name_en = nameEn;
    data.name_de = nameDe;
  }

  console.log('[Translation] Translation process completed');
  return data;
}

async function downloadAndUploadImage(imageUrl: string, fishCode: string): Promise<string | null> {
  try {
    console.log('[Image Upload] Downloading image from:', imageUrl);

    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FishDataBot/1.0)',
      },
    });

    if (!imageResponse.ok) {
      console.error('[Image Upload] Failed to download image:', imageResponse.statusText);
      return null;
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBlob = await imageResponse.blob();

    const extension = contentType.split('/')[1] || 'jpg';
    const fileName = `${fishCode}-${Date.now()}.${extension}`;

    console.log('[Image Upload] Uploading to Supabase Storage:', fileName);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.storage
      .from('fish-images')
      .upload(fileName, imageBlob, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('[Image Upload] Upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('fish-images')
      .getPublicUrl(fileName);

    console.log('[Image Upload] Successfully uploaded to:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('[Image Upload] Error uploading image:', error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[Fetch Fish Data] Fetching data from:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FishDataBot/1.0)',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.statusText}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const html = await response.text();
    console.log('[Fetch Fish Data] Received HTML, length:', html.length);

    let fishData: FishData;

    if (url.includes('rtw.org.pl')) {
      console.log('[Fetch Fish Data] Using RTW parser');
      fishData = extractRTWData(html, url);
    } else {
      console.log('[Fetch Fish Data] Using generic parser');
      fishData = extractGenericData(html, url);
    }

    console.log('[Fetch Fish Data] Extracted data:', fishData);

    console.log('[Fetch Fish Data] Starting translation...');
    fishData = await translateFishData(fishData);
    console.log('[Fetch Fish Data] Translation completed');

    if (fishData.image_url) {
      const fishCode = fishData.name_pl
        ? fishData.name_pl.toLowerCase()
            .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
            .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
            .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
            .replace(/[^a-z0-9]/g, '')
        : 'fish';

      console.log('[Fetch Fish Data] Attempting to upload image for:', fishCode);
      const uploadedImageUrl = await downloadAndUploadImage(fishData.image_url, fishCode);

      if (uploadedImageUrl) {
        fishData.image_url = uploadedImageUrl;
        fishData.thumbnail_url = uploadedImageUrl;
        console.log('[Fetch Fish Data] Image uploaded successfully');
      } else {
        console.log('[Fetch Fish Data] Image upload failed, keeping original URL');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: fishData,
        message: 'Data extracted successfully. Images have been uploaded to your storage. Please review and edit before saving.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Fetch Fish Data] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
