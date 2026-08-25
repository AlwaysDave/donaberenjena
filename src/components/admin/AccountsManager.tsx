import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, Activity } from '../../types';
import { useData } from '../../context/DataContext';
import { AlertTriangle, Plus, X, Upload, Save, Trash2, Calendar, CheckCircle2, ChevronRight, Activity as ActivityIcon } from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  bodega_proveedor: 'Bodega / Proveedor',
  catering: 'Catering / Comida',
  transporte: 'Transporte',
  alojamiento: 'Alojamiento',
  material: 'Material',
  personal: 'Personal',
  otros: 'Otros'
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  bodega_proveedor: 'bg-purple-100 text-purple-700 border-purple-200',
  catering: 'bg-orange-100 text-orange-700 border-orange-200',
  transporte: 'bg-blue-100 text-blue-700 border-blue-200',
  alojamiento: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  material: 'bg-slate-100 text-slate-700 border-slate-200',
  personal: 'bg-rose-100 text-rose-700 border-rose-200',
  otros: 'bg-gray-100 text-gray-700 border-gray-200'
};

export function AccountsManager() {
  const { activities, participants, expenses, addExpense, updateExpense, deleteExpense } = useData();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Selected activity for breakdown
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Form state for adding/editing expense
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  const [expenseForm, setExpenseForm] = useState<{
    concept: string;
    amount: string;
    category: ExpenseCategory;
    date: string;
    notes: string;
  }>({
    concept: '',
    amount: '',
    category: 'bodega_proveedor',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>(activities.map(a => new Date(a.date).getFullYear()));
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    if (!sortedYears.includes(new Date().getFullYear())) {
      sortedYears.unshift(new Date().getFullYear());
    }
    return sortedYears.map(String);
  }, [activities]);

  // Filter activities by year
  const filteredActivities = useMemo(() => {
    return activities
      .filter(a => new Date(a.date).getFullYear().toString() === selectedYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities, selectedYear]);

  // Financial calculations
  const financesByActivity = useMemo(() => {
    const data: Record<string, { facturado: number; cobrado: number; gastos: number; balance: number; hasExpenses: boolean }> = {};
    
    filteredActivities.forEach(a => {
      // Ingresos
      const actParticipants = participants.filter(p => p.activityId === a.id && p.status !== 'cancelada');
      const facturado = actParticipants.reduce((sum, p) => sum + p.totalAmount, 0);
      const cobrado = actParticipants.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
      
      // Gastos
      const actExpenses = expenses.filter(e => e.activityId === a.id);
      const gastos = actExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      data[a.id] = {
        facturado,
        cobrado,
        gastos,
        balance: cobrado - gastos,
        hasExpenses: actExpenses.length > 0
      };
    });
    
    return data;
  }, [filteredActivities, participants, expenses]);

  // Totals for summary
  const totals = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    const typeBreakdown = { cata: 0, curso: 0, viaje: 0 };
    
    filteredActivities.forEach(a => {
      const f = financesByActivity[a.id];
      ingresos += f.cobrado;
      gastos += f.gastos;
      typeBreakdown[a.type] += (f.cobrado - f.gastos);
    });
    
    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
      typeBreakdown
    };
  }, [filteredActivities, financesByActivity]);

  const handleOpenBreakdown = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsEditing(false);
    resetForm();
  };

  const handleCloseBreakdown = () => {
    setSelectedActivity(null);
    setIsEditing(false);
  };

  const resetForm = () => {
    setExpenseForm({
      concept: '',
      amount: '',
      category: 'bodega_proveedor',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setImageFile(null);
    setPreviewUrl(null);
    setEditingExpenseId(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseForm({
      concept: expense.concept,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      notes: expense.notes || ''
    });
    setPreviewUrl(expense.receiptImageUrl || null);
    setImageFile(null);
    setEditingExpenseId(expense.id);
    setIsEditing(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('¿Eliminar este gasto?')) {
      await deleteExpense(id);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    
    setUploadingImage(true);
    let finalImageUrl = previewUrl;
    
    // Upload image if selected
    if (imageFile && storage) {
      try {
        const tempId = editingExpenseId || `new-${Date.now()}`;
        const fileExt = imageFile.name.split('.').pop();
        const path = `receipts/${selectedActivity.id}/${tempId}.${fileExt}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error('Error subiendo imagen', err);
        alert('Error al subir la imagen del ticket.');
      }
    }
    
    setUploadingImage(false);

    const expenseData = {
      activityId: selectedActivity.id,
      concept: expenseForm.concept,
      amount: parseFloat(expenseForm.amount) || 0,
      category: expenseForm.category,
      date: expenseForm.date,
      notes: expenseForm.notes,
      receiptImageUrl: finalImageUrl || undefined
    };

    if (editingExpenseId) {
      await updateExpense(editingExpenseId, expenseData);
    } else {
      await addExpense(expenseData);
    }
    
    setIsEditing(false);
    resetForm();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-light text-wine-900 tracking-tight">Control de Cuentas</h2>
          <p className="text-sm text-wine-600 mt-1">Gestión financiera y balance de actividades</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-wine-600" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="pl-3 pr-8 py-2 bg-white border border-wine-200 rounded-lg text-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-500 shadow-sm"
          >
            <option value="all">Todos los años</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ingresos Totales</span>
          <span className="text-3xl font-light text-slate-800 mt-2">{formatCurrency(totals.ingresos)}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Gastos Totales</span>
          <span className="text-3xl font-light text-rose-600 mt-2">{formatCurrency(totals.gastos)}</span>
        </div>
        <div className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col justify-between ${totals.balance >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <span className={`text-sm font-medium uppercase tracking-wider ${totals.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Balance Neto</span>
          <span className={`text-3xl font-bold mt-2 ${totals.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance)}
          </span>
        </div>
        
        {/* Breakdown by type */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Balance por tipo</span>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Catas</span>
              <span className={`font-medium ${totals.typeBreakdown.cata >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(totals.typeBreakdown.cata)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Cursos</span>
              <span className={`font-medium ${totals.typeBreakdown.curso >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(totals.typeBreakdown.curso)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Viajes</span>
              <span className={`font-medium ${totals.typeBreakdown.viaje >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(totals.typeBreakdown.viaje)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVITIES LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-medium">Actividad</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium text-right">Ingresos</th>
                <th className="p-4 font-medium text-right">Gastos</th>
                <th className="p-4 font-medium text-right">Balance</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No hay actividades registradas en {selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredActivities.map(act => {
                  const fin = financesByActivity[act.id];
                  const diffCobrado = fin.facturado - fin.cobrado;
                  
                  return (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            act.type === 'cata' ? 'bg-wine-100 text-wine-600' :
                            act.type === 'curso' ? 'bg-amber-100 text-amber-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            <ActivityIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 line-clamp-1">{act.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {new Date(act.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {act.status === 'celebrada' ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Celebrada
                          </div>
                        ) : (
                          <div className="text-xs font-medium text-slate-500">Próxima</div>
                        )}
                        
                        {act.status === 'celebrada' && !fin.hasExpenses && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Sin gastos
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium text-slate-900">{formatCurrency(fin.cobrado)}</div>
                        {diffCobrado > 0 && (
                          <div className="text-[10px] text-amber-600 mt-0.5">
                            Faltan {formatCurrency(diffCobrado)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-medium text-rose-600">{formatCurrency(fin.gastos)}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`font-bold ${fin.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {fin.balance >= 0 ? '+' : ''}{formatCurrency(fin.balance)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenBreakdown(act)}
                          className="inline-flex items-center justify-center p-2 text-wine-600 hover:bg-wine-50 rounded-lg transition-colors"
                          title="Desglosar gastos"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPENSE BREAKDOWN MODAL */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-medium text-slate-900">Desglose de Gastos</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selectedActivity.title}</p>
              </div>
              <button 
                onClick={handleCloseBreakdown}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
              
              {/* Left: Expenses List */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-end mb-4">
                  <h4 className="font-medium text-slate-800">Gastos Registrados</h4>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-wine-600 hover:text-wine-700 bg-wine-50 hover:bg-wine-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Gasto
                    </button>
                  )}
                </div>

                {expenses.filter(e => e.activityId === selectedActivity.id).length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm">
                    No hay gastos documentados para esta actividad.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses
                      .filter(e => e.activityId === selectedActivity.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(exp => (
                        <div key={exp.id} className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-medium text-slate-900">{exp.concept}</h5>
                              <span className="font-semibold text-rose-600">{formatCurrency(exp.amount)}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[exp.category]}`}>
                                {CATEGORY_LABELS[exp.category]}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(exp.date).toLocaleDateString('es-ES')}
                              </span>
                              {exp.receiptImageUrl && (
                                <a 
                                  href={exp.receiptImageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-medium text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  Ver Ticket
                                </a>
                              )}
                            </div>
                            
                            {exp.notes && (
                              <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                                {exp.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-start sm:flex-col justify-end gap-2 shrink-0">
                            <button
                              onClick={() => handleEditExpense(exp)}
                              className="text-xs text-slate-500 hover:text-wine-600 px-2 py-1 bg-slate-50 hover:bg-wine-50 rounded transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 bg-slate-50 hover:bg-rose-50 rounded transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Right: Form */}
              {isEditing && (
                <div className="w-full md:w-80 shrink-0 bg-slate-50 p-5 rounded-xl border border-slate-200 h-fit">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-slate-900">
                      {editingExpenseId ? 'Editar Gasto' : 'Nuevo Gasto'}
                    </h4>
                    <button onClick={() => { setIsEditing(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Concepto</label>
                      <input 
                        type="text" 
                        required
                        value={expenseForm.concept}
                        onChange={e => setExpenseForm({...expenseForm, concept: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500"
                        placeholder="Ej. Autobús empresa X"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Importe (€)</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          min="0"
                          value={expenseForm.amount}
                          onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Fecha</label>
                        <input 
                          type="date" 
                          required
                          value={expenseForm.date}
                          onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                      <select
                        value={expenseForm.category}
                        onChange={e => setExpenseForm({...expenseForm, category: e.target.value as ExpenseCategory})}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Notas (opcional)</label>
                      <textarea 
                        value={expenseForm.notes}
                        onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Ticket / Factura (opcional)</label>
                      <div className="mt-1 flex justify-center px-4 py-4 border-2 border-slate-300 border-dashed rounded-lg bg-white relative overflow-hidden group">
                        {previewUrl ? (
                          <>
                            <img src={previewUrl} alt="Ticket preview" className="max-h-32 object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-xs font-medium">Cambiar imagen</span>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </>
                        ) : (
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-8 w-8 text-slate-400" />
                            <div className="flex text-xs text-slate-600 justify-center">
                              <label className="relative cursor-pointer rounded-md font-medium text-wine-600 hover:text-wine-500">
                                <span>Subir un archivo</span>
                                <input type="file" className="sr-only" accept="image/*" onChange={handleImageSelect} />
                              </label>
                            </div>
                            <p className="text-[10px] text-slate-500">PNG, JPG hasta 5MB</p>
                            <p className="text-[9px] text-slate-400 mt-2 px-2">Nota: Para alto volumen, se requiere ampliar la cuota de Storage.</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={uploadingImage}
                      className="w-full flex items-center justify-center gap-2 bg-wine-600 hover:bg-wine-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
                    >
                      {uploadingImage ? (
                        <>Guardando...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {editingExpenseId ? 'Guardar Cambios' : 'Añadir Gasto'}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
