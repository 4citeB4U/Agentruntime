/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Injects CSS and JS into an HTML string to hide everything except the canvas and necessary elements.
 * This is the ultimate "cleaner" for generated voxel scenes.
 */
export const injectHideStyles = (html: string): string => {
  if (!html) return "";

  const hideStyles = `
    <style id="agent-lee-hide-styles">
      /* Kill all text rendering and interaction in the document */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
        width: 100% !important;
        height: 100% !important;
        color: transparent !important;
        font-size: 0 !important;
        line-height: 0 !important;
        text-indent: -9999px !important;
        user-select: none !important;
        -webkit-user-select: none !important;
      }

      /* Hide everything by default except the canvas and its containers */
      body > *:not(script):not(style):not(canvas):not(#canvas-container):not(#app):not(#root):not(#container):not(.canvas-container) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Aggressive overlay hiding for common Three.js/dat.gui/stats elements */
      #info, .dg, .dg.ac, .dg.main, #stats, .stats, #gui, .gui, .controls, #controls, .label, .text-overlay, #loading, #instructions {
        display: none !important;
        z-index: -1 !important;
      }

      /* Ensure canvas is visible and fills the screen */
      canvas {
        display: block !important;
        width: 100vw !important;
        height: 100vh !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        z-index: 1 !important;
        background: transparent !important;
        visibility: visible !important;
        opacity: 1 !important;
        touch-action: none !important; /* Prevent default touch actions for better OrbitControls */
      }
    </style>
    <script>
      // Force OrbitControls to be interactive and handle zoom
      const forceInteractivity = () => {
        // Try to find any OrbitControls instances and ensure they are enabled
        // This is a bit tricky as we don't have direct access to the JS variables
        // but we can try to intercept or override common patterns.
        
        // Ensure the canvas is focused and ready for events
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.style.pointerEvents = 'auto';
          canvas.focus();
        }
      };

      // Additional runtime cleanup to ensure no text nodes survive
      const cleanup = () => {
        // Hide all elements that are not canvas or its parents
        const all = document.querySelectorAll('body *');
        all.forEach(el => {
          if (el.tagName !== 'CANVAS' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
            const hasCanvas = el.querySelector('canvas') || el.tagName === 'CANVAS';
            if (!hasCanvas) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.opacity = '0';
            }
          }
        });
        
        // Clear any text nodes directly in body or html
        const targets = [document.body, document.documentElement];
        targets.forEach(target => {
          if (target) {
            Array.from(target.childNodes).forEach(node => {
              if (node.nodeType === Node.TEXT_NODE) {
                node.textContent = '';
              }
            });
          }
        });
      };
      
      // Run immediately and on multiple intervals
      forceInteractivity();
      cleanup();
      window.addEventListener('load', () => {
        forceInteractivity();
        cleanup();
      });
      setInterval(() => {
        forceInteractivity();
        cleanup();
      }, 500);
      
      // MutationObserver to catch dynamic elements
      let timeout;
      const observer = new MutationObserver(() => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(cleanup, 100);
      });
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    </script>
  `;

  // Inject before </head> or <body> or at the beginning
  const lowerHtml = html.toLowerCase();
  if (lowerHtml.includes("</head>")) {
    return html.replace(/<\/head>/i, `${hideStyles}</head>`);
  } else if (lowerHtml.includes("<body>")) {
    return html.replace(/<body>/i, `<body>${hideStyles}`);
  } else {
    return `${hideStyles}${html}`;
  }
};

/**
 * Injects auto-rotate settings into the Three.js OrbitControls.
 */
