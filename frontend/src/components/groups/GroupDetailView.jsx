import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, UserPlus, Wallet, Upload, Eye, CheckCircle, Check, Clock, Banknote } from 'lucide-react';
import AppModal, { ModalActions, ModalField, modalInputClass } from '../ui/AppModal';
import { groupService } from '../../services/groupService';
import apiClient from '../../services/api';
import GroupCategoryChart from './GroupCategoryChart';
import { formatPeso } from '../../utils/format';
import {
  formatAmountFromDigits,
  parseAmountDigits,
  sanitizeAmountDigits,
} from '../../utils/currency';
import {
  payViaMpAlias,
  copyMpAlias,
} from '../../utils/mercadoPagoPay';
import { openProofBlob, resolveProofContentType } from '../../utils/proofBlob';
import { notifyFinancesChanged } from '../../utils/financesEvents';

const emptyItem = () => ({ categoryId: '', title: '', amount: '' });

const POLL_INTERVAL_MS = 5000;

const groupSyncFingerprint = (g) => {
  if (!g) return '';
  const members = [...(g.members || [])]
    .sort((a, b) => (a.memberKey || '').localeCompare(b.memberKey || ''))
    .map((m) => `${m.memberKey}:${m.totalSpent}:${m.movementConfirmed ? 1 : 0}:${m.items?.length ?? 0}`)
    .join('|');
  const settlements = (g.settlements || [])
    .map((s) => `${s.fromMemberKey}-${s.toMemberKey}:${s.amount}:${s.paid ? 1 : 0}:${s.pendingConfirmation ? 1 : 0}:${s.cashPending ? 1 : 0}:${s.paymentMethod || ''}`)
    .join('|');
  const categoryTotals = (g.expensesByCategory || [])
    .map((c) => `${c.categoryName}:${c.total}`)
    .join('|');
  return [
    g.lifecycleStatus,
    g.memberCount,
    g.movementsConfirmed ? 1 : 0,
    g.totalExpenses,
    g.movementConfirmationsCount,
    g.movementConfirmationsRequired,
    g.currentUserConfirmedMovements ? 1 : 0,
    g.canConfirmMovements ? 1 : 0,
    members,
    settlements,
    categoryTotals,
  ].join('::');
};

