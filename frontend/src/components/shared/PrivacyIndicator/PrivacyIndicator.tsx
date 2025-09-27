import React from 'react';
import {
  Chip,
  Tooltip,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Public,
  LockOpen,
  Lock,
  Security,
  VerifiedUser,
} from '@mui/icons-material';
import { PRIVACY_LEVELS } from '@/utils/constants';

interface PrivacyIndicatorProps {
  level: 'public' | 'restricted' | 'private';
  size?: 'small' | 'medium';
  showLabel?: boolean;
  showTooltip?: boolean;
  variant?: 'chip' | 'badge' | 'icon';
}

export const PrivacyIndicator: React.FC<PrivacyIndicatorProps> = ({
  level,
  size = 'medium',
  showLabel = true,
  showTooltip = true,
  variant = 'chip',
}) => {
  const theme = useTheme();

  const privacyConfig = PRIVACY_LEVELS.find(p => p.value === level);

  if (!privacyConfig) {
    return null;
  }

  const getIcon = () => {
    switch (level) {
      case 'public':
        return <Public fontSize={size} />;
      case 'restricted':
        return <LockOpen fontSize={size} />;
      case 'private':
        return <Lock fontSize={size} />;
      default:
        return <Security fontSize={size} />;
    }
  };

  const getColor = () => {
    switch (level) {
      case 'public':
        return theme.palette.success;
      case 'restricted':
        return theme.palette.warning;
      case 'private':
        return theme.palette.error;
      default:
        return theme.palette.grey;
    }
  };

  const content = () => {
    switch (variant) {
      case 'chip':
        return (
          <Chip
            icon={getIcon()}
            label={showLabel ? privacyConfig.label : undefined}
            size={size}
            sx={{
              backgroundColor: getColor().light,
              color: getColor().dark,
              '& .MuiChip-icon': {
                color: getColor().main,
              },
            }}
          />
        );

      case 'badge':
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: getColor().light,
              color: getColor().dark,
            }}
          >
            {getIcon()}
            {showLabel && (
              <Typography variant="caption" fontWeight="medium">
                {privacyConfig.label}
              </Typography>
            )}
          </Box>
        );

      case 'icon':
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              color: getColor().main,
            }}
          >
            {getIcon()}
          </Box>
        );

      default:
        return null;
    }
  };

  const indicator = content();

  if (!showTooltip) {
    return indicator;
  }

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {privacyConfig.label} Data
          </Typography>
          <Typography variant="body2">
            {privacyConfig.description}
          </Typography>
        </Box>
      }
      arrow
    >
      <span>{indicator}</span>
    </Tooltip>
  );
};

// Enhanced Privacy Indicator with ZK Proof status
interface EnhancedPrivacyIndicatorProps extends PrivacyIndicatorProps {
  zkProofStatus?: 'none' | 'generating' | 'verified' | 'failed';
  accessCount?: number;
  lastAccessed?: string;
}

export const EnhancedPrivacyIndicator: React.FC<EnhancedPrivacyIndicatorProps> = ({
  zkProofStatus,
  accessCount,
  lastAccessed,
  ...props
}) => {
  const theme = useTheme();

  const getZKProofIcon = () => {
    switch (zkProofStatus) {
      case 'verified':
        return <VerifiedUser fontSize="small" color="success" />;
      case 'generating':
        return <Security fontSize="small" color="info" />;
      case 'failed':
        return <Security fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  const getZKProofTooltip = () => {
    switch (zkProofStatus) {
      case 'verified':
        return 'Zero-knowledge proof verified';
      case 'generating':
        return 'Generating zero-knowledge proof...';
      case 'failed':
        return 'Zero-knowledge proof verification failed';
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PrivacyIndicator {...props} />

      {zkProofStatus && zkProofStatus !== 'none' && (
        <Tooltip title={getZKProofTooltip()} arrow>
          <span>{getZKProofIcon()}</span>
        </Tooltip>
      )}

      {accessCount !== undefined && (
        <Tooltip
          title={`Accessed ${accessCount} times${lastAccessed ? ` (last: ${new Date(lastAccessed).toLocaleDateString()})` : ''}`}
          arrow
        >
          <Chip
            label={accessCount}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem', height: 20 }}
          />
        </Tooltip>
      )}
    </Box>
  );
};

// Privacy Level Selector
interface PrivacyLevelSelectorProps {
  value: string;
  onChange: (level: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

export const PrivacyLevelSelector: React.FC<PrivacyLevelSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'medium',
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {PRIVACY_LEVELS.map((level) => (
        <Chip
          key={level.value}
          icon={
            level.value === 'public' ? <Public /> :
            level.value === 'restricted' ? <LockOpen /> :
            <Lock />
          }
          label={level.label}
          clickable={!disabled}
          color={value === level.value ? level.color as any : 'default'}
          variant={value === level.value ? 'filled' : 'outlined'}
          size={size}
          onClick={() => !disabled && onChange(level.value)}
          sx={{
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        />
      ))}
    </Box>
  );
};