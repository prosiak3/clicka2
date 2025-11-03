import { useEffect, useState } from 'react';
import { supabase } from '../utils/db';
import { WeatherData } from '../types';
import { Line } from 'react-chartjs-2';
import { Cloud, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeatherSnapshot {
  id: string;
  weather_data: WeatherData;
  timestamp: string;
  provider_name: string;
}

interface WeatherSnapshotChartProps {
  sessionId: string;
}

export function WeatherSnapshotChart({ sessionId }: WeatherSnapshotChartProps) {
  const [snapshots, setSnapshots] = useState<WeatherSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        const { data, error } = await supabase
          .from('weather_snapshots')
          .select('*')
          .eq('session_id', sessionId)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        setSnapshots(data || []);
      } catch (error) {
        console.error('Error fetching weather snapshots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No weather snapshots available for this session</p>
        <p className="text-sm text-gray-500 mt-1">Weather tracking may not have been enabled</p>
      </div>
    );
  }

  const timestamps = snapshots.map(s => {
    const date = new Date(s.timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });

  const temperatureData = snapshots.map(s => s.weather_data.temperature);
  const pressureData = snapshots.map(s => s.weather_data.pressure);
  const windSpeedData = snapshots.map(s => s.weather_data.windSpeed);

  const temperatureChart = {
    labels: timestamps,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const pressureChart = {
    labels: timestamps,
    datasets: [
      {
        label: 'Pressure (hPa)',
        data: pressureData,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const windChart = {
    labels: timestamps,
    datasets: [
      {
        label: 'Wind Speed (m/s)',
        data: windSpeedData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  const tempTrend = temperatureData.length > 1
    ? temperatureData[temperatureData.length - 1] - temperatureData[0]
    : 0;

  const pressureTrend = pressureData.length > 1
    ? pressureData[pressureData.length - 1] - pressureData[0]
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-gray-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weather Trends During Session</h3>
          </div>
          <span className="text-sm text-gray-600">{snapshots.length} snapshots</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Temperature Change</p>
            <p className={`text-lg font-bold ${tempTrend > 0 ? 'text-red-600' : tempTrend < 0 ? 'text-blue-600' : 'text-gray-700'}`}>
              {tempTrend > 0 ? '+' : ''}{tempTrend.toFixed(1)}°C
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Pressure Change</p>
            <p className={`text-lg font-bold ${pressureTrend > 0 ? 'text-green-600' : pressureTrend < 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {pressureTrend > 0 ? '+' : ''}{pressureTrend.toFixed(0)} hPa
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Data Source</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {snapshots[0]?.provider_name || 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Temperature</h4>
        <div className="h-48">
          <Line data={temperatureChart} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Atmospheric Pressure</h4>
        <div className="h-48">
          <Line data={pressureChart} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Wind Speed</h4>
        <div className="h-48">
          <Line data={windChart} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
