import { useMemo } from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface FocusPoint {
  timestamp: Date;
  level: number;
}

interface FocusChartProps {
  data: FocusPoint[];
  title?: string;
  height?: number;
}

const FocusChart = ({ data, title = 'Focus Level Over Time', height = 300 }: FocusChartProps) => {
  const theme = useTheme();
  
  const chartData = useMemo(() => {
    return data.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: point.level,
      timestamp: new Date(point.timestamp).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const averageFocus = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, point) => acc + point.level, 0);
    return Math.round(sum / data.length);
  }, [data]);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Average Focus Level: {averageFocus}%
      </Typography>
      
      {chartData.length > 0 ? (
        <Box sx={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: theme.palette.text.secondary }} 
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: theme.palette.text.secondary }} 
                label={{ 
                  value: 'Focus Level (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: theme.palette.text.secondary }
                }} 
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Focus Level']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="level" 
                name="Focus Level" 
                stroke={theme.palette.primary.main} 
                activeDot={{ r: 8 }} 
                isAnimationActive={true}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box 
          sx={{ 
            height, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No focus data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default FocusChart;