/*
 * E³ page-aware knowledge assistant
 * This is a local, rules-and-knowledge-based assistant. It does not call a paid AI API.
 * Update /data/e3-knowledge.json to maintain E³'s public business information.
 */
(() => {
  'use strict';

  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdHayuS9caJF8xDlasvgahjGDnjGwdOQWqtiwGU5M5_6ZMRnA/viewform';
  // Resolve the site root from this script's own URL. Root-absolute resources
  // (knowledge data, questionnaire, works and contact pages) then work on any
  // host, any sub-path deployment, and when pages are opened directly from
  // disk (file://), where "/..." would point outside the site folder.
  const SCRIPT_EL = typeof document !== 'undefined'
    ? (document.currentScript || document.querySelector('script[src*="e3-ai-assistant"]'))
    : null;
  const SCRIPT_URL = (SCRIPT_EL && SCRIPT_EL.src) || '';
  const ROOT_MARKER = SCRIPT_URL.lastIndexOf('assets/');
  const SITE_ROOT = ROOT_MARKER === -1 ? '/' : SCRIPT_URL.slice(0, ROOT_MARKER);
  const rootUrl = value => SITE_ROOT + String(value || '').replace(/^\/+/, '');
  const FORM_PAGE = rootUrl('get-started.html');
  const DEFAULT_WA = '2347042776167';
  const stopWords = new Set(['a','an','and','are','as','at','be','can','could','do','does','for','from','get','have','i','if','in','is','it','me','my','of','on','or','our','please','the','this','to','us','we','what','when','where','which','who','with','would','you','your','how','tell','about','want','like']);
  // Keep synonym groups narrow. Broad groupings such as AI=automation or
  // medical=pharmacy can make a visitor receive an answer about the wrong service.
  const synonymGroups = [
    ['website','websites','site','sites','webpage','webpages'],
    ['app','apps','application','applications'],
    ['school','schools'],
    ['price','prices','pricing','cost','costs','charge','charges','fee','fees','quote','quotation'],
    ['event','events'],
    ['wedding','weddings'],
    ['medical','healthcare'],
    ['pharmacy','pharmacies'],
    ['ticket','tickets','ticketing'],
    ['course','courses'],
    ['contact','reach']
  ];

  const normalize = value => String(value || '')
    .toLowerCase()
    .replace(/e³/g, 'e3')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const getTokens = value => normalize(value).split(' ').filter(token => token && !stopWords.has(token));
  const expandTokens = tokens => {
    const expanded = new Set(tokens);
    synonymGroups.forEach(group => {
      if (group.some(word => tokens.includes(word))) group.forEach(word => expanded.add(word));
    });
    return expanded;
  };

  function pageIdFromPath(pathname) {
    const path = normalize(pathname.replace(/\/+$/, '') || '/');
    if (path.includes('get started') || path.includes('get started html')) return 'contact';
    if (path.includes('schools')) return 'schools';
    if (path.includes('medical')) return 'medical';
    if (path.includes('nightlife')) return 'nightlife';
    if (path.includes('weddings')) return 'weddings';
    if (path.includes('learning hub') || path.includes('learning')) return 'learning';
    if (path.includes('blog')) return 'insights';
    if (path.includes('works')) return 'works';
    if (path.includes('about')) return 'about';
    if (path.includes('contact')) return 'contact';
    return 'home';
  }

  function currentPageContext(library) {
    const pageId = document.body?.dataset.aiPage || pageIdFromPath(location.pathname);
    const profile = library.pages.find(item => item.id === pageId) || library.pages.find(item => item.id === 'home');
    const main = document.querySelector('main');
    const headings = main ? [...main.querySelectorAll('h1,h2,h3')].slice(0, 8).map(el => el.textContent.trim()).filter(Boolean) : [];
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const title = document.title || profile.label;
    const pageText = main ? main.innerText.replace(/\s+/g, ' ').trim().slice(0, 1800) : '';
    return {
      id: profile.id,
      label: profile.label,
      summary: profile.summary,
      suggestions: profile.suggestions || [],
      title,
      description,
      headings,
      pageText
    };
  }

  function scoreEntry(entry, query, page) {
    const q = normalize(query);
    const queryTokens = [...expandTokens(getTokens(q))];
    let score = 0;
    let matched = 0;
    let exactTrigger = false;

    (entry.triggers || []).forEach(trigger => {
      const phrase = normalize(trigger);
      if (phrase && q.includes(phrase)) {
        score = Math.max(score, phrase === q ? 12 : 9);
        exactTrigger = true;
      }
    });

    const keywordTokens = new Set();
    (entry.keywords || []).forEach(keyword => {
      const norm = normalize(keyword);
      if (norm.includes(' ')) {
        if (q.includes(norm)) { score += 1.8; matched += 2; }
        getTokens(norm).forEach(token => keywordTokens.add(token));
      } else {
        keywordTokens.add(norm);
      }
    });

    if (!exactTrigger) {
      const overlaps = queryTokens.filter(token => keywordTokens.has(token));
      matched = Math.max(matched, overlaps.length);
      score += overlaps.length * 1.15;
      if (overlaps.length >= 2) score += 0.8;
    }

    if (entry.section === page.id) {
      score += 2.25;
      const visiblePageText = normalize([page.title, page.description, ...(page.headings || []), page.pageText].join(' '));
      const relevantOnPage = queryTokens.filter(token => token.length > 3 && visiblePageText.includes(token));
      if (relevantOnPage.length) score += Math.min(1.25, relevantOnPage.length * 0.25);
    } else if (entry.section === 'general') score += 0.25;

    // The active page context also helps resolve references such as "this", "that" or "how does it work?".
    if (page.id !== 'home' && queryTokens.some(token => ['platform','service','page','this','that','it'].includes(token))) {
      if (entry.section === page.id) score += 1;
    }

    return { entry, score, matched, exactTrigger };
  }

  function findBestEntry(library, query, page) {
    const ranked = library.entries
      .map(entry => scoreEntry(entry, query, page))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const second = ranked[1];
    if (!best) return null;
    const strongEnough = best.exactTrigger || (best.score >= 3.0 && best.matched >= 2);
    const clearWinner = !second || best.score - second.score >= 0.7 || best.exactTrigger;
    return strongEnough && clearWinner ? best.entry : null;
  }

  function isAdvancedQuestion(query) {
    const q = normalize(query);
    const advancedTerms = /\b(quote|quotation|estimate|custom|bespoke|complicated|confusing|complex|special requirement|not sure how to explain|hard to explain|integrate with|integration with|connect to|migrate|migration|payment gateway|payment integration|existing database|existing system|api integration|security requirements|technical requirements|project deadline|multiple branches|multiple locations|inventory integration|specific scope|proposal|contract|procurement|enterprise)\b/;
    return advancedTerms.test(q) || (q.split(' ').length > 22 && /\b(build|develop|integrate|automate|system|platform|application)\b/.test(q));
  }

  function isVagueReference(query) {
    const q = normalize(query);
    return /^(what about this|what about that|what about the features|how does this work|how does it work|tell me more|tell me more about this|tell me more about this service|explain this|explain that|can you explain|can you explain it|can you expand|what else|what does this include|who is this for|is this right for me|and the price|is this available|can you do this|can this be done|is this possible|can you help with this)$/.test(q);
  }

  function isPricingQuestion(query) {
    return /\b(how much|price|pricing|cost|quote|quotation|budget|fee|fees|charge|charges|rate|rates)\b/.test(normalize(query));
  }

  function hasWebsiteIntent(query) {
    const q = normalize(query);
    return /\b(website|websites|webpage|webpages|web page|web pages|site|sites|static|dynamic|landing page|web design|web development|online store|ecommerce|e commerce|shopping cart)\b/.test(q);
  }

  function websitePricingAnswer(query) {
    const q = normalize(query);
    const staticOnly = /\bstatic\b/.test(q) && !/\bdynamic\b/.test(q);
    const dynamicOnly = /\bdynamic\b|\b(ecommerce|e commerce|online store|shopping cart)\b/.test(q) && !/\bstatic\b/.test(q);
    if (staticOnly) {
      return 'Static websites start from ₦150,000. This is a starting price, not a fixed package price. The final cost increases according to the features, functionality, complexity and agreed scope.';
    }
    if (dynamicOnly) {
      return 'Dynamic websites start from ₦250,000. This is a starting price, not a fixed package price. The final cost increases according to the features, functionality, complexity and agreed scope.';
    }
    return 'E³ static websites start from ₦150,000, while dynamic websites start from ₦250,000. These are starting prices, not fixed package prices. The final cost increases according to the features, functionality, complexity and agreed scope.';
  }

  function pricingResponse(page, query, previousEntry) {
    const q = normalize(query);
    const previousTopicIsWebsite = previousEntry && ['website','static-dynamic-websites'].includes(previousEntry.id);
    const namesAnotherService = /\b(school|schools|medical|health|pharmacy|clinic|hospital|learning|course|courses|social|graphics|branding|automation|automate|ai|app|application|portal|platform|event|events|wedding|custom|software|system)\b/.test(q);
    if (hasWebsiteIntent(query) || (previousTopicIsWebsite && !namesAnotherService)) {
      const pricingQuery = hasWebsiteIntent(query) ? query : 'website';
      return {
        text: `${websitePricingAnswer(pricingQuery)}\n\nTell me what you want the website to help people do, and I can help you identify the right starting point.`,
        actions: ['questionnaire','whatsapp']
      };
    }
    const pageIntro = page.id !== 'home' ? `For ${page.label}, ` : '';
    return {
      text: `${pageIntro}pricing is discussed based on the specific services, features and requirements involved. E³ does not publish a fixed price for every programme or service. The team will understand what you need, discuss the scope and confirm the appropriate cost before any commitment.`,
      actions: ['questionnaire','whatsapp']
    };
  }

  function getWhatsAppUrl(page, lastQuestion) {
    const number = window.E3Knowledge?.contact?.whatsappNumber || DEFAULT_WA;
    const message = `Hello E³, I was browsing the ${page.label} page on your website.\n\nMy question: ${lastQuestion || 'I would like to discuss a project.'}\n\nPlease help me with the next steps.`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }

  function actionLinks(actionIds, page, lastQuestion, contact) {
    const unique = [...new Set(actionIds || [])];
    return unique.map(id => {
      if (id === 'questionnaire') return { label: 'Complete the E³ questionnaire', href: FORM_PAGE, primary: true };
      if (id === 'form') return { label: 'Open Google Form', href: contact.questionnaire || FORM_URL, external: true };
      if (id === 'whatsapp') return { label: 'Continue on WhatsApp', href: getWhatsAppUrl(page, lastQuestion), external: true };
      if (id === 'works') return { label: 'Explore E³ Works', href: rootUrl('works.html') };
      if (id === 'contact') return { label: 'Contact E³', href: rootUrl('contact.html') };
      return null;
    }).filter(Boolean);
  }

  function resolveAnswer(library, page, query, previousEntry) {
    const normalized = normalize(query);
    if (!normalized) return { text: 'Please type a question and I will try to point you in the right direction.', actions: ['questionnaire','whatsapp'] };

    // Handle pricing before keyword matching so a price query cannot be
    // intercepted by a generic page entry. Only website starting prices are quoted.
    if (isPricingQuestion(query)) return pricingResponse(page, query, previousEntry);

    if (isVagueReference(query)) {
      if (previousEntry) {
        return {
          text: `We're discussing ${previousEntry.title}.\n\n${previousEntry.answer}\n\nWould you like to explore its features, who it is for, how it works or how to get started?`,
          actions: previousEntry.actions || ['questionnaire','whatsapp'],
          entry: previousEntry
        };
      }
      if (page.id !== 'home') {
        return {
          text: `You're viewing ${page.label}. ${page.summary}\n\nWhat would you like to understand about it — the features, who it is for, how it works or how to get started?`,
          actions: ['questionnaire','whatsapp']
        };
      }
    }

    const entry = findBestEntry(library, query, page);
    if (entry) {
      let text = entry.answer;
      if (isAdvancedQuestion(query)) {
        text += '\n\nYour question needs a more detailed review than I can provide from the public information. Please send the requirements to E³ so the team can assess them.';
        return { text, actions: ['questionnaire','whatsapp'] };
      }
      return { text, actions: entry.actions || ['questionnaire','whatsapp'], entry };
    }

    // A short page-specific query can be understood through the current page without inventing details.
    const pageWords = expandTokens(getTokens(`${page.label} ${page.summary}`));
    const queryWords = [...expandTokens(getTokens(query))];
    const contextOverlap = queryWords.filter(word => pageWords.has(word)).length;
    if (page.id !== 'home' && contextOverlap > 0 && queryWords.length <= 8) {
      return {
        text: `I can help with ${page.label}. ${page.summary}\n\nI don't have a verified answer to that exact question yet. You can ask about the main features, who the service is for, or how to get started. For a detailed or unusual requirement, send it to the E³ team.`,
        actions: ['questionnaire','whatsapp']
      };
    }

    return {
      text: `I don't have a verified answer to that question in E³'s public information yet, and I don't want to guess. For a detailed, unusual or project-specific question, the best next step is to send E³ the context through the Business Discovery & Growth questionnaire or speak with the team on WhatsApp.`,
      actions: ['questionnaire','whatsapp']
    };
  }

  function buildWidget(library) {
    const page = currentPageContext(library);
    const widget = document.createElement('section');
    widget.className = 'e3-ai-widget';
    widget.setAttribute('aria-label', 'E³ website assistant');
    widget.innerHTML = `
      <button class="e3-ai-launcher" type="button" aria-expanded="false" aria-controls="e3-ai-panel">
        <span class="e3-ai-launcher-mark" aria-hidden="true">E³</span>
        <span class="e3-ai-launcher-copy"><strong>Ask E³</strong><small>Your E³ guide</small></span>
      </button>
      <div class="e3-ai-panel" id="e3-ai-panel" role="dialog" aria-modal="false" aria-label="Chat with E³" aria-hidden="true">
        <div class="e3-ai-head">
          <div class="e3-ai-brand"><span class="e3-ai-brand-mark" aria-hidden="true">E³</span><span class="e3-ai-brand-copy"><strong>E³ Assistant</strong><small>Ask about E³ services and next steps</small></span></div>
          <button class="e3-ai-close" type="button" aria-label="Close assistant">×</button>
        </div>
        <div class="e3-ai-context"><span class="e3-ai-context-dot"></span><span>Page-aware guide · Currently exploring: <strong>${escapeHtml(page.label)}</strong></span></div>
        <div class="e3-ai-messages" aria-live="polite" aria-relevant="additions text"></div>
        <div class="e3-ai-suggestions" aria-label="Suggested questions"></div>
        <form class="e3-ai-compose">
          <textarea class="e3-ai-input" rows="1" maxlength="700" aria-label="Type your question" placeholder="Ask a question about E³..."></textarea>
          <button class="e3-ai-send" type="submit" aria-label="Send question">➤</button>
        </form>
        <div class="e3-ai-footnote">Uses approved E³ information. Detailed enquiries go to the E³ team.</div>
      </div>`;
    document.body.appendChild(widget);

    const launcher = widget.querySelector('.e3-ai-launcher');
    const panel = widget.querySelector('.e3-ai-panel');
    const close = widget.querySelector('.e3-ai-close');
    const messages = widget.querySelector('.e3-ai-messages');
    const suggestions = widget.querySelector('.e3-ai-suggestions');
    const form = widget.querySelector('.e3-ai-compose');
    const input = widget.querySelector('.e3-ai-input');
    const send = widget.querySelector('.e3-ai-send');
    let lastQuestion = '';
    let lastEntry = null;
    let opened = false;

    function openPanel() {
      widget.classList.add('is-open');
      // Body-level flag so page elements (for example the mobile WhatsApp bar)
      // can react; a widget-relative sibling selector can never reach them
      // because the widget is appended last inside <body>.
      document.body.classList.add('e3-ai-chat-open');
      launcher.setAttribute('aria-expanded','true');
      panel.setAttribute('aria-hidden','false');
      input.focus({preventScroll:true});
      if (!opened) {
        opened = true;
        addMessage(`Hello, I'm the E³ website guide. I can explain E³'s services and help you find the right next step.\n\nYou're currently exploring ${page.label}. What would you like to know?`, 'bot');
        renderSuggestions();
      }
    }
    function closePanel() {
      widget.classList.remove('is-open');
      document.body.classList.remove('e3-ai-chat-open');
      launcher.setAttribute('aria-expanded','false');
      panel.setAttribute('aria-hidden','true');
      launcher.focus({preventScroll:true});
    }
    function addMessage(text, who, actions = []) {
      const bubble = document.createElement('div');
      bubble.className = `e3-ai-message ${who}`;
      const paragraphs = String(text).split(/\n\n+/);
      paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        bubble.appendChild(p);
      });
      if (actions.length) {
        const links = document.createElement('div');
        links.className = 'e3-ai-actions';
        actions.forEach(action => {
          const a = document.createElement('a');
          a.className = `e3-ai-action${action.primary ? '' : ' secondary'}`;
          a.textContent = action.label;
          a.href = action.href;
          if (action.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          links.appendChild(a);
        });
        bubble.appendChild(links);
      }
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }
    function renderSuggestions() {
      suggestions.replaceChildren();
      (page.suggestions || []).slice(0,3).forEach(question => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'e3-ai-suggestion';
        button.textContent = question;
        button.addEventListener('click', () => sendQuestion(question));
        suggestions.appendChild(button);
      });
    }
    function showTyping() {
      const bubble = document.createElement('div');
      bubble.className = 'e3-ai-message bot e3-ai-typing-message';
      bubble.innerHTML = '<span class="e3-ai-typing" aria-label="Preparing answer"><i></i><i></i><i></i></span>';
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }
    function sendQuestion(question) {
      const clean = String(question || '').trim();
      if (!clean) return;
      lastQuestion = clean;
      addMessage(clean, 'user');
      input.value = '';
      suggestions.replaceChildren();
      send.disabled = true;
      const typing = showTyping();
      // Brief visual pause makes the exchange readable; all matching is local and no API is called.
      window.setTimeout(() => {
        typing.remove();
        const result = resolveAnswer(library, page, clean, lastEntry);
        if (result.entry) lastEntry = result.entry;
        const actions = actionLinks(result.actions, page, clean, library.contact || {});
        addMessage(result.text, 'bot', actions);
        send.disabled = false;
        input.focus({preventScroll:true});
      }, 280);
    }

    launcher.addEventListener('click', openPanel);
    close.addEventListener('click', closePanel);
    form.addEventListener('submit', event => { event.preventDefault(); sendQuestion(input.value); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendQuestion(input.value); }
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && widget.classList.contains('is-open')) closePanel(); });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  async function init() {
    let library = null;
    // Primary source: assets/e3-knowledge.js, loaded as a plain <script> tag on
    // every page. Script tags keep working when the pages are opened directly
    // from disk (file://), where fetch() of a local JSON file is blocked.
    if (window.E3KnowledgeData && Array.isArray(window.E3KnowledgeData.entries)) {
      library = window.E3KnowledgeData;
    }
    if (!library) {
      // Fallback for deployments where the generated script file is missing but
      // the JSON is served (for example a server deployment updated in a hurry).
      try {
        const response = await fetch(rootUrl('data/e3-knowledge.json'), { cache: 'no-cache', credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Knowledge library request failed (${response.status})`);
        library = await response.json();
      } catch (error) {
        console.error('E³ Assistant could not load its knowledge library:', error);
      }
    }
    if (!library) {
      // Keep a useful human-contact fallback if the library cannot be loaded at all.
      const fallback = document.createElement('a');
      fallback.className = 'e3-ai-launcher e3-ai-fallback';
      fallback.href = `https://wa.me/${DEFAULT_WA}?text=${encodeURIComponent('Hello E³, I need help with a question from your website.')}`;
      fallback.target = '_blank';
      fallback.rel = 'noopener noreferrer';
      fallback.textContent = 'Ask E³ on WhatsApp';
      Object.assign(fallback.style, { position:'fixed', right:'22px', bottom:'22px', zIndex:'1005', textDecoration:'none' });
      document.body.appendChild(fallback);
      return;
    }
    window.E3Knowledge = library;
    buildWidget(library);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
