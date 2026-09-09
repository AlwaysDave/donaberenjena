import React, { useState, useMemo } from 'react';
import { 
  GeneralIncome, 
  GeneralExpense, 
  GeneralIncomeType, 
  GeneralExpenseCategory, 
  GeneralIncomeStatus 
} from '../../types';
import { useData } from '../../context/DataContext';
import { 
  Plus, 
  X, 
  Upload, 
  Save, 
  Trash2, 
  Edit2, 
  Eye, 
  TrendingUp, 
  Receipt, 
  DollarSign, 
  Search, 
  Filter, 
  Building2, 
  Landmark, 
  Sparkles, 
  HelpCircle, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Users
} from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatDisplayDate } from '../../utils/dateUtils';
import { MemberFeesModal } from './MemberFeesModal';

export const GENERAL_INCOME_TYPE_LABELS: Record<GeneralIncomeType, string> = {
  cuota_socio: 'Cuota de Socio',
  subvencion: 'Subvención Oficial',
  patrocinio_general: 'Patrocinio General',
  donacion: 'Donación',
  otros: 'Otros Ingresos'
};

export const GENERAL_INCOME_TYPE_COLORS: Record<GeneralIncomeType, { bg: string; text: string; border: string }> = {
  cuota_socio: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  subvencion: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  patrocinio_general: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  donacion: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  otros: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
};

export const GENERAL_EXPENSE_CATEGORY_LABELS: Record<GeneralExpenseCategory, string> = {
  equipamiento: 'Equipamiento y Maquinaria',
  comida_asociacion: 'Comida y Eventos Asociación',
  menaje_copas: 'Menaje y Copas de Cata',
  suministros_local: 'Suministros y Sede',
  administracion_legal: 'Gestión, Legal y Seguros',
  mantenimiento: 'Mantenimiento y Reparaciones',
  otros: 'Otros Gastos'
};

export const GENERAL_EXPENSE_CATEGORY_COLORS: Record<GeneralExpenseCategory, { bg: string; text: string; border: string }> = {
  equipamiento: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  comida_asociacion: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  menaje_copas: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  suministros_local: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  administracion_legal: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  mantenimiento: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  otros: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' }
};

interface GeneralAccountsSectionProps {
  selectedYear: string;
}

