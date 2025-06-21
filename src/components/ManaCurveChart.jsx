import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MAX_CMC = 7; // bucket 7+

function ManaCurveChart({ cards }) {
  const data = useMemo(() => {
    const counts = Array(MAX_CMC + 1).fill(0);
    cards.forEach((c) => {
      const qty = c.qty || c.quantity || 1;
      const cmc = Math.round(c.cmc || 0);
      if ((c.type || '').toLowerCase().includes('land')) return; // skip lands
      const bucket = Math.min(cmc, MAX_CMC);
      counts[bucket] += qty;
    });

    return {
      labels: [...Array(MAX_CMC).keys()].map((i) => i.toString()).concat(`${MAX_CMC}+`),
      datasets: [
        {
          label: 'Numero carte',
          data: counts,
          backgroundColor: '#42a5f5',
        },
      ],
    };
  }, [cards]);

  const options = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false,
    height: 200,
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', height: '220px', margin: '1rem 0' }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default ManaCurveChart;
