import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLOR_MAP = {
  W: { label: 'White', color: '#f2eedc' },
  U: { label: 'Blue', color: '#4a90e2' },
  B: { label: 'Black', color: '#4d4d4d' },
  R: { label: 'Red', color: '#d64a2c' },
  G: { label: 'Green', color: '#3c9d46' },
  C: { label: 'Colorless', color: '#bdbdbd' },
};

function ColorPieChart({ cards }) {
  const data = useMemo(() => {
    const counts = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    cards.forEach((c) => {
      const qty = c.qty || c.quantity || 1;
      if ((c.type || '').toLowerCase().includes('land')) return; // ignore lands
      const colors = c.colors && c.colors.length ? c.colors : ['C'];
      colors.forEach((col) => {
        if (counts[col] !== undefined) counts[col] += qty;
      });
    });

    const labels = [];
    const values = [];
    const bg = [];
    Object.entries(counts).forEach(([key, val]) => {
      if (val > 0) {
        labels.push(COLOR_MAP[key].label);
        values.push(val);
        bg.push(COLOR_MAP[key].color);
      }
    });

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: bg,
          borderColor: '#333',
        },
      ],
    };
  }, [cards]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '1rem 0' }}>
      <Pie data={data} />
    </div>
  );
}

export default ColorPieChart;
