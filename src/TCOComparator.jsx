import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import './TCOComparator.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SEGMENT_COSTS = {
  GENERALISTA: { bollo: 250, assicurazione: 700, manutenzione: 500, pneumatici: 300 },
  PREMIUM: { bollo: 450, assicurazione: 1100, manutenzione: 800, pneumatici: 500 },
  LUXURY: { bollo: 1200, assicurazione: 2500, manutenzione: 2000, pneumatici: 1200 }
};

const formatEUR = (val) => new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR'
}).format(val);

export default function TCOComparator() {
  const [form, setForm] = useState({
    duration: 36,
    km: 60000,
    purchasePrice: 30000,
    residualValue: 15000,
    rentalFee: 400,
    fuel: 5000,
    segment: 'GENERALISTA',
    tax: 0,
    insurance: 0,
    maintenance: 0,
    tires: 0,
    isBusiness: false
  });

  useEffect(() => {
    const { bollo, assicurazione, manutenzione, pneumatici } = SEGMENT_COSTS[form.segment];
    const years = form.duration / 12;
    setForm((prev) => ({
      ...prev,
      tax: bollo * years,
      insurance: assicurazione * years,
      maintenance: manutenzione * years,
      tires: pneumatici * (form.km / 30000)
    }));
  }, [form.segment, form.duration, form.km]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : name === 'segment' ? value : parseFloat(value)
    });
  };

  const calcPurchaseTCO = () => {
    const depre = form.purchasePrice - form.residualValue;
    const total = depre + form.insurance + form.tax + form.maintenance + form.fuel + form.tires;
    if (!form.isBusiness) return total;
    const iva = total * 0.4;
    const deduct = (total - iva) * 0.2;
    const fringe = 1500 * (form.duration / 12);
    return total - iva - deduct + fringe;
  };

  const calcRentalTCO = () => {
    const rental = form.rentalFee * form.duration;
    const total = rental + form.fuel;
    if (!form.isBusiness) return total;
    const iva = rental * 0.4;
    const deduct = (rental - iva) * 0.7;
    const fringe = 1500 * (form.duration / 12);
    return total - iva - deduct + fringe;
  };

  const tcoPurchase = calcPurchaseTCO();
  const tcoRental = calcRentalTCO();
  const diff = tcoRental - tcoPurchase;
  const costPerKmPurchase = tcoPurchase / form.km;
  const costPerKmRental = tcoRental / form.km;

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('TCO Comparator Results', 10, 10);
    doc.text(`TCO Acquisto: ${formatEUR(tcoPurchase)}`, 10, 20);
    doc.text(`TCO Noleggio: ${formatEUR(tcoRental)}`, 10, 30);
    doc.text(`Differenza: ${formatEUR(diff)}`, 10, 40);
    doc.text(`€/km Acquisto: ${costPerKmPurchase.toFixed(3)}`, 10, 50);
    doc.text(`€/km Noleggio: ${costPerKmRental.toFixed(3)}`, 10, 60);
    doc.save('TCO_Comparison.pdf');
  };

  const data = {
    labels: ['Acquisto', 'Noleggio'],
    datasets: [
      {
        label: 'TCO (€)',
        data: [tcoPurchase, tcoRental],
        backgroundColor: ['#3b82f6', '#10b981']
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Confronto TCO' }
    },
    scales: {
      x: { type: 'category', title: { display: true, text: 'Tipo' } },
      y: { beginAtZero: true, title: { display: true, text: 'Costo (€)' } }
    }
  };

  return (
    <div className="container">
      <h1>TCO Comparator</h1>
      <form>
        <label>Durata (mesi):
          <select name="duration" value={form.duration} onChange={handleChange}>
            <option value={24}>24</option>
            <option value={36}>36</option>
            <option value={48}>48</option>
            <option value={60}>60</option>
          </select>
        </label>
        <label>Km totali: <input type="number" name="km" value={form.km} onChange={handleChange} /></label>
        <label>Segmento:
          <select name="segment" value={form.segment} onChange={handleChange}>
            <option value="GENERALISTA">Generalista</option>
            <option value="PREMIUM">Premium</option>
            <option value="LUXURY">Luxury</option>
          </select>
        </label>
        <label>Prezzo acquisto (€): <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} /></label>
        <label>Valore residuo (€): <input type="number" name="residualValue" value={form.residualValue} onChange={handleChange} /></label>
        <label>Canone noleggio (€): <input type="number" name="rentalFee" value={form.rentalFee} onChange={handleChange} /></label>
        <label>Carburante / energia (€): <input type="number" name="fuel" value={form.fuel} onChange={handleChange} /></label>
        <label><input type="checkbox" name="isBusiness" checked={form.isBusiness} onChange={handleChange} /> Cliente Business</label>
      </form>
      <div className="results">
        <p><strong>TCO Acquisto:</strong> {formatEUR(tcoPurchase)}</p>
        <p><strong>TCO Noleggio:</strong> {formatEUR(tcoRental)}</p>
        <p><strong>Differenza:</strong> {formatEUR(diff)}</p>
        <p><strong>€/km Acquisto:</strong> {costPerKmPurchase.toFixed(3)}</p>
        <p><strong>€/km Noleggio:</strong> {costPerKmRental.toFixed(3)}</p>
        <button onClick={downloadPDF}>Scarica PDF</button>
      </div>
      <div className="results">
        <h3>Costi stimati annui per segmento: {form.segment}</h3>
        <ul>
          <li>Bollo: {formatEUR(form.tax / (form.duration / 12))}</li>
          <li>Assicurazione: {formatEUR(form.insurance / (form.duration / 12))}</li>
          <li>Manutenzione: {formatEUR(form.maintenance / (form.duration / 12))}</li>
          <li>Pneumatici: {formatEUR(form.tires / (form.duration / 12))}</li>
        </ul>
      </div>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