export const injectAutoRotate = (html: string): string => {
  if (!html) return "";
  
  // Look for OrbitControls initialization and add autoRotate settings
  const controlsRegex = /const\s+(\w+)\s*=\s*new\s+OrbitControls\(/g;
  return html.replace(controlsRegex, (match, varName) => {
    return `${match}
    ${varName}.autoRotate = true;
    ${varName}.autoRotateSpeed = 3.0; // 3 rotations per minute (20s each)
    ${varName}.minDistance = 5;
    ${varName}.maxDistance = 500;
    ${varName}.enableZoom = true;
    ${varName}.enablePan = true;`;
  });
};

/**
 * Injects standardized transition logic (scattering, rebuilding, dismantling) into the voxel scene.
 */
export const injectTransitionLogic = (html: string): string => {
  if (!html) return "";

  const transitionScript = `
    <script id="agent-lee-transition-logic">
      // Standardized Transition Constants
      const FLOOR_Y = -30;
      const SCATTER_RANGE = 40;
      
      // We'll override/inject into the existing voxel logic if possible
      // or provide helpers that the generated code can use.
      
      window.addEventListener('message', (e) => {
        if (e.data.type === 'DISMANTLE') {
          if (window.setVoxelState) window.setVoxelState('DISMANTLING');
        }
      });

      // Helper to initialize a voxel at the floor
      window.getInitialVoxelPos = () => {
        return {
          x: (Math.random() - 0.5) * SCATTER_RANGE,
          y: FLOOR_Y + Math.random() * 2,
          z: (Math.random() - 0.5) * SCATTER_RANGE,
          rx: Math.random() * Math.PI,
          ry: Math.random() * Math.PI,
          rz: Math.random() * Math.PI
        };
      };
    </script>
  `;

  // This is more complex because we need to replace the actual logic in the generated code.
  // We'll look for common patterns in the generated Three.js code.

  let result = html;

  // 1. Inject the helper script
  if (result.toLowerCase().includes("</head>")) {
    result = result.replace(/<\/head>/i, `${transitionScript}</head>`);
  } else {
    result = transitionScript + result;
  }

  // 2. Standardize addVoxel to use the floor positions
  const addVoxelRegex = /function\s+addVoxel\s*\(([^)]+)\)\s*\{([\s\S]*?)\}/g;
  result = result.replace(addVoxelRegex, (match, args, body) => {
    // Check if it already has target logic
    if (body.includes('targetX')) {
      return `function addVoxel(${args}) {
        const initial = window.getInitialVoxelPos ? window.getInitialVoxelPos() : { x: 0, y: -30, z: 0, rx: 0, ry: 0, rz: 0 };
        const [x, y, z, color] = [${args}];
        voxels.push({
          x: initial.x, y: initial.y, z: initial.z,
          targetX: x, targetY: y, targetZ: z,
          color,
          vx: 0, vy: 0, vz: 0,
          rx: initial.rx, ry: initial.ry, rz: initial.rz,
          rvx: (Math.random() - 0.5) * 0.1, rvy: (Math.random() - 0.5) * 0.1, rvz: (Math.random() - 0.5) * 0.1
        });
      }`;
    }
    return match;
  });

  // 3. Standardize state management
  if (!result.includes("let state = 'SCATTERED'")) {
    result = result.replace(/import\s+.*from\s+['"]three['"];/i, (match) => {
      return `${match}\nlet state = 'SCATTERED';\nwindow.setVoxelState = (s) => { state = s; };`;
    });
  } else {
    result = result.replace(/let\s+state\s*=\s*['"][^'"]+['"]/, "let state = 'SCATTERED'; window.setVoxelState = (s) => { state = s; }");
  }

  // 4. Standardize the animation loop logic
  // We look for the loop that iterates over voxels and applies state logic
  const voxelLoopRegex = /voxels\.forEach\s*\(\s*\(\s*v\s*,\s*i\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\);/g;
  result = result.replace(voxelLoopRegex, (match, body) => {
    // If it already has state logic, we replace it with our standardized one
    if (body.includes('state ===')) {
      return `voxels.forEach((v, i) => {
        if (state === 'REBUILDING') {
          v.x += (v.targetX - v.x) * 0.08;
          v.y += (v.targetY - v.y) * 0.08;
          v.z += (v.targetZ - v.z) * 0.08;
          v.rx += (0 - v.rx) * 0.08;
          v.ry += (0 - v.ry) * 0.08;
          v.rz += (0 - v.rz) * 0.08;
        } else if (state === 'DISMANTLING') {
          v.vy -= 0.02; // Gravity
          v.x += v.vx;
          v.y += v.vy;
          v.z += v.vz;
          v.rx += v.rvx;
          v.ry += v.rvy;
          v.rz += v.rvz;
          if (v.y < FLOOR_Y) {
            v.y = FLOOR_Y;
            v.vy *= -0.2; // Very low bounce
            v.vx *= 0.8;
            v.vz *= 0.8;
            v.rvx *= 0.8; v.rvy *= 0.8; v.rvz *= 0.8;
          }
        } else if (state === 'SCATTERED') {
          v.y = FLOOR_Y;
        }
        ${body.includes('dummy.position') ? body.substring(body.indexOf('dummy.position')) : ''}
      });`;
    }
    return match;
  });

  // 5. Ensure the initial transition to REBUILDING happens
  if (!result.includes("setTimeout(() => { if (state === 'SCATTERED') state = 'REBUILDING'; }")) {
    result = result.replace(/animate\(\);/i, (match) => {
      return `setTimeout(() => { if (state === 'SCATTERED') state = 'REBUILDING'; }, 1500);\n${match}`;
    });
  }

  // 6. Handle DISMANTLE message more aggressively
  if (!result.includes("window.addEventListener('message'")) {
     result = result.replace(/animate\(\);/i, (match) => {
      return `window.addEventListener('message', (e) => {
        if (e.data.type === 'DISMANTLE') {
          state = 'DISMANTLING';
          voxels.forEach(v => {
            v.vx = (Math.random() - 0.5) * 0.2;
            v.vy = Math.random() * 0.2;
            v.vz = (Math.random() - 0.5) * 0.2;
          });
        }
      });\n${match}`;
    });
  }

  return result;
};

/**
 * Extracts a complete HTML document from a string that might contain
 * conversational text, markdown code blocks, etc.
 */
export const extractHtmlFromText = (text: string): string => {
  if (!text) return "";

  // 1. Try to find the LAST markdown code block (usually the final, most complete output)
  const codeBlocks = Array.from(text.matchAll(/```(?:html|javascript|css)?\s*([\s\S]*?)```/gi));
  if (codeBlocks.length > 0) {
    const lastBlock = codeBlocks[codeBlocks.length - 1][1].trim();
    // If the block contains HTML or script tags, it's likely our target
    if (lastBlock.toLowerCase().includes('<html') || 
        lastBlock.toLowerCase().includes('<script') || 
        lastBlock.toLowerCase().includes('<style')) {
      return injectTransitionLogic(injectAutoRotate(injectHideStyles(lastBlock)));
    }
  }

  // 2. Try to find the most complete HTML document structure
  // We use a greedy match to get everything from the first <html> to the last </html>
  const htmlMatch = text.match(/(<!DOCTYPE html>|<html)[\s\S]*(<\/html>)/i);
  if (htmlMatch) {
    return injectTransitionLogic(injectAutoRotate(injectHideStyles(htmlMatch[0])));
  }

  // 3. Try to find the first significant tag and take everything after it
  const firstTagMatch = text.match(/<(script|div|style|canvas|link|meta|body|head|!DOCTYPE)[\s\S]*/i);
  if (firstTagMatch) {
    // Take everything from the first tag to the end, but try to find a closing tag if it's a full document
    const content = firstTagMatch[0].trim();
    const lastClosingTag = content.lastIndexOf('</html>');
    if (lastClosingTag !== -1) {
      return injectHideStyles(content.substring(0, lastClosingTag + 7));
    }
    return injectHideStyles(content);
  }

  // 4. Fallback: handle JSON if the whole thing is a JSON string or contains one
  try {
    // Look for the first { and the last } to extract a potential JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);
      if (parsed.html) return extractHtmlFromText(parsed.html);
      if (parsed.code) return extractHtmlFromText(parsed.code);
      if (parsed.text) return extractHtmlFromText(parsed.text);
    }
  } catch (e) {}

  // 5. Final fallback: If it's just raw text, it's probably not a voxel scene.
  // Return a minimal empty scene to avoid showing JSON/text artifacts.
  return injectHideStyles(`
    <!DOCTYPE html>
    <html>
      <head><style>body { margin: 0; overflow: hidden; background: transparent; }</style></head>
      <body><canvas id="fallback-canvas"></canvas></body>
    </html>
  `);
};

