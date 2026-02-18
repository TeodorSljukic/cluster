/**
 * Process post content HTML to add proper list styling
 * This runs on the server side before rendering
 */
export function processPostContent(html: string): string {
  if (!html) return html;

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'processPostContent.ts:6',message:'processPostContent called',data:{htmlLength:html.length,hasUl:html.includes('<ul'),hasOl:html.includes('<ol'),htmlPreview:html.substring(0,200)},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    let processed = html;

    // Process ul lists - add inline styles
    const ulMatches = processed.match(/<ul[^>]*>/gi);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'processPostContent.ts:12',message:'UL matches before processing',data:{ulMatchCount:ulMatches?.length||0,ulMatches:ulMatches?.slice(0,3)},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    processed = processed.replace(
      /<ul([^>]*)>/gi,
      '<ul$1 style="list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;">'
    );

    // Process ul li elements - add styles and bullet points
    // Use a more robust approach that handles nested content
    processed = processed.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'processPostContent.ts:20',message:'Processing UL match',data:{matchLength:match.length,matchPreview:match.substring(0,150),hasLi:match.includes('<li')},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Find all li tags within this ul (handling nested ul/ol)
      let result = match;
      let liIndex = 0;
      
      // Process each li tag individually
      result = result.replace(/<li([^>]*)>([\s\S]*?)(?=<\/li>|$)/gi, (liMatch, liAttrs, liContent) => {
        liIndex++;
        // Check if bullet already exists
        if (liContent.includes('class="list-bullet"') || liContent.includes("class='list-bullet'")) {
          return liMatch; // Already has bullet
        }
        
        // Remove any existing list-bullet spans
        const cleanContent = liContent.replace(/<span[^>]*class=["']list-bullet["'][^>]*>.*?<\/span>/gi, '');
        
        return `<li${liAttrs} style="margin: 0.5em 0 !important; padding: 0 0 0 0.5em !important; position: relative !important; list-style: none !important;"><span class="list-bullet" style="position: absolute !important; left: -2em !important; color: #333 !important; font-weight: bold !important; font-size: 1.2em !important; line-height: 1.6 !important; text-align: right !important; min-width: 1.5em !important;">•</span>${cleanContent}`;
      });
      
      return result;
    });

    // Process ol lists - add inline styles
    const olMatches = processed.match(/<ol[^>]*>/gi);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'processPostContent.ts:42',message:'OL matches before processing',data:{olMatchCount:olMatches?.length||0,olMatches:olMatches?.slice(0,3)},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    processed = processed.replace(
      /<ol([^>]*)>/gi,
      '<ol$1 style="list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;">'
    );

    // Process ol li elements - add styles and numbers
    processed = processed.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'processPostContent.ts:48',message:'Processing OL match',data:{matchLength:match.length,matchPreview:match.substring(0,150),hasLi:match.includes('<li')},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      let result = match;
      let counter = 0;
      
      // Process each li tag individually
      result = result.replace(/<li([^>]*)>([\s\S]*?)(?=<\/li>|$)/gi, (liMatch, liAttrs, liContent) => {
        counter++;
        // Check if number already exists
        if (liContent.includes('class="list-number"') || liContent.includes("class='list-number'")) {
          return liMatch; // Already has number
        }
        
        // Remove any existing list-number spans
        const cleanContent = liContent.replace(/<span[^>]*class=["']list-number["'][^>]*>.*?<\/span>/gi, '');
        
        return `<li${liAttrs} style="margin: 0.5em 0 !important; padding: 0 0 0 0.5em !important; position: relative !important; list-style: none !important;"><span class="list-number" style="position: absolute !important; left: -2em !important; color: #333 !important; font-weight: normal !important; text-align: right !important; min-width: 1.5em !important; line-height: 1.6 !important;">${counter}.</span>${cleanContent}`;
      });
      
      return result;
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'processPostContent.ts:69',message:'processPostContent result',data:{processedLength:processed.length,hasBulletSpans:processed.includes('list-bullet'),hasNumberSpans:processed.includes('list-number'),processedPreview:processed.substring(0,300)},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return processed;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0343b0e1-3afb-40f5-8781-a0cafdb6da46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'processPostContent.ts:72',message:'processPostContent error',data:{error:String(error)},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error("Error processing post content:", error);
    return html; // Return original on error
  }
}
