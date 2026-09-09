import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { AnnualMembershipFeesRecord, MemberFeeItem, PaymentMethod } from '../../types';
import { 
  X, 
  Users, 
  Search, 
  Check, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Save, 
  Sparkles, 
  RotateCcw,
  Calendar,
  CreditCard,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

interface MemberFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: number;
}

export const MemberFeesModal: React.FC<MemberFeesModalProps> = ({
  isOpen,
  onClose,
  initialYear
}) => {
  const { members, annualMembershipFees, saveAnnualMembershipFees } = useData();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pagada' | 'pendiente'>('all');
  const [defaultFeeInput, setDefaultFeeInput] = useState<number>(50);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Local editable record
  const [currentFees, setCurrentFees] = useState<Record<string, MemberFeeItem>>({});

  // When year or isOpen changes, load or initialize the record for selectedYear
  useEffect(() => {
    if (!isOpen) return;

    const existingRecord = annualMembershipFees.find(r => r.year === selectedYear);
    const initialFeeItems: Record<string, MemberFeeItem> = {};

    // 1. If existing record has fees, populate from it
    if (existingRecord && existingRecord.fees) {
      Object.entries(existingRecord.fees as Record<string, MemberFeeItem>).forEach(([memberId, item]) => {
        initialFeeItems[memberId] = { ...item };
      });
      if (existingRecord.defaultFeeAmount) {
        setDefaultFeeInput(existingRecord.defaultFeeAmount);
      }
    }

    // 2. Ensure all active members in `members` exist in initialFeeItems
    const activeMembers = members.filter(m => m.active);
    activeMembers.forEach(member => {
      if (!initialFeeItems[member.id]) {
        initialFeeItems[member.id] = {
          memberId: member.id,
          memberName: member.fullName,
          membershipNumber: member.membershipNumber,
          email: member.email,
          phone: member.phone,
          feeAmount: defaultFeeInput || 50,
          status: 'pendiente'
        };
      } else {
        // Sync name/number in case member was edited
        initialFeeItems[member.id].memberName = member.fullName;
        initialFeeItems[member.id].membershipNumber = member.membershipNumber;
        initialFeeItems[member.id].email = member.email;
        initialFeeItems[member.id].phone = member.phone;
      }
    });

    setCurrentFees(initialFeeItems);
  }, [isOpen, selectedYear, annualMembershipFees, members]);

  // Calculations
  const feeItemsArray = useMemo(() => Object.values(currentFees), [currentFees]);

  const filteredFeeItems = useMemo(() => {
    return feeItemsArray.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = item.memberName.toLowerCase().includes(query);
        const numMatch = (item.membershipNumber || '').toLowerCase().includes(query);
        const emailMatch = (item.email || '').toLowerCase().includes(query);
        if (!nameMatch && !numMatch && !emailMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort by membership number if available, then by name
      if (a.membershipNumber && b.membershipNumber) {
        return a.membershipNumber.localeCompare(b.membershipNumber, undefined, { numeric: true });
      }
      return a.memberName.localeCompare(b.memberName);
    });
  }, [feeItemsArray, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalMembers = feeItemsArray.length;
    const paidItems = feeItemsArray.filter(f => f.status === 'pagada');
    const paidCount = paidItems.length;
    const pendingCount = totalMembers - paidCount;
    const totalAssigned = feeItemsArray.reduce((acc, f) => acc + (Number(f.feeAmount) || 0), 0);
    const totalCollected = paidItems.reduce((acc, f) => acc + (Number(f.feeAmount) || 0), 0);
    const totalPending = totalAssigned - totalCollected;

    return {
      totalMembers,
      paidCount,
      pendingCount,
      totalAssigned,
      totalCollected,
      totalPending
    };
  }, [feeItemsArray]);

  // Handlers for single member row
  const handleToggleStatus = (memberId: string) => {
    setCurrentFees(prev => {
      const current = prev[memberId];
      if (!current) return prev;
      const nextStatus = current.status === 'pagada' ? 'pendiente' : 'pagada';
      return {
        ...prev,
        [memberId]: {
          ...current,
          status: nextStatus,
          paidDate: nextStatus === 'pagada' ? (current.paidDate || new Date().toISOString().split('T')[0]) : undefined,
          paymentMethod: nextStatus === 'pagada' ? (current.paymentMethod || 'transferencia') : undefined
        }
      };
    });
  };

  const handleAmountChange = (memberId: string, value: number) => {
    setCurrentFees(prev => {
      const current = prev[memberId];
      if (!current) return prev;
      return {
        ...prev,
        [memberId]: {
          ...current,
          feeAmount: isNaN(value) || value < 0 ? 0 : value
        }
      };
    });
  };

  const handlePaymentMethodChange = (memberId: string, method: PaymentMethod) => {
    setCurrentFees(prev => {
      const current = prev[memberId];
      if (!current) return prev;
      return {
        ...prev,
        [memberId]: {
          ...current,
          paymentMethod: method
        }
      };
    });
  };

  const handleNotesChange = (memberId: string, notes: string) => {
    setCurrentFees(prev => {
      const current = prev[memberId];
      if (!current) return prev;
      return {
        ...prev,
        [memberId]: {
          ...current,
          notes
        }
      };
    });
  };

  // Bulk actions
  const handleApplyDefaultFeeToAll = () => {
    const fee = Number(defaultFeeInput) || 50;
    setCurrentFees(prev => {
      const next: Record<string, MemberFeeItem> = {};
      Object.entries(prev as Record<string, MemberFeeItem>).forEach(([id, item]) => {
        next[id] = { ...item, feeAmount: fee };
      });
      return next;
    });
  };

  const handleMarkAllAsPaid = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentFees(prev => {
      const next: Record<string, MemberFeeItem> = {};
      Object.entries(prev as Record<string, MemberFeeItem>).forEach(([id, item]) => {
        next[id] = { 
          ...item, 
          status: 'pagada', 
          paidDate: item.paidDate || today,
          paymentMethod: item.paymentMethod || 'transferencia'
        };
      });
      return next;
    });
  };

  const handleMarkAllAsPending = () => {
    setCurrentFees(prev => {
      const next: Record<string, MemberFeeItem> = {};
      Object.entries(prev as Record<string, MemberFeeItem>).forEach(([id, item]) => {
        next[id] = { ...item, status: 'pendiente', paidDate: undefined };
      });
      return next;
    });
  };

  // Save changes & synchronize
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const record: AnnualMembershipFeesRecord = {
      id: `fees_${selectedYear}`,
      year: selectedYear,
      defaultFeeAmount: defaultFeeInput || 50,
      fees: currentFees,
      totalAssigned: stats.totalAssigned,
      totalCollected: stats.totalCollected,
      totalMembers: stats.totalMembers,
      paidMembersCount: stats.paidCount,
      updatedAt: new Date().toISOString()
    };

    const res = await saveAnnualMembershipFees(record);
    setIsSaving(false);

    if (res.success) {
      setSaveSuccessMsg(`¡Registro permanente "CUOTAS SOCIOS AÑO ${selectedYear}" sincronizado con éxito!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4000);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-wine-800 text-wine-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Estado de Cuotas de Socios
                </h2>
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-0.5">
                  <Calendar className="w-3.5 h-3.5 text-wine-400" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
                  >
                    {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(y => (
                      <option key={y} value={y} className="bg-slate-900 text-white">
                        Año {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Gestión individual de cuotas de socios con sincronización automática en el apunte consolidado permanente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK SUCCESS TOAST */}
        {saveSuccessMsg && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-medium flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-100 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SUMMARY STATS STRIP */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Censo de Socios</span>
              <div className="text-xl font-bold text-slate-800 mt-1 flex items-baseline gap-1.5">
                <span>{stats.totalMembers}</span>
                <span className="text-xs font-normal text-slate-400">activos</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Emitido ({selectedYear})</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(stats.totalAssigned)}
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Recaudado / Cobrado</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                  {stats.paidCount} / {stats.totalMembers}
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {formatCurrency(stats.totalCollected)}
              </div>
            </div>

            <div className={`border rounded-xl p-3 flex flex-col justify-between ${
              stats.totalPending > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-100/70 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  stats.totalPending > 0 ? 'text-amber-800' : 'text-slate-500'
                }`}>
                  Pendiente de Cobro
                </span>
                {stats.totalPending > 0 && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                    {stats.pendingCount} pendientes
                  </span>
                )}
              </div>
              <div className={`text-xl font-bold mt-1 ${
                stats.totalPending > 0 ? 'text-amber-700' : 'text-slate-400'
              }`}>
                {formatCurrency(stats.totalPending)}
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Left: Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Tabs */}
            <div className="inline-flex bg-slate-100 rounded-xl p-0.5 text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({stats.totalMembers})
              </button>
              <button
                onClick={() => setStatusFilter('pagada')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'pagada'
                    ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pagadas ({stats.paidCount})
              </button>
              <button
                onClick={() => setStatusFilter('pendiente')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'pendiente'
                    ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendientes ({stats.pendingCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por socio o nº..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-wine-500 focus:ring-1 focus:ring-wine-500 transition-colors"
              />
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <span className="text-slate-500 font-medium">Cuota base:</span>
              <input
                type="number"
                min="0"
                step="5"
                value={defaultFeeInput}
                onChange={(e) => setDefaultFeeInput(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 text-xs text-center font-bold bg-white border border-slate-200 rounded-md focus:outline-hidden focus:border-wine-500"
              />
              <span className="text-slate-500 font-bold">€</span>
              <button
                type="button"
                onClick={handleApplyDefaultFeeToAll}
                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold transition-colors cursor-pointer ml-1"
                title="Fijar este importe como cuota a todos los socios"
              >
                Aplicar a todos
              </button>
            </div>

            <button
              type="button"
              onClick={handleMarkAllAsPaid}
              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Marcar todos pagados
            </button>
            <button
              type="button"
              onClick={handleMarkAllAsPending}
              className="px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Marcar pendientes
            </button>
          </div>
        </div>

        {/* MAIN LIST / TABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {filteredFeeItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No se encontraron socios con los filtros actuales.</p>
              <p className="text-xs text-slate-400 mt-1">Prueba a limpiar la búsqueda o cambiar el filtro de estado.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Nº Socio & Nombre</th>
                    <th className="py-3 px-4 w-36">Cuota Asignada</th>
                    <th className="py-3 px-4 w-40 text-center">Estado Cuota</th>
                    <th className="py-3 px-4 w-44">Forma de Pago</th>
                    <th className="py-3 px-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFeeItems.map((item) => {
                    const isPaid = item.status === 'pagada';
                    return (
                      <tr 
                        key={item.memberId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isPaid ? 'bg-emerald-50/15' : ''
                        }`}
                      >
                        {/* Socio Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                              {item.membershipNumber || 'S/N'}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900">{item.memberName}</div>
                              {item.email && <div className="text-[11px] text-slate-400">{item.email}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Cuota Asignada (Editable) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="relative rounded-lg border border-slate-200 focus-within:border-wine-500 bg-white">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.feeAmount}
                                onChange={(e) => handleAmountChange(item.memberId, parseFloat(e.target.value))}
                                className="w-20 px-2 py-1.5 text-xs font-bold text-right text-slate-800 focus:outline-hidden"
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-500">€</span>
                          </div>
                        </td>

                        {/* Estado Toggle Button */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item.memberId)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer w-full max-w-[130px] ${
                              isPaid
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>PAGADA</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>PENDIENTE</span>
                              </>
                            )}
                          </button>
                          {isPaid && item.paidDate && (
                            <div className="text-[10px] text-emerald-700 mt-0.5">
                              {formatDisplayDate(item.paidDate)}
                            </div>
                          )}
                        </td>

                        {/* Forma de Pago (when paid) */}
                        <td className="py-3 px-4">
                          {isPaid ? (
                            <select
                              value={item.paymentMethod || 'transferencia'}
                              onChange={(e) => handlePaymentMethodChange(item.memberId, e.target.value as PaymentMethod)}
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-wine-500 cursor-pointer font-medium"
                            >
                              <option value="transferencia">Transferencia Bancaria</option>
                              <option value="bizum">Bizum</option>
                              <option value="efectivo">Efectivo en mano</option>
                              <option value="tarjeta">Tarjeta / TPV</option>
                              <option value="otro">Otro método</option>
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Pendiente de cobro</span>
                          )}
                        </td>

                        {/* Observaciones */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleNotesChange(item.memberId, e.target.value)}
                            placeholder="Añadir nota opcional..."
                            className="w-full px-2.5 py-1 text-xs bg-transparent border-b border-slate-200 hover:border-slate-300 focus:bg-white focus:border-wine-500 focus:outline-hidden transition-colors"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-wine-600 shrink-0" />
            <span>
              Al guardar se actualizará el apunte permanente consolidado: <strong>CUOTAS SOCIOS AÑO {selectedYear}</strong> ({stats.paidCount}/{stats.totalMembers} pagadas, {formatCurrency(stats.totalCollected)}).
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-wine-700 hover:bg-wine-800 disabled:bg-wine-400 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Sincronizando...' : 'Guardar y Sincronizar Registro'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
