import { useState, useEffect, useCallback } from 'react';

import { ChevronLeft, ChevronRight, Loader2, Plus, X, Repeat, Star } from 'lucide-react';

import Layout from '../../components/layout/Layout';

import AppModal, { ModalActions, ModalField, modalInputClass } from '../../components/ui/AppModal';
import HelpTip from '../../components/ui/HelpTip';
import { HELP } from '../../content/helpContent';

import apiClient from '../../services/api';

import useConfirmDialog from '../../hooks/useConfirmDialog';



const MONTH_NAMES = [

  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',

  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',

];



const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const pad2 = (n) => String(n).padStart(2, '0');

const formatDisplayDate = (day, month, year) => `${pad2(day)}/${pad2(month)}/${year}`;

const toIsoDate = (year, month, day) => {
  const clamped = Math.min(day, new Date(year, month, 0).getDate());
  return `${year}-${pad2(month)}-${pad2(clamped)}`;
};



function buildCalendarGrid(year, month) {

  const firstDay = new Date(year, month - 1, 1).getDay();

  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;

}



function groupByDay(transactions) {

  const map = {};

  for (const tx of transactions) {

    const d = new Date(tx.date).getDate();

    if (!map[d]) map[d] = [];

    map[d].push(tx);

  }

  return map;

}



