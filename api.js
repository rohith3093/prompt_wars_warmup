/**
 * Handles network interaction communicating strictly through our secure internal proxy.
 * This completely abstracts Google API Keys and tokens from frontend client visibility.
 */
export async function generateItinerary(startLoc, endLoc, sDate, eDate, numPeople, transport, comments) {
    const commentsContext = comments ? `\nAdditional User Constraints & Preferences: ${comments}` : "";

    const prompt = `You are an expert AI travel planner for WanderAI. Create a detailed itinerary for a trip from ${startLoc} to ${endLoc}. 
Dates: ${sDate} to ${eDate}. Travelers: ${numPeople} people.
Suggested Transport: ${transport}. ${commentsContext} 

Output the response STRICTLY separated by the following exact tags (do not include any other top level text outside these tags):
[OVERVIEW]
A visual flowchart-style summary of the route in a few lines. Use emojis or arrows like "Origin -> Transport -> Destination -> Activities -> Return". Keep it high-level.
[LOGISTICS]
Provide detailed travel logistics specifically between ${startLoc} and ${endLoc}. Detail likely train routes, flights, or road-trip constraints based on Indian infrastructure.
[ITINERARY]
Provide a day-by-day basic itinerary from start to finish. Keep it formatted nicely in Markdown utilizing headers and bullet points. 
[NOTES]
Important notes, packings suggestions, or recommendations based on the region.`;

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
