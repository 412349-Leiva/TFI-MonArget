import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, UserPlus, Wallet } from 'lucide-react';
import { groupService } from '../../services/groupService';
import { formatPeso } from '../../utils/format';

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
  const [markingPaidKey, setMarkingPaidKey] = useState(null);

  const currentMember = group.members?.find((m) => m.currentUser);

  const reload = async () => {
    const { data } = await groupService.getById(group.id);
    onRefresh(data);
    return data;
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSaving(true);
    onError('');
    try {
      await groupService.invite(group.id, inviteEmail);
      setInviteEmail('');
      setShowAddMember(false);
      alert('Invitación enviada.');
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

  const copyAlias = (alias) => {
    navigator.clipboard?.writeText(alias);
    alert(`Alias copiado: ${alias}\nAbrí Mercado Pago y transferí a ese alias.`);
  };

  const payWithMercadoPago = async (settlement) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    setPayingKey(key);
    onError('');
    try {
      const { data } = await groupService.createPaymentLink(group.id, {
        toMemberKey: settlement.toMemberKey,
        amount: settlement.amount,
      });
      if (data?.paymentUrl) {
        window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo generar el link de pago.');
    } finally {
      setPayingKey(null);
    }
  };

  const markAsPaid = async (settlement) => {
    const key = `${settlement.fromMemberKey}-${settlement.toMemberKey}`;
    setMarkingPaidKey(key);
    onError('');
    try {
      const { data } = await groupService.markSettlementPaid(group.id, {
        fromMemberKey: settlement.fromMemberKey,
        toMemberKey: settlement.toMemberKey,
      });
      onRefresh(data);
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo marcar como pagado.');
    } finally {
      setMarkingPaidKey(null);
    }
  };

  const memberLabel = (member) => {
    if (member.currentUser) return `${member.nick} (vos)`;
    return member.nick;
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

      <section className="rounded-2xl border border-[#284567] bg-[#0f2543] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-section-title">Miembros</h3>
          {currentMember && (
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
            <li key={member.memberKey}>
              <button
                type="button"
                onClick={() => setSelectedMember(member)}
                className="w-full flex items-center justify-between rounded-lg border border-[#284567]/60 bg-[#0b2034]/40 px-3 py-3 hover:border-amber-400/40 transition-colors text-left"
              >
                <div>
                  <p className="font-medium">{memberLabel(member)}</p>
                  {member.guest && <p className="text-xs text-slate-500">Sin app</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-amount text-amber-100">{formatPeso(member.totalSpent)}</span>
                  <ChevronRight size={14} className="text-slate-500" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => setShowAddMember(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#284567] bg-[#0f2543]/50 py-3 text-sm font-medium text-slate-200 hover:border-amber-400/50"
      >
        <UserPlus size={16} /> Añadir miembro
      </button>

      {group.settlements?.length > 0 && (
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
                    <span className="font-medium">{s.fromNick}</span>
                    {' '}{s.paid ? 'pagó' : 'debe'}{' '}
                    <span className="font-amount text-amber-200">{formatPeso(s.amount)}</span>
                    {' '}{s.paid ? 'a' : 'a'}{' '}
                    <span className="font-medium">{s.toNick}</span>
                  </p>
                  {s.paid ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-300">Pagado</p>
                  ) : iOwe ? (
                    <div className="mt-2 space-y-2">
                      {s.toMpCheckoutAvailable ? (
                        <button
                          type="button"
                          disabled={payingKey === settlementKey}
                          onClick={() => payWithMercadoPago(s)}
                          className="w-full rounded-lg bg-amber-400 text-slate-900 py-2 text-xs font-semibold disabled:opacity-60"
                        >
                          {payingKey === settlementKey
                            ? 'Generando pago...'
                            : `Pagar a ${s.toNick} con Mercado Pago`}
                        </button>
                      ) : s.toMpAlias ? (
                        <button
                          type="button"
                          onClick={() => copyAlias(s.toMpAlias)}
                          className="w-full rounded-lg bg-amber-400 text-slate-900 py-2 text-xs font-semibold"
                        >
                          Pagar a {s.toNick} (copiar alias MP)
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400">
                          {s.toNick} aún no conectó Mercado Pago ni cargó alias.
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={markingPaidKey === settlementKey}
                        onClick={() => markAsPaid(s)}
                        className="w-full rounded-lg border border-emerald-500/50 text-emerald-300 py-2 text-xs font-semibold disabled:opacity-60"
                      >
                        {markingPaidKey === settlementKey ? 'Guardando...' : 'Marcar como pagado'}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#284567] bg-[#0f2543] p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{memberLabel(selectedMember)}</h3>
              <button type="button" onClick={() => setSelectedMember(null)} className="text-slate-400">Cerrar</button>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Total gastado: <span className="font-amount text-amber-100">{formatPeso(selectedMember.totalSpent)}</span>
            </p>
            {selectedMember.items?.length > 0 ? (
              <ul className="space-y-2">
                {selectedMember.items.map((item) => (
                  <li key={item.id} className="flex justify-between border-b border-[#284567]/60 pb-2 text-sm">
                    <span>{item.title}</span>
                    <span className="font-amount text-amber-100">{formatPeso(item.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Todavía no cargó gastos.</p>
            )}
          </div>
        </div>
      )}

      {showMyExpenses && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleAddMyExpenses} className="w-full max-w-md rounded-2xl border border-[#284567] bg-[#0f2543] p-5 space-y-3">
            <h3 className="text-lg font-semibold">Añadir mis gastos</h3>
            {myItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={item.title}
                  onChange={(e) => {
                    const next = [...myItems];
                    next[index] = { ...next[index], title: e.target.value };
                    setMyItems(next);
                  }}
                  placeholder="Ej: Coca, fernet..."
                  className="flex-1 rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => {
                    const next = [...myItems];
                    next[index] = { ...next[index], amount: e.target.value };
                    setMyItems(next);
                  }}
                  placeholder="$"
                  className="w-24 rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                />
                {myItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setMyItems(myItems.filter((_, i) => i !== index))}
                    className="text-red-300"
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
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowMyExpenses(false)} className="flex-1 rounded-lg border border-[#284567] py-2 text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-amber-400 text-slate-900 py-2 text-sm font-semibold disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#284567] bg-[#0f2543] p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">Añadir miembro</h3>
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
              <form onSubmit={handleInvite} className="space-y-3">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                />
                <button type="submit" disabled={saving} className="w-full rounded-lg bg-amber-400 text-slate-900 py-2 text-sm font-semibold">
                  Enviar invitación
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddGuest} className="space-y-3">
                <input
                  required
                  value={guestForm.name}
                  onChange={(e) => setGuestForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nombre"
                  className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  required
                  value={guestForm.email}
                  onChange={(e) => setGuestForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Correo electrónico (recibe la deuda)"
                  className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                />
                <input
                  required
                  value={guestForm.mpAlias}
                  onChange={(e) => setGuestForm((p) => ({ ...p, mpAlias: e.target.value }))}
                  placeholder="Alias Mercado Pago"
                  className="w-full rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-400">Gastos (opcional, podés agregar varios)</p>
                {guestForm.items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const items = [...guestForm.items];
                        items[index] = { ...items[index], title: e.target.value };
                        setGuestForm((p) => ({ ...p, items }));
                      }}
                      placeholder="Qué compró"
                      className="flex-1 rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => {
                        const items = [...guestForm.items];
                        items[index] = { ...items[index], amount: e.target.value };
                        setGuestForm((p) => ({ ...p, items }));
                      }}
                      placeholder="$"
                      className="w-24 rounded-lg bg-[#0b2034] border border-[#284567] px-3 py-2 text-sm"
                    />
                    {guestForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGuestForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}
                        className="text-red-300"
                      >
                        <Trash2 size={16} />
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
                <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#1a3457] text-slate-100 py-2 text-sm font-medium">
                  Agregar al grupo
                </button>
              </form>
            )}

            <button type="button" onClick={() => setShowAddMember(false)} className="w-full text-sm text-slate-400">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailView;
