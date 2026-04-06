/**
 * Billing Page - Übersicht der Finanzen mit Zeitraum-Filtern und Honorarberechnung
 */

'use client';

import { useState, useMemo } from 'react';
import { DollarSign, Calendar, Users, Filter, ArrowUpRight, Clock } from 'lucide-react';
import type { Appointment, Student, PriceEntry } from '@/types';
import { calculateAllFees } from '@/lib/billing';

export default function BillingPage() {
  const [data, setData] = useState<{ students: Student[]; priceEntries: PriceEntry[]; appointments: Appointment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

  // Lade Daten bei Mount
  const loadData = () => {
    setLoading(true);
    try {
      const storedData = localStorage.getItem('mathe_manager_data');
      if (storedData) {
        setData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: 'month' | 'year' | 'custom') => {
    setSelectedPeriod(period);
    if (period === 'month') {
      const now = new Date();
      setStartDate(now.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (period === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setStartDate(yearStart);
      setEndDate(new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]);
    } else if (period === 'custom') {
      setStartDate('');
      setEndDate(new Date().toISOString().split('T')[0]);
    }
  };

  // Filter appointments based on selection
  const filteredAppointments = useMemo(() => {
    if (!data) return [];

    let filtered = data.appointments.filter(appt => 
      !appt.status.startsWith('canceled') && appt.status !== 'pending'
    );

    // Apply date range filter
    if (selectedPeriod === 'custom' || selectedPeriod === 'month') {
      const startDateObj = startDate ? new Date(startDate) : null;
      const endDateObj = new Date(endDate);

      filtered = filtered.filter(appt => {
        const apptDate = new Date(appt.date).getTime();
        if (startDateObj) {
          const start = startDateObj.setHours(0, 0, 0, 0);
          return apptDate >= start;
        }
        return apptDate <= endDateObj.getTime();
      });
    }

    // Apply student filter
    if (selectedStudentId !== 'all' && data.students) {
      filtered = filtered.filter(appt => 
        appt.studentIds.includes(selectedStudentId)
      );
    }

    return filtered;
  }, [data, selectedPeriod, startDate, endDate, selectedStudentId]);

  // Calculate fees for filtered appointments
  const { appointments: calculatedAppointments, totalFee } = useMemo(() => {
    if (!filteredAppointments.length) return { appointments: [], totalFee: 0 };
    return calculateAllFees(filteredAppointments, data?.priceEntries || []);
  }, [filteredAppointments, data]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate average fee per appointment
  const avgFee = calculatedAppointments.length > 0 
    ? (totalFee / calculatedAppointments.length).toFixed(2) 
    : '0.00';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Lade Finanzübersicht...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Abrechnung</h1>
          <p className="text-gray-600 dark:text-gray-400">Bitte erstelle einige Termine oder lade Daten aus dem LocalStorage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600 dark:text-green-500" />
          Abrechnung & Finanzen
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Gesamtsaldo" 
          value={formatCurrency(totalFee)}
          icon={<DollarSign />}
          color="green"
        />
        <SummaryCard 
          title="Termine" 
          value={calculatedAppointments.length.toString()}
          subtitle="in Zeitraum"
          icon={<Clock />}
          color="blue"
        />
        <SummaryCard 
          title="Avg. Honorar" 
          value={formatCurrency(parseFloat(avgFee))}
          subtitle={`pro Termin`}
          icon={<Users />}
          color="purple"
        />
        <SummaryCard 
          title="Preiseinträge" 
          value={data.priceEntries.length.toString()}
          subtitle="verfügbar"
          icon={<Filter />}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-5">
          {/* Period Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide w-full sm:w-auto flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Zeitraum:
            </h3>

            <div className="flex gap-2 flex-1">
              {[
                { id: 'month', label: 'Diesen Monat' },
                { id: 'year', label: 'Letztes Jahr' },
                { id: 'custom', label: 'Benutzerdefiniert' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => handlePeriodChange(option.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === option.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range & Student Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range (only show for custom) */}
            {(selectedPeriod === 'custom') && (
              <>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Startdatum: {startDate || ''}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enddatum: {endDate || ''}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Student Filter */}
            {data.students.length > 1 && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schüler filtern:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Alle Schüler</option>
                  {data.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {(student.lastName || '') ? `${student.lastName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {calculatedAppointments.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Keine Termine für den ausgewählten Zeitraum</p>
              <p className="text-sm mt-2">Wähle einen anderen Zeitraum oder füge Termine hinzu.</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Datum & Zeit
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Schüler
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Typ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Dauer
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Honorar
                      </th>
                    </tr>
                  </thead>
                  
                  {/* Table Body */}
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {calculatedAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div>{formatDate(appt.date)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(appt.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {appt.studentIds.map(id => {
                              const student = data.students.find(s => s.id === id);
                              return student ? (
                                <span key={student.id}>
                                  {student.firstName} {(student.lastName || '') && `${student.lastName}`.charAt(0)}
                                  {student.lastName && !student.firstName.includes(student.lastName) && ', '}
                                </span>
                              ) : null;
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            appt.studentIds.length === 1 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                            {appt.studentIds.length === 1 ? (
                              <>Einzel</>
                            ) : (
                              <>Gruppenkurs</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {appt.duration} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <span className={`inline-flex items-center gap-1 ${
                            appt.calculatedFee > 0 
                              ? 'text-green-600 dark:text-green-500' 
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {appt.calculatedFee > 0 && (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {formatCurrency(appt.calculatedFee)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Footer Total */}
                  <tfoot className="bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700">
                    <tr>
                      <td colspan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wide">
                        Gesamt:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-bold text-green-600 dark:text-green-500">
                        {formatCurrency(totalFee)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Status Legende</h4>
        <div className="flex justify-center gap-6 flex-wrap">
          <LegendItem 
            status="attended" 
            label="Stattgefunden" 
            color="green" 
            icon={<CheckCircle />}
          />
          <LegendItem 
            status="canceled_paid" 
            label="Ausfall bezahlt" 
            color="yellow" 
            icon={<AlertCircle />}
          />
          <LegendItem 
            status="canceled_free" 
            label="Ausfall frei" 
            color="gray" 
            icon={<XCircle />}
          />
        </div>
      </div>
    </div>
  );
}

// Legend Item Component
function LegendItem({ status, label, color, icon }) {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-400',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${colors[color as keyof typeof colors] || colors.gray}`}></span>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

function SummaryCard({ title, value, subtitle, icon, color }: SummaryCardProps) {
  const colors = {
    green: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600',
  };

  return (
    <div className={`${colors[color]} p-5 rounded-xl shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{value}</p>
    </div>
  );
}