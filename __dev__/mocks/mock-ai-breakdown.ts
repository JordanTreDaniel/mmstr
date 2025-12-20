// Mock AI Breakdown Utility
// Generates random breakdown points from text

import { Point } from '@/types/entities';

/**
 * Simulates AI breaking down a message or interpretation into atomic points
 * @param text The text to break down
 * @returns Array of points with text and order
 */
export async function generateBreakdown(text: string): Promise<Omit<Point, 'id' | 'breakdownId'>[]> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Split by sentence-ending punctuation and filter empty strings
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // If text is short or simple, return as single point
  if (sentences.length <= 1 || text.length < 50) {
    return [
      {
        text: text.trim(),
        order: 0
      }
    ];
  }

  // For longer text, create breakdown points
  const points: Omit<Point, 'id' | 'breakdownId'>[] = [];
  
  // Strategy: split by sentences, optionally combine short adjacent sentences
  let currentOrder = 0;
  let i = 0;
  
  while (i < sentences.length) {
    let pointText = sentences[i];
    
    // Combine short adjacent sentences (< 30 chars) randomly
    if (i < sentences.length - 1 && sentences[i].length < 30 && Math.random() > 0.5) {
      pointText += '. ' + sentences[i + 1];
      i++;
    }
    
    points.push({
      text: pointText,
      order: currentOrder++
    });
    
    i++;
  }

  // Ensure we have at least 1 and at most 5 points
  if (points.length > 5) {
    // Combine points to reduce count
    const reduced: Omit<Point, 'id' | 'breakdownId'>[] = [];
    const step = Math.ceil(points.length / 5);
    
    for (let i = 0; i < points.length; i += step) {
      const combinedText = points
        .slice(i, Math.min(i + step, points.length))
        .map(p => p.text)
        .join('. ');
      
      reduced.push({
        text: combinedText,
        order: reduced.length
      });
    }
    
    return reduced;
  }

  return points;
}
