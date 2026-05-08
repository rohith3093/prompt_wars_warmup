// ==========================================
// CONFIGURATION: API BINDINGS
// ==========================================
const GEMINI_API_KEY = "AIzaSyAXlmyNhlvMRRQufbXPy_SJYWwuhFwc57E";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Handles network interaction and orchestration with Google Generative AI Models securely.
 */
export async function generateItinerary(startLoc, endLoc, sDate, eDate, numPeople, transport) {
    const prompt = `You are an expert AI travel planner for WanderAI. Create a detailed itinerary for a trip from ${startLoc} to ${endLoc}. 
Dates: ${sDate} to ${eDate}. 
Travelers: ${numPeople} people.
Suggested Transport: ${transport}. 

Output the response STRICTLY separated by the following exact tags (do not include any other top level text outside these tags):
[OVERVIEW]
A visual flowchart-style summary of the route in a few lines. Use emojis or arrows like "Origin -> Transport -> Destination -> Activities -> Return". Keep it high-level.
[LOGISTICS]
Provide detailed travel logistics specifically between ${startLoc} and ${endLoc}. Detail likely train routes, flights, or road-trip constraints based on Indian infrastructure.
[ITINERARY]
Provide a day-by-day basic itinerary from start to finish. Keep it formatted nicely in Markdown utilizing headers and bullet points. 
[NOTES]
Important notes, packings suggestions, or recommendations based on the region.`;

    const response = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.candidates[0].content.parts[0].text;
}
