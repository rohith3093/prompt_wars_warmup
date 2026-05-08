// ==========================================
// CONFIGURATION
// Paste your Gemini API key below
// ==========================================
const GEMINI_API_KEY = "AIzaSyAXlmyNhlvMRRQufbXPy_SJYWwuhFwc57E";

document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Optimization
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal-up');
    revealElements.forEach(el => observer.observe(el));

    // Mouse Glow Effect
    const glow = document.getElementById('glow');
    if (glow) {
        let glowX = window.innerWidth / 2;
        let glowY = window.innerHeight / 2;
        let isMouseMoving = false;

        window.addEventListener('mousemove', (e) => {
            glowX = e.clientX;
            glowY = e.clientY;
            if (!isMouseMoving) {
                isMouseMoving = true;
                requestAnimationFrame(() => {
                    glow.style.transform = `translate(${glowX}px, ${glowY}px)`;
                    glow.style.left = `0px`;
                    glow.style.top = `0px`;
                    isMouseMoving = false;
                });
            }
        });

        window.addEventListener('mouseout', (e) => {
            if (e.relatedTarget === null) glow.style.opacity = '0';
        });
        window.addEventListener('mouseover', () => glow.style.opacity = '0.5');
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // --- APP LOGIC: Gemini Integration & Indian Cities ---

    // Comprehensive list of major Indian cities
    const indianCities = [
        "Mumbai, Maharashtra", "Delhi", "Bangalore, Karnataka", "Hyderabad, Telangana",
        "Ahmedabad, Gujarat", "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Surat, Gujarat",
        "Pune, Maharashtra", "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh",
        "Nagpur, Maharashtra", "Indore, Madhya Pradesh", "Thane, Maharashtra", "Bhopal, Madhya Pradesh",
        "Visakhapatnam, Andhra Pradesh", "Pimpri-Chinchwad, Maharashtra", "Patna, Bihar", "Vadodara, Gujarat",
        "Kochi, Kerala", "Coimbatore, Tamil Nadu", "Agra, Uttar Pradesh", "Varanasi, Uttar Pradesh",
        "Goa", "Srinagar, Jammu and Kashmir", "Amritsar, Punjab", "Dehradun, Uttarakhand",
        "Mysore, Karnataka", "Guwahati, Assam"
    ];

    const attachAutocomplete = (inputId) => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const dropdown = input.nextElementSibling;

        input.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            dropdown.innerHTML = '';

            if (val.length < 1) {
                dropdown.classList.add('hidden');
                return;
            }

            const matches = indianCities.filter(city => city.toLowerCase().includes(val));

            if (matches.length > 0) {
                dropdown.classList.remove('hidden');
                matches.forEach(match => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.textContent = match;
                    div.addEventListener('click', () => {
                        input.value = match;
                        dropdown.classList.add('hidden');
                    });
                    dropdown.appendChild(div);
                });
            } else {
                dropdown.classList.add('hidden');
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target !== input && e.target !== dropdown) {
                dropdown.classList.add('hidden');
            }
        });
    };

    attachAutocomplete('startLocation');
    attachAutocomplete('endLocation');

    // Form Submission: calling real Gemini AI API
    const tripForm = document.getElementById('trip-form');

    // Simple markdown parser to output nice HTML from Gemini
    const parseMarkdown = (md) => {
        return md.replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/- (.*)/g, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+?)$/gm, (match) => { if (!match.startsWith('<')) return `<p>${match}</p>`; return match; });
    };

    if (tripForm) {
        tripForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const apiKey = GEMINI_API_KEY;
            const startLoc = document.getElementById('startLocation').value;
            const endLoc = document.getElementById('endLocation').value;
            const sDate = document.getElementById('startDate').value;
            const eDate = document.getElementById('endDate').value;
            const numPeople = document.getElementById('people').value;
            const transport = document.getElementById('transport').value;

            const btnSubmit = document.querySelector('.btn-submit');
            const loadingSpinner = document.getElementById('loading-spinner');
            const resultsPanel = document.getElementById('itinerary-results');

            btnSubmit.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            resultsPanel.classList.add('hidden');

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

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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

                const aiText = data.candidates[0].content.parts[0].text;

                // Helper to extract content between custom tags safely
                const extractSection = (text, startTag, endTag) => {
                    const startIdx = text.indexOf(startTag);
                    if (startIdx === -1) return '';
                    const actualStart = startIdx + startTag.length;
                    const endIdx = endTag ? text.indexOf(endTag, actualStart) : text.length;
                    return text.substring(actualStart, endIdx !== -1 ? endIdx : text.length).trim();
                };

                const overview = extractSection(aiText, '[OVERVIEW]', '[LOGISTICS]');
                const logistics = extractSection(aiText, '[LOGISTICS]', '[ITINERARY]');
                const itinerary = extractSection(aiText, '[ITINERARY]', '[NOTES]');
                const notes = extractSection(aiText, '[NOTES]', null);

                loadingSpinner.classList.add('hidden');
                btnSubmit.classList.remove('hidden');

                resultsPanel.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
                        <h2>Trip Generated!</h2>
                        <div class="badge" style="margin-bottom:0">WanderAI Live</div>
                    </div>
                    
                    <div class="overview-box ai-output">
                        <h4 style="color:var(--accent-color); margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.05em; font-size:0.85rem;">Trip Overview flowchart</h4>
                        ${parseMarkdown(overview || 'Flowchart generating...')}
                    </div>

                    <div class="tabs-container">
                        <button class="tab-btn active" data-target="logistics">Travel Logistics: ${startLoc.split(',')[0]} to ${endLoc.split(',')[0]}</button>
                        <button class="tab-btn" data-target="itinerary">Day-by-Day Itinerary</button>
                        <button class="tab-btn" data-target="notes">Important Notes & Recs</button>
                    </div>

                    <div id="logistics" class="tab-content active ai-output">
                        ${parseMarkdown(logistics || 'No logistics data returned.')}
                    </div>
                    <div id="itinerary" class="tab-content ai-output">
                        ${parseMarkdown(itinerary || 'No itinerary data returned.')}
                    </div>
                    <div id="notes" class="tab-content ai-output">
                        ${parseMarkdown(notes || 'No notes returned.')}
                    </div>
                `;

                // Attach tab logic
                const tabs = resultsPanel.querySelectorAll('.tab-btn');
                const contents = resultsPanel.querySelectorAll('.tab-content');

                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        tabs.forEach(t => t.classList.remove('active'));
                        contents.forEach(c => c.classList.remove('active'));

                        tab.classList.add('active');
                        document.getElementById(tab.getAttribute('data-target')).classList.add('active');
                    });
                });

                resultsPanel.classList.remove('hidden');
                resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } catch (err) {
                loadingSpinner.classList.add('hidden');
                btnSubmit.classList.remove('hidden');
                resultsPanel.innerHTML = `<div class="ai-output" style="color:red"><p><strong>Error contacting Gen AI:</strong> ${err.message}. Please check your API key and network connection.</p></div>`;
                resultsPanel.classList.remove('hidden');
            }
        });
    }
});
