import React, { useState, useMemo, useEffect } from 'react';
import { Expense, ExpenseCategory, Activity, Sponsorship, SponsorshipStatus, Participant } from '../../types';
import { useData } from '../../context/DataContext';
import { 
  AlertTriangle, 
  Plus, 
  X, 
  Upload, 
  Save, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Activity as ActivityIcon, 
  Users, 
  Euro,
  FileText,
  Layers,
  FileSpreadsheet,
  Printer,
  Download,
  Loader2,
  Edit2,
  HandCoins,
  DollarSign,
  TrendingUp,
  Receipt,
  Eye,
  Wine,
  ChefHat,
  Compass,
  Building2
} from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { exportAccountingToExcel } from '../../utils/accountingExport';
import { exportReportToPdf } from '../../utils/pdfExport';
import { formatDisplayDate, getActivityYear, sortActivitiesAscending } from '../../utils/dateUtils';
import { Pagination } from '../common/Pagination';
import { GeneralAccountsSection } from './GeneralAccountsSection';

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateStr?: string): string {
  return formatDisplayDate(dateStr);
}

export function AccountsManager() {
  const { 
    activities, 
    participants, 
    expenses, 
    sponsorships,
    generalIncomes,
    generalExpenses,
    addExpense, 
    updateExpense, 
    deleteExpense,
    addSponsorship,
    updateSponsorship,
    deleteSponsorship
  } = useData();

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [mainSectionTab, setMainSectionTab] = useState<'asociacion' | 'actividades'>('asociacion');
  
  // Drill-down Modal State
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activeTab, setActiveTab] = useState<'ingresos' | 'gastos'>('ingresos');

  // Report Modals
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const [pageBreakPerActivity, setPageBreakPerActivity] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');

  // Form state for adding/editing expense
  const [isEditingExpense, setIsEditingExpense] = useState(false);
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

  // Form state for adding/editing sponsorship
  const [isEditingSponsorship, setIsEditingSponsorship] = useState(false);
  const [editingSponsorshipId, setEditingSponsorshipId] = useState<string | null>(null);
  const [sponsorshipForm, setSponsorshipForm] = useState<{
    sponsorName: string;
    concept: string;
    amount: string;
    paidAmount: string;
    status: SponsorshipStatus;
    date: string;
    notes: string;
  }>({
    sponsorName: '',
    concept: '',
    amount: '',
    paidAmount: '',
    status: 'pendiente',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>(activities.map(a => getActivityYear(a.date)).filter(y => !isNaN(y)));
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    if (!sortedYears.includes(new Date().getFullYear())) {
      sortedYears.unshift(new Date().getFullYear());
    }
    return sortedYears.map(String);
  }, [activities]);

  // Pagination state for activities accounting table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when year filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, pageSize]);

  // Filter activities by year (Ascending sort)
  const filteredActivities = useMemo(() => {
    const matching = activities.filter(a => {
      if (selectedYear === 'all') return true;
      return getActivityYear(a.date).toString() === selectedYear;
    });
    return sortActivitiesAscending(matching);
  }, [activities, selectedYear]);

  // Paginated activities slice
  const paginatedActivities = useMemo(() => {
    const totalItems = filteredActivities.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  // Sync safePage to state
  useEffect(() => {
    const totalItems = filteredActivities.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [filteredActivities.length, pageSize, currentPage]);

  // Financial calculations
  const financesByActivity = useMemo(() => {
    const data: Record<string, { 
      reservasFacturadas: number;
      reservasCobradas: number;
      patrociniosFacturados: number;
      patrociniosCobrados: number;
      ingresosFacturados: number;
      ingresosCobrados: number;
      gastos: number;
      balance: number;
      hasExpenses: boolean;
      asistentes: number;
      aforo: number;
      gastoPorAsistente: number;
      numSocios: number;
      numNoSocios: number;
    }> = {};
    
    filteredActivities.forEach(a => {
      // Participantes con asistencia confirmada (CON-01 / CON-02: solo status === 'asistio', 1 doc = 1 persona)
      const actAsistioParticipants = participants.filter(
        p => p.activityId === a.id && p.status === 'asistio'
      );
      
      const asistentes = actAsistioParticipants.length;
      const aforo = a.totalSpots || 0;

      const numSocios = actAsistioParticipants.filter(p => p.isMember).length;
      const numNoSocios = actAsistioParticipants.filter(p => !p.isMember).length;

      // Reservas (solo 'asistio')
      const reservasFacturadas = actAsistioParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const reservasCobradas = actAsistioParticipants.reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);

      // Patrocinios (distintos de cancelado)
      const actSponsorships = sponsorships.filter(s => s.activityId === a.id);
      const activeSponsorships = actSponsorships.filter(s => s.status !== 'cancelado');
      const patrociniosFacturados = activeSponsorships.reduce((sum, s) => sum + (s.amount || 0), 0);
      const patrociniosCobrados = activeSponsorships.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);

      // Ingresos Totales
      const ingresosFacturados = reservasFacturadas + patrociniosFacturados;
      const ingresosCobrados = reservasCobradas + patrociniosCobrados;
      
      // Gastos
      const actExpenses = expenses.filter(e => e.activityId === a.id);
      const gastos = actExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const gastoPorAsistente = asistentes > 0 ? (gastos / asistentes) : 0;
      
      data[a.id] = {
        reservasFacturadas,
        reservasCobradas,
        patrociniosFacturados,
        patrociniosCobrados,
        ingresosFacturados,
        ingresosCobrados,
        gastos,
        balance: ingresosCobrados - gastos,
        hasExpenses: actExpenses.length > 0,
        asistentes,
        aforo,
        gastoPorAsistente,
        numSocios,
        numNoSocios
      };
    });
    
    return data;
  }, [filteredActivities, participants, sponsorships, expenses]);

  // Totals for summary
  const totals = useMemo(() => {
    let ingresosCobrados = 0;
    let ingresosFacturados = 0;
    let reservasCobradas = 0;
    let reservasFacturadas = 0;
    let patrociniosCobrados = 0;
    let patrociniosFacturados = 0;
    let gastos = 0;
    let totalAsistentes = 0;
    const typeBreakdown = { cata: 0, curso: 0, viaje: 0 };
    
    filteredActivities.forEach(a => {
      const f = financesByActivity[a.id];
      if (!f) return;
      ingresosCobrados += f.ingresosCobrados;
      ingresosFacturados += f.ingresosFacturados;
      reservasCobradas += f.reservasCobradas;
      reservasFacturadas += f.reservasFacturadas;
      patrociniosCobrados += f.patrociniosCobrados;
      patrociniosFacturados += f.patrociniosFacturados;
      gastos += f.gastos;
      totalAsistentes += f.asistentes;
      typeBreakdown[a.type] += f.balance;
    });
    
    return {
      ingresosCobrados,
      ingresosFacturados,
      reservasCobradas,
      reservasFacturadas,
      patrociniosCobrados,
      patrociniosFacturados,
      gastos,
      balance: ingresosCobrados - gastos,
      totalAsistentes,
      costeMedioAsistente: totalAsistentes > 0 ? (gastos / totalAsistentes) : 0,
      typeBreakdown
    };
  }, [filteredActivities, financesByActivity]);

  // General Incomes & Expenses filtered by year
  const filteredGeneralIncomes = useMemo(() => {
    return generalIncomes.filter(inc => {
      if (selectedYear !== 'all') {
        const itemYear = (inc.date || '').substring(0, 4);
        if (itemYear !== selectedYear) return false;
      }
      return true;
    });
  }, [generalIncomes, selectedYear]);

  const filteredGeneralExpenses = useMemo(() => {
    return generalExpenses.filter(exp => {
      if (selectedYear !== 'all') {
        const itemYear = (exp.date || '').substring(0, 4);
        if (itemYear !== selectedYear) return false;
      }
      return true;
    });
  }, [generalExpenses, selectedYear]);

  // General Totals (Asociación)
  const generalTotals = useMemo(() => {
    let cobrados = 0;
    let facturados = 0;
    let gastos = 0;

    filteredGeneralIncomes.forEach(inc => {
      if (inc.status !== 'cancelado') {
        facturados += inc.amount || 0;
        cobrados += inc.paidAmount ?? 0;
      }
    });

    filteredGeneralExpenses.forEach(exp => {
      gastos += exp.amount || 0;
    });

    return {
      cobrados,
      facturados,
      gastos,
      balance: cobrados - gastos,
      countIncomes: filteredGeneralIncomes.length,
      countExpenses: filteredGeneralExpenses.length
    };
  }, [filteredGeneralIncomes, filteredGeneralExpenses]);

  // Global Combined Totals
  const globalTotals = useMemo(() => {
    const totalCobrados = totals.ingresosCobrados + generalTotals.cobrados;
    const totalFacturados = totals.ingresosFacturados + generalTotals.facturados;
    const totalGastos = totals.gastos + generalTotals.gastos;
    const totalBalance = totalCobrados - totalGastos;

    return {
      totalCobrados,
      totalFacturados,
      totalGastos,
      totalBalance,
      actividadesBalance: totals.balance,
      asociacionBalance: generalTotals.balance
    };
  }, [totals, generalTotals]);

  // Handlers for Detail Modal
  const handleOpenFinancialDetail = (activity: Activity, defaultTab: 'ingresos' | 'gastos' = 'ingresos') => {
    setSelectedActivity(activity);
    setActiveTab(defaultTab);
    setIsEditingExpense(false);
    setIsEditingSponsorship(false);
    resetExpenseForm();
    resetSponsorshipForm();
  };

  const handleCloseFinancialDetail = () => {
    setSelectedActivity(null);
    setIsEditingExpense(false);
    setIsEditingSponsorship(false);
  };

  // Expense form handlers
  const resetExpenseForm = () => {
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
    setEditingExpenseId(expense.id);
    setIsEditingExpense(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      await deleteExpense(id);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    const amountNum = parseFloat(expenseForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Por favor introduce un importe válido mayor que 0.');
      return;
    }

    setUploadingImage(true);
    let finalImageUrl = previewUrl || undefined;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `receipts/${selectedActivity.id}/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, {
          concept: expenseForm.concept.trim(),
          amount: amountNum,
          category: expenseForm.category,
          date: expenseForm.date,
          notes: expenseForm.notes.trim() || undefined,
          receiptImageUrl: finalImageUrl
        });
      } else {
        await addExpense({
          activityId: selectedActivity.id,
          concept: expenseForm.concept.trim(),
          amount: amountNum,
          category: expenseForm.category,
          date: expenseForm.date,
          notes: expenseForm.notes.trim() || undefined,
          receiptImageUrl: finalImageUrl
        });
      }

      setIsEditingExpense(false);
      resetExpenseForm();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      alert('Error al guardar el gasto: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploadingImage(false);
    }
  };

  // Sponsorship form handlers
  const resetSponsorshipForm = () => {
    setSponsorshipForm({
      sponsorName: '',
      concept: '',
      amount: '',
      paidAmount: '',
      status: 'pendiente',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingSponsorshipId(null);
  };

  const handleEditSponsorship = (sponsorship: Sponsorship) => {
    setSponsorshipForm({
      sponsorName: sponsorship.sponsorName,
      concept: sponsorship.concept,
      amount: sponsorship.amount.toString(),
      paidAmount: sponsorship.paidAmount.toString(),
      status: sponsorship.status,
      date: sponsorship.date,
      notes: sponsorship.notes || ''
    });
    setEditingSponsorshipId(sponsorship.id);
    setIsEditingSponsorship(true);
  };

  const handleDeleteSponsorship = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este patrocinio?')) {
      await deleteSponsorship(id);
    }
  };

  const handleSponsorshipStatusChange = (newStatus: SponsorshipStatus) => {
    const currentAmount = parseFloat(sponsorshipForm.amount) || 0;
    let newPaid = sponsorshipForm.paidAmount;

    if (newStatus === 'cobrado') {
      newPaid = currentAmount > 0 ? currentAmount.toString() : '';
    } else if (newStatus === 'cancelado') {
      newPaid = '0';
    }

    setSponsorshipForm(prev => ({
      ...prev,
      status: newStatus,
      paidAmount: newPaid
    }));
  };

  const handleSaveSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    const sponsorName = sponsorshipForm.sponsorName.trim();
    const concept = sponsorshipForm.concept.trim();
    const amountNum = parseFloat(sponsorshipForm.amount);
    let paidAmountNum = parseFloat(sponsorshipForm.paidAmount);

    if (!sponsorName) {
      alert('El nombre del patrocinador es obligatorio.');
      return;
    }
    if (!concept) {
      alert('El concepto del patrocinio es obligatorio.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('El importe comprometido debe ser mayor que 0.');
      return;
    }

    if (sponsorshipForm.status === 'cancelado') {
      paidAmountNum = 0;
    } else {
      if (isNaN(paidAmountNum) || paidAmountNum < 0) {
        paidAmountNum = 0;
      }
      if (paidAmountNum > amountNum) {
        alert('El importe cobrado no puede ser mayor que el importe total comprometido.');
        return;
      }
    }

    try {
      if (editingSponsorshipId) {
        await updateSponsorship(editingSponsorshipId, {
          sponsorName,
          concept,
          amount: amountNum,
          paidAmount: paidAmountNum,
          status: sponsorshipForm.status,
          date: sponsorshipForm.date,
          notes: sponsorshipForm.notes.trim() || undefined
        });
      } else {
        await addSponsorship({
          activityId: selectedActivity.id,
          sponsorName,
          concept,
          amount: amountNum,
          paidAmount: paidAmountNum,
          status: sponsorshipForm.status,
          date: sponsorshipForm.date,
          notes: sponsorshipForm.notes.trim() || undefined
        });
      }

      setIsEditingSponsorship(false);
      resetSponsorshipForm();
    } catch (err: any) {
      console.error('Error saving sponsorship:', err);
      alert('Error al guardar el patrocinio: ' + (err.message || 'Error desconocido'));
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    exportAccountingToExcel({
      year: selectedYear,
      activities: filteredActivities,
      participants,
      sponsorships,
      expenses,
      financesByActivity,
      generalIncomes,
      generalExpenses
    });
  };

  // PDF Export Handlers
  const handleDownloadDetailedPdf = async () => {
    setIsExportingPdf(true);
    const filename = `informe-contable-detallado-${selectedYear === 'all' ? 'todos' : selectedYear}.pdf`;
    try {
      await exportReportToPdf('printable-detailed-report', {
        filename,
        onProgress: (msg) => setPdfProgressText(msg)
      });
    } catch (err) {
      console.error('Error al generar PDF detallado:', err);
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText('');
    }
  };

  const handleDownloadExecutivePdf = async () => {
    setIsExportingPdf(true);
    const filename = `informe-contable-ejecutivo-${selectedYear === 'all' ? 'todos' : selectedYear}.pdf`;
    try {
      await exportReportToPdf('printable-executive-report', {
        filename,
        onProgress: (msg) => setPdfProgressText(msg)
      });
    } catch (err) {
      console.error('Error al generar PDF ejecutivo:', err);
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText('');
    }
  };

  const handleNativePrint = (fallbackFn: () => void) => {
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.warn('Native print failed, triggering direct PDF download:', err);
      fallbackFn();
    }
  };

  // Activity participants and sponsorships for drilldown modal (CON-01: solo 'asistio')
  const selectedActParticipants = useMemo(() => {
    if (!selectedActivity) return [];
    return participants
      .filter(p => p.activityId === selectedActivity.id && p.status === 'asistio')
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [selectedActivity, participants]);

  const selectedActSponsorships = useMemo(() => {
    if (!selectedActivity) return [];
    return sponsorships
      .filter(s => s.activityId === selectedActivity.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedActivity, sponsorships]);

  const selectedActExpenses = useMemo(() => {
    if (!selectedActivity) return [];
    return expenses
      .filter(e => e.activityId === selectedActivity.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedActivity, expenses]);

  return (
    <div className="space-y-6">
      {/* Main Dashboard Content (Hidden in Print when a Report Modal is Open) */}
      <div className={`space-y-6 ${showDetailedReport || showExecutiveReport ? 'print:hidden' : ''}`}>
        {/* TOP BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-light text-wine-900 tracking-tight flex items-center gap-2.5">
            <ActivityIcon className="w-6 h-6 text-wine-600" />
            Control de Cuentas
          </h2>
          <p className="text-xs text-wine-600/80 mt-1">
            Gestión contable, patrocinios, desglose de costes y balance de actividades
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Year selector */}
          <div className="flex items-center gap-2 bg-[#FAF8F5] border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-wine-600 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              aria-label="Seleccionar año contable"
            >
              <option value="all">Todos los años</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <button
            onClick={() => setShowDetailedReport(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer hover:border-slate-400"
            title="Ver informe detallado para descargar en PDF o imprimir"
          >
            <FileText className="w-4 h-4 text-[#521849]" />
            <span>Informe detallado (PDF)</span>
          </button>

          <button
            onClick={() => setShowExecutiveReport(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer hover:border-slate-400"
            title="Ver informe ejecutivo para descargar en PDF o imprimir"
          >
            <Layers className="w-4 h-4 text-[#521849]" />
            <span>Informe ejecutivo (PDF)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Exportar libro Excel completo con 5 hojas contables"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar contabilidad (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Cobrados */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingresos cobrados</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-light text-slate-900 tracking-tight">
              {formatCurrency(globalTotals.totalCobrados)}
            </span>
            <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
              <span>Actividades: <strong className="text-slate-700">{formatCurrency(totals.ingresosCobrados)}</strong></span>
              <span>Asociación: <strong className="text-slate-700">{formatCurrency(generalTotals.cobrados)}</strong></span>
            </div>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gastos Totales</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-light text-rose-600 tracking-tight">
              {formatCurrency(globalTotals.totalGastos)}
            </span>
            <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
              <span>Actividades: <strong className="text-slate-700">{formatCurrency(totals.gastos)}</strong></span>
              <span>Asociación: <strong className="text-slate-700">{formatCurrency(generalTotals.gastos)}</strong></span>
            </div>
          </div>
        </div>

        {/* Balance Neto */}
        <div className={`rounded-2xl shadow-xs border p-5 flex flex-col justify-between ${globalTotals.totalBalance >= 0 ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${globalTotals.totalBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>Balance Neto Total</span>
            <div className={`p-2 rounded-xl ${globalTotals.totalBalance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-3xl font-bold tracking-tight ${globalTotals.totalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {globalTotals.totalBalance >= 0 ? '+' : ''}{formatCurrency(globalTotals.totalBalance)}
            </span>
            <p className={`text-[11px] mt-1 ${globalTotals.totalBalance >= 0 ? 'text-emerald-700/90' : 'text-rose-700/90'}`}>
              Fondo combinado ({selectedYear === 'all' ? 'Histórico completo' : `Año ${selectedYear}`})
            </p>
          </div>
        </div>
        
        {/* Breakdown by scope */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Balance por origen</span>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-wine-700" />
                <span>Asociación</span>
              </span>
              <span className={`font-semibold ${generalTotals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {generalTotals.balance >= 0 ? '+' : ''}{formatCurrency(generalTotals.balance)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <ActivityIcon className="w-3.5 h-3.5 text-[#521849]" />
                <span>Actividades</span>
              </span>
              <span className={`font-semibold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
              <span>{filteredActivities.length} actividades</span>
              <span>{filteredGeneralIncomes.length + filteredGeneralExpenses.length} mov. generales</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION TABS (Sobre la asociación / Sobre las actividades) */}
      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl gap-1.5 border border-slate-200/80">
        <button
          id="tab-btn-asociacion"
          onClick={() => setMainSectionTab('asociacion')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            mainSectionTab === 'asociacion'
              ? 'bg-white text-wine-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-4 h-4 text-wine-700" />
          <span>Sobre la asociación</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            mainSectionTab === 'asociacion' ? 'bg-wine-100 text-wine-800' : 'bg-slate-200/80 text-slate-600'
          }`}>
            {generalTotals.balance >= 0 ? '+' : ''}{formatCurrency(generalTotals.balance)}
          </span>
        </button>

        <button
          id="tab-btn-actividades"
          onClick={() => setMainSectionTab('actividades')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            mainSectionTab === 'actividades'
              ? 'bg-white text-wine-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ActivityIcon className="w-4 h-4 text-[#521849]" />
          <span>Sobre las actividades</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            mainSectionTab === 'actividades' ? 'bg-wine-100 text-wine-800' : 'bg-slate-200/80 text-slate-600'
          }`}>
            {totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance)}
          </span>
        </button>
      </div>

      {/* SECTION CONTENT CONDITIONAL RENDERING */}
      {mainSectionTab === 'asociacion' ? (
        <GeneralAccountsSection selectedYear={selectedYear} />
      ) : (
        /* ACTIVITIES ACCOUNTING TABLE */
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900 text-sm">Cuentas por Actividad ({filteredActivities.length})</h3>
            <span className="text-xs text-slate-400 font-normal">· Pulsa en Ingresos o Gastos para desglosar</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">Actividad</th>
                <th className="p-4 font-semibold">Precios</th>
                <th className="p-4 font-semibold text-center">Asistencia</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Ingresos</th>
                <th className="p-4 font-semibold text-right">Gastos</th>
                <th className="p-4 font-semibold text-right">Gasto / Asist.</th>
                <th className="p-4 font-semibold text-right">Balance</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No hay actividades registradas para el período seleccionado.
                  </td>
                </tr>
              ) : (
                paginatedActivities.map(act => {
                  const fin = financesByActivity[act.id] || {
                    reservasFacturadas: 0,
                    reservasCobradas: 0,
                    patrociniosFacturados: 0,
                    patrociniosCobrados: 0,
                    ingresosFacturados: 0,
                    ingresosCobrados: 0,
                    gastos: 0,
                    balance: 0,
                    hasExpenses: false,
                    asistentes: 0,
                    aforo: act.totalSpots,
                    gastoPorAsistente: 0,
                    numSocios: 0,
                    numNoSocios: 0
                  };

                  const diffCobrado = fin.ingresosFacturados - fin.ingresosCobrados;
                  const occPercentage = fin.aforo > 0 ? Math.min(100, Math.round((fin.asistentes / fin.aforo) * 100)) : 0;
                  
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Actividad */}
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] shrink-0 ${
                            act.type === 'cata' 
                              ? 'bg-[#521849]/10 text-[#521849]' 
                              : act.type === 'curso'
                              ? 'bg-[#C96043]/10 text-[#C96043]'
                              : 'bg-[#4D6233]/10 text-[#4D6233]'
                          }`}>
                            {act.type === 'cata' && <Wine className="w-3 h-3" />}
                            {act.type === 'curso' && <ChefHat className="w-3 h-3" />}
                            {act.type === 'viaje' && <Compass className="w-3 h-3" />}
                            <span className="capitalize">{act.type}</span>
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 line-clamp-1">{act.title}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{formatDate(act.date)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Precios (Socio / No Socio) */}
                      <td className="p-4 whitespace-nowrap">
                        {act.priceMember !== act.priceNonMember ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70 leading-none">
                                Socio
                              </span>
                              <span className="font-bold text-slate-800 text-xs">{act.priceMember}€</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-[#73635B] bg-[#F6F1EA] px-1.5 py-0.5 rounded border border-[#EDE4D7] leading-none">
                                General
                              </span>
                              <span className="font-medium text-slate-600 text-xs">{act.priceNonMember}€</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-800 text-xs">{act.priceMember}€</span>
                        )}
                      </td>

                      {/* Asistencia (ignora lista de espera y canceladas) */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1.5 min-w-[110px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              {fin.asistentes} / {fin.aforo}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              occPercentage >= 100 ? 'bg-emerald-100 text-emerald-800' :
                              occPercentage >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                              occPercentage >= 40 ? 'bg-wine-50 text-wine-700 border border-wine-200/60' :
                              occPercentage > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {occPercentage}%
                            </span>
                          </div>
                          <div className="w-24 bg-slate-100 border border-slate-200/80 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                occPercentage >= 100 ? 'bg-emerald-600' :
                                occPercentage >= 75 ? 'bg-emerald-500' :
                                occPercentage >= 40 ? 'bg-wine-600' :
                                occPercentage > 0 ? 'bg-amber-500' :
                                'bg-slate-200'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, occPercentage))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-4 whitespace-nowrap">
                        {act.status === 'celebrada' ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Celebrada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-wine-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="capitalize">{act.status}</span>
                          </div>
                        )}
                      </td>

                      {/* Ingresos (Drilldown button) */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenFinancialDetail(act, 'ingresos')}
                          className="text-right p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group/ing"
                          aria-label={`Ver detalle de ingresos de ${act.title}`}
                          title="Ver detalle de reservas y patrocinios"
                        >
                          <div className="font-bold text-slate-900 group-hover/ing:text-wine-700 underline-offset-2 group-hover/ing:underline">
                            {formatCurrency(fin.ingresosCobrados)}
                          </div>
                          {diffCobrado > 0 ? (
                            <div className="text-[10px] text-amber-600 mt-0.5 font-medium">
                              Pendiente: {formatCurrency(diffCobrado)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {fin.patrociniosCobrados > 0 ? `Inc. ${formatCurrency(fin.patrociniosCobrados)} patroc.` : 'Cobrado íntegro'}
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Gastos (Drilldown button) */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenFinancialDetail(act, 'gastos')}
                          className="text-right p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group/gst"
                          aria-label={`Ver detalle de gastos de ${act.title}`}
                          title="Ver desglose de gastos y tickets"
                        >
                          {act.status === 'celebrada' && !fin.hasExpenses ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Sin gastos
                            </span>
                          ) : (
                            <div className="font-bold text-rose-600 group-hover/gst:text-rose-700 underline-offset-2 group-hover/gst:underline">
                              {formatCurrency(fin.gastos)}
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Gasto / Asistente */}
                      <td className="p-4 text-right whitespace-nowrap">
                        {fin.asistentes > 0 && fin.gastos > 0 ? (
                          <div className="font-semibold text-slate-700 text-xs">
                            {formatCurrency(fin.gastoPorAsistente)}
                            <span className="text-[10px] text-slate-400 font-normal block">por asistente</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Balance */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className={`font-bold ${fin.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {fin.balance >= 0 ? '+' : ''}{formatCurrency(fin.balance)}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenFinancialDetail(act, 'ingresos')}
                          className="inline-flex items-center justify-center p-2 text-wine-600 hover:bg-wine-50 rounded-xl transition-colors cursor-pointer"
                          title="Abrir detalle financiero"
                          aria-label={`Abrir detalle financiero de ${act.title}`}
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

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredActivities.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="actividades"
        />
      </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETALLE FINANCIERO (INGRESOS / GASTOS) */}
      {/* ========================================================================= */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FAF8F5]">
              <div>
                <h3 className="text-lg font-medium text-slate-900">Detalle Financiero</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-700">{selectedActivity.title}</span> · {formatDate(selectedActivity.date)}
                </p>
              </div>
              <button 
                onClick={handleCloseFinancialDetail}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Financial Figures Banner */}
            {(() => {
              const fin = financesByActivity[selectedActivity.id] || {
                reservasFacturadas: 0,
                reservasCobradas: 0,
                patrociniosFacturados: 0,
                patrociniosCobrados: 0,
                ingresosFacturados: 0,
                ingresosCobrados: 0,
                gastos: 0,
                balance: 0,
                asistentes: 0,
                aforo: selectedActivity.totalSpots,
                gastoPorAsistente: 0
              };

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF8F5] border-b border-slate-200 text-xs">
                  {/* Reservas cobradas */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Reservas cobradas</span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block">
                      {formatCurrency(fin.reservasCobradas)}
                    </span>
                    {fin.reservasFacturadas !== fin.reservasCobradas && (
                      <span className="text-[10px] text-amber-600 block mt-0.5">
                        Facturado: {formatCurrency(fin.reservasFacturadas)}
                      </span>
                    )}
                  </div>

                  {/* Patrocinios cobrados */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Patrocinios cobrados</span>
                    <span className="font-bold text-slate-900 text-sm mt-1 block">
                      {formatCurrency(fin.patrociniosCobrados)}
                    </span>
                    {fin.patrociniosFacturados !== fin.patrociniosCobrados && (
                      <span className="text-[10px] text-amber-600 block mt-0.5">
                        Comprometido: {formatCurrency(fin.patrociniosFacturados)}
                      </span>
                    )}
                  </div>

                  {/* Gastos */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Gastos totales</span>
                    <span className="font-bold text-rose-600 text-sm mt-1 block">
                      {formatCurrency(fin.gastos)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {fin.asistentes > 0 && fin.gastos > 0 ? `${formatCurrency(fin.gastoPorAsistente)} / asist.` : `${fin.asistentes} asistentes`}
                    </span>
                  </div>

                  {/* Balance neto */}
                  <div className={`p-3 rounded-xl border shadow-2xs ${fin.balance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <span className={`text-[10px] uppercase font-bold block ${fin.balance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>Balance Neto</span>
                    <span className={`font-bold text-sm mt-1 block ${fin.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {fin.balance >= 0 ? '+' : ''}{formatCurrency(fin.balance)}
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${fin.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Ingresos - Gastos
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
              <button
                type="button"
                onClick={() => setActiveTab('ingresos')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'ingresos'
                    ? 'border-wine-600 text-wine-900 bg-wine-50/30'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Ingresos</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  {selectedActParticipants.length + selectedActSponsorships.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gastos')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'gastos'
                    ? 'border-wine-600 text-wine-900 bg-wine-50/30'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Gastos</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  {selectedActExpenses.length}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* ========================================================= */}
              {/* TAB 1: INGRESOS */}
              {/* ========================================================= */}
              {activeTab === 'ingresos' && (
                <div className="space-y-8">
                  
                  {/* BLOQUE A: RESERVAS */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Reservas ({selectedActParticipants.length})</h4>
                        <p className="text-xs text-slate-500">Asistentes registrados en esta actividad</p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                              <th className="p-3">Asistente</th>
                              <th className="p-3">Tarifa</th>
                              <th className="p-3 text-right">Total</th>
                              <th className="p-3 text-right">Cobrado</th>
                              <th className="p-3 text-center">Estado</th>
                              <th className="p-3">Método Pago</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedActParticipants.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-400">
                                  No hay reservas registradas para esta actividad.
                                </td>
                              </tr>
                            ) : (
                              selectedActParticipants.map(p => {
                                const total = p.totalAmount || 0;
                                const paid = p.paidAmount ?? 0;
                                const pending = Math.max(0, total - paid);

                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3 font-semibold text-slate-900">
                                      {p.fullName}
                                      {p.spotsCount && p.spotsCount > 1 && (
                                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                                          ({p.spotsCount} plazas)
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {p.isMember ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                          Socio
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F6F1EA] text-[#73635B] border border-[#EDE4D7]">
                                          General
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-medium text-slate-900">
                                      {formatCurrency(total)}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-emerald-700">
                                      {formatCurrency(paid)}
                                      {pending > 0 && (
                                        <span className="text-[10px] text-amber-600 block font-normal">
                                          Pendiente: {formatCurrency(pending)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                        p.status === 'asistio' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        p.status === 'pagada' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                        p.status === 'pendiente_pago' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        p.status === 'lista_de_espera' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                        'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}>
                                        {p.status.replace(/_/g, ' ')}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-600 capitalize">
                                      {p.paymentMethod || 'No especificado'}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          {selectedActParticipants.length > 0 && (
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
                              <tr>
                                <td colSpan={2} className="p-3 text-slate-600">
                                  Totales Reservas ({selectedActParticipants.length} asistentes)
                                </td>
                                <td className="p-3 text-right">
                                  {formatCurrency(selectedActParticipants.reduce((sum, p) => sum + (p.totalAmount || 0), 0))}
                                </td>
                                <td className="p-3 text-right text-emerald-700">
                                  {formatCurrency(selectedActParticipants.reduce((sum, p) => sum + (p.paidAmount ?? 0), 0))}
                                </td>
                                <td colSpan={2} className="p-3 text-right text-[11px] text-amber-700">
                                  Pendiente: {formatCurrency(
                                    selectedActParticipants.reduce((sum, p) => sum + Math.max(0, (p.totalAmount || 0) - (p.paidAmount ?? 0)), 0)
                                  )}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE B: PATROCINIOS */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">Patrocinios y Colaboraciones ({selectedActSponsorships.length})</h4>
                        <p className="text-xs text-slate-500">Ingresos complementarios asociados a la actividad</p>
                      </div>
                      {!isEditingSponsorship && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingSponsorship(true);
                            resetSponsorshipForm();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-wine-700 hover:bg-wine-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Registrar patrocinio</span>
                        </button>
                      )}
                    </div>

                    {/* FORMULARIO PATROCINIO */}
                    {isEditingSponsorship && (
                      <form onSubmit={handleSaveSponsorship} className="bg-[#FAF8F5] p-5 rounded-2xl border border-wine-200 mb-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-wine-100 pb-2">
                          <h5 className="font-semibold text-wine-900 text-xs">
                            {editingSponsorshipId ? 'Editar Patrocinio' : 'Nuevo Patrocinio'}
                          </h5>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingSponsorship(false);
                              resetSponsorshipForm();
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Patrocinador *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Bodegas Lustau"
                              value={sponsorshipForm.sponsorName}
                              onChange={e => setSponsorshipForm({ ...sponsorshipForm, sponsorName: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Concepto *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Aportación para cata"
                              value={sponsorshipForm.concept}
                              onChange={e => setSponsorshipForm({ ...sponsorshipForm, concept: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Importe Comprometido (€) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                              placeholder="0.00"
                              value={sponsorshipForm.amount}
                              onChange={e => setSponsorshipForm({ ...sponsorshipForm, amount: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Estado de Cobro</label>
                            <select
                              value={sponsorshipForm.status}
                              onChange={e => handleSponsorshipStatusChange(e.target.value as SponsorshipStatus)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden cursor-pointer"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="cobrado">Cobrado (Total o Parcial)</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Importe Cobrado (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={sponsorshipForm.amount || undefined}
                              disabled={sponsorshipForm.status === 'cancelado'}
                              placeholder="0.00"
                              value={sponsorshipForm.paidAmount}
                              onChange={e => setSponsorshipForm({ ...sponsorshipForm, paidAmount: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden disabled:bg-slate-100 text-emerald-700 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Fecha *</label>
                            <input
                              type="date"
                              required
                              value={sponsorshipForm.date}
                              onChange={e => setSponsorshipForm({ ...sponsorshipForm, date: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-xs">Notas contables / auditoría</label>
                          <textarea
                            rows={2}
                            placeholder="Detalles sobre el convenio, factura o método de pago..."
                            value={sponsorshipForm.notes}
                            onChange={e => setSponsorshipForm({ ...sponsorshipForm, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden text-xs"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingSponsorship(false);
                              resetSponsorshipForm();
                            }}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-wine-700 hover:bg-wine-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
                          >
                            {editingSponsorshipId ? 'Actualizar Patrocinio' : 'Guardar Patrocinio'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* TABLA PATROCINIOS */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                              <th className="p-3">Patrocinador</th>
                              <th className="p-3">Concepto</th>
                              <th className="p-3">Fecha</th>
                              <th className="p-3 text-right">Comprometido</th>
                              <th className="p-3 text-right">Cobrado</th>
                              <th className="p-3 text-center">Estado</th>
                              <th className="p-3 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedActSponsorships.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-400">
                                  No hay patrocinios registrados para esta actividad.
                                </td>
                              </tr>
                            ) : (
                              selectedActSponsorships.map(s => {
                                const pending = s.status === 'cancelado' ? 0 : Math.max(0, s.amount - s.paidAmount);

                                return (
                                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3 font-semibold text-slate-900">
                                      {s.sponsorName}
                                      {s.notes && (
                                        <span className="text-[10px] text-slate-400 font-normal block">
                                          {s.notes}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-slate-600">
                                      {s.concept}
                                    </td>
                                    <td className="p-3 text-slate-500 whitespace-nowrap">
                                      {formatDate(s.date)}
                                    </td>
                                    <td className="p-3 text-right font-medium text-slate-900">
                                      {formatCurrency(s.amount)}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-emerald-700">
                                      {formatCurrency(s.paidAmount)}
                                      {pending > 0 && (
                                        <span className="text-[10px] text-amber-600 block font-normal">
                                          Pendiente: {formatCurrency(pending)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                        s.status === 'cobrado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        s.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        'bg-slate-100 text-slate-500 border border-slate-200'
                                      }`}>
                                        {s.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center whitespace-nowrap">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleEditSponsorship(s)}
                                          className="p-1 text-slate-400 hover:text-wine-600 hover:bg-wine-50 rounded-lg transition-colors cursor-pointer"
                                          title="Editar patrocinio"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSponsorship(s.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                          title="Eliminar patrocinio"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          {selectedActSponsorships.length > 0 && (
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
                              <tr>
                                <td colSpan={3} className="p-3 text-slate-600">
                                  Totales Patrocinios
                                </td>
                                <td className="p-3 text-right">
                                  {formatCurrency(selectedActSponsorships.filter(s => s.status !== 'cancelado').reduce((sum, s) => sum + s.amount, 0))}
                                </td>
                                <td className="p-3 text-right text-emerald-700">
                                  {formatCurrency(selectedActSponsorships.filter(s => s.status !== 'cancelado').reduce((sum, s) => sum + s.paidAmount, 0))}
                                </td>
                                <td colSpan={2} className="p-3 text-right text-[11px] text-amber-700">
                                  Pendiente: {formatCurrency(
                                    selectedActSponsorships.filter(s => s.status !== 'cancelado').reduce((sum, s) => sum + Math.max(0, s.amount - s.paidAmount), 0)
                                  )}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: GASTOS */}
              {/* ========================================================= */}
              {activeTab === 'gastos' && (
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Expense List */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          Gastos Imputados ({selectedActExpenses.length})
                        </h4>
                        <p className="text-xs text-slate-500">
                          Total gastos: <span className="font-bold text-rose-600">{formatCurrency(selectedActExpenses.reduce((sum, e) => sum + e.amount, 0))}</span>
                        </p>
                      </div>
                      {!isEditingExpense && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingExpense(true);
                            resetExpenseForm();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-wine-700 hover:bg-wine-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir Gasto</span>
                        </button>
                      )}
                    </div>

                    {selectedActExpenses.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 font-medium">No hay gastos imputados a esta actividad</p>
                        <p className="text-xs text-slate-400 mt-1">Registra tickets, facturas de bodega o transporte</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedActExpenses.map(exp => (
                          <div 
                            key={exp.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[exp.category]}`}>
                                  {CATEGORY_LABELS[exp.category]}
                                </span>
                                <span className="text-xs text-slate-400">{formatDate(exp.date)}</span>
                              </div>
                              <div className="font-semibold text-slate-900 text-sm">{exp.concept}</div>
                              {exp.notes && <p className="text-xs text-slate-500">{exp.notes}</p>}
                              {exp.receiptImageUrl && (
                                <a 
                                  href={exp.receiptImageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 text-[11px] text-wine-600 hover:underline mt-1"
                                >
                                  <Upload className="w-3 h-3" /> Ver ticket / factura
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                              <span className="font-bold text-rose-600 text-base">
                                {formatCurrency(exp.amount)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditExpense(exp)}
                                  className="p-1 text-slate-400 hover:text-wine-600 hover:bg-wine-50 rounded-lg transition-colors cursor-pointer"
                                  title="Editar gasto"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar gasto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expense Form */}
                  {isEditingExpense && (
                    <div className="w-full md:w-80 bg-[#FAF8F5] p-5 rounded-2xl border border-wine-200 shrink-0">
                      <div className="flex justify-between items-center mb-4 border-b border-wine-100 pb-2">
                        <h4 className="font-semibold text-wine-900 text-xs">
                          {editingExpenseId ? 'Editar Gasto' : 'Nuevo Gasto'}
                        </h4>
                        <button 
                          onClick={() => { setIsEditingExpense(false); resetExpenseForm(); }} 
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Concepto *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Factura vino mencía"
                            value={expenseForm.concept}
                            onChange={e => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Importe (€) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
                            value={expenseForm.amount}
                            onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden font-bold text-rose-600"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                          <select
                            value={expenseForm.category}
                            onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden cursor-pointer"
                          >
                            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                              <option key={cat} value={cat}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
                          <input
                            type="date"
                            required
                            value={expenseForm.date}
                            onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Ticket / Factura (Opcional)</label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setImageFile(e.target.files[0]);
                                setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                            className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-wine-100 file:text-wine-700 hover:file:bg-wine-200 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Notas</label>
                          <textarea
                            rows={2}
                            placeholder="Detalles sobre el proveedor o desglose..."
                            value={expenseForm.notes}
                            onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-wine-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={uploadingImage}
                            className="w-full flex items-center justify-center gap-2 bg-wine-700 hover:bg-wine-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-70 cursor-pointer shadow-2xs"
                          >
                            {uploadingImage ? (
                              <span>Guardando...</span>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                <span>{editingExpenseId ? 'Actualizar Gasto' : 'Guardar Gasto'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      </div> {/* End Main Dashboard Content */}

      {/* ========================================================================= */}
      {/* MODAL 4.1: INFORME DETALLADO (PRINT / PDF) */}
      {/* ========================================================================= */}
      {showDetailedReport && (
        <div className="report-print-backdrop fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:m-0 print:bg-white print:static print:inset-auto print:block print:w-full print:h-auto print:max-h-none print:overflow-visible print:z-auto">
          <div className="report-print-dialog bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:max-w-none print:w-full print:max-h-none print:h-auto print:overflow-visible print:border-none print:rounded-none print:shadow-none print:m-0 print:p-0 print:animate-none print:static">
            
            {/* Header / Controls */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#521849]" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Informe Contable Detallado ({selectedYear === 'all' ? 'Todos los años' : selectedYear})
                  </h3>
                  <span className="text-xs text-slate-500 block">
                    Exportación a PDF con todas las páginas necesarias o impresión en A4
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pageBreakPerActivity}
                    onChange={(e) => setPageBreakPerActivity(e.target.checked)}
                    className="w-4 h-4 rounded text-[#521849] focus:ring-[#521849] border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium">Salto de página por actividad</span>
                </label>

                {/* Primary Button: Direct PDF Download (works reliably in all browsers & iframes) */}
                <button
                  type="button"
                  onClick={handleDownloadDetailedPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#521849] hover:bg-[#3E1037] active:scale-98 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed border border-[#3E1037]/30"
                  title="Descargar archivo PDF completo a tu ordenador"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{pdfProgressText || 'Generando PDF...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar PDF (.pdf)</span>
                    </>
                  )}
                </button>

                {/* Secondary Button: Browser Native Print */}
                <button
                  type="button"
                  onClick={() => handleNativePrint(handleDownloadDetailedPdf)}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 active:scale-98 rounded-xl transition-colors cursor-pointer shadow-2xs border border-slate-300"
                  title="Abrir diálogo de impresión del navegador"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDetailedReport(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  aria-label="Cerrar informe"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print & PDF Help Notice */}
            <div className="px-6 py-2.5 bg-amber-50/90 border-b border-amber-200/70 text-[11px] text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  Pulsa <strong>"Descargar PDF"</strong> para guardar el archivo oficial con todas las páginas completas en tu equipo. También puedes usar <strong>"Imprimir"</strong> para enviar a tu impresora física.
                </span>
              </span>
              {isExportingPdf && (
                <span className="shrink-0 flex items-center gap-1 font-semibold text-[#521849] bg-white/90 px-2.5 py-0.5 rounded-lg border border-[#E2BCE0]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{pdfProgressText}</span>
                </span>
              )}
            </div>

            {/* Printable Report Content */}
            <div id="printable-detailed-report" className="report-print-content flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-slate-800 print:p-0 print:overflow-visible print:h-auto print:max-h-none print:block">
              
              {/* Official Document Header */}
              <div className="border-b-2 border-slate-800 pb-4 print:break-after-avoid">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-wine-800 block">
                      Doña Berenjena · Asociación Cultural Gastronómica
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                      Informe Contable Detallado de Actividades
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      Ejercicio: <strong>{selectedYear === 'all' ? 'Histórico Completo (Todos los años)' : `Año ${selectedYear}`}</strong> · 
                      Emitido el {formatDate(new Date().toISOString())} · 
                      {filteredActivities.length} actividades analizadas
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 hidden sm:block print:block">
                    <span className="font-semibold text-slate-700 block">Auditoría y Control Interno</span>
                    <span>Formato Oficial A4</span>
                  </div>
                </div>

                {/* Executive KPI Summary strip on Page 1 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs print:grid-cols-4 print:gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:p-2 print:bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Facturación Total</span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{formatCurrency(totals.ingresosFacturados)}</span>
                    <span className="text-[10px] text-slate-500">Reservas + Patrocinios</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:p-2 print:bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Cobros Efectivos</span>
                    <span className="text-sm font-bold text-emerald-700 mt-0.5 block">{formatCurrency(totals.ingresosCobrados)}</span>
                    <span className="text-[10px] text-slate-500">Ingresos realizados</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:p-2 print:bg-slate-50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Gastos Totales</span>
                    <span className="text-sm font-bold text-rose-700 mt-0.5 block">{formatCurrency(totals.gastos)}</span>
                    <span className="text-[10px] text-slate-500">{expenses.length} partidas de gasto</span>
                  </div>
                  <div className={`p-3 rounded-xl border print:p-2 ${totals.balance >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                    <span className="text-[10px] uppercase font-bold block">Balance Neto</span>
                    <span className="text-sm font-bold mt-0.5 block">{totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance)}</span>
                    <span className="text-[10px] opacity-80">Resultado consolidado</span>
                  </div>
                </div>
              </div>

              {/* Activities Loop */}
              <div className="space-y-6 print:space-y-4">
                {filteredActivities.map((act, actIndex) => {
                  const fin = financesByActivity[act.id] || {
                    reservasFacturadas: 0,
                    reservasCobradas: 0,
                    patrociniosFacturados: 0,
                    patrociniosCobrados: 0,
                    ingresosFacturados: 0,
                    ingresosCobrados: 0,
                    gastos: 0,
                    balance: 0,
                    asistentes: 0
                  };

                  const actParticipants = participants
                    .filter(p => p.activityId === act.id && p.status === 'asistio')
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));

                  const actSponsorshipsList = sponsorships
                    .filter(s => s.activityId === act.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  const actExpensesList = expenses
                    .filter(e => e.activityId === act.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  return (
                    <div 
                      key={act.id} 
                      className={`report-activity-block border border-slate-300 rounded-xl p-4 sm:p-5 space-y-4 print:border-slate-300 print:rounded-lg print:p-3 print:mb-5 print:break-inside-auto ${pageBreakPerActivity && actIndex > 0 ? 'print-page-break' : ''}`}
                    >
                      
                      {/* Activity Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5 print:break-after-avoid">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">#{actIndex + 1}</span>
                            <h3 className="text-base font-bold text-slate-900">{act.title}</h3>
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="capitalize font-semibold text-wine-800">{act.type}</span>
                            <span>•</span>
                            <span>{formatDate(act.date)}</span>
                            <span>•</span>
                            <span className="capitalize">{act.status}</span>
                            <span>•</span>
                            <span>{actParticipants.length} asistentes confirmados (Aforo: {act.totalSpots})</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-xs print:text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            Cobrado: <strong>{formatCurrency(fin.ingresosCobrados)}</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Gastos: <strong>{formatCurrency(fin.gastos)}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold border ${fin.balance >= 0 ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}>
                            Balance: {fin.balance >= 0 ? '+' : ''}{formatCurrency(fin.balance)}
                          </span>
                        </div>
                      </div>

                      {/* 1. Reservas (Nombre y Apellido SOLAMENTE) */}
                      <div className="space-y-1.5 print:break-inside-auto">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 print:break-after-avoid">
                          Reservas y Asistentes ({actParticipants.length} asistentes confirmados)
                        </h4>
                        {actParticipants.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Sin reservas registradas para esta actividad.</p>
                        ) : (
                          <table className="report-table w-full text-xs text-left border-collapse border border-slate-300 print:text-[9.5px]">
                            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 print:bg-slate-100">
                              <tr className="print:break-inside-avoid">
                                <th className="p-2 border border-slate-300">Asistente</th>
                                <th className="p-2 border border-slate-300">Tarifa</th>
                                <th className="p-2 border border-slate-300 text-right">Facturado</th>
                                <th className="p-2 border border-slate-300 text-right">Cobrado</th>
                                <th className="p-2 border border-slate-300 text-right">Pendiente</th>
                                <th className="p-2 border border-slate-300 text-center">Estado</th>
                                <th className="p-2 border border-slate-300">Método</th>
                              </tr>
                            </thead>
                            <tbody>
                              {actParticipants.map(p => {
                                const total = p.totalAmount || 0;
                                const cobrado = p.paidAmount ?? 0;
                                const pendiente = Math.max(0, total - cobrado);
                                return (
                                  <tr key={p.id} className="print:break-inside-avoid hover:bg-slate-50/50">
                                    <td className="p-2 border border-slate-200 font-medium text-slate-900">{p.fullName}</td>
                                    <td className="p-2 border border-slate-200">{p.isMember ? 'Socio' : 'General'}</td>
                                    <td className="p-2 border border-slate-200 text-right">{formatCurrency(total)}</td>
                                    <td className="p-2 border border-slate-200 text-right text-emerald-700 font-semibold">{formatCurrency(cobrado)}</td>
                                    <td className="p-2 border border-slate-200 text-right text-amber-700 font-medium">{pendiente > 0 ? formatCurrency(pendiente) : '-'}</td>
                                    <td className="p-2 border border-slate-200 text-center capitalize">{p.status}</td>
                                    <td className="p-2 border border-slate-200 capitalize">{p.paymentMethod || 'No especificado'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-800 text-[11px] print:bg-slate-100">
                              <tr className="print:break-inside-avoid">
                                <td colSpan={2} className="p-2 border border-slate-300 uppercase text-[10px]">
                                  Subtotal Reservas ({actParticipants.length} asistentes)
                                </td>
                                <td className="p-2 border border-slate-300 text-right">{formatCurrency(fin.reservasFacturadas)}</td>
                                <td className="p-2 border border-slate-300 text-right text-emerald-700">{formatCurrency(fin.reservasCobradas)}</td>
                                <td className="p-2 border border-slate-300 text-right text-amber-700">
                                  {formatCurrency(Math.max(0, fin.reservasFacturadas - fin.reservasCobradas))}
                                </td>
                                <td colSpan={2} className="p-2 border border-slate-300 text-slate-500 text-[10px] text-center font-normal">
                                  {fin.reservasFacturadas === fin.reservasCobradas ? 'Al corriente de pago' : 'Pagos pendientes'}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        )}
                      </div>

                      {/* 2. Patrocinios */}
                      <div className="space-y-1.5 print:break-inside-auto">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 print:break-after-avoid">
                          Patrocinios ({actSponsorshipsList.length})
                        </h4>
                        {actSponsorshipsList.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Sin patrocinios asociados a esta actividad.</p>
                        ) : (
                          <table className="report-table w-full text-xs text-left border-collapse border border-slate-300 print:text-[9.5px]">
                            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 print:bg-slate-100">
                              <tr className="print:break-inside-avoid">
                                <th className="p-2 border border-slate-300">Patrocinador</th>
                                <th className="p-2 border border-slate-300">Concepto</th>
                                <th className="p-2 border border-slate-300">Fecha</th>
                                <th className="p-2 border border-slate-300 text-right">Comprometido</th>
                                <th className="p-2 border border-slate-300 text-right">Cobrado</th>
                                <th className="p-2 border border-slate-300 text-right">Pendiente</th>
                                <th className="p-2 border border-slate-300 text-center">Estado</th>
                                <th className="p-2 border border-slate-300">Notas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {actSponsorshipsList.map(s => {
                                const pendiente = Math.max(0, s.amount - s.paidAmount);
                                return (
                                  <tr key={s.id} className="print:break-inside-avoid hover:bg-slate-50/50">
                                    <td className="p-2 border border-slate-200 font-medium text-slate-900">{s.sponsorName}</td>
                                    <td className="p-2 border border-slate-200">{s.concept}</td>
                                    <td className="p-2 border border-slate-200">{formatDate(s.date)}</td>
                                    <td className="p-2 border border-slate-200 text-right">{formatCurrency(s.amount)}</td>
                                    <td className="p-2 border border-slate-200 text-right text-emerald-700 font-semibold">{formatCurrency(s.paidAmount)}</td>
                                    <td className="p-2 border border-slate-200 text-right text-amber-700 font-medium">{pendiente > 0 ? formatCurrency(pendiente) : '-'}</td>
                                    <td className="p-2 border border-slate-200 text-center capitalize">{s.status}</td>
                                    <td className="p-2 border border-slate-200 text-slate-500">{s.notes || '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-800 text-[11px] print:bg-slate-100">
                              <tr className="print:break-inside-avoid">
                                <td colSpan={3} className="p-2 border border-slate-300 uppercase text-[10px]">
                                  Subtotal Patrocinios ({actSponsorshipsList.length})
                                </td>
                                <td className="p-2 border border-slate-300 text-right">{formatCurrency(fin.patrociniosFacturados)}</td>
                                <td className="p-2 border border-slate-300 text-right text-emerald-700">{formatCurrency(fin.patrociniosCobrados)}</td>
                                <td className="p-2 border border-slate-300 text-right text-amber-700">
                                  {formatCurrency(Math.max(0, fin.patrociniosFacturados - fin.patrociniosCobrados))}
                                </td>
                                <td colSpan={2} className="p-2 border border-slate-300"></td>
                              </tr>
                            </tfoot>
                          </table>
                        )}
                      </div>

                      {/* 3. Gastos (Sin imágenes) */}
                      <div className="space-y-1.5 print:break-inside-auto">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 print:break-after-avoid">
                          Gastos Imputados ({actExpensesList.length})
                        </h4>
                        {actExpensesList.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Sin gastos imputados a esta actividad.</p>
                        ) : (
                          <table className="report-table w-full text-xs text-left border-collapse border border-slate-300 print:text-[9.5px]">
                            <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 print:bg-slate-100">
                              <tr className="print:break-inside-avoid">
                                <th className="p-2 border border-slate-300">Concepto</th>
                                <th className="p-2 border border-slate-300">Categoría</th>
                                <th className="p-2 border border-slate-300">Fecha</th>
                                <th className="p-2 border border-slate-300 text-right">Importe</th>
                                <th className="p-2 border border-slate-300">Notas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {actExpensesList.map(e => (
                                <tr key={e.id} className="print:break-inside-avoid hover:bg-slate-50/50">
                                  <td className="p-2 border border-slate-200 font-medium text-slate-900">{e.concept}</td>
                                  <td className="p-2 border border-slate-200">{CATEGORY_LABELS[e.category] || e.category}</td>
                                  <td className="p-2 border border-slate-200">{formatDate(e.date)}</td>
                                  <td className="p-2 border border-slate-200 text-right text-rose-700 font-semibold">{formatCurrency(e.amount)}</td>
                                  <td className="p-2 border border-slate-200 text-slate-500">{e.notes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-800 text-[11px] print:bg-slate-100">
                              <tr className="print:break-inside-avoid">
                                <td colSpan={3} className="p-2 border border-slate-300 uppercase text-[10px]">
                                  Subtotal Gastos ({actExpensesList.length} partidas)
                                </td>
                                <td className="p-2 border border-slate-300 text-right text-rose-700">{formatCurrency(fin.gastos)}</td>
                                <td className="p-2 border border-slate-300"></td>
                              </tr>
                            </tfoot>
                          </table>
                        )}
                      </div>

                      {/* Activity Balance Strip */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-wrap justify-between items-center text-xs print:bg-slate-50 print:p-2 print:break-inside-avoid">
                        <span className="font-semibold text-slate-700">
                          Resumen Financiero: <span className="font-normal text-slate-600">{act.title}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600">Total Cobrado: <strong className="text-slate-900">{formatCurrency(fin.ingresosCobrados)}</strong></span>
                          <span className="text-slate-600">Total Gastos: <strong className="text-rose-700">{formatCurrency(fin.gastos)}</strong></span>
                          <span className={`font-bold ${fin.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            Resultado: {fin.balance >= 0 ? '+' : ''}{formatCurrency(fin.balance)}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Global Totals Footer */}
              <div className="report-totals-footer border-t-2 border-slate-400 pt-6 space-y-4 print:break-inside-avoid">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Liquidación y Totales Globales del Ejercicio
                    </h3>
                    <p className="text-xs text-slate-500">
                      Totales acumulados correspondientes a {filteredActivities.length} actividades procesadas
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                    Ejercicio: {selectedYear === 'all' ? 'Todos los años' : selectedYear}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:grid-cols-4 print:gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:p-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Reservas Cobradas</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{formatCurrency(totals.reservasCobradas)}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Facturado: {formatCurrency(totals.reservasFacturadas)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:p-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Patrocinios Cobrados</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{formatCurrency(totals.patrociniosCobrados)}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Comprometido: {formatCurrency(totals.patrociniosFacturados)}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:p-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Gastos Totales</span>
                    <span className="font-bold text-rose-700 text-sm mt-0.5 block">{formatCurrency(totals.gastos)}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{expenses.length} justificantes contables</span>
                  </div>
                  <div className={`p-3 rounded-xl border font-bold print:p-2 ${totals.balance >= 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
                    <span className="block text-[10px] uppercase">Balance Neto Consolidado</span>
                    <span className="text-base font-extrabold mt-0.5 block">{totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance)}</span>
                    <span className="text-[10px] opacity-80 block font-normal mt-0.5">Cobros menos gastos</span>
                  </div>
                </div>

                {/* Audit Disclaimer footnote */}
                <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
                  <span>
                    Documento contable oficial emitido por la Asociación Cultural Doña Berenjena. Contiene el desglose nominal de asistentes conforme a las disposiciones de protección de datos (sin exposición de datos de contacto).
                  </span>
                  <span className="shrink-0 font-medium text-slate-600">
                    Generado: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4.2: INFORME EJECUTIVO (PRINT / PDF) */}
      {/* ========================================================================= */}
      {showExecutiveReport && (
        <div className="report-print-backdrop fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:m-0 print:bg-white print:static print:inset-auto print:block print:w-full print:h-auto print:max-h-none print:overflow-visible print:z-auto">
          <div className="report-print-dialog bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:max-w-none print:w-full print:max-h-none print:h-auto print:overflow-visible print:border-none print:rounded-none print:shadow-none print:m-0 print:p-0 print:animate-none print:static">
            
            {/* Header / Controls */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#521849]" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Informe Contable Ejecutivo ({selectedYear === 'all' ? 'Todos los años' : selectedYear})
                  </h3>
                  <span className="text-xs text-slate-500 block">
                    Resumen consolidado de ingresos, patrocinios y costes en A4
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Primary Button: Direct PDF Download */}
                <button
                  type="button"
                  onClick={handleDownloadExecutivePdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#521849] hover:bg-[#3E1037] active:scale-98 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed border border-[#3E1037]/30"
                  title="Descargar archivo PDF ejecutivo a tu ordenador"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{pdfProgressText || 'Generando PDF...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar PDF (.pdf)</span>
                    </>
                  )}
                </button>

                {/* Secondary Button: Native Print */}
                <button
                  type="button"
                  onClick={() => handleNativePrint(handleDownloadExecutivePdf)}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 active:scale-98 rounded-xl transition-colors cursor-pointer shadow-2xs border border-slate-300"
                  title="Abrir diálogo de impresión del navegador"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExecutiveReport(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  aria-label="Cerrar informe"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print & PDF Help Notice */}
            <div className="px-6 py-2.5 bg-amber-50/90 border-b border-amber-200/70 text-[11px] text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden">
              <span className="flex items-center gap-1.5">
                <span>💡</span>
                <span>
                  Pulsa <strong>"Descargar PDF"</strong> para obtener el informe ejecutivo listo para archivo contable o presentaciones.
                </span>
              </span>
              {isExportingPdf && (
                <span className="shrink-0 flex items-center gap-1 font-semibold text-[#521849] bg-white/90 px-2.5 py-0.5 rounded-lg border border-[#E2BCE0]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{pdfProgressText}</span>
                </span>
              )}
            </div>

            {/* Printable Report Content */}
            <div id="printable-executive-report" className="report-print-content flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-slate-800 print:p-0 print:overflow-visible print:h-auto print:max-h-none print:block">
              
              {/* Report Title */}
              <div className="border-b-2 border-slate-800 pb-4 print:break-after-avoid">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-wine-800 block">
                      Doña Berenjena · Asociación Cultural Gastronómica
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                      Informe Ejecutivo de Cuentas
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      Ejercicio: <strong>{selectedYear === 'all' ? 'Histórico Completo (Todos los años)' : `Año ${selectedYear}`}</strong> · 
                      Resumen financiero agregado sin datos personales · Generado el {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500 hidden sm:block print:block">
                    <span className="font-semibold text-slate-700 block">Resumen de Dirección</span>
                    <span>Formato Oficial A4</span>
                  </div>
                </div>
              </div>

              {/* Compact Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs print:border-slate-300 print:rounded-none">
                <table className="report-table w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-bold text-slate-700 print:bg-slate-100">
                    <tr className="print:break-inside-avoid">
                      <th className="p-2.5 border border-slate-300">Actividad</th>
                      <th className="p-2.5 border border-slate-300">Tipo</th>
                      <th className="p-2.5 border border-slate-300">Fecha</th>
                      <th className="p-2.5 border border-slate-300 text-center">Nº Socios</th>
                      <th className="p-2.5 border border-slate-300 text-center">Nº No Socios</th>
                      <th className="p-2.5 border border-slate-300 text-right">Reservas Cobradas</th>
                      <th className="p-2.5 border border-slate-300 text-right">Patrocinios Cobrados</th>
                      <th className="p-2.5 border border-slate-300 text-right">Gastos</th>
                      <th className="p-2.5 border border-slate-300 text-right">Balance Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredActivities.map(act => {
                      const fin = financesByActivity[act.id] || {
                        reservasFacturadas: 0,
                        reservasCobradas: 0,
                        patrociniosFacturados: 0,
                        patrociniosCobrados: 0,
                        ingresosFacturados: 0,
                        ingresosCobrados: 0,
                        gastos: 0,
                        balance: 0,
                        asistentes: 0,
                        numSocios: 0,
                        numNoSocios: 0
                      };

                      return (
                        <tr key={act.id} className="print:break-inside-avoid hover:bg-slate-50/60 transition-colors">
                          <td className="p-2.5 border border-slate-200 font-semibold text-slate-900">{act.title}</td>
                          <td className="p-2.5 border border-slate-200 capitalize text-slate-600">{act.type}</td>
                          <td className="p-2.5 border border-slate-200 text-slate-500">{formatDate(act.date)}</td>
                          <td className="p-2.5 border border-slate-200 text-center font-medium">{fin.numSocios}</td>
                          <td className="p-2.5 border border-slate-200 text-center font-medium">{fin.numNoSocios}</td>
                          <td className="p-2.5 border border-slate-200 text-right font-medium text-slate-900">{formatCurrency(fin.reservasCobradas)}</td>
                          <td className="p-2.5 border border-slate-200 text-right font-medium text-slate-900">{formatCurrency(fin.patrociniosCobrados)}</td>
                          <td className="p-2.5 border border-slate-200 text-right font-medium text-rose-700">{formatCurrency(fin.gastos)}</td>
                          <td className={`p-2.5 border border-slate-200 text-right font-bold ${fin.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {fin.balance >= 0 ? '+' : ''}{formatCurrency(fin.balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900 print:bg-slate-100">
                    <tr className="print:break-inside-avoid">
                      <td colSpan={3} className="p-2.5 border border-slate-300 text-slate-700 uppercase tracking-wider text-[10px]">
                        Totales Globales ({filteredActivities.length} actividades)
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center">
                        {filteredActivities.reduce((sum, a) => sum + (financesByActivity[a.id]?.numSocios || 0), 0)}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center">
                        {filteredActivities.reduce((sum, a) => sum + (financesByActivity[a.id]?.numNoSocios || 0), 0)}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-right">{formatCurrency(totals.reservasCobradas)}</td>
                      <td className="p-2.5 border border-slate-300 text-right">{formatCurrency(totals.patrociniosCobrados)}</td>
                      <td className="p-2.5 border border-slate-300 text-right text-rose-700">{formatCurrency(totals.gastos)}</td>
                      <td className={`p-2.5 border border-slate-300 text-right text-sm ${totals.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {totals.balance >= 0 ? '+' : ''}{formatCurrency(totals.balance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Sub-totals by type breakdown */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-slate-200 space-y-3 print:bg-white print:border-slate-300 print:rounded-lg print:p-3 print:break-inside-avoid">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Subtotales por Tipo de Actividad</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs print:grid-cols-3 print:gap-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 print:p-2 print:border-slate-300">
                    <span className="font-bold text-slate-800 block">Catas</span>
                    <span className={`font-semibold text-sm mt-1 block ${totals.typeBreakdown.cata >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Balance: {totals.typeBreakdown.cata >= 0 ? '+' : ''}{formatCurrency(totals.typeBreakdown.cata)}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 print:p-2 print:border-slate-300">
                    <span className="font-bold text-slate-800 block">Cursos</span>
                    <span className={`font-semibold text-sm mt-1 block ${totals.typeBreakdown.curso >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Balance: {totals.typeBreakdown.curso >= 0 ? '+' : ''}{formatCurrency(totals.typeBreakdown.curso)}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 print:p-2 print:border-slate-300">
                    <span className="font-bold text-slate-800 block">Viajes</span>
                    <span className={`font-semibold text-sm mt-1 block ${totals.typeBreakdown.viaje >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      Balance: {totals.typeBreakdown.viaje >= 0 ? '+' : ''}{formatCurrency(totals.typeBreakdown.viaje)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
