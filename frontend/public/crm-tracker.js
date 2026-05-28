/**
 * DeaL CRM Tracker
 * A lightweight analytics and UTM tracking snippet.
 */

(function(window, document) {
    // Prevent double initialization
    if (window.CRM) return;
  
    const API_BASE = "http://127.0.0.1:8000/api";
    
    // Simple Session ID generator
    function generateSessionId() {
      return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  
    // Get or create session ID
    let sessionId = localStorage.getItem('crm_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('crm_session_id', sessionId);
    }
  
    // Parse UTMs from URL
    function getUTMParams() {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_term: urlParams.get('utm_term'),
        utm_content: urlParams.get('utm_content'),
      };
    }
  
    const CRM = {
      config: {
        sourceId: null,
      },
      
      init: function(options) {
        if (!options || !options.sourceId) {
          console.error("CRM.init() requires a sourceId");
          return;
        }
        this.config.sourceId = options.sourceId;
        
        // Register UTMs if they exist
        const utms = getUTMParams();
        if (utms.utm_source || utms.utm_medium || utms.utm_campaign) {
          this.registerUTMs(utms);
        }
        
        // Auto-track pageview on init
        this.track('pageview');
      },
  
      registerUTMs: function(utms) {
        const payload = {
          session_id: sessionId,
          referrer_url: document.referrer || null,
          landing_page: window.location.href,
          ...utms
        };
        
        fetch(`${API_BASE}/events/utm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors'
        }).catch(err => console.error("CRM UTM track failed", err));
      },
  
      track: function(eventType, metadata = {}) {
        if (!this.config.sourceId) {
          console.warn("CRM tracker not initialized. Call CRM.init({ sourceId: '...' }) first.");
          return;
        }
  
        const payload = {
          session_id: sessionId,
          event_type: eventType,
          page_url: window.location.href,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          browser: navigator.userAgent,
          metadata_json: metadata
        };
  
        fetch(`${API_BASE}/events/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors'
        }).catch(err => console.error("CRM Event track failed", err));
      }
    };
  
    // Expose to global window object
    window.CRM = CRM;
    
    // Auto-capture clicks on CTA buttons (optional, basic heuristic)
    document.addEventListener('click', function(e) {
      const target = e.target.closest('button, a');
      if (target) {
        // If it looks like a conversion or important button
        if (target.innerText.toLowerCase().includes('submit') || 
            target.innerText.toLowerCase().includes('buy') ||
            target.innerText.toLowerCase().includes('sign up')) {
          CRM.track('cta_click', {
            button_text: target.innerText,
            button_id: target.id || null
          });
        }
      }
    });
  
  })(window, document);
