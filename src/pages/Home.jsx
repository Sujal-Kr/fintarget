import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WEBSOCKET_URL = 'wss://stream.binance.com:9443/ws';
const COINS = ['ETHUSDT', 'BNBUSDT', 'DOTUSDT'];
const INTERVALS = ['1m', '3m', '5m'];

const Home = () => {
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [selectedInterval, setSelectedInterval] = useState(INTERVALS[0]);
  const [chartData, setChartData] = useState({});
  const wsRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedCoin, selectedInterval]);

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    wsRef.current = new WebSocket(`${WEBSOCKET_URL}/${selectedCoin.toLowerCase()}@kline_${selectedInterval}`);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.e === 'kline') {
        updateChartData(message.k);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };

  const updateChartData = (kline) => {
    const { t: time, c: close } = kline;
    
    setChartData((prevData) => {
      const newData = { ...prevData };
      if (!newData[selectedCoin]) {
        newData[selectedCoin] = [];
      }
      
      newData[selectedCoin].push({
        time: new Date(time).toLocaleTimeString(),
        price: parseFloat(close),
      });

      // Keep only the last 100 data points
      if (newData[selectedCoin].length > 100) {
        newData[selectedCoin] = newData[selectedCoin].slice(-100);
      }

      return newData;
    });
  };

  const handleCoinChange = (event) => {
    setSelectedCoin(event.target.value);
  };

  const handleIntervalChange = (interval) => {
    setSelectedInterval(interval);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${selectedCoin} Price Chart (${selectedInterval})`,
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
  };

  const data = {
    labels: chartData[selectedCoin]?.map(item => item.time) || [],
    datasets: [
      {
        label: selectedCoin,
        data: chartData[selectedCoin]?.map(item => item.price) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h1 className="text-2xl font-bold mb-4">Binance Market Data</h1>
        <div className="flex justify-between mb-4">
          <select
            value={selectedCoin}
            onChange={handleCoinChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          >
            {COINS.map((coin) => (
              <option key={coin} value={coin}>
                {coin}
              </option>
            ))}
          </select>
          <div>
            {INTERVALS.map((interval) => (
              <button
                key={interval}
                className={`mx-1 px-4 py-2 rounded ${
                  interval === selectedInterval
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleIntervalChange(interval)}
              >
                {interval}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[400px]">
          <Line options={chartOptions} data={data} ref={chartRef} />
        </div>
      </div>
    </div>
  );
};

export default Home;