/**
 * Billing / Abrechnung page with price history management
 */
'use client';

import { useState, useEffect } from 'react';
import { DollarSign, PlusCircle, CalendarRange, Trash2, Clock, TrendingUp, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DataContainer, PriceEntry, Student, Appointment } from '@/types';

export default function BillingPage() {
  const router = useRouter();
  
  // Data state
  const [data, setData] = useState<DataContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Price entry form state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newPriceAmount, setNewPriceAmount] = useState(25.0);
  const [newPriceType, setNewPriceType] = useState<'individual' | 'group'>('individual');
  
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (data?.priceEntries) {
      updatePrices(data.priceEntries);
    }
  }, [data?.priceEntries]);

  const loadData = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem('mathe_manager_data');
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrices = (priceEntries: PriceEntry[]) => {
    // Sort by validFrom descending
    const sorted = [...priceEntries].sort((a, b) => 
      new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime()
    );
    
    setNewPriceAmount(25.0);
    setNewPriceType('individual');

    // Set form to last active price for current editing student if exists
    const active = sorted.find(p => p.studentId === editingStudentId && !p.validTo);
    if (active) {
      setNewPriceAmount(active.amount);
      setNewPriceType(active.type);
    }
  };

  // Calculate total from price entries for current student(s) in range
  const calculateTotal = () => {
    if (!data?.priceEntries || !editingStudentId) return 0;
    
    const now = new Date();
    const sorted = [...data.priceEntries]
      .filter(p => p.studentId === editingStudentId && !p.validTo) // Only active prices (not expired)
      .sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());
    
    if (sorted.length === 0) return 0;

    const latest = sorted[0];
    let totalIndividual = latest.amount;
    let totalGroup = 0;
    let groupCount = 0;

    // Also sum up historical group prices that were in effect
    for (const p of data.priceEntries.filter(p => p.studentId === editingStudentId)) {
      const from = new Date(p.validFrom).getTime();
      const to = p.validTo ? new Date(p.validTo).getTime() : now.getTime();
      
      if (from <= now.getTime() && to >= now.getTime()) {
        if (p.type === 'group') {
          totalGroup += p.amount;
          groupCount++;
        }
      }
    }

    return { individual: totalIndividual, group: totalGroup, groupCount };
  };

  const handleAddPrice = () => {
    if (!editingStudentId || !data) return;

    try {
      setData(prev => {
        if (!prev) return null;

        // Check for existing active price with same type
        let targetValidTo: string | null = null;
        
        const sortedEntries = [...prev.priceEntries]
          .filter(p => p.studentId === editingStudentId)
          .sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime());

        // Find active price of same type to set its validTo
        const now = new Date().toISOString();
        const activeSameType = sortedEntries.find(p => 
          !p.validTo && p.type === newPriceType
        );

        if (activeSameType) {
          targetValidTo = activeSameType.id;
        }

        // Create new price entry
        const newEntry: PriceEntry = {
          id: `price-${Date.now()}`,
          studentId: editingStudentId,
          type: newPriceType,
          amount: Number(newPriceAmount),
          validFrom: now,
          validTo: targetValidTo
        };

        // Remove the old price if we're setting its validTo (prevent duplicate active prices)
        const remainingEntries = prev.priceEntries.filter(p => p.id !== targetValidTo);

        return {
          ...prev,
          priceEntries: [...remainingEntries, newEntry]
        };
      });

      // Also update localStorage
      try {
        const currentData = JSON.parse(localStorage.getItem('mathe_manager_data') || '{}');
        
        // Find and remove old entry if it exists
        let remaining = currentData.priceEntries.filter(p => p.id !== targetValidTo);
        
        // Add new entry
        remaining = [...remaining, {
          id: `price-${Date.now()}`,
          studentId: editingStudentId,
          type: newPriceType,
          amount: Number(newPriceAmount),
          validFrom: now,
          validTo: targetValidTo
        }];

        localStorage.setItem('mathe_manager_data', JSON.stringify({
          ...currentData,
          priceEntries: remaining,
          lastUpdated: new Date().toISOString()
        }));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }

      // Reset form and switch back to view mode
      setEditingStudentId(null);
      setNewPriceAmount(25.0);
      setNewPriceType('individual');
      
      loadData();
      
      if (data) {
        updatePrices(data.priceEntries);
      }

    } catch (e) {
      console.error('Error adding price:', e);
      alert('Fehler beim Hinzufügen der Preiskondition.');
    }
  };

  const handleDeletePrice = async (priceId: string, studentName: string) => {
    if (!confirm(`Möchten Sie die Preiskondition für "${studentName}" wirklich löschen?`)) return;

    try {
      setData(prev => {
        if (!prev) return null;
        
        // Remove price entry but keep appointments
        const remaining = prev.priceEntries.filter(p => p.id !== priceId);
        
        return { ...prev, priceEntries: remaining };
      });

      try {
        const currentData = JSON.parse(localStorage.getItem('mathe_manager_data') || '{}');
        
        // Remove price but keep appointments for this student
        const remaining = currentData.priceEntries.filter(p => p.id !== priceId);
        
        localStorage.setItem('mathe_manager_data', JSON.stringify({
          ...currentData,
          priceEntries: remaining,
          lastUpdated: new Date().toISOString()
        }));
      } catch (e) {
        console.error('Error saving after deletion:', e);
      }

      loadData();
      
      if (data) {
        updatePrices(data.priceEntries);
      }
    } catch (e) {
      console.error('Error deleting price:', e);
      alert('Fehler beim Löschen der Preiskondition.');
    }
  };

  const handleCancel = () => {
    setEditingStudentId(null);
    setNewPriceAmount(25.0);
    setNewPriceType('individual');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Lade Daten...</div>;
  }

  // Header
  const header = (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Abrechnung</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Preishistorie und Terminübersicht pro Schüler</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            <span className="font-semibold text-gray-900 dark:text-white">Aktueller Preis</span>
          </div>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
            {data?.priceEntries && data.priceEntries.length > 0 ? (
              `${calculateTotal()?.individual || 25.0} €`
            ) : '—'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            <span className="font-semibold text-gray-900 dark:text-white">Historie</span>
          </div>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">
            {data?.priceEntries ? data.priceEntries.length : 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-3 mb-2">
            <CalendarRange className="text-purple-600 dark:text-purple-400" size={24} />
            <span className="font-semibold text-gray-900 dark:text-white">Zeiträume</span>
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {data?.priceEntries ? (new Set(data.priceEntries.map(p => p.validTo || 'now')).size) : 0}
          </p>
        </div>
      </div>

      {/* Add/Edit Price Form */}
      {editingStudentId && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {data?.students?.find(s => s.id === editingStudentId) ? (
                <>
                  <DollarSign size={20} className="text-green-600" />
                  Preiskonditionen für:
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {data.students.find(s => s.id === editingStudentId)?.firstName || '—'}
                  </span>
                </>
              ) : (
                <>
                  <DollarSign size={20} className="text-green-600" />
                  Neue Preiskondition hinzufügen
                </>
              )}
            </h3>
            
            {!editingStudentId && (
              <button
                onClick={() => {
                  setEditingStudentId(data?.students?.[0]?.id || null);
                  if (data?.students?.[0]) {
                    updatePrices([
                      ...data.priceEntries.filter(p => p.studentId === data.students[0].id),
                      {
                        id: 'temp-placeholder',
                        studentId: data.students[0].id,
                        type: 'individual',
                        amount: 25.0,
                        validFrom: new Date().toISOString(),
                        validTo: null
                      }
                    ]);
                  }
                }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusCircle size={18} />
                Erster Schüler
              </button>
            )}

            {editingStudentId && (
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          {/* Calculate section - only show when in view mode (not editing) */}
          {!editingStudentId && data?.priceEntries.length > 0 && (
            <div className="bg-gray-50 dark:bg-slate-900/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Info size={14} />
                <span>
                  Aktueller Preis: {calculateTotal()?.individual || 25.0} € / 
                  {(calculateTotal()?.groupCount || 0) > 0 ? `${calculateTotal()?.groupCount}x Gruppenkurs` : ''}
                </span>
              </div>
              
              {/* Show group total if applicable */}
              {calculateTotal()?.groupCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Historisch wurden {calculateTotal()?.groupCount} Gruppenkurse abgerechnet.
                </p>
              )}

              {/* Info about price history */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <CalendarRange size={12} />
                  Preise sind über Zeiträume versioniert. Ältere Preise haben ein validTo Datum.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          {editingStudentId && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Betrag (€) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPriceAmount}
                    onChange={(e) => setNewPriceAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preis-Typ *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewPriceType('individual')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        newPriceType === 'individual'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      Einzelunterricht
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPriceType('group')}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        newPriceType === 'group'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      Gruppenkurs (max. 2)
                    </button>
                  </div>
                </div>
              </div>

              {/* Info text for group pricing */}
              {newPriceType === 'group' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Info size={16} />
                  Gruppenpreis ist pro Kurs (nicht pro Schüler). Bei 2 Schülern teilt sich der Preis.
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                {editingStudentId && (
                  <button
                    onClick={handleAddPrice}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    Preiskondition hinzufügen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price History List */}
      {!editingStudentId && data?.priceEntries.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-900/30 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Schüler</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Preis (€)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Von</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Bis</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {data.priceEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {data?.students?.find(s => s.id === entry.studentId)?.firstName || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.type === 'individual' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {entry.type === 'individual' ? 'Einzel' : 'Gruppe'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {entry.amount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.validFrom).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {entry.validTo ? (
                        <>
                          <span className="text-gray-500 dark:text-gray-400">bis </span>
                          <span className="font-medium text-gray-900 dark:text-white ml-1">
                            {new Date(entry.validTo).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Aktuell
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {data?.students?.find(s => s.id === entry.studentId) && (
                        <button
                          onClick={() => handleDeletePrice(entry.id, data.students.find(s => s.id === entry.studentId)?.firstName || '')}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {data.priceEntries.length === 0 && (
            <div className="p-12 text-center">
              <Clock size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Noch keine Preiskonditionen</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Klicken Sie auf "Erster Schüler" oben, um mit dem Hinzufügen von Preisen zu beginnen.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* No Data State */}
      {!data && !isLoading && (
        <div className="text-center py-16">
          <Info size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Noch keine Daten geladen</p>
        </div>
      )}
    </>
  );

  return (
    <Layout.Header>
      {header}
    </Layout.Header>
  );
}