/**
 * Zooms the camera in by modifying the camera.position.set() call in the Three.js code.
 * Also handles camera.position.x/y/z assignments.
 */
export const zoomCamera = (html: string, zoomFactor: number = 0.6): string => {
  if (!html) return "";

  // 1. Handle camera.position.set(x, y, z)
  const setRegex = /camera\.position\.set\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)/g;
  let result = html.replace(setRegex, (match, x, y, z) => {
    const newX = parseFloat(x) * zoomFactor;
    const newY = parseFloat(y) * zoomFactor;
    const newZ = parseFloat(z) * zoomFactor;
    return `camera.position.set(${newX}, ${newY}, ${newZ})`;
  });

  // 2. Handle camera.position.x = ... etc
  const xRegex = /camera\.position\.x\s*=\s*(-?\d*\.?\d+)/g;
  const yRegex = /camera\.position\.y\s*=\s*(-?\d*\.?\d+)/g;
  const zRegex = /camera\.position\.z\s*=\s*(-?\d*\.?\d+)/g;

  result = result.replace(xRegex, (match, val) => `camera.position.x = ${parseFloat(val) * zoomFactor}`);
  result = result.replace(yRegex, (match, val) => `camera.position.y = ${parseFloat(val) * zoomFactor}`);
  result = result.replace(zRegex, (match, val) => `camera.position.z = ${parseFloat(val) * zoomFactor}`);

  return result;
};
