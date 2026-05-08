/**
 * Handles network interaction communicating strictly through our secure internal proxy.
 * This completely abstracts Google API Keys and tokens from frontend client visibility.
 */
export async function generateItinerary(startLoc, endLoc, sDate, eDate, numPeople, transport, comments) {
    const commentsContext = comments ? `\nAdditional User Constraints & Preferences: ${comments}` : "";

    const prompt = `You are an expert AI travel planner for WanderAI. Create a highly concise itinerary for a trip from ${startLoc} to ${endLoc}. 
Dates: ${sDate} to ${eDate}. Travelers: ${numPeople} people.
Transport: ${transport}. ${commentsContext} 

CRITICAL INSTRUCTION: Keep the overall response EXTREMELY SHORT. Do not exceed 2 paragraphs per section. Use bullet points and bold text where relevant. Do not overwhelm the user.

Output the response STRICTLY separated by the following exact tags (do not include any other top level text outside these tags):
[OVERVIEW]
A 1-line visual flowchart summary of the route using emojis.
[LOGISTICS]
Core logistics only. Keep it heavily bulleted.
[ITINERARY]
Provide a day-by-day itinerary. CONCISE bullet points only. Highlight key activities in bold.
[NOTES]
Top 3 most important rapid-fire packing/cultural tips.`;

    const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error);
    }

    return data.text;
}
