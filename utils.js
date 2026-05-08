/**
 * UTILITIES: Pure functions representing business parsing logic and algorithms.
 * Built for standard testing decoupling and efficiency.
 */

// Security: Strips sensitive characters to prevent DOM Injection/XSS manually.
export function sanitizeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

// Utility: Markdown Parser
export function parseMarkdown(md) {
    if (!md) return '';
    return md.replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/## (.*)/g, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*)/g, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+?)$/gm, (match) => { if (!match.startsWith('<')) return `<p>${match}</p>`; return match; });
}

// Utility: Extract Section cleanly from raw LLM output
export function extractSection(text, startTag, endTag) {
    const startIdx = text.indexOf(startTag);
    if (startIdx === -1) return '';
    const actualStart = startIdx + startTag.length;
    const endIdx = endTag ? text.indexOf(endTag, actualStart) : text.length;
    return text.substring(actualStart, endIdx !== -1 ? endIdx : text.length).trim();
}

// Efficiency: Debounce wrapper prevents excessive browser API executions during typeahead
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
