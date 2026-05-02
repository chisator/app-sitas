import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type WorkoutEntry = {
  id: string;
  exercise_name: string;
  sets_data: any; // Can be an array of { reps, weight }
};

export type WorkoutLog = {
  id: string;
  date: string;
  created_at: string;
  notes: string;
  routineTitle: string;
  duration: string; // extracted from notes
  entries: WorkoutEntry[];
  totalSets: number;
};

export function useWorkoutHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainedDates, setTrainedDates] = useState<Set<string>>(new Set());

  // Function to extract time duration from notes string
  const extractDuration = (notes?: string) => {
    if (!notes) return '';
    const match = notes.match(/Tiempo total:\s([\d:]+)/);
    return match ? match[1] : '';
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          id, date, created_at, notes,
          routines ( title ),
          workout_log_entries ( id, exercise_name, sets_data )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedLogs: WorkoutLog[] = [];
      const datesSet = new Set<string>();

      data?.forEach((logRow: any) => {
        datesSet.add(logRow.date);
        
        let totalSets = 0;
        const mappedEntries = logRow.workout_log_entries?.map((entry: any) => {
          let setsData = [];
          if (typeof entry.sets_data === 'string') {
             try { setsData = JSON.parse(entry.sets_data); } catch(e) {}
          } else if (Array.isArray(entry.sets_data)) {
             setsData = entry.sets_data;
          }
          
          totalSets += setsData.length;

          return {
            id: entry.id,
            exercise_name: entry.exercise_name,
            sets_data: setsData
          };
        }) || [];

        parsedLogs.push({
          id: logRow.id,
          date: logRow.date,
          created_at: logRow.created_at,
          notes: logRow.notes || '',
          routineTitle: logRow.routines?.title || 'Entrenamiento Libre',
          duration: extractDuration(logRow.notes),
          entries: mappedEntries,
          totalSets
        });
      });

      setLogs(parsedLogs);
      setTrainedDates(datesSet);

    } catch (e) {
      console.error('Error fetching workout history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  return {
    logs,
    loading,
    trainedDates,
    refresh: fetchHistory
  };
}
