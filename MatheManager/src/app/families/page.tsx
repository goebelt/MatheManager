/**
 * Families management page - list, search, add/edit families and students
 */
'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Search, Edit2, Trash2, X, ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Family, Student, DataContainer } from '@/types';

// Types for pagination state
type PaginationState = {
  familyPage: number;
  studentPage: number;
};

export default function FamiliesPage() {
  const router = useRouter();
  
  // Data state
  const [data, setData] = useState<DataContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [editingStudentIds, setEditingStudentIds] = useState<Set<string>>(new Set());
  
  // Forms state
  const [familyName, setFamilyName] = useState('');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [duration, setDuration] = useState(60);
  const [rhythm, setRhythm] = useState<'weekly' | 'biweekly'>('weekly');
  
  // Pagination state (separate for families and students)
  const [pagination, setPagination] = useState<PaginationState>({ familyPage: 1, studentPage: 1 });
  
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (data?.students) {
      updateStudents(data.students, pagination.studentPage);
    }
  }, [data?.students, pagination.studentPage]);

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

  const updateStudents = (students: Student[], page: number) => {
    // Filter by search term
    const filtered = students.filter(s => 
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.lastName && s.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Paginate
    const pageSize = 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    
    setEditingStudentIds(new Set(filtered.slice(start, end).map(s => s.id)));
  };

  const handleAddFamily = () => {
    if (!familyName.trim()) return;
    
    try {
      setData(prev => {
        if (!prev) return null;
        
        // Check if family exists
        const existing = prev.families.find(f => f.name.toLowerCase() === familyName.trim().toLowerCase());
        if (existing) {
          alert('Eine Familie mit diesem Namen existiert bereits.');
          return prev;
        }

        // Create new family and student with same name
        const newFamilyId = existing ? existing.id : `family-${Date.now()}`;
        
        const newFamily: Family = {
          id: newFamilyId,
          name: familyName.trim(),
          address: '',
          email: '',
          phone: ''
        };

        // Check if student with same name already exists
        const existingStudent = prev.students.find(s => s.firstName.toLowerCase() === familyName.trim().toLowerCase());
        
        const newStudentId = existingStudent ? existingStudent.id : `student-${Date.now()}`;
        
        const newStudent: Student = {
          id: newStudentId,
          familyId: newFamilyId,
          firstName: familyName.trim(),
          notes: '',
          defaultDuration: duration,
          rhythm
        };

        return {
          ...prev,
          families: [...prev.families, newFamily],
          students: existingStudent ? prev.students : [newStudent]
        };
      });
      
      // Reset form and switch to edit mode
      setEditingFamilyId(existing ? existing.id : `family-${Date.now()}`);
      setEditingStudentIds(new Set([existingStudent ? existingStudent.id : `student-${Date.now()}`]));
      setFamilyName('');
      alert(`Familie "${familyName}" wurde erstellt! Jetzt können Sie Details bearbeiten.`);
    } catch (e) {
      console.error('Error adding family:', e);
      alert('Fehler beim Hinzufügen der Familie.');
    }
  };

  const handleDeleteFamily = async (familyId: string, name: string) => {
    if (!confirm(`Möchten Sie die Familie "${name}" wirklich löschen?`)) return;

    try {
      // First remove from localStorage
      const currentData = JSON.parse(localStorage.getItem('mathe_manager_data') || '{}');
      
      // Find and filter out the family and all its students
      const remainingStudents = currentData.students.filter(s => s.familyId !== familyId);
      
      // Remove family, keep only its students' records (they'll be orphaned but that's OK for now)
      setData(prev => ({
        ...prev,
        families: prev.families.filter(f => f.id !== familyId),
        students: remainingStudents
      }));

      localStorage.setItem('mathe_manager_data', JSON.stringify({
        ...currentData,
        families: currentData.families.filter(f => f.id !== familyId),
        students: remainingStudents
      }));

      // Reload to be safe
      loadData();
      
      if (editingFamilyId === familyId) {
        setEditingFamilyId(null);
        setEditingStudentIds(new Set());
      }
    } catch (e) {
      console.error('Error deleting family:', e);
      alert('Fehler beim Löschen der Familie.');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Möchten Sie den Schüler "${studentName}" wirklich löschen?`)) return;

    try {
      setData(prev => {
        if (!prev) return null;
        
        // Remove student but keep appointments and prices (they'll be orphaned - handled by data integrity rules)
        const remainingStudents = prev.students.filter(s => s.id !== studentId);
        
        return {
          ...prev,
          students: remainingStudents
        };
      });

      try {
        const currentData = JSON.parse(localStorage.getItem('mathe_manager_data') || '{}');
        localStorage.setItem('mathe_manager_data', JSON.stringify({
          ...currentData,
          students: currentData.students.filter(s => s.id !== studentId)
        }));
      } catch (e) {
        console.error('Error saving data after deletion:', e);
      }

      loadData();
      
      // Update pagination if needed
      updateStudents(data?.students || [], pagination.studentPage);
    } catch (e) {
      console.error('Error deleting student:', e);
      alert('Fehler beim Löschen des Schülers.');
    }
  };

  const handleEditFamily = async (familyId: string, name: string) => {
    try {
      // Update in localStorage first
      const currentData = JSON.parse(localStorage.getItem('mathe_manager_data') || '{}');
      
      // Find and update the family (and student with same name)
      const updatedFamilies = currentData.families.map(f => 
        f.id === familyId ? { ...f, name: name.trim() } : f
      );
      
      const updatedStudents = currentData.students.map(s => 
        s.firstName.toLowerCase() === name.toLowerCase() && s.familyId === familyId
          ? { ...s, firstName: name.trim() }
          : s
      );

      setData(prev => ({
        ...prev,
        families: updatedFamilies,
        students: updatedStudents
      }));

      localStorage.setItem('mathe_manager_data', JSON.stringify({
        ...currentData,
        families: updatedFamilies,
        students: updatedStudents
      }));

      loadData();
      
      if (editingFamilyId === familyId) {
        setEditingFamilyId(null);
        setEditingStudentIds(new Set());
      }
    } catch (e) {
      console.error('Error updating family name:', e);
      alert('Fehler beim Bearbeiten des Familiennamens.');
    }
  };

  const handleEditStudent = async (studentId: string, firstName: string, duration: number, rhythm: 'weekly' | 'biweekly') => {
    try {
      setData(prev => {
        if (!prev) return null;
        
        // Find and update student
        const updatedStudents = prev.students.map(s => 
          s.id === studentId ? { ...s, firstName, defaultDuration: duration, rhythm } : s
        );

        return { ...prev, students: updatedStudents };
      });

      try {
        const currentData = JSON.parse(localStorage.getItem('mathe_manager_data') || '{}');
        
        // Find and update the student
        const updatedStudents = currentData.students.map(s => 
          s.id === studentId ? { ...s, firstName, defaultDuration: duration, rhythm } : s
        );

        localStorage.setItem('mathe_manager_data', JSON.stringify({
          ...currentData,
          students: updatedStudents
        }));
      } catch (e) {
        console.error('Error saving data after student update:', e);
      }

      loadData();
      
      // Update pagination
      updateStudents(data?.students || [], pagination.studentPage);
    } catch (e) {
      console.error('Error updating student:', e);
      alert('Fehler beim Bearbeiten des Schülers.');
    }
  };

  const handleSaveFamily = () => {
    if (!familyName.trim()) return;
    
    try {
      // Check if family exists with this name (case-insensitive)
      const existingStudent = data?.students.find(s => 
        s.familyId === editingFamilyId && s.firstName.toLowerCase() === familyName.trim().toLowerCase()
      );

      if (existingStudent) {
        // Update student name
        handleEditStudent(existingStudent.id, familyName.trim(), duration, rhythm);
        setEditingFamilyId(null);
        setEditingStudentIds(new Set());
        return;
      }

      // Create new family and student
      const newFamily: Family = {
        id: `family-${Date.now()}`,
        name: familyName.trim(),
        address: '',
        email: '',
        phone: ''
      };

      const newStudent: Student = {
        id: `student-${Date.now()}`,
        familyId: newFamily.id,
        firstName: familyName.trim(),
        notes: '',
        defaultDuration: duration,
        rhythm
      };

      setData(prev => ({
        ...prev!,
        families: [...prev!.families, newFamily],
        students: [newStudent, ...prev!.students]
      }));

      localStorage.setItem('mathe_manager_data', JSON.stringify({
        families: prev?.families ? [...prev.families, newFamily] : [newFamily],
        students: prev?.students ? [newStudent, ...prev.students] : [newStudent],
        lastUpdated: new Date().toISOString()
      }));

      setEditingFamilyId(null);
      setEditingStudentIds(new Set());
      setFamilyName('');
    } catch (e) {
      console.error('Error saving family:', e);
      alert('Fehler beim Speichern.');
    }
  };

  const handleCancel = () => {
    setEditingFamilyId(null);
    setEditingStudentIds(new Set());
    setFamilyName('');
  };

  // Pagination helpers for families
  const totalPagesFamilies = Math.ceil((data?.families?.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )?.length || 0) / 10) || 1;

  const handleFamilyPageChange = (page: number) => {
    setPagination(prev => ({ ...prev, familyPage: page }));
  };

  // Pagination helpers for students
  const totalPagesStudents = Math.ceil((data?.students?.filter(s => 
    s.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  )?.length || 0) / 10) || 1;

  const handleStudentPageChange = (page: number) => {
    setPagination(prev => ({ ...prev, studentPage: page }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Lade Daten...</div>;
  }

  // Header section
  const header = (
    <>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Familien & Schüler</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Verwalten Sie Ihre Nachhilfe-Familien und deren Schüler</p>
        </div>
        {!editingFamilyId && (
          <button
            onClick={() => {
              setEditingFamilyId('new');
              setEditingStudentIds(new Set(['new']));
              setFamilyName('');
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Neue Familie
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Nach Familie oder Schüler suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
          <div className="text-3xl font-bold text-green-600">{data?.families?.length || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Familien</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
          <div className="text-3xl font-bold text-blue-600">{data?.students?.length || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Schüler</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
          <div className="text-3xl font-bold text-purple-600">{data?.students?.filter(s => s.defaultDuration === 90).length || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">90 Min</div>
        </div>
      </div>
    </>
  );

  // Add/Edit Family Form Modal
  const editForm = editingFamilyId && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingFamilyId === 'new' ? 'Neue Familie erstellen' : 'Familie bearbeiten'}
            </h3>
            <button onClick={handleCancel} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="z.B. Müller Familie"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standard-Dauer (Min)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value={60}>60 Minuten</option>
                  <option value={90}>90 Minuten</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Termin-Rhythmus</label>
                <select
                  value={rhythm}
                  onChange={(e) => setRhythm(e.target.value as 'weekly' | 'biweekly')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="weekly">Wöchentlich</option>
                  <option value="biweekly">Zweiwöchentlich</option>
                </select>
              </div>
            </div>

            {/* Info text */}
            {editingFamilyId !== 'new' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ⚠️ Der Familienname und der Schülername werden gleichgesetzt. Bearbeiten Sie zuerst den Schüler, um Details zu ändern.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
              {editingFamilyId !== 'new' && (
                <button
                  onClick={() => handleEditStudent(editingFamilyId, familyName, duration, rhythm)}
                  disabled={!familyName.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  Speichern & Schüler bearbeiten
                </button>
              )}
              <button
                onClick={handleSaveFamily}
                disabled={!familyName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {editingFamilyId === 'new' ? 'Erstellen' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Family List Grid
  const familyList = (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Add new button */}
      {!editingFamilyId && (
        <button
          onClick={() => {
            setEditingFamilyId('new');
            setEditingStudentIds(new Set(['new']));
            setFamilyName('');
          }}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all min-h-[180px] group"
        >
          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
            <Plus className="text-gray-400 group-hover:text-green-600" size={24} />
          </div>
          <span className="font-medium text-gray-500 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-300">Neue Familie</span>
        </button>
      )}

      {/* Families */}
      {Array.from(editingStudentIds).map((studentId) => {
        const student = data?.students?.find(s => s.id === studentId);
        if (!student) return null;
        
        // Find parent family
        const family = data?.families?.find(f => f.id === student.familyId);

        // Check if this is a new family being added (same name as student for new families)
        const isNewFamily = editingFamilyId === 'new' && 
          !data?.families?.some(f => f.name.toLowerCase() === student.firstName.toLowerCase());

        return isNewFamily ? null : (
          <div key={student.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow">
            {editingStudentIds.has(student.id) ? (
              // Edit Mode - show both family and student info inline
              <>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{student.firstName}</h4>
                    {family && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Familie: {family.name}</p>
                    )}
                  </div>
                  
                  {/* Delete button */}
                  {editingStudentIds.has(student.id) && !isNewFamily && (
                    <button
                      onClick={() => handleDeleteStudent(student.id, student.firstName)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Schüler löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Edit Student Form */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={student.firstName}
                    onChange={(e) => handleEditStudent(student.id, e.target.value, student.defaultDuration, student.rhythm)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={student.defaultDuration}
                      onChange={(e) => handleEditStudent(student.id, student.firstName, Number(e.target.value), student.rhythm)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    >
                      <option value={60}>60 Min</option>
                      <option value={90}>90 Min</option>
                    </select>

                    <select
                      value={student.rhythm}
                      onChange={(e) => handleEditStudent(student.id, student.firstName, student.defaultDuration, e.target.value as 'weekly' | 'biweekly')}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    >
                      <option value="weekly">Wöchentlich</option>
                      <option value="biweekly">Zweiwöchentlich</option>
                    </select>
                  </div>

                  {/* Notes field */}
                  <textarea
                    value={student.notes || ''}
                    onChange={(e) => handleEditStudent(student.id, student.firstName, student.defaultDuration, student.rhythm)}
                    placeholder="Notizen..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white h-16 resize-none"
                  />

                  {/* Save/Cancel buttons */}
                  <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
                    {editingStudentIds.has(student.id) && !isNewFamily ? (
                      <>
                        <button
                          onClick={() => handleEditStudent(student.id, student.firstName, student.defaultDuration, student.rhythm)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudentIds(new Set(editingStudentIds.has(student.familyId || '') ? [...editingStudentIds] : []));
                            // Remove student from editing view but keep in pagination
                            updateStudents(data?.students || [], pagination.studentPage);
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-sm rounded-lg transition-colors"
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingStudentIds(new Set([student.id]));
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Family details if not in edit mode */}
              </>
            ) : (
              // View Mode - show family info + student count
              <>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{family?.name || 'Familie'}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {data?.students?.filter(s => s.familyId === family?.id).length} Schüler
                    </p>
                  </div>

                  {/* Edit button */}
                  {!editingStudentIds.has(student.id) && !isNewFamily && (
                    <button
                      onClick={() => setEditingStudentIds(new Set([student.id]))}
                      className="text-gray-400 hover:text-green-600 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      title="Schüler bearbeiten"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}

                  {/* Delete family button (only when not editing student) */}
                  {!editingStudentIds.has(student.id) && !isNewFamily && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDeleteFamily(family?.id || '', family?.name || '')}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Familie löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick view of students */}
                {Array.from(editingStudentIds).slice(0, 3).map(sId => {
                  const s = data?.students?.find(stu => stu.id === sId);
                  if (!s || s.familyId !== family?.id) return null;

                  // Check if student is in edit mode
                  const inEditMode = editingStudentIds.has(s.id);

                  return (
                    <div key={s.id} className={`text-sm ${inEditMode ? 'pl-3' : ''}`}>
                      {inEditMode ? (
                        <>
                          <span className="font-medium text-gray-900 dark:text-white">{s.firstName}</span>
                          {' | '}
                          <select
                            value={s.defaultDuration}
                            onChange={(e) => handleEditStudent(s.id, s.firstName, Number(e.target.value), s.rhythm)}
                            className="ml-1 px-1 py-0.5 text-xs border border-gray-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                          >
                            <option value={60}>60 Min</option>
                            <option value={90}>90 Min</option>
                          </select>
                          {' | '}
                          <span className="text-gray-500">{s.rhythm === 'weekly' ? 'Wöchentlich' : '2-wöchentlich'}</span>
                        </>
                      ) : (
                        <>
                          <strong className="text-gray-700 dark:text-gray-300">• {s.firstName}</strong>
                          {' | '}
                          {s.defaultDuration} Min • 
                          <span className={`ml-1 text-xs px-1.5 py-0.5 rounded ${s.rhythm === 'weekly' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                            {s.rhythm === 'weekly' ? 'Wöchentlich' : '2-wöchentlich'}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Show "und X weitere" if more students exist */}
                {data?.students?.filter(s => s.familyId === family?.id).length > 3 && !isNewFamily && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    und {data.students.filter(s => s.familyId === family.id).length - 3} weitere
                  </p>
                )}

                {/* Add first student button for new families */}
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Layout.Header>
      {header}
      {editForm}
      {familyList}

      {/* Family Pagination */}
      {!editingFamilyId && totalPagesFamilies > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => handleFamilyPageChange(pagination.familyPage - 1)}
            disabled={pagination.familyPage === 1}
            className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: totalPagesFamilies }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handleFamilyPageChange(i + 1)}
              className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                pagination.familyPage === i + 1
                  ? 'bg-green-600 text-white'
                  : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handleFamilyPageChange(pagination.familyPage + 1)}
            disabled={pagination.familyPage === totalPagesFamilies}
            className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Student Pagination */}
      {!editingFamilyId && totalPagesStudents > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => handleStudentPageChange(pagination.studentPage - 1)}
            disabled={pagination.studentPage === 1}
            className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>

          {Array.from({ length: totalPagesStudents }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handleStudentPageChange(i + 1)}
              className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                pagination.studentPage === i + 1
                  ? 'bg-green-600 text-white'
                  : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handleStudentPageChange(pagination.studentPage + 1)}
            disabled={pagination.studentPage === totalPagesStudents}
            className="p-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Back button */}
      {editingFamilyId && (
        <button
          onClick={() => router.back()}
          className="fixed bottom-6 right-6 p-3 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 rounded-full hover:shadow-xl transition-all z-40"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
      )}
    </Layout.Header>
  );
}