import React from 'react';

const BADGE_STYLES = {
  HIGH_INTENT: {
    background: '#1F6E43',
    color: '#FFFFFF',
    border: 'none',
  },
  AT_RISK: {
    background: '#FBE9D2',
    color: '#B4670F',
    border: '1px solid #B4670F',
  },
  NEGLECTED: {
    background: '#FBE9D2',
    color: '#B4670F',
    border: '1px solid #B4670F',
  },
  STANDARD: {
    background: '#FFFFFF',
    color: '#777777',
    border: '1px solid #777777',
  },
};

const BADGE_LABELS = {
  HIGH_INTENT: 'HIGH INTENT',
  AT_RISK:     'AT RISK',
  NEGLECTED:   'NEGLECTED',
  STANDARD:    'STANDARD',
};

/**
 * IntentBadge — canonical badge component per DaleIQ design spec.
 * @param {'HIGH_INTENT'|'AT_RISK'|'NEGLECTED'|'STANDARD'} type
 */
const IntentBadge = ({ type = 'STANDARD', style = {} }) => {
  const key = type?.toUpperCase().replace(/[- ]/g, '_') || 'STANDARD';
  const s   = BADGE_STYLES[key] || BADGE_STYLES.STANDARD;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '2px 8px',
      borderRadius: 4,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      ...s,
      ...style,
    }}>
      {BADGE_LABELS[key] || key}
    </span>
  );
};

export default IntentBadge;
