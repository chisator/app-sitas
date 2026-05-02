import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type ChartDataPoint = {
  date: string;
  value: number;
};

export type ExerciseStat = {
  exerciseName: string;
  strengthData: ChartDataPoint[]; // 1RM Trend
  volumeData: ChartDataPoint[];   // Volume Trend
  growthPercentage: number;       // Insight metric
};

export function useProgressStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Record<string, ExerciseStat>>({});
  const [loading, setLoading] = useState(true);
  const [frequentExercises, setFrequentExercises] = useState<string[]>([]);
  const [allExercises, setAllExercises] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all workout logs with their nested entries
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          date,
          workout_log_entries (
            exercise_name,
            sets_data
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: true }); // chronological order

      if (error) throw error;

      // Group by Exercise Name
      const aggregated: Record<string, { [date: string]: { volume: number, best1RM: number } }> = {};
      const frequencyMap: Record<string, number> = {};

      data.forEach(log => {
        const logDate = log.date;

        log.workout_log_entries?.forEach((entry: any) => {
          const exName = entry.exercise_name?.trim();
          if (!exName) return;

          // frequency counts how many times they did this exercise
          frequencyMap[exName] = (frequencyMap[exName] || 0) + 1;

          if (!aggregated[exName]) {
            aggregated[exName] = {};
          }
          if (!aggregated[exName][logDate]) {
            aggregated[exName][logDate] = { volume: 0, best1RM: 0 };
          }

          let dayVolume = aggregated[exName][logDate].volume;
          let dayBest1RM = aggregated[exName][logDate].best1RM;

          // Parse sets data if string
          let setsArray = entry.sets_data;
          if (typeof setsArray === 'string') {
            try { setsArray = JSON.parse(setsArray); } catch(e) { setsArray = []; }
          }
          if (!Array.isArray(setsArray)) setsArray = [];

          setsArray.forEach((set: any) => {
             const w = parseFloat(set.weight || '0');
             const r = parseInt(set.reps || '0');
             if (w > 0 && r > 0) {
                // 1. Accumulate Volume
                dayVolume += (w * r);

                // 2. Calculate Brzycki 1RM
                // 1RM = Weight * (36 / (37 - Reps))
                const brzycki = w * (36 / (37 - Math.min(r, 36))); // cap to avoid zero division or negatives
                if (brzycki > dayBest1RM) {
                  dayBest1RM = brzycki;
                }
             }
          });

          // Aggregate if Multiple identical exercises in the same day (rare but possible)
          aggregated[exName][logDate].volume = dayVolume;
          aggregated[exName][logDate].best1RM = dayBest1RM;
        });
      });

      // Format final output
      const finalStats: Record<string, ExerciseStat> = {};
      
      for (const exName in aggregated) {
         const dates = Object.keys(aggregated[exName]).sort(); // ensure sorted
         const strengthData: ChartDataPoint[] = [];
         const volumeData: ChartDataPoint[] = [];
         
         dates.forEach(d => {
            const row = aggregated[exName][d];
            if (row.best1RM > 0) strengthData.push({ date: d, value: parseFloat(row.best1RM.toFixed(1)) });
            if (row.volume > 0) volumeData.push({ date: d, value: parseFloat(row.volume.toFixed(1)) });
         });

         // Calculate Insights: Growth Percentage (Comparing last point to moving average or first point)
         let growthPercentage = 0;
         if (strengthData.length > 1) {
            const first = strengthData[0].value;
            const last = strengthData[strengthData.length - 1].value;
            growthPercentage = first > 0 ? ((last - first) / first) * 100 : 0;
         }

         finalStats[exName] = {
           exerciseName: exName,
           strengthData,
           volumeData,
           growthPercentage
         };
      }

      setStats(finalStats);

      // Process metadata
      const allEx = Object.keys(finalStats).sort();
      setAllExercises(allEx);

      // Sort by frequency to suggest Quick Pills
      const sortedByFreq = Object.entries(frequencyMap).sort((a, b) => b[1] - a[1]).map(e => e[0]);
      setFrequentExercises(sortedByFreq.slice(0, 4));

    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    frequentExercises,
    allExercises,
    refresh: fetchData
  };
}
