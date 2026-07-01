import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, UserPlus, Wallet, Upload, Eye, CheckCircle } from 'lucide-react';
import AppModal, { ModalActions, ModalField, modalInputClass } from '../ui/AppModal';
import { groupService } from '../../services/groupService';
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

const emptyItem = () => ({ title: '', amount: '' });

const GroupDetailView = ({ group, onBack, onRefresh, onError }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMyExpenses, setShowMyExpenses] = useState(false);
  const [addMemberTab, setAddMemberTab] = useState('email');
  const [inviteEmail, setInviteEmail] = useState('');
  const [guestForm, setGuestForm] = useState({ name: '', email: '', mpAlias: '', items: [emptyItem()] });
  const [myItems, setMyItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [payingKey, setPayingKey] = useState(null);
  const [paySuccess, setPaySuccess] = useState('');
  const [uploadingKey, setUploadingKey] = useState(null);
  const [confirmingKey, setConfirmingKey] = useState(null);
  const [markingPaidKey, setMarkingPaidKey] = useState(null);
  const [viewingProofKey, setViewingProofKey] = useState(null);
  const proofInputRefs = useRef({});
  const [confirmingMovements, setConfirmingMovements] = useState(false);

  const isOpen = group.lifecycleStatus === 'OPEN' || !group.lifecycleStatus;
  const isSettlement = group.lifecycleStatus === 'SETTLEMENT' || group.paymentsEnabled;
  const isClosed = group.lifecycleStatus === 'CLOSED';

  const reload = async () => {
    const { data } = await groupService.getById(group.id);
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
        .map((item) => ({ title: item.title.trim(), amount: Number(item.amount) }));

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
        .filter((item) => item.title?.trim() && Number(item.amount) > 0)
        .map((item) => ({ title: item.title.trim(), amount: Number(item.amount) }));

      if (items.length === 0) {
        onError('Agregá al menos un gasto con monto.');
        return;
      }

      const { data } = await groupService.addMyExpenses(group.id, items);
      onRefresh(data);
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
      const { data } = await groupService.fetchSettlementProof(
        group.id,
        settlement.fromMemberKey,
        settlement.toMemberKey,
      );
      const blobUrl = URL.createObjectURL(data);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
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
          <p className="mt-2 text-xs font-semibold text-emerald-300">Grupo cerrado — solo historial</p>
        )}
        {isOpen && !group.movementsConfirmed && (
          <p className="mt-2 text-xs text-slate-400">
            Cargá gastos. Cada integrante debe confirmar ({group.movementConfirmationsCount || 0}/
            {group.movementConfirmationsRequired || group.members?.filter((m) => !m.guest).length || 0}) para ver la liquidación.
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
                        <li key={item.id} className="flex justify-between text-sm">
                          <span className="text-slate-300">{item.title}</span>
                          <span className="font-amount text-amber-100">{formatPeso(item.amount)}</span>
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
                      Comprobante enviado. Esperando que {s.toNick} confirme el pago.
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
                        {s.fromNick} subió un comprobante. Revisalo y confirmá si recibiste el pago.
                      </p>
                      <button
                        type="button"
                        disabled={viewingProofKey === settlementKey}
                        onClick={() => viewProof(s)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#284567] text-slate-200 py-2 text-xs font-semibold disabled:opacity-60"
                      >
                        <Eye size={14} />
                        {viewingProofKey === settlementKey ? 'Abriendo...' : 'Ver comprobante'}
                      </button>
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
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const next = [...myItems];
                      next[index] = { ...next[index], title: e.target.value };
                      setMyItems(next);
                    }}
                    placeholder="Ej: Coca, fernet..."
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
    </div>
  );
};

export default GroupDetailView;
