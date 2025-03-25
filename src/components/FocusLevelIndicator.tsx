import { Box, Typography, LinearProgress } from '@mui/material';

interface FocusLevelIndicatorProps {
  focusLevel: number;
}

const FocusLevelIndicator = ({ focusLevel }: FocusLevelIndicatorProps) => {
  // Get focus level in percentage (0-100)
  const focusPercentage = Math.round(focusLevel * 100);
  
  // Determine the focus state for display
  const getFocusState = () => {
    if (focusPercentage < 30) return 'Low Focus';
    if (focusPercentage < 70) return 'Moderate Focus';
    return 'High Focus';
  };
  
  // Determine color based on focus level
  const getColor = () => {
    if (focusPercentage < 30) return 'error';
    if (focusPercentage < 70) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">Focus Level:</Typography>
        <Typography variant="body2" fontWeight="bold">
          {getFocusState()} ({focusPercentage}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={focusPercentage}
        color={getColor() as 'error' | 'warning' | 'success'}
        sx={{ height: 10, borderRadius: 5 }}
      />
    </Box>
  );
};

export default FocusLevelIndicator;