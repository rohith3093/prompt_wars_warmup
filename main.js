import { debounce, parseMarkdown, extractSection, sanitizeHTML } from './utils.js';
import { generateItinerary } from './api.js';

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

    // --- DOM LOGIC: Indian Cities Typeahead ---
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

        // Debounce map filtering for execution efficiency
        const handleInput = debounce((e) => {
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
        }, 150);

        input.addEventListener('input', handleInput);

        document.addEventListener('click', (e) => {
            if (e.target !== input && e.target !== dropdown) {
                dropdown.classList.add('hidden');
            }
        });
    };

    attachAutocomplete('startLocation');
    attachAutocomplete('endLocation');

    // --- FORM LOGIC: Live Gemini Interaction ---
    const tripForm = document.getElementById('trip-form');

    if (tripForm) {
        tripForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Security: Sanitize inputs natively before transmitting them to API
            const startLoc = sanitizeHTML(document.getElementById('startLocation').value);
            const endLoc = sanitizeHTML(document.getElementById('endLocation').value);
            const sDate = sanitizeHTML(document.getElementById('startDate').value);
            const eDate = sanitizeHTML(document.getElementById('endDate').value);
            const numPeople = sanitizeHTML(document.getElementById('people').value);
            const transport = sanitizeHTML(document.getElementById('transport').value);
            const commentsElement = document.getElementById('comments');
            const comments = commentsElement ? sanitizeHTML(commentsElement.value) : "";

            const btnSubmit = document.querySelector('.btn-submit');
            const loadingSpinner = document.getElementById('loading-spinner');
            const resultsPanel = document.getElementById('itinerary-results');

            btnSubmit.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            resultsPanel.classList.add('hidden');

            try {
                // Fetch encapsulated API
                const aiText = await generateItinerary(startLoc, endLoc, sDate, eDate, numPeople, transport, comments);

                const overview = extractSection(aiText, '[OVERVIEW]', '[LOGISTICS]');
                const logistics = extractSection(aiText, '[LOGISTICS]', '[ITINERARY]');
                const itinerary = extractSection(aiText, '[ITINERARY]', '[NOTES]');
                const notes = extractSection(aiText, '[NOTES]', null);

                loadingSpinner.classList.add('hidden');
                btnSubmit.classList.remove('hidden');

                resultsPanel.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
                        <h2>Trip Generated!</h2>
                        <div class="action-buttons" style="display:flex; gap:0.5rem; margin-bottom:0;">
                            <button id="btn-print" class="tab-btn" style="padding: 0.4rem 1rem;">📄 Save PDF</button>
                            <button id="btn-copy" class="tab-btn" style="padding: 0.4rem 1rem;">📋 Copy</button>
                        </div>
                    </div>
                    
                    <div class="overview-box ai-output" tabindex="-1" id="focus-mount">
                        <h4 style="color:var(--accent-color); margin-bottom:1rem; text-transform:uppercase; letter-spacing:0.05em; font-size:0.85rem;">Trip Overview</h4>
                        ${parseMarkdown(overview || 'No flowchart returned.')}
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

                // Attach tab logic dynamically
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

                // Attach Export Handlers Natively
                document.getElementById('btn-print').addEventListener('click', () => window.print());
                document.getElementById('btn-copy').addEventListener('click', async () => {
                    try {
                        const copyText = `WanderAI Itinerary: ${startLoc} to ${endLoc}\n\n---\n\n${overview}\n\n${itinerary}`;
                        await navigator.clipboard.writeText(copyText);
                        const btn = document.getElementById('btn-copy');
                        btn.textContent = "✅ Copied!";
                        setTimeout(() => btn.textContent = "📋 Copy", 3000);
                    } catch (e) {
                        alert("Clipboard access denied natively. Please copy manually.");
                    }
                });

                // Accessibility standard: Map focus dynamically onto generated content
                const mount = document.getElementById('focus-mount');
                if (mount) {
                    mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    mount.focus();
                }

            } catch (err) {
                loadingSpinner.classList.add('hidden');
                btnSubmit.classList.remove('hidden');
                resultsPanel.innerHTML = `<div class="ai-output" style="color:#ff5555" tabindex="-1" id="focus-mount"><p><strong>Error contacting Gen AI:</strong> ${err.message}</p></div>`;
                resultsPanel.classList.remove('hidden');
                document.getElementById('focus-mount').focus();
            }
        });
    }
});
