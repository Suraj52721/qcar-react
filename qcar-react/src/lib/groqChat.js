// Lightweight client for the public GROQ chat endpoint
export async function queryGroq(prompt, apiKey) {
    if (!prompt) return '';
    const url = 'https://g4f.space/api/groq';

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['x-api-key'] = apiKey;
    }

    const maxTries = 3;
    let lastErr = null;
    for (let attempt = 1; attempt <= maxTries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ prompt })
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`GROQ API returned ${res.status}: ${text}`);
            }

            const ct = (res.headers.get('content-type') || '').toLowerCase();

            // Handle JSON responses
            if (ct.includes('application/json')) {
                const json = await res.json();
                const raw = (typeof json === 'string') ? json : (json.text || json.reply || json.output || JSON.stringify(json));
                return sanitizeReply(raw);
            }

            // Handle streaming / ndjson
            if (ct.includes('application/x-ndjson') || ct.includes('text/event-stream') || ct.includes('stream')) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let done = false;
                let accumulated = '';
                while (!done) {
                    const { value, done: d } = await reader.read();
                    done = d;
                    if (value) accumulated += decoder.decode(value, { stream: !done });
                }
                const parts = accumulated.trim().split(/\n+/).map(l => l.trim()).filter(Boolean);
                for (let i = parts.length - 1; i >= 0; i--) {
                    const line = parts[i];
                    try {
                        const j = JSON.parse(line);
                        const candidate = j.text || j.output || j.reply || (typeof j === 'string' ? j : JSON.stringify(j));
                        return sanitizeReply(candidate);
                    } catch (e) {
                        // ignore
                    }
                }
                return sanitizeReply(accumulated);
            }

            // Fallback to plain text
            const text = await res.text();
            return sanitizeReply(text);
        } catch (err) {
            lastErr = err;
            console.warn(`queryGroq attempt ${attempt} failed:`, err.message || err);
            if (attempt < maxTries) await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
        }
    }

    console.error('queryGroq failed after retries:', lastErr);
    throw lastErr || new Error('Unknown GROQ error');
}

export default queryGroq;

function sanitizeReply(text) {
    if (!text) return '';
    // Remove obvious option headers
    let s = text.replace(/^[ \t]*Options?:.*$/gim, '');
    s = s.replace(/^[ \t]*Choose (one|an option).*/gim, '');

    // Drop bullet/enum lines
    const lines = s.split(/\r?\n/);
    const filtered = lines.filter(line => {
        const l = line.trim();
        if (!l) return false;
        if (/^[\-\*\u2022]\s+/.test(l)) return false;
        if (/^(?:\d+|[A-Za-z])\s*[\.)\-:]/.test(l)) return false;
        if (/^\([A-Za-z0-9]+\)\s+/.test(l)) return false;
        if (/^option[s]?\b[:\-]/i.test(l)) return false;
        return true;
    });
    s = filtered.join('\n');

    // Remove inline enumerations
    s = s.replace(/\(?\b(?:\d+|[A-Za-z])\b[\.)]\s*[^\n;]+/g, '');
    s = s.replace(/\boption[s]?\s+\d+\b[:\)]?/ig, '');

    // Collapse blank lines
    s = s.replace(/\n{3,}/g, '\n\n').trim();
    return s;
}
