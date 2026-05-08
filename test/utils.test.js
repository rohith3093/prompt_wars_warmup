import test from 'node:test';
import assert from 'node:assert';
import { parseMarkdown, extractSection, sanitizeHTML } from '../utils.js';

test('[Security] sanitizeHTML escapes potentially dangerous strings securely', () => {
    const rawData = "<script>alert('XSS')</script>";
    const output = sanitizeHTML(rawData);

    assert.ok(!output.includes("<script>"), 'Output should not contain standard script node');
    assert.ok(output.includes("&lt;script&gt;"), 'Node brackets must be securely escaped via entity mapping');
});

test('[Architecture] extractSection isolates contextual strings based on block markers', () => {
    const fakeLLMResponse = `
Here is your text output string block.
[OVERVIEW]
this is the flowchart
[LOGISTICS]
the train ticket
`;
    const result = extractSection(fakeLLMResponse, '[OVERVIEW]', '[LOGISTICS]');
    assert.strictEqual(result, "this is the flowchart", "Extraction logic failed to appropriately clip target index boundaries.");
});

test('[Quality] extractSection correctly identifies and halts if end tag is missing', () => {
    const fakeLLMResponse = `
[NOTES]
Just pack warm clothing.`;
    const result = extractSection(fakeLLMResponse, '[NOTES]', null);
    assert.strictEqual(result, "Just pack warm clothing.", "Failed to gracefully resolve when EOF was queried.");
});
