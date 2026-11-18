# E³ website assistant — knowledge library guide

## Official identity and pricing

The organisation's official name is **Encourage Excellence Early**. The approved public website starting prices are:

- Static websites: **from ₦150,000**.
- Dynamic websites: **from ₦250,000**.

Both are starting prices. Final website pricing increases with features, functionality, complexity and agreed scope. Do not quote prices for E³'s other services, platforms or programmes. Explain that these are discussed after understanding the requirements and that the cost is confirmed before commitment.

## What the assistant is

The current website assistant is a lightweight, page-aware, rules-and-knowledge-based guide. It does not call OpenAI, another model API or a paid chatbot service. It reads the approved public information in `data/e3-knowledge.json`, considers the page being viewed, and uses local JavaScript matching rules in `assets/e3-ai-assistant.js`.

It is not a generative AI model. It should not claim that it can reason freely, browse external sources, or remember visitors after they leave the page. Conversation context is held only for the current page session.

## Page awareness

The assistant identifies the current site area using the page's `data-ai-page` attribute (or the page path as a fallback). It also reads the current page title, meta description, visible headings and main-page text. This context changes the welcome message and suggested questions, and helps rank relevant knowledge entries.

## Updating E³ information

Edit `data/e3-knowledge.json`.

- `meta` contains the official identity, positioning, answer policy and pricing rules.
- `pages` contains each website area, its summary, keywords and suggested questions.
- `entries` contains question-and-answer records. Add natural question variations to `triggers`, related terms to `keywords`, and only verified public wording to `answer`.
- `contact` stores E³'s WhatsApp number, email address and questionnaire destination.

Keep public answers factual and customer-friendly. Do not put private staff notes, customer records, passwords or confidential commercial information in this file.

## Answer and safety rules

- Quote static and dynamic website starting prices exactly as stated above, and always explain that features and scope affect the final price.
- Do not quote prices for other services or programmes. Invite the visitor to discuss their needs.
- Do not invent features, delivery dates, guarantees, eligibility or terms.
- For E³ Medical, describe the platform only. Do not diagnose, prescribe or provide personal medical advice. State that the AI nurse is not a medical professional and that urgent concerns belong with qualified professionals.
- If the assistant cannot find a sufficiently confident answer, it should say so and direct the visitor to the Business Discovery & Growth questionnaire or WhatsApp.
- A WhatsApp handover should include the page the visitor was browsing and their latest question.

## Tests after updates

Run the automated logic checks from the project root with `node scripts/verify-e3-assistant.cjs`, then test in a browser on desktop and mobile:

1. Ask what E³ stands for; it must say **Encourage Excellence Early**.
2. Ask for static website pricing; it must say **from ₦150,000**.
3. Ask for dynamic website pricing; it must say **from ₦250,000**.
4. Ask the general website price; it must quote both starting prices and explain feature-based increases.
5. Ask for school, medical, Learning Hub or another programme's price; it must not invent or quote a programme fee.
6. Ask “How does the AI nurse work?” from the Medical page; it must select the Medical AI nurse answer, not the general AI automation answer.
7. Ask about school grading, parent results, optional school services, Abuja Events ticketing and wedding RSVPs.
8. Ask a follow-up such as “tell me more” and verify it retains the last topic within the current chat.
9. Test WhatsApp and questionnaire handover links.

The assistant is intentionally a curated answer-and-routing system. A future generative model integration would require a protected server-side endpoint and an approved knowledge retrieval layer; private model API keys must never be placed in public browser JavaScript.
