import { useMemo } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp, Calendar, Activity, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const EMOTION_CONFIG = {
  happy: { color: 'hsl(50, 95%, 55%)', value: 5, label: 'Happy' },
  surprise: { color: 'hsl(35, 95%, 55%)', value: 4, label: 'Surprise' },
  neutral: { color: 'hsl(200, 15%, 55%)', value: 3, label: 'Neutral' },
  fear: { color: 'hsl(280, 60%, 55%)', value: 2, label: 'Fear' },
  sad: { color: 'hsl(220, 70%, 55%)', value: 1, label: 'Sad' },
  angry: { color: 'hsl(0, 75%, 55%)', value: 0, label: 'Angry' },
  disgust: { color: 'hsl(80, 50%, 45%)', value: 1, label: 'Disgust' },
};

const EMOTION_EMOJIS = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨',
  surprise: '😲', neutral: '😐', disgust: '🤢',
};

const EMOTION_LABELS = ['😠', '😢', '😨', '😐', '😲', '😊'];

const EmotionDashboard = ({ conversations, messages = [] }) => {
  // Filter to messages with emotions, sorted by time
  const allMessages = useMemo(() =>
    messages
      .filter(msg => msg.emotion)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [messages]
  );

  // Per-message timeline data for smooth curve chart
  const timelineData = useMemo(() => {
    return allMessages.map((msg, index) => ({
      index: index + 1,
      label: `Msg ${index + 1}`,
      time: format(new Date(msg.timestamp), 'h:mm a'),
      emotion: msg.emotion,
      emoji: EMOTION_EMOJIS[msg.emotion] || '❓',
      score: EMOTION_CONFIG[msg.emotion]?.value ?? 3,
      role: msg.role || 'user',
    }));
  }, [allMessages]);

  // Pie chart data
  const emotionDistribution = useMemo(() => {
    const counts = { happy: 0, sad: 0, angry: 0, fear: 0, surprise: 0, neutral: 0, disgust: 0 };
    allMessages.forEach(msg => { if (msg.emotion) counts[msg.emotion]++; });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([emotion, count]) => ({
        name: EMOTION_CONFIG[emotion].label,
        value: count,
        color: EMOTION_CONFIG[emotion].color,
        emoji: EMOTION_EMOJIS[emotion],
      }));
  }, [allMessages]);

  // Stats
  const stats = useMemo(() => {
    if (allMessages.length === 0) return { total: 0, dominant: 'neutral', avgScore: 0, trend: 'stable' };
    const counts = { happy: 0, sad: 0, angry: 0, fear: 0, surprise: 0, neutral: 0, disgust: 0 };
    let totalScore = 0;
    allMessages.forEach(msg => {
      if (msg.emotion) {
        counts[msg.emotion]++;
        totalScore += EMOTION_CONFIG[msg.emotion].value;
      }
    });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const avgScore = totalScore / allMessages.length;
    const midpoint = Math.floor(allMessages.length / 2);
    const recentAvg = allMessages.slice(midpoint).reduce((sum, m) => sum + (EMOTION_CONFIG[m.emotion]?.value || 0), 0) / (allMessages.slice(midpoint).length || 1);
    const olderAvg = allMessages.slice(0, midpoint).reduce((sum, m) => sum + (EMOTION_CONFIG[m.emotion]?.value || 0), 0) / (allMessages.slice(0, midpoint).length || 1);
    const trend = recentAvg > olderAvg + 0.5 ? 'improving' : recentAvg < olderAvg - 0.5 ? 'declining' : 'stable';
    return { total: allMessages.length, dominant, avgScore, trend };
  }, [allMessages]);

  // Custom tooltip for the line chart
  const MoodTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 rounded-lg border border-border shadow-lg">
          <p className="font-medium text-foreground flex items-center gap-2">
            <span className="text-lg">{data.emoji}</span>
            <span className="capitalize">{data.emotion}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{data.time}</p>
          <p className="text-xs text-muted-foreground">Score: {data.score}/5</p>
        </div>
      );
    }
    return null;
  };

  // Custom dot renderer for the line chart
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={14}>
          {payload.emoji}
        </text>
      </g>
    );
  };

  if (allMessages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Activity className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">No Data Yet</h3>
        <p className="text-muted-foreground max-w-md">Start chatting to track your emotional patterns. Your mood timeline will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-border">
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Activity className="h-4 w-4" />Total Messages</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{stats.total}</p></CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Heart className="h-4 w-4" />Dominant Mood</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground flex items-center gap-2"><span>{EMOTION_EMOJIS[stats.dominant]}</span><span className="capitalize">{stats.dominant}</span></p></CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Mood Score</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground">{stats.avgScore.toFixed(1)}/5</p></CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Calendar className="h-4 w-4" />Trend</CardDescription></CardHeader>
          <CardContent><p className={`text-2xl font-bold capitalize ${stats.trend === 'improving' ? 'text-green-500' : stats.trend === 'declining' ? 'text-red-500' : 'text-muted-foreground'}`}>{stats.trend === 'improving' ? '↑ ' : stats.trend === 'declining' ? '↓ ' : '→ '}{stats.trend}</p></CardContent>
        </Card>
      </div>

      {/* Mood Timeline - Per Message Smooth Curve */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Mood Timeline</CardTitle>
          <CardDescription>Your emotional flow during this conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 25, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={14}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => EMOTION_LABELS[value] || ''}
                  width={30}
                />
                <Tooltip content={<MoodTooltip />} />
                <Area
                  type="natural"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#moodGradient)"
                  dot={<CustomDot />}
                  activeDot={{ r: 8, strokeWidth: 2, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--background))' }}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Emotion Distribution Pie Chart */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Emotion Distribution</CardTitle>
          <CardDescription>Breakdown of detected emotions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            {emotionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ emoji, percent }) => `${emoji} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {emotionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend formatter={(value) => <span className="text-foreground">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">No emotion data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Emotions */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Recent Emotions</CardTitle>
          <CardDescription>Your last 10 emotional readings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allMessages.slice(-10).reverse().map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50"
                title={format(new Date(msg.timestamp), 'MMM d, h:mm a')}
              >
                <span className="text-xl">{msg.emotion ? EMOTION_EMOJIS[msg.emotion] : '❓'}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(msg.timestamp), 'h:mm a')}</span>
              </div>
            ))}
            {allMessages.length === 0 && <p className="text-muted-foreground text-sm">No emotions recorded yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionDashboard;