const GroupDetailView = ({ group, onBack, onRefresh, onDeleted, onError }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMyExpenses, setShowMyExpenses] = useState(false);
  const [addMemberTab, setAddMemberTab] = useState('email');
  const [inviteEmail, setInviteEmail] = useState('');
  const [guestForm, setGuestForm] = useState({ name: '', email: '', mpAlias: '', items: [emptyItem()] });
  const [myItems, setMyItems] = useState([emptyItem()]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryModalTarget, setCategoryModalTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payingKey, setPayingKey] = useState(null);
  const [paySuccess, setPaySuccess] = useState('');
  const [uploadingKey, setUploadingKey] = useState(null);
  const [confirmingKey, setConfirmingKey] = useState(null);
  const [markingPaidKey, setMarkingPaidKey] = useState(null);
  const [markingCashKey, setMarkingCashKey] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [viewingProofKey, setViewingProofKey] = useState(null);
  const proofInputRefs = useRef({});
  const [confirmingMovements, setConfirmingMovements] = useState(false);
  const syncFingerprintRef = useRef(groupSyncFingerprint(group));
  const onRefreshRef = useRef(onRefresh);

  const isOpen = group.lifecycleStatus === 'OPEN' || !group.lifecycleStatus;
  const isSettlement = group.lifecycleStatus === 'SETTLEMENT' || group.paymentsEnabled;
  const isClosed = group.lifecycleStatus === 'CLOSED';
  const registeredMembers = group.members?.filter((m) => !m.guest) ?? [];
  const confirmationsRequired = group.movementConfirmationsRequired ?? registeredMembers.length;
  const confirmationsCount = group.movementConfirmationsCount ?? 0;

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setExpenseCategories(data.filter((c) => c.type === 'EXPENSE'));
      } catch {
        setExpenseCategories([]);
      }
    };
    loadCategories();
  }, []);

  const openCategoryModal = (form, index) => {
    setCategoryModalTarget({ form, index });
    setNewCategoryName('');
    setShowCategoryModal(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    onError('');
    try {
      const { data: created } = await apiClient.post('/categories', {
        name: newCategoryName.trim(),
        type: 'EXPENSE',
      });
      setExpenseCategories((prev) => {
        const next = [...prev.filter((c) => c.id !== created.id), created];
        return next.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      });
      if (categoryModalTarget) {
        const { form, index } = categoryModalTarget;
        if (form === 'my') {
          setMyItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], categoryId: String(created.id) };
            return next;
          });
        } else {
          setGuestForm((prev) => {
            const items = [...prev.items];
            items[index] = { ...items[index], categoryId: String(created.id) };
            return { ...prev, items };
          });
        }
      }
      setNewCategoryName('');
      setCategoryModalTarget(null);
      setShowCategoryModal(false);
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo crear la categoría.');
    }
  };

  useEffect(() => {
    syncFingerprintRef.current = groupSyncFingerprint(group);
  }, [group]);

  useEffect(() => {
    const shouldPoll = isOpen || isSettlement;
    if (!shouldPoll || isClosed) {
      return undefined;
    }

    let cancelled = false;

    const poll = async () => {
      if (document.hidden || cancelled) return;
      try {
        const { data } = await groupService.getById(group.id, { sync: true });
        const nextFingerprint = groupSyncFingerprint(data);
        if (nextFingerprint !== syncFingerprintRef.current) {
          syncFingerprintRef.current = nextFingerprint;
          onRefreshRef.current(data, { silent: true });
        }
      } catch {
        // Ignorar errores transitorios de sincronización en segundo plano.
      }
    };

    poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        poll();
      }
    };
    const onWindowFocus = () => {
      poll();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [group.id, isOpen, isSettlement, isClosed]);

  const reload = async () => {
    const { data } = await groupService.getById(group.id, { sync: true });
    syncFingerprintRef.current = groupSyncFingerprint(data);
    onRefresh(data);
    return data;
  };

  const currentMember = group.members?.find((m) => m.currentUser);

  const handleConfirmMovements = async () => {
    if (!window.confirm('¿Confirmar movimientos? Cada integrante debe confirmar antes de ver la liquidación.')) {
      return;
    }
    setConfirmingMovements(true);
    onError('');
    try {
      const { data } = await groupService.confirmMovements(group.id);
      syncFingerprintRef.current = groupSyncFingerprint(data);
      onRefresh(data);
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudieron confirmar los movimientos.');
    } finally {
      setConfirmingMovements(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError('');
    try {
      await groupService.invite(group.id, inviteEmail);
      setInviteEmail('');
      setShowAddMember(false);
      await reload();
      alert('Invitación enviada. Si no tiene cuenta, recibirá un correo para registrarse.');
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo enviar la invitación.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError('');
    try {
      const items = guestForm.items
        .filter((item) => item.title?.trim() && Number(item.amount) > 0)
        .map((item) => ({
          categoryId: item.categoryId ? Number(item.categoryId) : null,
          title: item.title.trim(),
          amount: Number(item.amount),
        }));

      await groupService.addGuest(group.id, {
        name: guestForm.name.trim(),
        email: guestForm.email.trim(),
        mpAlias: guestForm.mpAlias.trim(),
        items,
      });
      setGuestForm({ name: '', email: '', mpAlias: '', items: [emptyItem()] });
      setShowAddMember(false);
      await reload();
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo agregar al integrante.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMyExpenses = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError('');
    try {
      const items = myItems
        .filter((item) => item.categoryId && item.title?.trim() && Number(item.amount) > 0)
        .map((item) => ({
          categoryId: Number(item.categoryId),
          title: item.title.trim(),
          amount: Number(item.amount),
        }));

      if (items.length === 0) {
        onError('Completá categoría, descripción y monto en al menos un gasto.');
        return;
      }

      const { data } = await groupService.addMyExpenses(group.id, items);
      onRefresh(data);
      notifyFinancesChanged();
      setMyItems([emptyItem()]);
      setShowMyExpenses(false);
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudieron guardar tus gastos.');
    } finally {
      setSaving(false);
    }
  };

  const [copiedAliasKey, setCopiedAliasKey] = useState(null);

  const copyAliasOnly = async (alias, nick, settlementKey) => {
    try {
      const trimmed = await copyMpAlias(alias);
      setCopiedAliasKey(settlementKey);
      setPaySuccess(`Alias de ${nick} copiado: ${trimmed}`);
      onError('');
    } catch {
      onError('No se pudo copiar el alias.');
    }
  };

  const payDebt = async (settlement) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    setPayingKey(key);
    setPaySuccess('');
    setCopiedAliasKey(null);
    onError('');

    const alias = settlement.toMpAlias?.trim();
    if (!alias) {
      onError(`${settlement.toNick} no tiene alias. Pedile que lo configure en Grupos.`);
      setPayingKey(null);
      return;
    }

    try {
      const msg = await payViaMpAlias(alias, settlement.toNick, settlement.amount);
      setCopiedAliasKey(key);
      setPaySuccess(msg);
    } catch {
      try {
        await copyMpAlias(alias);
        setCopiedAliasKey(key);
        setPaySuccess(`Alias de ${settlement.toNick} copiado (${alias}). Transferí desde Mercado Pago cuando puedas.`);
      } catch {
        onError('No se pudo copiar el alias.');
      }
    } finally {
      setPayingKey(null);
    }
  };

  const uploadProof = async (settlement, file) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    setUploadingKey(key);
    onError('');
    try {
      const { data } = await groupService.uploadSettlementProof(
        group.id,
        settlement.fromMemberKey,
        settlement.toMemberKey,
        file,
      );
      onRefresh(data);
      setPaySuccess('Comprobante enviado. Esperá a que ' + settlement.toNick + ' confirme el pago.');
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo subir el comprobante.');
    } finally {
      setUploadingKey(null);
    }
  };

  const viewProof = async (settlement) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    setViewingProofKey(key);
    onError('');
    try {
      const response = await groupService.fetchSettlementProof(
        group.id,
        settlement.fromMemberKey,
        settlement.toMemberKey,
      );
      const contentType = resolveProofContentType(response.headers);
      openProofBlob(response.data, contentType);
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo abrir el comprobante.');
    } finally {
      setViewingProofKey(null);
    }
  };

  const confirmPayment = async (settlement) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    if (!window.confirm(`¿Confirmar que recibiste ${formatPeso(settlement.amount)} de ${settlement.fromNick}?`)) {
      return;
    }
    setConfirmingKey(key);
    onError('');
    try {
      const { data } = await groupService.confirmSettlement(group.id, {
        fromMemberKey: settlement.fromMemberKey,
        toMemberKey: settlement.toMemberKey,
      });
      onRefresh(data);
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo confirmar el pago.');
    } finally {
      setConfirmingKey(null);
    }
  };

  const markAsPaid = async (settlement) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    if (!window.confirm(`¿Marcar como pagado ${formatPeso(settlement.amount)} a ${settlement.toNick}?`)) {
      return;
    }
    setMarkingPaidKey(key);
    onError('');
    try {
      const { data } = await groupService.markSettlementPaid(group.id, {
        fromMemberKey: settlement.fromMemberKey,
        toMemberKey: settlement.toMemberKey,
      });
      onRefresh(data);
      setPaySuccess('Pago marcado como realizado.');
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo marcar el pago.');
    } finally {
      setMarkingPaidKey(null);
    }
  };

  const markCashPayment = async (settlement) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    if (!window.confirm(`¿Marcar ${formatPeso(settlement.amount)} pagados en efectivo a ${settlement.toNick}? El cobrador deberá confirmar.`)) {
      return;
    }
    setMarkingCashKey(key);
    onError('');
    try {
      const { data } = await groupService.markSettlementCash(group.id, {
        fromMemberKey: settlement.fromMemberKey,
        toMemberKey: settlement.toMemberKey,
      });
      onRefresh(data);
      setPaySuccess('Pago en efectivo registrado. Esperá la confirmación de ' + settlement.toNick + '.');
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo registrar el pago en efectivo.');
    } finally {
      setMarkingCashKey(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`¿Eliminar "${group.title}" del historial? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingGroup(true);
    onError('');
    try {
      await groupService.delete(group.id);
      onDeleted?.();
      onBack();
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo eliminar el grupo.');
    } finally {
      setDeletingGroup(false);
    }
  };

  const memberLabel = (member) => {
    const label = member.name || member.nick;
    if (member.currentUser) return `${label} (vos)`;
    return label;
  };

  return (
    <div className="text-white max-w-xl mx-auto space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-300"
      >
        <ChevronLeft size={16} /> Volver a grupos
      </button>

      <div className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
        <h2 className="text-item-title">{group.title}</h2>
        {group.description && (
          <p className="text-item-meta mt-1">{group.description}</p>
        )}
        {isClosed && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-emerald-300">Grupo cerrado — solo historial</p>
            {group.owner && (
              <button
                type="button"
                disabled={deletingGroup}
                onClick={handleDeleteGroup}
                className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deletingGroup ? 'Eliminando...' : 'Eliminar del historial'}
              </button>
            )}
          </div>
        )}
        {isOpen && !group.movementsConfirmed && (
          <p className="mt-2 text-xs text-slate-400">
            Cargá gastos. Cada integrante con app debe confirmar ({confirmationsCount}/
            {confirmationsRequired}) para ver la liquidación. Los invitados sin app no confirman.
          </p>
        )}
        <div className="mt-4">
          <p className="text-label-caps">Gasto total</p>
          <p className="text-2xl font-amount text-money-balance mt-1">{formatPeso(group.totalExpenses)}</p>
          {Number(group.sharePerPerson) > 0 && (
            <p className="text-item-meta mt-2">
              Cuota por persona: <span className="font-amount text-slate-200">{formatPeso(group.sharePerPerson)}</span>
            </p>
          )}
        </div>
      </div>

      {group.canConfirmMovements && (
        <button
          type="button"
          disabled={confirmingMovements}
          onClick={handleConfirmMovements}
          className="w-full rounded-xl bg-amber-400 text-slate-900 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {confirmingMovements ? 'Confirmando...' : 'Confirmar movimientos'}
        </button>
      )}

      {isOpen && !group.movementsConfirmed && registeredMembers.length > 0 && (
        <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 space-y-2">
          <h3 className="text-section-title">Confirmaciones ({confirmationsCount}/{confirmationsRequired})</h3>
          <p className="text-xs text-slate-400">
            Solo integrantes con cuenta en la app. Invitados sin app no necesitan confirmar.
          </p>
          <ul className="space-y-2">
            {registeredMembers.map((member) => (
              <li
                key={member.memberKey}
                className="flex items-center justify-between rounded-lg border border-[#284567]/60 bg-[#0b2034]/40 px-3 py-2 text-sm"
              >
                <span className="font-medium">{memberLabel(member)}</span>
                {member.movementConfirmed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                    <Check size={14} /> Confirmó
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                    <Clock size={14} /> Pendiente
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isOpen && group.currentUserConfirmedMovements && !isSettlement && (
        <p className="text-xs text-center text-emerald-300">
          Ya confirmaste. Esperando al resto del grupo para calcular la liquidación.
        </p>
      )}

      <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-section-title">Integrantes y gastos</h3>
          {currentMember && isOpen && (
            <button
              type="button"
              onClick={() => setShowMyExpenses(true)}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200"
            >
              + Añadir mis gastos
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {group.members?.map((member) => (
            <li key={member.memberKey} className="rounded-lg border border-[#284567]/60 bg-[#0b2034]/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectedMember(
                  selectedMember?.memberKey === member.memberKey ? null : member,
                )}
                className="w-full flex items-center justify-between px-3 py-3 hover:border-amber-400/40 transition-colors text-left"
              >
                <div>
                  <p className="font-medium">{memberLabel(member)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {member.guest && <p className="text-xs text-slate-500">Sin app</p>}
                    {!member.guest && isOpen && (
                      <p className={`text-xs ${member.movementConfirmed ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {member.movementConfirmed ? 'Confirmó movimientos' : 'Pendiente de confirmar'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-amount text-amber-100">{formatPeso(member.totalSpent)}</span>
                  <ChevronRight
                    size={14}
                    className={`text-slate-500 transition-transform ${selectedMember?.memberKey === member.memberKey ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>
              {selectedMember?.memberKey === member.memberKey && (
                <div className="px-3 pb-3 border-t border-[#284567]/40 pt-2">
                  {member.items?.length > 0 ? (
                    <ul className="space-y-2">
                      {member.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2 text-sm">
                          <div className="min-w-0">
                            {item.categoryName && (
                              <p className="text-xs text-amber-300/80">{item.categoryName}</p>
                            )}
                            <span className="text-slate-300">{item.title}</span>
                          </div>
                          <span className="font-amount text-amber-100 shrink-0">{formatPeso(item.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Todavía no cargó gastos.</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {(group.expensesByCategory?.length > 0 || Number(group.totalExpenses) > 0) && (
        <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
          <h3 className="text-section-title mb-3">Gastos por categoría</h3>
          <GroupCategoryChart expensesByCategory={group.expensesByCategory || []} />
        </section>
      )}

      {isOpen && (
        <button
          type="button"
          onClick={() => setShowAddMember(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#284567] bg-[#0f2543]/50 py-3 text-sm font-medium text-slate-200 hover:border-amber-400/50"
        >
          <UserPlus size={16} /> Añadir miembro
        </button>
      )}

      {(isSettlement || isClosed) && group.settlements?.length > 0 && (
        <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4 space-y-3">
            <h3 className="text-section-title flex items-center gap-2">
            <Wallet size={16} /> Liquidación
          </h3>
          <p className="text-xs text-slate-400">
            Reparto equitativo según lo que gastó cada uno.
          </p>
          <ul className="space-y-3">
            {group.settlements.map((s, index) => {
              const iOwe = group.currentUserMemberKey === s.fromMemberKey;
              const iAmCreditor = group.currentUserMemberKey === s.toMemberKey;
              const creditorHasApp = s.creditorHasApp !== false;
              const settlementKey = `${s.fromMemberKey}-${s.toMemberKey}`;
              return (
                <li
                  key={`${s.fromMemberKey}-${s.toMemberKey}-${index}`}
                  className={`rounded-lg p-3 text-sm ${
                    s.paid
                      ? 'border border-emerald-700/40 bg-emerald-900/10 opacity-80'
                      : s.involvesCurrentUser
                        ? 'border border-amber-400/30 bg-amber-400/5'
                        : 'border border-[#284567]/60'
                  }`}
                >
                  <p>
                    {iOwe ? (
                      <>
                        Le debés{' '}
                        <span className="font-amount text-amber-200">{formatPeso(s.amount)}</span>
                        {' '}a <span className="font-medium">{s.toNick}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{s.fromNick}</span>
                        {' '}{s.paid ? 'pagó' : 'debe'}{' '}
                        <span className="font-amount text-amber-200">{formatPeso(s.amount)}</span>
                        {' '}a <span className="font-medium">{s.toNick}</span>
                      </>
                    )}
                  </p>
                  {s.paid ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-300">Pagado y confirmado</p>
                  ) : s.pendingConfirmation && iOwe ? (
                    <p className="mt-2 text-xs text-amber-200">
                      {s.cashPending
                        ? `Pago en efectivo registrado. Esperando que ${s.toNick} confirme.`
                        : `Comprobante enviado. Esperando que ${s.toNick} confirme el pago.`}
                    </p>
                  ) : iOwe && isSettlement && !isClosed ? (
                    <div className="mt-2 space-y-2">
                      {s.toMpAlias ? (
                        <>
                          <button
                            type="button"
                            disabled={payingKey === settlementKey}
                            onClick={() => payDebt(s)}
                            className="w-full rounded-lg py-2.5 text-xs font-semibold disabled:opacity-60 bg-amber-400 text-slate-900"
                          >
                            {payingKey === settlementKey
                              ? 'Abriendo Mercado Pago...'
                              : `Pagar en Mercado Pago`}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyAliasOnly(s.toMpAlias, s.toNick, settlementKey)}
                            className="w-full rounded-lg py-2 text-xs border border-[#284567] text-slate-200"
                          >
                            {copiedAliasKey === settlementKey
                              ? `Alias copiado (${s.toMpAlias})`
                              : 'Solo copiar alias'}
                          </button>
                          <p className="text-xs text-slate-500">
                            {creditorHasApp
                              ? 'Transferí desde Mercado Pago y subí el comprobante para que te confirmen el pago.'
                              : 'Transferí desde Mercado Pago. Podés subir el comprobante o marcar como pagado.'}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">
                          {s.toNick} no tiene alias. Pedile que lo configure en Grupos.
                        </p>
                      )}
                      {paySuccess && copiedAliasKey === settlementKey && (
                        <p className="text-xs text-emerald-300 leading-relaxed">{paySuccess}</p>
                      )}
                      <input
                        ref={(el) => { proofInputRefs.current[settlementKey] = el; }}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadProof(s, file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingKey === settlementKey}
                        onClick={() => proofInputRefs.current[settlementKey]?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-emerald-500/50 text-emerald-300 py-2 text-xs font-semibold disabled:opacity-60"
                      >
                        <Upload size={14} />
                        {uploadingKey === settlementKey ? 'Subiendo...' : 'Subir comprobante'}
                      </button>
                      {creditorHasApp && (
                        <button
                          type="button"
                          disabled={markingCashKey === settlementKey}
                          onClick={() => markCashPayment(s)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg border border-amber-400/50 text-amber-200 py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          <Banknote size={14} />
                          {markingCashKey === settlementKey ? 'Registrando...' : 'Pago en efectivo'}
                        </button>
                      )}
                      {!creditorHasApp && (
                        <button
                          type="button"
                          disabled={markingPaidKey === settlementKey}
                          onClick={() => markAsPaid(s)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 text-slate-900 py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          <CheckCircle size={14} />
                          {markingPaidKey === settlementKey ? 'Marcando...' : 'Marcar como pagado'}
                        </button>
                      )}
                    </div>
                  ) : s.pendingConfirmation && iAmCreditor && isSettlement && !isClosed && creditorHasApp ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-amber-200">
                        {s.cashPending
                          ? `${s.fromNick} marcó pago en efectivo. Confirmá si recibiste el dinero.`
                          : `${s.fromNick} subió un comprobante. Revisalo y confirmá si recibiste el pago.`}
                      </p>
                      {!s.cashPending && (
                        <button
                          type="button"
                          disabled={viewingProofKey === settlementKey}
                          onClick={() => viewProof(s)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#284567] text-slate-200 py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          <Eye size={14} />
                          {viewingProofKey === settlementKey ? 'Abriendo...' : 'Ver comprobante'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={confirmingKey === settlementKey}
                        onClick={() => confirmPayment(s)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 text-slate-900 py-2 text-xs font-semibold disabled:opacity-60"
                      >
                        <CheckCircle size={14} />
                        {confirmingKey === settlementKey ? 'Confirmando...' : 'Confirmar pago recibido'}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {showMyExpenses && (
        <AppModal open title="Mis gastos" onClose={() => setShowMyExpenses(false)}>
          <form onSubmit={handleAddMyExpenses} className="space-y-4">
            {myItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => openCategoryModal('my', index)}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      + Agregar categoría
                    </button>
                    <select
                      required
                      value={item.categoryId}
                      onChange={(e) => {
                        const next = [...myItems];
                        next[index] = { ...next[index], categoryId: e.target.value };
                        setMyItems(next);
                      }}
                      className={modalInputClass}
                    >
                      <option value="">Categoría</option>
                      {expenseCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const next = [...myItems];
                      next[index] = { ...next[index], title: e.target.value };
                      setMyItems(next);
                    }}
                    placeholder="Descripción: Ej. Coca, fernet..."
                    className={modalInputClass}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={item.amountDisplay || item.amount}
                    onChange={(e) => {
                      const digits = sanitizeAmountDigits(e.target.value);
                      const next = [...myItems];
                      next[index] = {
                        ...next[index],
                        amountDigits: digits,
                        amountDisplay: formatAmountFromDigits(digits),
                        amount: parseAmountDigits(digits) || '',
                      };
                      setMyItems(next);
                    }}
                    placeholder="$ 1.000,00"
                    className={`${modalInputClass} font-amount`}
                  />
                </div>
                {myItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setMyItems(myItems.filter((_, i) => i !== index))}
                    className="text-red-300 mt-2"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMyItems([...myItems, emptyItem()])}
              className="text-xs text-amber-300 flex items-center gap-1"
            >
              <Plus size={14} /> Agregar ítem
            </button>
            <ModalActions
              onCancel={() => setShowMyExpenses(false)}
              submitLabel="Guardar"
              loading={saving}
            />
          </form>
        </AppModal>
      )}

      {showAddMember && (
        <AppModal open title="Añadir miembro" onClose={() => setShowAddMember(false)}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddMemberTab('email')}
                className={`flex-1 rounded-lg py-2 text-sm ${addMemberTab === 'email' ? 'bg-amber-400 text-slate-900 font-semibold' : 'border border-[#284567]'}`}
              >
                Por correo
              </button>
              <button
                type="button"
                onClick={() => setAddMemberTab('guest')}
                className={`flex-1 rounded-lg py-2 text-sm ${addMemberTab === 'guest' ? 'bg-amber-400 text-slate-900 font-semibold' : 'border border-[#284567]'}`}
              >
                Sin app
              </button>
            </div>

            {addMemberTab === 'email' ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <ModalField label="Correo">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={modalInputClass}
                  />
                </ModalField>
                <ModalActions
                  onCancel={() => setShowAddMember(false)}
                  submitLabel="Enviar invitación"
                  loading={saving}
                />
              </form>
            ) : (
              <form onSubmit={handleAddGuest} className="space-y-4">
                <ModalField label="Nombre">
                  <input
                    required
                    value={guestForm.name}
                    onChange={(e) => setGuestForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Juan"
                    className={modalInputClass}
                  />
                </ModalField>
                <ModalField label="Correo">
                  <input
                    type="email"
                    required
                    value={guestForm.email}
                    onChange={(e) => setGuestForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className={modalInputClass}
                  />
                </ModalField>
                <ModalField label="Alias (preferentemente de MP)">
                  <input
                    required
                    value={guestForm.mpAlias}
                    onChange={(e) => setGuestForm((p) => ({ ...p, mpAlias: e.target.value }))}
                    placeholder="Ej: juan.mp"
                    className={modalInputClass}
                  />
                </ModalField>
                <p className="text-xs text-slate-400">Gastos (opcional)</p>
                {guestForm.items.map((item, index) => (
                  <div key={index} className="rounded-lg border border-[#284567]/60 p-3 space-y-2">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => openCategoryModal('guest', index)}
                        className="text-xs text-amber-400 hover:underline"
                      >
                        + Agregar categoría
                      </button>
                      <select
                        value={item.categoryId || ''}
                        onChange={(e) => {
                          const items = [...guestForm.items];
                          items[index] = { ...items[index], categoryId: e.target.value };
                          setGuestForm((p) => ({ ...p, items }));
                        }}
                        className={modalInputClass}
                      >
                        <option value="">Categoría (opcional)</option>
                        {expenseCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const items = [...guestForm.items];
                        items[index] = { ...items[index], title: e.target.value };
                        setGuestForm((p) => ({ ...p, items }));
                      }}
                      placeholder="Descripción: Ej. Coca, fernet..."
                      className={modalInputClass}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.amountDisplay || item.amount}
                      onChange={(e) => {
                        const digits = sanitizeAmountDigits(e.target.value);
                        const items = [...guestForm.items];
                        items[index] = {
                          ...items[index],
                          amountDigits: digits,
                          amountDisplay: formatAmountFromDigits(digits),
                          amount: parseAmountDigits(digits) || '',
                        };
                        setGuestForm((p) => ({ ...p, items }));
                      }}
                      placeholder="$ 1.000,00"
                      className={`${modalInputClass} font-amount`}
                    />
                    {guestForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGuestForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}
                        className="text-xs text-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Quitar ítem
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setGuestForm((p) => ({ ...p, items: [...p.items, emptyItem()] }))}
                  className="text-xs text-amber-300 flex items-center gap-1"
                >
                  <Plus size={14} /> Agregar ítem
                </button>
                <ModalActions
                  onCancel={() => setShowAddMember(false)}
                  submitLabel="Agregar al grupo"
                  loading={saving}
                />
              </form>
            )}
          </div>
        </AppModal>
      )}

      {showCategoryModal && (
        <AppModal
          open
          title="Nueva categoría"
          onClose={() => {
            setShowCategoryModal(false);
            setCategoryModalTarget(null);
            setNewCategoryName('');
          }}
          zIndex="z-[100]"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <ModalField label="Nombre">
              <input
                type="text"
                placeholder="Ejemplo: Asado, Bebidas..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={modalInputClass}
                required
                autoFocus
              />
            </ModalField>
            <ModalField label="Tipo">
              <div className={`${modalInputClass} flex items-center text-sm`}>Gastos</div>
            </ModalField>
            <ModalActions
              onCancel={() => {
                setShowCategoryModal(false);
                setCategoryModalTarget(null);
                setNewCategoryName('');
              }}
              submitLabel="Guardar"
            />
          </form>
        </AppModal>
      )}
    </div>
  );
};

export default GroupDetailView;
