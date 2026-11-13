import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const interestsList = ['History', 'Museums', 'Food', 'Photography', 'Outdoors'];

function App() {
  const [form, setForm] = useState({ destination: 'Paris', start_date: '2026-12-10', end_date: '2026-12-15', travelers: 2, budget_inr: 150000, origin: 'Delhi', request: 'Plan my complete trip' });
  const [interests, setInterests] = useState(['History', 'Food', 'Photography']);
  const [memory, setMemory] = useState(['Budget traveler', 'Prefers public transport']);
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [delay, setDelay] = useState('6');
  const [event, setEvent] = useState('Flight delayed');
  const [llm, setLlm] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/preferences/local`).then(r => r.ok ? r.json() : null).then(d => d?.preferences?.length && setMemory(d.preferences)).catch(() => {});
    fetch(`${API}/api/integrations`).then(r => r.ok ? r.json() : null).then(d => d?.integrations?.llm && setLlm(d.integrations.llm)).catch(() => {});
  }, []);
  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggle = value => setInterests(current => current.includes(value) ? current.filter(i => i !== value) : [...current, value]);
  async function saveMemory() {
    try {
      const response = await fetch(`${API}/api/preferences/local`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences: memory }) });
      if (!response.ok) throw new Error('Could not save preferences');
    } catch (e) { setError(`Memory could not be saved: ${e.message}`); }
  }
  async function createPlan(e) {
    e.preventDefault(); setBusy(true); setError(''); setPlan(null);
    try {
      const response = await fetch(`${API}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, travelers: Number(form.travelers), budget_inr: Number(form.budget_inr), interests, user_id: 'local' }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'Planning failed'); setPlan(data);
      if (interests.length) {
        const remembered = [...new Set([...memory, ...interests.map(i => i.toLowerCase())])];
        setMemory(remembered);
        fetch(`${API}/api/preferences/local`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences: remembered }) }).catch(() => {});
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function replan() {
    if (!plan) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/api/replan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, event, delay_hours: Number(delay) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'Replanning failed'); setPlan(data);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  const updateMemory = value => setMemory(value.split(',').map(x => x.trim()).filter(Boolean));

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">w</span> wayfarer</a><span className="top-note">Thoughtful trips, planned together</span><a className="top-link" href="#preferences">Your travel style ↗</a></header>
    <section id="top" className="hero"><div className="eyebrow"><span className="eyebrow-dot"/> YOUR NEXT CHAPTER</div><h1>Go somewhere<br/><em>that stays with you.</em></h1><p>Tell us what matters. We’ll shape the route, mind the budget and leave room for the good surprises.</p></section>
    <div className="content-grid">
      <form className="planner card" onSubmit={createPlan}>
        <div className="section-heading"><div><div className="eyebrow muted">THE STARTING POINT</div><h2>Where to?</h2></div><span className="step">01 <i>—</i> 03</span></div>
        <label className="field-label" htmlFor="destination">Destination</label><input id="destination" value={form.destination} onChange={e => change('destination', e.target.value)} placeholder="A city, a coastline, a feeling" required />
        <div className="two-col"><div><label className="field-label" htmlFor="start">Arrive</label><input id="start" type="date" value={form.start_date} onChange={e => change('start_date', e.target.value)} required /></div><div><label className="field-label" htmlFor="end">Leave</label><input id="end" type="date" value={form.end_date} onChange={e => change('end_date', e.target.value)} required /></div></div>
        <div className="two-col"><div><label className="field-label" htmlFor="people">Travelers</label><input id="people" type="number" min="1" max="20" value={form.travelers} onChange={e => change('travelers', e.target.value)} /></div><div><label className="field-label" htmlFor="budget">Total budget · INR</label><input id="budget" type="number" min="10000" step="5000" value={form.budget_inr} onChange={e => change('budget_inr', e.target.value)} /></div></div>
        <label className="field-label" htmlFor="origin">Starting from</label><input id="origin" value={form.origin} onChange={e => change('origin', e.target.value)} />
        <label className="field-label interests-label">What draws you in?</label><div className="chips">{interestsList.map(item => <button type="button" key={item} onClick={() => toggle(item)} className={`chip ${interests.includes(item) ? 'selected' : ''}`}>{interests.includes(item) && <span>✓ </span>}{item}</button>)}</div>
        <label className="field-label" htmlFor="intent">What should we plan?</label><select id="intent" value={form.request} onChange={e => change('request', e.target.value)}><option>Plan my complete trip</option><option>Suggest places to visit</option><option>Find a place to stay</option><option>Help with flights and transport</option></select>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="submit" disabled={busy}>{busy ? <><span className="spinner"/> Finding your way…</> : <>Build my trip <span>↗</span></>}</button>
        <div className="privacy">✳ &nbsp; Estimates for inspiration. Nothing gets booked.</div>
      </form>

      <aside className="side-column">
        <section className="note-card"><div className="note-symbol">✳</div><div className="eyebrow">A LITTLE INTENTION GOES A LONG WAY</div><p>We’ll group nearby places into a sensible route and keep an eye on what the whole trip might cost.</p>{llm && <div className="provider-status"><span className={llm.credentials_present ? 'provider-dot ready' : 'provider-dot'} />{llm.credentials_present ? `${llm.model} · Gemini free tier` : 'Local routing · add a Gemini key to enable AI routing'}</div>}<div className="note-foot">MADE FOR THE WAY YOU LIKE TO TRAVEL</div></section>
        <section className="memory-card" id="preferences"><div className="memory-head"><div><div className="eyebrow muted">YOUR TRAVEL MEMORY</div><h3>We’ll remember<br/>what you love.</h3></div><span className="memory-icon">✿</span></div><p>Your preferences help future trips feel more like yours.</p><label htmlFor="memory" className="field-label">Separate each preference with a comma</label><textarea id="memory" rows="3" value={memory.join(', ')} onChange={e => updateMemory(e.target.value)} /><button className="text-button" type="button" onClick={saveMemory}>Save my preferences <span>→</span></button></section>
      </aside>
    </div>

    {busy && <div className="progress card"><div className="spinner dark"/><span>Our trip planner is bringing the pieces together…</span></div>}
    {plan && <section className="results" aria-live="polite">
      <div className="result-title"><div><div className="eyebrow muted">A FIRST DRAFT, MADE FOR YOU</div><h2>{plan.destination}<span>{plan.country ? ` · ${plan.country}` : ''}</span></h2><p>{plan.dates.start} — {plan.dates.end} &nbsp;·&nbsp; {plan.travelers} travelers</p></div><div className={`budget-stamp ${plan.budget?.within_budget ? '' : 'over'}`}><span>{plan.budget?.within_budget ? 'WITHIN BUDGET' : 'OVER BUDGET'}</span><strong>{money(plan.budget?.estimated_total_inr)}</strong><small>of {money(plan.budget?.limit_inr)}</small></div></div>
      <div className="agent-row">{plan.agents_used?.map((agent, i) => <span key={`${agent}-${i}`} className="agent-pill"><b>✓</b> {agent}</span>)}</div>
      <div className="result-grid">
        {plan.itinerary?.length > 0 && <article className="result-card itinerary-card"><div className="eyebrow muted">THE DAYS, AT YOUR PACE</div><h3>Your itinerary</h3><div className="days">{plan.itinerary.map((day, i) => <div className="day" key={day.date}><div className="day-index">{String(i + 1).padStart(2, '0')}</div><div className="day-body"><div className="day-date">{new Date(`${day.date}T12:00:00`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })}</div><ul>{day.activities.map((activity, j) => <li key={`${activity}-${j}`}>{activity}</li>)}</ul>{day.replanned_note && <small className="replan-note">{day.replanned_note}</small>}</div><div className="distance">{day.estimated_travel_km || 0} km</div></div>)}</div></article>}
        {plan.budget && <article className="result-card"><div className="eyebrow muted">A WORKING ESTIMATE</div><h3>Where it goes</h3><div className="cost-list">{Object.entries(plan.budget.categories_inr).map(([key, value]) => <div className="cost-line" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{money(value)}</strong></div>)}</div>{plan.budget.adjustments?.map((text, i) => <p className="adjustment" key={i}>↳ {text}</p>)}</article>}
        {plan.weather && <article className="result-card"><div className="eyebrow muted">A LOOK AT THE SKY</div><h3>Weather outlook</h3>{plan.weather.days?.length ? plan.weather.days.map(day => <div className="cost-line live-option" key={day.date}><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })} · {day.summary}</span><strong>{day.low_c}°–{day.high_c}°C</strong></div>) : <p className="small-note">{plan.weather.note}</p>}<p className="small-note">{plan.weather.source}</p></article>}
        {plan.attractions?.length > 0 && <article className="result-card"><div className="eyebrow muted">WORTH A DETOUR</div><h3>Places to explore</h3><div className="place-list">{plan.attractions.slice(0, 7).map((a, i) => <div className="place" key={a.name}><span className="place-num">{String(i + 1).padStart(2, '0')}</span><span>{a.name}</span><span className="place-category">{a.category}</span></div>)}</div><p className="small-note">Places: {plan.places_source || 'demo'}. Route legs: {plan.route_source || 'straight-line estimate'}.</p></article>}
        {plan.transport && <article className="result-card"><div className="eyebrow muted">GETTING THERE & AROUND</div><h3>{plan.transport.origin} <span className="arrow">→</span> {plan.transport.destination}</h3><div className="transport-cost">{money(plan.transport.estimated_fare_inr)} <small>estimated return fare</small></div>{plan.flight_options?.map((flight, i) => <div className="cost-line live-option" key={`${flight.airline}-${i}`}><span>{flight.airline} · {flight.stops} stop(s)</span><strong>{money(flight.price_inr)}</strong></div>)}<p className="small-note">{plan.transport.note} Local transit estimate: {money(plan.transport.local_transit_per_day_inr)} per day.</p></article>}
        {plan.accommodation && <article className="result-card"><div className="eyebrow muted">A PLACE TO LAND</div><h3>{plan.accommodation.name}</h3><div className="transport-cost">{money(plan.accommodation.estimated_total_inr)} <small>estimated total · {plan.accommodation.nights} nights · {plan.accommodation.rooms || 1} room(s)</small></div>{plan.hotel_options?.slice(0, 3).map((hotel, i) => <div className="cost-line live-option" key={`${hotel.hotel_id}-${i}`}><span>{hotel.name}</span><strong>{money(hotel.estimated_total_inr)}</strong></div>)}<p className="small-note">{plan.accommodation.note}</p></article>}
      </div>
      <div className="replan card"><div><div className="eyebrow muted">PLANS CHANGE. THAT'S OKAY.</div><h3>Need to reshape a day?</h3><p>Tell us what changed and we’ll make the first day easier.</p></div><div className="replan-controls"><input aria-label="What changed" value={event} onChange={e => setEvent(e.target.value)} /><div className="replan-bottom"><label>Delay <input aria-label="Delay in hours" type="number" min="0" max="72" value={delay} onChange={e => setDelay(e.target.value)} /> hrs</label><button type="button" onClick={replan} disabled={busy}>Replan day ↗</button></div></div></div>
      {plan.replan_note && <div className="updated-banner">✳ &nbsp;{plan.replan_note}</div>}
    </section>}
    <footer><span>wayfarer</span><span>Go at your own pace.</span><span>DEMO ESTIMATES · NO BOOKINGS</span></footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