export const GeneralAccountsSection: React.FC<GeneralAccountsSectionProps> = ({ selectedYear }) => {
  const {
    generalIncomes,
    addGeneralIncome,
    updateGeneralIncome,
    deleteGeneralIncome,
    generalExpenses,
    addGeneralExpense,
    updateGeneralExpense,
    deleteGeneralExpense
  } = useData();

  // Filters state
  const [filterType, setFilterType] = useState<'all' | 'incomes' | 'expenses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GeneralIncomeStatus>('all');

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMemberFeesModalOpen, setIsMemberFeesModalOpen] = useState(false);
  const [memberFeesModalYear, setMemberFeesModalYear] = useState<number>(
    selectedYear !== 'all' ? Number(selectedYear) : new Date().getFullYear()
  );
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Income form state
  const [incomeForm, setIncomeForm] = useState({
    concept: '',
    payerName: '',
    amount: '',
    paidAmount: '',
    type: 'cuota_socio' as GeneralIncomeType,
    status: 'cobrado' as GeneralIncomeStatus,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    concept: '',
    supplierName: '',
    amount: '',
    category: 'equipamiento' as GeneralExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // Filter items by year
  const filteredIncomes = useMemo(() => {
    return generalIncomes.filter(inc => {
      if (selectedYear !== 'all') {
        const itemYear = (inc.date || '').substring(0, 4);
        if (itemYear !== selectedYear) return false;
      }
      return true;
    });
  }, [generalIncomes, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return generalExpenses.filter(exp => {
      if (selectedYear !== 'all') {
        const itemYear = (exp.date || '').substring(0, 4);
        if (itemYear !== selectedYear) return false;
      }
      return true;
    });
  }, [generalExpenses, selectedYear]);

  // General Totals
  const generalTotals = useMemo(() => {
    let ingresosCobrados = 0;
    let ingresosFacturados = 0;
    let gastosTotales = 0;

    filteredIncomes.forEach(inc => {
      if (inc.status !== 'cancelado') {
        ingresosFacturados += inc.amount || 0;
        ingresosCobrados += inc.paidAmount ?? 0;
      }
    });

    filteredExpenses.forEach(exp => {
      gastosTotales += exp.amount || 0;
    });

    const balance = ingresosCobrados - gastosTotales;

    // Breakdown
    const incomeByType: Record<GeneralIncomeType, number> = {
      cuota_socio: 0,
      subvencion: 0,
      patrocinio_general: 0,
      donacion: 0,
      otros: 0
    };

    filteredIncomes.forEach(inc => {
      if (inc.status !== 'cancelado') {
        incomeByType[inc.type] = (incomeByType[inc.type] || 0) + (inc.paidAmount ?? 0);
      }
    });

    const expenseByCategory: Record<GeneralExpenseCategory, number> = {
      equipamiento: 0,
      comida_asociacion: 0,
      menaje_copas: 0,
      suministros_local: 0,
      administracion_legal: 0,
      mantenimiento: 0,
      otros: 0
    };

    filteredExpenses.forEach(exp => {
      expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + (exp.amount || 0);
    });

    return {
      ingresosCobrados,
      ingresosFacturados,
      gastosTotales,
      balance,
      incomeByType,
      expenseByCategory
    };
  }, [filteredIncomes, filteredExpenses]);

  // Combined and filtered movements list
  interface UnifiedMovement {
    id: string;
    kind: 'income' | 'expense';
    date: string;
    concept: string;
    entityName?: string;
    categoryOrType: string;
    badgeStyle: { bg: string; text: string; border: string };
    amount: number;
    paidAmount?: number;
    status?: GeneralIncomeStatus;
    receiptImageUrl?: string;
    notes?: string;
    original: GeneralIncome | GeneralExpense;
  }

  const unifiedMovements = useMemo<UnifiedMovement[]>(() => {
    const list: UnifiedMovement[] = [];

    if (filterType === 'all' || filterType === 'incomes') {
      filteredIncomes.forEach(inc => {
        if (statusFilter !== 'all' && inc.status !== statusFilter) return;
        
        list.push({
          id: inc.id,
          kind: 'income',
          date: inc.date || '',
          concept: inc.concept,
          entityName: inc.payerName,
          categoryOrType: GENERAL_INCOME_TYPE_LABELS[inc.type] || inc.type,
          badgeStyle: GENERAL_INCOME_TYPE_COLORS[inc.type] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
          amount: inc.amount,
          paidAmount: inc.paidAmount,
          status: inc.status,
          receiptImageUrl: inc.receiptImageUrl,
          notes: inc.notes,
          original: inc
        });
      });
    }

    if (filterType === 'all' || filterType === 'expenses') {
      filteredExpenses.forEach(exp => {
        list.push({
          id: exp.id,
          kind: 'expense',
          date: exp.date || '',
          concept: exp.concept,
          entityName: exp.supplierName,
          categoryOrType: GENERAL_EXPENSE_CATEGORY_LABELS[exp.category] || exp.category,
          badgeStyle: GENERAL_EXPENSE_CATEGORY_COLORS[exp.category] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
          amount: exp.amount,
          receiptImageUrl: exp.receiptImageUrl,
          notes: exp.notes,
          original: exp
        });
      });
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(m => 
        m.concept.toLowerCase().includes(q) ||
        (m.entityName && m.entityName.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        m.categoryOrType.toLowerCase().includes(q)
      );
    }

    return list;
  }, [filteredIncomes, filteredExpenses, filterType, statusFilter, searchQuery]);

  // Image Upload helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Income Handlers
  const handleOpenAddIncome = () => {
    setIncomeForm({
      concept: '',
      payerName: '',
      amount: '',
      paidAmount: '',
      type: 'cuota_socio',
      status: 'cobrado',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingIncomeId(null);
    setImageFile(null);
    setPreviewUrl(null);
    setIsIncomeModalOpen(true);
  };

  const handleOpenEditIncome = (income: GeneralIncome) => {
    setIncomeForm({
      concept: income.concept,
      payerName: income.payerName || '',
      amount: income.amount.toString(),
      paidAmount: (income.paidAmount ?? income.amount).toString(),
      type: income.type,
      status: income.status,
      date: income.date,
      notes: income.notes || ''
    });
    setEditingIncomeId(income.id);
    setImageFile(null);
    setPreviewUrl(income.receiptImageUrl || null);
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(incomeForm.amount);
    let paidAmountNum = parseFloat(incomeForm.paidAmount || '0');

    if (!incomeForm.concept.trim()) {
      alert('El concepto del ingreso es obligatorio.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('El importe debe ser un número mayor que 0.');
      return;
    }

    if (incomeForm.status === 'cancelado') {
      paidAmountNum = 0;
    } else if (incomeForm.status === 'cobrado' && (isNaN(paidAmountNum) || paidAmountNum <= 0)) {
      paidAmountNum = amountNum;
    } else if (incomeForm.status === 'pendiente') {
      paidAmountNum = isNaN(paidAmountNum) ? 0 : paidAmountNum;
    }

    setUploadingImage(true);
    let finalImageUrl = previewUrl || undefined;

    try {
      if (imageFile && storage) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `general/incomes/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      if (editingIncomeId) {
        await updateGeneralIncome(editingIncomeId, {
          concept: incomeForm.concept.trim(),
          payerName: incomeForm.payerName.trim() || undefined,
          amount: amountNum,
          paidAmount: paidAmountNum,
          type: incomeForm.type,
          status: incomeForm.status,
          date: incomeForm.date,
          receiptImageUrl: finalImageUrl,
          notes: incomeForm.notes.trim() || undefined
        });
      } else {
        await addGeneralIncome({
          concept: incomeForm.concept.trim(),
          payerName: incomeForm.payerName.trim() || undefined,
          amount: amountNum,
          paidAmount: paidAmountNum,
          type: incomeForm.type,
          status: incomeForm.status,
          date: incomeForm.date,
          receiptImageUrl: finalImageUrl,
          notes: incomeForm.notes.trim() || undefined
        });
      }

      setIsIncomeModalOpen(false);
    } catch (err: any) {
      console.error('Error saving general income:', err);
      alert('Error al guardar el ingreso: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de ingreso general?')) {
      await deleteGeneralIncome(id);
    }
  };

  // Expense Handlers
  const handleOpenAddExpense = () => {
    setExpenseForm({
      concept: '',
      supplierName: '',
      amount: '',
      category: 'equipamiento',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingExpenseId(null);
    setImageFile(null);
    setPreviewUrl(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: GeneralExpense) => {
    setExpenseForm({
      concept: expense.concept,
      supplierName: expense.supplierName || '',
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      notes: expense.notes || ''
    });
    setEditingExpenseId(expense.id);
    setImageFile(null);
    setPreviewUrl(expense.receiptImageUrl || null);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseForm.amount);

    if (!expenseForm.concept.trim()) {
      alert('El concepto del gasto es obligatorio.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('El importe debe ser un número mayor que 0.');
      return;
    }

    setUploadingImage(true);
    let finalImageUrl = previewUrl || undefined;

    try {
      if (imageFile && storage) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `general/expenses/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      if (editingExpenseId) {
        await updateGeneralExpense(editingExpenseId, {
          concept: expenseForm.concept.trim(),
          supplierName: expenseForm.supplierName.trim() || undefined,
          amount: amountNum,
          category: expenseForm.category,
          date: expenseForm.date,
          receiptImageUrl: finalImageUrl,
          notes: expenseForm.notes.trim() || undefined
        });
      } else {
        await addGeneralExpense({
          concept: expenseForm.concept.trim(),
          supplierName: expenseForm.supplierName.trim() || undefined,
          amount: amountNum,
          category: expenseForm.category,
          date: expenseForm.date,
          receiptImageUrl: finalImageUrl,
          notes: expenseForm.notes.trim() || undefined
        });
      }

      setIsExpenseModalOpen(false);
    } catch (err: any) {
      console.error('Error saving general expense:', err);
      alert('Error al guardar el gasto: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de gasto general?')) {
      await deleteGeneralExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ACTION BUTTONS TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-wine-50 text-wine-700">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            {selectedYear === 'all' ? 'Movimientos Generales (Histórico Completo)' : `Movimientos Generales (${selectedYear})`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-member-fees-status"
            type="button"
            onClick={() => {
              setMemberFeesModalYear(selectedYear !== 'all' ? Number(selectedYear) : new Date().getFullYear());
              setIsMemberFeesModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Abrir panel de control y estado de cuotas anuales de socios"
          >
            <Users className="w-4 h-4 text-wine-700" />
            <span>Estado cuotas socios</span>
          </button>

          <button
            id="btn-add-general-income"
            type="button"
            onClick={handleOpenAddIncome}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Ingreso General</span>
          </button>

          <button
            id="btn-add-general-expense"
            type="button"
            onClick={handleOpenAddExpense}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-wine-700 hover:bg-wine-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Gasto General</span>
          </button>
        </div>
      </div>

      {/* MOVEMENTS TABLE & CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Type */}
            <div className="inline-flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'all' 
                    ? 'bg-slate-900 text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({filteredIncomes.length + filteredExpenses.length})
              </button>
              <button
                onClick={() => setFilterType('incomes')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'incomes' 
                    ? 'bg-emerald-700 text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ingresos ({filteredIncomes.length})
              </button>
              <button
                onClick={() => setFilterType('expenses')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterType === 'expenses' 
                    ? 'bg-wine-700 text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gastos ({filteredExpenses.length})
              </button>
            </div>

            {/* Income Status filter if viewing incomes */}
            {filterType === 'incomes' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white text-xs border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-700 focus:outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="all">Todos los estados</option>
                <option value="cobrado">Solo Cobrados</option>
                <option value="pendiente">Solo Pendientes</option>
                <option value="cancelado">Solo Cancelados</option>
              </select>
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar movimiento o entidad..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-wine-500 shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Movements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Tipo / Categoría</th>
                <th className="p-4 font-semibold">Concepto y Entidad</th>
                <th className="p-4 font-semibold text-center">Estado / Justificante</th>
                <th className="p-4 font-semibold text-right">Importe</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unifiedMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-medium text-slate-600">No hay movimientos registrados</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery ? 'No se encontraron resultados para el filtro aplicado.' : 'Utiliza los botones superiores para registrar los primeros ingresos o gastos generales de la asociación.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                unifiedMovements.map(item => {
                  const isIncome = item.kind === 'income';
                  const isFeeRecord = isIncome && ((item.original as GeneralIncome).isConsolidatedFeeRecord || (item.original as GeneralIncome).type === 'cuota_socio');
                  const itemFeeYear = isFeeRecord ? ((item.original as GeneralIncome).feeYear || (item.date ? Number(item.date.substring(0, 4)) : new Date().getFullYear())) : undefined;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${isFeeRecord ? 'bg-blue-50/20' : ''}`}>
                      {/* Date */}
                      <td className="p-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{formatDisplayDate(item.date)}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="p-4 whitespace-nowrap">
                        {isFeeRecord ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (itemFeeYear) setMemberFeesModalYear(itemFeeYear);
                              setIsMemberFeesModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Haz clic para abrir el desglose individual de socios"
                          >
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>Cuotas de Socios</span>
                          </button>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${item.badgeStyle.bg} ${item.badgeStyle.text} ${item.badgeStyle.border}`}>
                            {item.categoryOrType}
                          </span>
                        )}
                      </td>

                      {/* Concept & Entity */}
                      <td className="p-4">
                        <div className="font-medium text-slate-900 text-sm flex items-center gap-2">
                          <span>{item.concept}</span>
                          {isFeeRecord && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              Consolidado Anual
                            </span>
                          )}
                        </div>
                        {item.entityName && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-normal text-slate-400">{isIncome ? 'Pagador/Origen:' : 'Proveedor:'}</span>
                            <span className="font-medium text-slate-700">{item.entityName}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Status & Receipt */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isIncome && item.status && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.status === 'cobrado' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : item.status === 'pendiente' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {item.status === 'cobrado' && <CheckCircle2 className="w-3 h-3" />}
                              {item.status === 'pendiente' && <Clock className="w-3 h-3" />}
                              {item.status === 'cancelado' && <AlertCircle className="w-3 h-3" />}
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          )}

                          {item.receiptImageUrl ? (
                            <button
                              onClick={() => setViewingReceiptUrl(item.receiptImageUrl!)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-wine-700 bg-wine-50 hover:bg-wine-100 rounded-lg border border-wine-200 transition-colors cursor-pointer"
                              title="Ver justificante"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Factura</span>
                            </button>
                          ) : (
                            !isFeeRecord && <span className="text-[11px] text-slate-300">-</span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className={`font-semibold text-sm ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                        </div>
                        {isIncome && item.paidAmount !== undefined && item.paidAmount !== item.amount && item.status !== 'cancelado' && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            Cobrado: {formatCurrency(item.paidAmount)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isFeeRecord ? (
                            <button
                              onClick={() => {
                                if (itemFeeYear) setMemberFeesModalYear(itemFeeYear);
                                setIsMemberFeesModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="Abrir panel de cuotas de socios"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Desglose</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  if (isIncome) {
                                    handleOpenEditIncome(item.original as GeneralIncome);
                                  } else {
                                    handleOpenEditExpense(item.original as GeneralExpense);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar apunte"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (isIncome) {
                                    handleDeleteIncome(item.id);
                                  } else {
                                    handleDeleteExpense(item.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar apunte"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: AÑADIR / EDITAR INGRESO GENERAL                                    */}
      {/* ========================================================================= */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    {editingIncomeId ? 'Editar Ingreso General' : 'Registrar Nuevo Ingreso General'}
                  </h3>
                  <p className="text-xs text-slate-500">Asociación Doña Berenjena</p>
                </div>
              </div>
              <button 
                onClick={() => setIsIncomeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-4 mt-4">
              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concepto del Ingreso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cuotas anuales socios 2026, Subvención Ayto, Patrocinio..."
                  value={incomeForm.concept}
                  onChange={(e) => setIncomeForm({ ...incomeForm, concept: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                />
              </div>

              {/* Tipo de Ingreso y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Ingreso <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={incomeForm.type}
                    onChange={(e) => setIncomeForm({ ...incomeForm, type: e.target.value as GeneralIncomeType })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:border-wine-600 cursor-pointer"
                  >
                    {Object.entries(GENERAL_INCOME_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                  />
                </div>
              </div>

              {/* Pagador / Institución */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pagador / Entidad emisora
                </label>
                <input
                  type="text"
                  placeholder="Ej: Excmo. Ayuntamiento, Socios de Número, Globalcaja..."
                  value={incomeForm.payerName}
                  onChange={(e) => setIncomeForm({ ...incomeForm, payerName: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                />
              </div>

              {/* Importes y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Importe (€) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={incomeForm.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIncomeForm(prev => ({
                        ...prev,
                        amount: val,
                        paidAmount: prev.status === 'cobrado' ? val : prev.paidAmount
                      }));
                    }}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={incomeForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as GeneralIncomeStatus;
                      setIncomeForm(prev => ({
                        ...prev,
                        status: newStatus,
                        paidAmount: newStatus === 'cobrado' ? (prev.amount || prev.paidAmount) : (newStatus === 'cancelado' ? '0' : prev.paidAmount)
                      }));
                    }}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:border-wine-600 cursor-pointer"
                  >
                    <option value="cobrado">Cobrado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cobrado Real (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={incomeForm.status === 'cancelado'}
                    placeholder="0.00"
                    value={incomeForm.paidAmount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, paidAmount: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Justificante de Ingreso */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documento / Justificante / Factura
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{imageFile ? 'Cambiar archivo' : 'Adjuntar comprobante'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {previewUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Archivo seleccionado
                      </span>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                        className="text-xs text-rose-500 hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre la resolución, condiciones o número de expediente..."
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Guardando...' : 'Guardar Ingreso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AÑADIR / EDITAR GASTO GENERAL                                      */}
      {/* ========================================================================= */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    {editingExpenseId ? 'Editar Gasto General' : 'Registrar Nuevo Gasto General'}
                  </h3>
                  <p className="text-xs text-slate-500">Asociación Doña Berenjena</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 mt-4">
              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Concepto del Gasto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Compra de horno, Compra de copas, Comida asociación..."
                  value={expenseForm.concept}
                  onChange={(e) => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                />
              </div>

              {/* Categoría y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as GeneralExpenseCategory })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:border-wine-600 cursor-pointer"
                  >
                    {Object.entries(GENERAL_EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                  />
                </div>
              </div>

              {/* Proveedor e Importe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proveedor / Comercio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Hostelería Ciudad Real, Schott Zwiesel..."
                    value={expenseForm.supplierName}
                    onChange={(e) => setExpenseForm({ ...expenseForm, supplierName: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Importe (€) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                  />
                </div>
              </div>

              {/* Factura / Ticket */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ticket / Factura de compra
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{imageFile ? 'Cambiar factura' : 'Adjuntar ticket/factura'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {previewUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Archivo cargado
                      </span>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                        className="text-xs text-rose-500 hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Garantía, ubicación de instalación, destino del material..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-wine-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-wine-700 hover:bg-wine-800 rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Guardando...' : 'Guardar Gasto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVISUALIZADOR DE FACTURA / JUSTIFICANTE                          */}
      {/* ========================================================================= */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-medium text-slate-900 text-sm">Vista de Factura / Justificante</h4>
              <button 
                onClick={() => setViewingReceiptUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-50 rounded-xl my-3">
              <img 
                src={viewingReceiptUrl} 
                alt="Justificante de contabilidad" 
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <a
                href={viewingReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-wine-800 bg-wine-50 hover:bg-wine-100 rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en nueva pestaña</span>
              </a>
              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: ESTADO CUOTAS DE SOCIOS (CONSOLIDADO ANUAL)                        */}
      {/* ========================================================================= */}
      {isMemberFeesModalOpen && (
        <MemberFeesModal
          isOpen={isMemberFeesModalOpen}
          onClose={() => setIsMemberFeesModalOpen(false)}
          initialYear={memberFeesModalYear}
        />
      )}
    </div>
  );
};
