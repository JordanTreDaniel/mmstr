'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Textarea from '@/app/components/ui/Textarea';
import { updateGrading } from '@/app/actions/interpretations';
import { getMessageBreakdown, getInterpretationBreakdown, getBreakdownPoints } from '@/app/actions/breakdowns';
import type { Message, Interpretation, InterpretationGrading, Point } from '@/types/entities';

export interface ReviewInterpretationStepProps {
  message: Message;
  interpretation: Interpretation;
  grading: InterpretationGrading;
  onReviewComplete: () => void;
}

interface PointGrading {
  pointId: string;
  status: 'pass' | 'fail' | 'ungraded';
}

/**
 * ReviewInterpretationStep - Step 3 of the interpretation flow
 * Allows the message author to review and accept/reject an interpretation
 * Shows the original message, interpreter's attempt, similarity score, and point-by-point review
 */
const ReviewInterpretationStep: React.FC<ReviewInterpretationStepProps> = ({
  message,
  interpretation,
  grading,
  onReviewComplete,
}) => {
  const [messagePoints, setMessagePoints] = useState<Point[]>([]);
  const [interpretationPoints, setInterpretationPoints] = useState<Point[]>([]);
  const [pointGradings, setPointGradings] = useState<PointGrading[]>([]);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load breakdown points on mount
  useEffect(() => {
    async function loadBreakdowns() {
      try {
        setIsLoading(true);
        
        // Get message breakdown and points
        const msgBreakdown = await getMessageBreakdown(message.id);
        if (msgBreakdown) {
          const msgPts = await getBreakdownPoints(msgBreakdown.id);
          setMessagePoints(msgPts);
          
          // Initialize point gradings
          setPointGradings(msgPts.map(pt => ({
            pointId: pt.id,
            status: 'ungraded' as const
          })));
        }
        
        // Get interpretation breakdown and points
        const interpBreakdown = await getInterpretationBreakdown(interpretation.id);
        if (interpBreakdown) {
          const interpPts = await getBreakdownPoints(interpBreakdown.id);
          setInterpretationPoints(interpPts);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading breakdowns:', err);
        setError('Failed to load breakdown points');
        setIsLoading(false);
      }
    }
    
    loadBreakdowns();
  }, [message.id, interpretation.id]);

  // Handle point grading
  const handleGradePoint = (pointId: string, status: 'pass' | 'fail') => {
    setPointGradings(prev => 
      prev.map(pg => 
        pg.pointId === pointId 
          ? { ...pg, status } 
          : pg
      )
    );
  };

  // Handle accept
  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await updateGrading(grading.id, {
        status: 'accepted',
        notes: feedbackNotes || null
      });
      
      onReviewComplete();
    } catch (err) {
      console.error('Error accepting interpretation:', err);
      setError('Failed to accept interpretation. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!feedbackNotes.trim()) {
      setError('Please provide feedback explaining why you are rejecting this interpretation.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await updateGrading(grading.id, {
        status: 'rejected',
        notes: feedbackNotes
      });
      
      onReviewComplete();
    } catch (err) {
      console.error('Error rejecting interpretation:', err);
      setError('Failed to reject interpretation. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Check if all points are graded
  const allPointsGraded = pointGradings.every(pg => pg.status !== 'ungraded');
  const passedPoints = pointGradings.filter(pg => pg.status === 'pass').length;
  const failedPoints = pointGradings.filter(pg => pg.status === 'fail').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading interpretation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Review Interpretation
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Evaluate if the interpreter accurately understood your message
        </p>
      </div>

      {/* Similarity Score & Auto-Accept Badge */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AI Similarity Score
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {grading.similarityScore}%
              </span>
              {grading.autoAcceptSuggested && (
                <Badge variant="success" size="md">
                  ✓ Auto-Accept Suggested
                </Badge>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              {grading.similarityScore >= 90 
                ? 'Excellent understanding' 
                : grading.similarityScore >= 75 
                ? 'Good understanding' 
                : grading.similarityScore >= 60
                ? 'Fair understanding'
                : 'Needs improvement'}
            </p>
          </div>
        </div>
      </Card>

      {/* Original Message Reference */}
      <Card variant="elevated" padding="lg">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Your Original Message
          </h4>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
            {message.text}
          </p>
        </div>
      </Card>

      {/* Interpreter's Attempt */}
      <Card variant="elevated" padding="lg">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Their Interpretation
          </h4>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
            {interpretation.text}
          </p>
        </div>
      </Card>

      {/* Point-by-Point Review */}
      {messagePoints.length > 0 && (
        <Card variant="elevated" padding="lg">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Point-by-Point Review
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Grade each point from your message (optional but helpful for feedback)
            </p>
          </div>
          
          <div className="space-y-4">
            {messagePoints.map((point, index) => {
              const grading = pointGradings.find(pg => pg.pointId === point.id);
              return (
                <div key={point.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Point {index + 1}
                    </span>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {point.text}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={grading?.status === 'pass' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleGradePoint(point.id, 'pass')}
                      className="min-w-[80px]"
                    >
                      {grading?.status === 'pass' ? '✓ Pass' : 'Pass'}
                    </Button>
                    <Button
                      variant={grading?.status === 'fail' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleGradePoint(point.id, 'fail')}
                      className="min-w-[80px]"
                    >
                      {grading?.status === 'fail' ? '✗ Fail' : 'Fail'}
                    </Button>
                    {grading?.status !== 'ungraded' && grading && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {grading.status === 'pass' ? 'Understood correctly' : 'Needs work'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Point Grading Summary */}
          {allPointsGraded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Point Summary:
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {passedPoints} Passed
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {failedPoints} Failed
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Optional Feedback Notes */}
      <div>
        <Textarea
          label="Feedback (Optional for acceptance, Required for rejection)"
          placeholder="Provide specific feedback about what was understood correctly or what needs improvement..."
          value={feedbackNotes}
          onChange={(e) => setFeedbackNotes(e.target.value)}
          rows={4}
          resize="vertical"
          className="font-sans"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleReject}
          disabled={isSubmitting}
          className="min-w-[150px] border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {isSubmitting ? 'Rejecting...' : 'Reject'}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleAccept}
          disabled={isSubmitting}
          className="min-w-[150px] bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
        >
          {isSubmitting ? 'Accepting...' : 'Accept Interpretation'}
        </Button>
      </div>

      {/* Info Box */}
      <Card variant="elevated" padding="md">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Accepting allows the interpreter to respond to your message. 
            Rejecting sends them back to try again (up to 3 total attempts).
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ReviewInterpretationStep;
