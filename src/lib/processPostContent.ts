/**
 * Process post content HTML to add proper list styling
 * This runs on the server side before rendering
 */
export function processPostContent(html: string): string {
  if (!html) return html;

  try {
    let processed = html;

    // Process ul lists - add inline styles
    processed = processed.replace(
      /<ul([^>]*)>/gi,
      '<ul$1 style="list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;">'
    );

    // Process ul li elements - add styles and bullet points
    // Use a more robust approach that handles nested content
    processed = processed.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match) => {
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
        
        return `<li${liAttrs} style="margin: 0.5em 0 !important; padding: 0 0 0 0.5em !important; position: relative !important; list-style: none !important;"><span class="list-bullet" style="position: absolute !important; left: -1.5em !important; color: #333 !important; font-weight: bold !important; font-size: 1.2em !important; line-height: 1.6 !important;">•</span>${cleanContent}`;
      });
      
      return result;
    });

    // Process ol lists - add inline styles
    processed = processed.replace(
      /<ol([^>]*)>/gi,
      '<ol$1 style="list-style: none !important; margin: 1em 0 1em 2em !important; padding: 0 !important;">'
    );

    // Process ol li elements - add styles and numbers
    processed = processed.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match) => {
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

    return processed;
  } catch (error) {
    console.error("Error processing post content:", error);
    return html; // Return original on error
  }
}
