# Gemini Expert - Quick Start Guide

## 1. Objective
This guide provides a prioritized list of files and an architectural overview to help you quickly understand our Gemini integration and prepare for a detailed review.

---

## 2. Key Files to Review (Prioritized)

1. **`src/services/ai/providers/cloudLLM.ts`**
   - **Primary focus:** Contains the `GeminiProvider` class, which is the core of our Gemini API integration.
   - **Review for:** API call structure, streaming implementation, function call handling, safety settings.

2. **`src/services/ai/geminiFunctions.ts`**
   - **Focus:** Central registry for all functions available to Gemini.
   - **Review for:** Function definition patterns, schema correctness, best practices.

3. **`src/types/gemini.ts`**
   - **Focus:** TypeScript definitions for all Gemini-related types.
   - **Review for:** Type safety, completeness, alignment with API specifications.

4. **`src/services/ai/router.ts`**
   - **Focus:** The `LLMRouter` class, which selects between Gemini and other providers.
   - **Review for:** Routing logic, fallback strategies, provider health checks.

5. **`src/components/AIAssistant/AIAssistant.tsx`**
   - **Focus:** Primary UI component that consumes the Gemini stream.
   - **Review for:** Streaming UI patterns, user experience, error handling.

---

## 3. Architecture Overview

- **`aiServiceBridge.ts`:** Main entry point for all AI services.
- **`router.ts`:** Selects the best LLM provider (Gemini, NotebookLM, local models).
- **`cloudLLM.ts`:** Implements `GeminiProvider` and `NotebookLMProvider`.
- **`apiKeyService.ts`:** Manages API key storage and retrieval.
- **`geminiFunctions.ts`:** Defines tools that Gemini can use.
- **`AIAssistant.tsx`:** Consumes and displays AI responses.

---

## 4. Review Checklist

### Key Areas for Feedback:

- **[ ] Gemini API Integration:** Patterns, efficiency, best practices.
- **[ ] Function Calling:** Implementation, schema design, scalability.
- **[ ] Vision API:** Usage patterns, opportunities for improvement.
- **[ ] Streaming:** Efficiency, error handling, client-side implementation.
- **[ ] Safety & System Instructions:** Configuration and effectiveness.
- **[ ] Error Handling:** Robustness, user feedback, retry logic.
- **[ ] API Key Management:** Security and best practices.
- **[ ] Performance:** Latency, token optimization, overall efficiency.
- **[ ] Best Practices:** Overall compliance with Google's recommendations.

---

*This guide is designed to provide a high-level overview. For more details, please see the main review document at `docs/reports/GEMINI_EXPERT_REVIEW.md`.*
