import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { FishingSession } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherChartsProps {
  session: FishingSession;
}

export function WeatherCharts({ session }: WeatherChartsProps) {
  const timestamps = session.locations.map(loc => 
    format(new Date(loc.timestamp), 'HH:mm')
  );

  const weatherData = session.locations.map((_, index) => 
    index === 0 ? session.initialWeather : session.weather
  );

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: '600'
        },
        bodyFont: {
          size: 13
        },
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#f3f4f6'
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#6b7280'
        }
      }
    }
  };

  const temperatureData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Temperature',
        data: weatherData.map(w => w.temperature),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const pressureData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Pressure',
        data: weatherData.map(w => w.pressure),
        borderColor: 'rgb(124, 58, 237)',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(124, 58, 237)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const windData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Wind Speed',
        data: weatherData.map(w => w.windSpeed),
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(6, 182, 212)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Temperature (°C)</h3>
        <div className="h-48">
          <Line options={commonOptions} data={temperatureData} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Pressure (hPa)</h3>
        <div className="h-48">
          <Line options={commonOptions} data={pressureData} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Wind Speed (m/s)</h3>
        <div className="h-48">
          <Line options={commonOptions} data={windData} />
        </div>
      </div>
    </div>
  );
}