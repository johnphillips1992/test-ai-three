import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as faceapi from 'face-api.js';
import { Canvas, Image } from 'canvas';
import * as tf from '@tensorflow/tfjs-node';

// Configure faceapi to use canvas
// @ts-ignore (types don't match exactly but it works)
faceapi.env.monkeyPatch({ Canvas, Image });

// Load the models (they will be cached after first load)
const loadModels = async () => {
  // Models are stored in the Vercel deployment
  const modelPath = 'https://your-vercel-domain.vercel.app/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
    faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
  ]);
};

// Initialize models
let modelsLoaded = false;

export default async (req: VercelRequest, res: VercelResponse) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Load models if not already loaded
    if (!modelsLoaded) {
      await loadModels();
      modelsLoaded = true;
    }

    // Get image data from request body
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Convert base64 image to buffer
    const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
    const image = await canvas.loadImage(imageBuffer);

    // Detect faces and expressions
    const detections = await faceapi
      .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    // Calculate focus level based on facial expressions
    let focusLevel = 0.5; // Default focus level
    
    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      
      // Calculate focus level based on expressions
      // Higher focus is associated with neutral expression
      // Lower focus is associated with surprised, angry, or happy expressions
      focusLevel = expressions.neutral * 0.8 + 
                  (1 - expressions.surprised) * 0.1 +
                  (1 - expressions.angry) * 0.05 +
                  (1 - expressions.happy) * 0.05;
      
      // Ensure the focus level is between 0 and 1
      focusLevel = Math.min(1, Math.max(0, focusLevel));
    }

    // Return the focus level and facial analysis
    res.status(200).json({
      focusLevel,
      faceDetected: detections.length > 0,
      expressions: detections.length > 0 ? detections[0].expressions : null
    });
  } catch (error) {
    console.error('Error analyzing focus:', error);
    res.status(500).json({ error: 'Failed to analyze focus' });
  }
};