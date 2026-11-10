---
"@polagram/preview": patch
"@polagram/cli": patch
---

Restrict preview access to configured diagram inputs inside the project root, bind the local server to loopback, and reject unsafe static output destinations. Harden diagram rendering and update the Mermaid security fixes. Existing non-empty static output directories require the preview build marker before they can be replaced.
