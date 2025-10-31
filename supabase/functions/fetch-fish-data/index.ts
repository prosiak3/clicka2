import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

function extractRTWData(html: string, url: string): FishData {
  const data: FishData = { source_url: url };

  try {
    const polishNameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (polishNameMatch) {
      data.name_pl = polishNameMatch[1].trim();
    }

    const latinMatch = html.match(/(?:Latin[:\s]*|Łacińsk[ai][:\s]*|<i>)\s*([A-Z][a-z]+\s+[a-z]+)/i);
    if (latinMatch) {
      data.latin_name = latinMatch[1].trim();
    }

    const lengthMatch = html.match(/(?:długość|length)[:\s]*(?:do|up to|max)[:\s]*(\d+)\s*cm/i);
    if (lengthMatch) {
      data.max_length = parseInt(lengthMatch[1]);
      data.min_length = Math.round(parseInt(lengthMatch[1]) * 0.2);
    }

    const weightMatch = html.match(/(?:waga|weight)[:\s]*(?:do|up to|max)[:\s]*(\d+(?:[.,]\d+)?)\s*kg/i);
    if (weightMatch) {
      data.max_weight = parseFloat(weightMatch[1].replace(',', '.'));
    }

    const legalSizeMatch = html.match(/(?:wymiar ochronny|protection size)[:\s]*(\d+)(?:\s*-\s*(\d+))?\s*cm/i);
    if (legalSizeMatch) {
      data.legal_size = parseInt(legalSizeMatch[1]);
    }

    const protectionPeriodMatch = html.match(/(?:okres ochronny|closed season)[:\s]*(\d+)\s+(\w+)\s*-\s*(\d+)\s+(\w+)/i);
    if (protectionPeriodMatch) {
      const monthMap: { [key: string]: string } = {
        'stycznia': '01', 'stycznia': '01', 'lutego': '02', 'marca': '03', 'kwietnia': '04',
        'maja': '05', 'czerwca': '06', 'lipca': '07', 'sierpnia': '08',
        'września': '09', 'października': '10', 'listopada': '11', 'grudnia': '12',
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };

      const startMonth = monthMap[protectionPeriodMatch[2].toLowerCase()];
      const endMonth = monthMap[protectionPeriodMatch[4].toLowerCase()];

      if (startMonth && endMonth) {
        data.protected_period_start = `2024-${startMonth}-${protectionPeriodMatch[1].padStart(2, '0')}`;
        data.protected_period_end = `2024-${endMonth}-${protectionPeriodMatch[3].padStart(2, '0')}`;
      }
    }

    const imageMatch = html.match(/<img[^>]*src=["']([^"']*(?:szczupak|okon|sandacz|karp|leszcz|sum|lin|amur|karas|pstrag|lipien|brzana|bolec|jaź|jelec|kleń|płoć|certa|kiełb|koza|krąp|miętus|piskorz|ukleja|węgorz|sieja|stynka|świnka|tołpyga|wzdręga)[^"']*)["']/i);
    if (imageMatch) {
      let imageUrl = imageMatch[1];
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      data.image_url = imageUrl;
      data.thumbnail_url = imageUrl;
    }

    const descriptionSections = html.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*)*?)<\/p>/gi);
    if (descriptionSections && descriptionSections.length > 0) {
      const cleanText = descriptionSections[0].replace(/<[^>]+>/g, '').trim();
      if (cleanText.length > 50) {
        data.description_pl = cleanText.substring(0, 500);
      }
    }

    const habitatMatch = html.match(/(?:Siedlisko|Habitat)[:\s]*([^<.]+(?:\.[^<.]+){0,2})/i);
    if (habitatMatch) {
      data.habitat_pl = habitatMatch[1].trim();
    }

    const spawningMatch = html.match(/(?:Tarło|Spawning|Rozród)[:\s]*([^<.]+(?:\.[^<.]+){0,2})/i);
    if (spawningMatch) {
      data.spawning_pl = spawningMatch[1].trim();
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

    return new Response(
      JSON.stringify({
        success: true,
        data: fishData,
        message: 'Data extracted successfully. Please review and edit before saving.',
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
