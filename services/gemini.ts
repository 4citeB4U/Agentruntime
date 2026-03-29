/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, Modality } from "@google/genai";
import { extractHtmlFromText } from "../utils/html";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const IMAGE_SYSTEM_PROMPT = "Generate a beautiful voxel art style object or character on a simple background. The style should be blocky, Minecraft-like, or isometric voxel art.";
export const VOXEL_PROMPT = `I have provided an image. Your task is to create a 3D voxel art representation of the main subject in this image using Three.js.

ENVIRONMENT & STYLE (CRITICAL):
- The subject MUST be placed on a floating voxel island (inverted cone shape with noise).
- Use a warm, cloudy background color: 0xffeedd.
- Add a subtle fog: new THREE.FogExp2(0xffeedd, 0.015).
- Use THREE.InstancedMesh for all voxels (subject and island).
- Include THREE.OrbitControls with autoRotate = true and autoRotateSpeed = 0.5.
- Lighting: AmbientLight(0xffcccc, 0.6) and a DirectionalLight(0xfffaed, 1.5) at (50, 80, 30) with shadows.

ANIMATION & PHYSICS REQUIREMENTS (MANDATORY):
- Every voxel must have physics properties: x, y, z (target), vx, vy, vz, rx, ry, rz, rvx, rvy, rvz.
- On load, voxels must start in a "SCATTERED" state: spread out on a virtual floor at y = -30 with random positions and rotations.
- Immediately after load, voxels must transition to a "REBUILDING" state.
- The rebuild animation should move voxels from their scattered positions to their target positions with height-based delays (building from bottom to top).
- Implement a "dismantle" function triggered via window.addEventListener('message', (e) => { if (e.data.type === 'DISMANTLE') { ... } }).
- In the "DISMANTLING" state, voxels must fall with gravity (vy -= 0.025) and bounce when hitting y = -30.
- Use smooth interpolation (lerp) for the rebuilding movement.

CODE STRUCTURE REFERENCE:
1. Setup Scene, Camera, Renderer, Controls, Lighting.
2. Define a 'voxels' array and an 'addVoxel(x, y, z, color)' function.
3. Procedurally generate the floating island (inverted cone) and the subject from the image.
4. Create a single THREE.InstancedMesh for all voxels.
5. In the animate loop, handle states:
   - 'SCATTERED': Voxels at y = -30.
   - 'REBUILDING': Lerp to target positions with height-based delay.
   - 'DISMANTLING': Apply gravity and bounce.
6. Add window message listener for 'DISMANTLE'.

STRICT OUTPUT RULES:
- Output ONLY the HTML code.
- DO NOT include any conversational text.
- DO NOT use markdown code blocks.
- Just the raw HTML starting with <!DOCTYPE html>.`;

export const generateImage = async (prompt: string, aspectRatio: string = '1:1', optimize: boolean = true): Promise<string> => {
  try {
    let finalPrompt = prompt;

    // Apply the shortened optimization prompt if enabled
    if (optimize) {
      finalPrompt = `${IMAGE_SYSTEM_PROMPT}\n\nSubject: ${prompt}`;
    }

    // Note: gemini-2.5-flash-image now supports multiple aspect ratios.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        responseModalities: [
            'IMAGE',
        ],
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image generated.");
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const generateVoxelScene = async (
  imageBase64: string, 
  onThoughtUpdate?: (thought: string) => void
): Promise<string> => {
  // Extract the base64 data part if it includes the prefix
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  
  // Extract MIME type from the data URL if present, otherwise default to jpeg
  const mimeMatch = imageBase64.match(/^data:(.*?);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  let fullHtml = "";

  try {
    // Using gemini-3-pro-preview for complex code generation with thinking
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: VOXEL_PROMPT
          }
        ]
      },
      config: {
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    });

    for await (const chunk of response) {
      const candidates = chunk.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          // Cast to any to access 'thought' property if not in current type definition
          const p = part as any;
          
          if (p.thought) {
            if (onThoughtUpdate && p.text) {
              onThoughtUpdate(p.text);
            }
          } else {
            if (p.text) {
              fullHtml += p.text;
            }
          }
        }
      }
    }

    return extractHtmlFromText(fullHtml);

  } catch (error) {
    console.error("Voxel scene generation failed:", error);
    throw error;
  }
};