const CalendarPage = () => {

  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [transactions, setTransactions] = useState([]);

  const [fixedExpenses, setFixedExpenses] = useState([]);

  const [calendarEvents, setCalendarEvents] = useState([]);

  const [selectedDay, setSelectedDay] = useState(null);

  const [loading, setLoading] = useState(false);

  const [showAddChoice, setShowAddChoice] = useState(false);

  const [addMode, setAddMode] = useState(null);

  const [fixedTitle, setFixedTitle] = useState('');

  const [fixedDay, setFixedDay] = useState(String(now.getDate()));

  const [eventTitle, setEventTitle] = useState('');

  const [eventDescription, setEventDescription] = useState('');

  const [eventDay, setEventDay] = useState(String(now.getDate()));

  const [eventDate, setEventDate] = useState(toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate()));

  const [eventHour, setEventHour] = useState('12:00');

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState('');

  const { askConfirm, confirmDialog } = useConfirmDialog();



  const loadData = useCallback(async () => {

    setLoading(true);

    setSelectedDay(null);

    try {

      const [txRes, fixedRes, eventsRes] = await Promise.all([

        apiClient.get('/transactions', { params: { month: selectedMonth, year: selectedYear } }),

        apiClient.get('/fixed-expenses'),

        apiClient.get('/calendar-events'),

      ]);

      setTransactions(txRes.data || []);

      setFixedExpenses(fixedRes.data || []);

      setCalendarEvents(eventsRes.data || []);

    } catch {

      setTransactions([]);

      setFixedExpenses([]);

      setCalendarEvents([]);

    } finally {

      setLoading(false);

    }

  }, [selectedMonth, selectedYear]);



  useEffect(() => {

    loadData();

  }, [loadData]);



  const goToPrev = () => {

    if (selectedMonth === 1) {

      setSelectedMonth(12);

      setSelectedYear((y) => y - 1);

    } else {

      setSelectedMonth((m) => m - 1);

    }

  };



  const goToNext = () => {

    if (selectedMonth === 12) {

      setSelectedMonth(1);

      setSelectedYear((y) => y + 1);

    } else {

      setSelectedMonth((m) => m + 1);

    }

  };



  const ensureExpenseCategory = async () => {

    const { data: categories } = await apiClient.get('/categories');

    const existing = categories.find((c) => c.type === 'EXPENSE');

    if (existing) return existing.id;

    const { data: created } = await apiClient.post('/categories', {

      name: 'Gastos fijos',

      type: 'EXPENSE',

    });

    return created.id;

  };



  const openAdd = () => {

    const day = String(selectedDay || now.getDate());

    setFixedDay(day);

    setEventDay(day);

    setEventDate(toIsoDate(selectedYear, selectedMonth, parseInt(day, 10) || 1));

    setEventHour('12:00');

    setFixedTitle('');

    setEventTitle('');

    setEventDescription('');

    setFormError('');

    setAddMode(null);

    setShowAddChoice(true);

  };



  const handleSaveFixed = async (e) => {

    e.preventDefault();

    setFormError('');

    const day = parseInt(fixedDay, 10);

    if (!fixedTitle.trim() || day < 1 || day > 31) {

      setFormError('Completá título y día (1-31).');

      return;

    }

    setSaving(true);

    try {

      const categoryId = await ensureExpenseCategory();

      const today = new Date().toISOString().slice(0, 10);

      await apiClient.post('/fixed-expenses', {

        title: fixedTitle.trim(),

        amount: 0,

        dueDay: day,

        startDate: today,

        active: true,

        categoryId,

      });

      setShowAddChoice(false);

      setAddMode(null);

      await loadData();

    } catch (err) {

      setFormError(err.response?.data?.message || 'No se pudo guardar el gasto fijo.');

    } finally {

      setSaving(false);

    }

  };



  const handleSaveEvent = async (e) => {

    e.preventDefault();

    setFormError('');

    const parsedDate = eventDate ? new Date(`${eventDate}T00:00:00`) : null;

    const day = parsedDate ? parsedDate.getDate() : parseInt(eventDay, 10);

    const month = parsedDate ? parsedDate.getMonth() + 1 : selectedMonth;

    const hourPart = eventHour?.split(':')[0];

    const hour = hourPart !== undefined && hourPart !== '' ? parseInt(hourPart, 10) : 12;

    if (!eventTitle.trim() || day < 1 || day > 31 || hour < 0 || hour > 23) {

      setFormError('Completá título, fecha y hora válidos.');

      return;

    }

    setSaving(true);

    try {

      await apiClient.post('/calendar-events', {

        title: eventTitle.trim(),

        description: eventDescription.trim() || null,

        month,

        day,

        eventHour: hour,

        eventType: 'EVENT',

      });

      setShowAddChoice(false);

      setAddMode(null);

      await loadData();

    } catch (err) {

      setFormError(err.response?.data?.message || 'No se pudo guardar el evento.');

    } finally {

      setSaving(false);

    }

  };



  const handleDeleteEvent = async (id) => {

    const ok = await askConfirm({
      title: 'Eliminar evento',
      message: '¿Querés eliminar este evento?',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;

    try {

      await apiClient.delete(`/calendar-events/${id}`);

      await loadData();

    } catch {

      setFormError('No se pudo eliminar el evento.');

    }

  };



  const cells = buildCalendarGrid(selectedYear, selectedMonth);

  const byDay = groupByDay(transactions);

  const fixedByDay = fixedExpenses.reduce((acc, fe) => {

    if (fe.active !== false) {

      const d = fe.dueDay;

      if (!acc[d]) acc[d] = [];

      acc[d].push(fe);

    }

    return acc;

  }, {});



  const eventsByDay = calendarEvents.reduce((acc, ev) => {

    if (ev.month === selectedMonth) {

      if (!acc[ev.day]) acc[ev.day] = [];

      acc[ev.day].push(ev);

    }

    return acc;

  }, {});



  const todayDay =

    now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth

      ? now.getDate()

      : null;



  const upcomingFixed = [...fixedExpenses]

    .filter((f) => f.active !== false)

    .sort((a, b) => a.dueDay - b.dueDay);



  const monthEvents = calendarEvents

    .filter((ev) => ev.month === selectedMonth)

    .sort((a, b) => a.day - b.day);



  return (

    <Layout>

      {confirmDialog}

      <div className="text-white max-w-xl mx-auto relative pb-20">

        <section className="bg-[#0f2543] border border-[#284567] rounded-3xl p-4">

          <div className="flex items-center justify-between mb-4">

            <button type="button" onClick={goToPrev} className="w-9 h-9 rounded-full bg-[#173459] border border-[#2b4b72] flex items-center justify-center">

              <ChevronLeft className="w-5 h-5" />

            </button>

            <h2 className="text-2xl font-semibold">

              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}

            </h2>

            <button type="button" onClick={goToNext} className="w-9 h-9 rounded-full bg-[#173459] border border-[#2b4b72] flex items-center justify-center">

              <ChevronRight className="w-5 h-5" />

            </button>

          </div>



          <div className="grid grid-cols-7 mb-2">

            {DAY_LABELS.map((label) => (

              <div key={label} className="py-2 text-center text-xs font-semibold text-slate-400">{label}</div>

            ))}

          </div>



          {loading ? (

            <div className="flex items-center justify-center py-10">

              <Loader2 className="w-8 h-8 animate-spin text-[#E8B923]" />

            </div>

          ) : (

            <div className="grid grid-cols-7 gap-y-2">

              {cells.map((day, idx) => {

                const dayTxs = day ? (byDay[day] || []) : [];

                const dayFixed = day ? (fixedByDay[day] || []) : [];

                const dayEvents = day ? (eventsByDay[day] || []) : [];

                const incomes = dayTxs.filter((t) => t.type === 'INCOME');

                const expenses = dayTxs.filter((t) => t.type === 'EXPENSE');

                const isToday = day === todayDay;



                return (

                  <div

                    key={idx}

                    onClick={() => day && setSelectedDay(day)}

                    className={[

                      'min-h-[42px] p-1 flex flex-col items-center justify-start cursor-pointer',

                      selectedDay === day ? 'bg-amber-500/30 rounded-xl' : '',

                    ].filter(Boolean).join(' ')}

                  >

                    {day && (

                      <>

                        <span className={[

                          'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',

                          isToday ? 'bg-[#2d4667] text-[#E8B923]' : 'text-slate-100',

                        ].join(' ')}>

                          {day}

                        </span>

                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[28px]">

                          {incomes.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}

                          {expenses.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}

                          {dayFixed.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}

                          {dayEvents.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}

                        </div>

                      </>

                    )}

                  </div>

                );

              })}

            </div>

          )}



          <div className="h-px bg-[#2c496d] my-4" />

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">

            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Ingreso</span>

            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Gasto</span>

            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />Fijo</span>

            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />Evento</span>

          </div>

        </section>



        <section className="mt-5">

          <h3 className="text-section-title mb-3 flex items-center gap-2">
            <Repeat size={18} className="text-amber-400" />
            Gastos fijos del mes
          </h3>

          <div className="space-y-3">

            {upcomingFixed.length === 0 ? (

              <p className="text-item-meta">Sin gastos fijos. Tocá + para agendar uno.</p>

            ) : (

              upcomingFixed.map((fe) => (

                <article
                  key={fe.id}
                  className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/12 via-[#0f2543] to-[#0b2034] p-4 flex items-center gap-4 shadow-[0_0_24px_rgba(251,191,36,0.06)]"
                >

                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-700" />

                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/25 flex flex-col items-center justify-center shrink-0 ml-1">

                    <Repeat size={14} className="text-amber-400 mb-0.5" />

                    <span className="text-sm font-amount text-amber-200 leading-none">{fe.dueDay}</span>

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-item-title truncate">{fe.title}</p>

                    <p className="text-item-meta text-amber-200/70">Día {fe.dueDay} de cada mes</p>

                  </div>

                </article>

              ))

            )}

          </div>

        </section>



        <section className="mt-5">

          <h3 className="text-section-title mb-3 flex items-center gap-2">

            <Star size={18} className="text-sky-400" />

            Eventos

          </h3>

          <div className="space-y-3">

            {monthEvents.length === 0 ? (

              <p className="text-item-meta">Sin eventos este mes. Agregá cumpleaños o recordatorios.</p>

            ) : (

              monthEvents.map((ev) => (

                <article
                  key={ev.id}
                  className="relative overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/12 via-[#0f2543] to-[#0b2034] p-4 flex items-center justify-between gap-3 shadow-[0_0_24px_rgba(56,189,248,0.06)]"
                >

                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-300 to-sky-600" />

                  <div className="flex items-center gap-4 min-w-0 ml-1">

                    <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-400/25 flex flex-col items-center justify-center shrink-0">

                      <Star size={20} className="text-sky-300" />

                      <span className="text-[10px] font-amount text-sky-200 mt-0.5">{ev.day}</span>

                    </div>

                    <div className="min-w-0">

                      <p className="text-item-title text-sky-50 truncate">{ev.title}</p>

                      <p className="text-item-meta text-sky-200/75">

                        {formatDisplayDate(ev.day, ev.month, selectedYear)}

                        {ev.eventHour != null ? ` · ${pad2(ev.eventHour)}:00 hs` : ''}

                      </p>

                      {ev.description && (
                        <p className="text-item-caption text-sky-200/60 truncate">{ev.description}</p>
                      )}

                    </div>

                  </div>

                  <button type="button" onClick={() => handleDeleteEvent(ev.id)} className="text-sky-300/50 hover:text-red-300 p-1 shrink-0">

                    <X size={16} />

                  </button>

                </article>

              ))

            )}

          </div>

        </section>



        <button

          type="button"

          onClick={openAdd}

          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-30 w-14 h-14 rounded-full bg-[#E8B923] text-slate-900 shadow-lg flex items-center justify-center hover:brightness-110"

          aria-label="Agregar al calendario"

        >

          <Plus size={28} strokeWidth={2.5} />

        </button>



        {showAddChoice && !addMode && (
          <AppModal open title="¿Qué querés agregar?" onClose={() => setShowAddChoice(false)}>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setAddMode('fixed')}
                className="flex items-center gap-3 rounded-xl border border-orange-400/30 bg-orange-400/10 p-4 text-left hover:border-orange-400/60"
              >
                <Repeat className="text-orange-300" size={22} />
                <p className="font-semibold">Gasto fijo</p>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('event')}
                className="flex items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 p-4 text-left hover:border-sky-400/60"
              >
                <Star className="text-sky-300" size={22} />
                <p className="font-semibold">Evento</p>
              </button>
            </div>
          </AppModal>
        )}

        {showAddChoice && addMode === 'fixed' && (
          <AppModal
            open
            title={
              <span className="inline-flex items-center justify-center gap-2">
                Gasto fijo
                <HelpTip title={HELP.calendar.title} body={HELP.calendar.body} align="left" />
              </span>
            }
            onClose={() => { setShowAddChoice(false); setAddMode(null); }}
          >
            <form onSubmit={handleSaveFixed} className="space-y-4">
              <ModalField label="Título">
                <input
                  required
                  value={fixedTitle}
                  onChange={(e) => setFixedTitle(e.target.value)}
                  placeholder="Ejemplo: Cuota de facultad"
                  className={modalInputClass}
                />
              </ModalField>
              <ModalField label="Día del mes">
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={fixedDay}
                  onChange={(e) => setFixedDay(e.target.value)}
                  className={modalInputClass}
                />
              </ModalField>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <ModalActions
                onCancel={() => { setShowAddChoice(false); setAddMode(null); }}
                submitLabel="Guardar"
                loading={saving}
              />
            </form>
          </AppModal>
        )}

        {showAddChoice && addMode === 'event' && (
          <AppModal
            open
            title={
              <span className="inline-flex items-center justify-center gap-2">
                Evento
                <HelpTip title={HELP.calendar.title} body={HELP.calendar.body} align="left" />
              </span>
            }
            onClose={() => { setShowAddChoice(false); setAddMode(null); }}
          >
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <ModalField label="Título">
                <input
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ejemplo: Aniversario"
                  className={modalInputClass}
                />
              </ModalField>
              <ModalField label="Descripción">
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="(Opcional)"
                  rows={2}
                  className={`${modalInputClass} resize-none`}
                />
              </ModalField>
              <ModalField label="Fecha">
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => {
                    setEventDate(e.target.value);
                    if (e.target.value) {
                      const d = new Date(`${e.target.value}T00:00:00`);
                      setEventDay(String(d.getDate()));
                    }
                  }}
                  className={modalInputClass}
                />
              </ModalField>
              <ModalField label="Hora">
                <input
                  type="time"
                  required
                  value={eventHour}
                  onChange={(e) => setEventHour(e.target.value)}
                  className={modalInputClass}
                />
              </ModalField>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <ModalActions
                onCancel={() => { setShowAddChoice(false); setAddMode(null); }}
                submitLabel="Guardar"
                loading={saving}
              />
            </form>
          </AppModal>
        )}

      </div>

    </Layout>

  );

};



export default CalendarPage;

