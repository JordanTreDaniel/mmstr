/**
 * Utility functions to determine message status and which icon to display
 * Based on interpretation state and user permissions
 */

/**
 * Message status types corresponding to the icon components:
 * - brain: Interpretation needed (not started or pending)
 * - speaking: Interpretation accepted, can respond now
 * - checkmark: Interpretation completed and accepted
 * - none: No icon (e.g., message is from current user or no interpretation needed)
 */
export type MessageStatus = 'brain' | 'speaking' | 'checkmark' | 'none';

/**
 * Interpretation grading status
 */
export type GradingStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Parameters needed to determine message status
 */
export interface MessageStatusParams {
  /** Is this message from the current user? */
  isOwnMessage: boolean;
  /** Does this message meet minimum requirements for interpretation (10+ chars, 3+ words)? */
  requiresInterpretation: boolean;
  /** Has the current user submitted an interpretation for this message? */
  hasInterpretation: boolean;
  /** If interpretation exists, what is its status? */
  interpretationStatus?: GradingStatus;
  /** Has the current user already responded to this message? */
  hasResponded: boolean;
}

/**
 * Determine which status icon should be displayed for a message
 * @param params Message status parameters
 * @returns The message status indicating which icon to show
 */
export function getMessageStatus(params: MessageStatusParams): MessageStatus {
  const {
    isOwnMessage,
    requiresInterpretation,
    hasInterpretation,
    interpretationStatus,
    hasResponded,
  } = params;

  // No icon for own messages
  if (isOwnMessage) {
    return 'none';
  }

  // If message is too short, no interpretation needed
  if (!requiresInterpretation) {
    return 'none';
  }

  // If already responded, show checkmark
  if (hasResponded) {
    return 'checkmark';
  }

  // If no interpretation yet, show brain (need to interpret)
  if (!hasInterpretation) {
    return 'brain';
  }

  // If interpretation exists, check its status
  if (interpretationStatus === 'accepted') {
    // Interpretation accepted but not yet responded - show speaking icon
    return 'speaking';
  } else if (interpretationStatus === 'pending') {
    // Still waiting for author to review - show brain
    return 'brain';
  } else if (interpretationStatus === 'rejected') {
    // Rejected interpretation - show brain (need to try again)
    return 'brain';
  }

  // Default fallback
  return 'brain';
}

/**
 * Check if a user can respond to a message based on interpretation status
 * @param params Message status parameters
 * @returns true if the user can respond, false otherwise
 */
export function canRespondToMessage(params: MessageStatusParams): boolean {
  const { isOwnMessage, requiresInterpretation, interpretationStatus } = params;

  // Cannot respond to own messages
  if (isOwnMessage) {
    return false;
  }

  // If no interpretation required, can respond directly
  if (!requiresInterpretation) {
    return true;
  }

  // Must have accepted interpretation to respond
  return interpretationStatus === 'accepted';
}

/**
 * Get a human-readable description of the current message status
 * @param status The message status
 * @returns A description string
 */
export function getStatusDescription(status: MessageStatus): string {
  switch (status) {
    case 'brain':
      return 'Interpretation needed';
    case 'speaking':
      return 'Can respond now';
    case 'checkmark':
      return 'Completed';
    case 'none':
      return 'No action needed';
    default:
      return '';
  }
}
