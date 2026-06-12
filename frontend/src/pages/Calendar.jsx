import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Calendar = () => {
  const [view, setView] = useState('Week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  
  // Use a proper date state for navigation
  const [baseDate, setBaseDate] = useState(new Date()); // Use current date as base
  
  // Real database-backed states
  const [dbEvents, setDbEvents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLeadId, setNewLeadId] = useState('');
  const [newEventType, setNewEventType] = useState('meeting');
  const [newAttendees, setNewAttendees] = useState('');

  // Reschedule Form State
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/calendar/events');
      setDbEvents(res.data);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/api/leads');
      setLeads(res.data);
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchLeads();
  }, []);

  const getWeekDays = (start) => {
    const days = [];
    const date = new Date(start);
    // Find the Monday of the current week of 'start'
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    for (let i = 0; i < 7; i++) {
      days.push({
        label: dayNames[i],
        date: monday.getDate(),
        fullDate: new Date(monday)
      });
      monday.setDate(monday.getDate() + 1);
    }
    return days;
  };

  const days = getWeekDays(baseDate);
  const times = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

  const formatDateRange = (start) => {
    const end = new Date(start);
    // Align with viewed week start
    const day = end.getDay();
    const diff = end.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(end.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    return `${monday.toLocaleDateString('en-US', options)} – ${sunday.toLocaleDateString('en-US', options)}, ${monday.getFullYear()}`;
  };

  const handlePrev = () => {
    const newDateObj = new Date(baseDate);
    newDateObj.setDate(newDateObj.getDate() - 7);
    setBaseDate(newDateObj);
  };

  const handleNext = () => {
    const newDateObj = new Date(baseDate);
    newDateObj.setDate(newDateObj.getDate() + 7);
    setBaseDate(newDateObj);
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  const getTimeLabel = (date) => {
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours} ${ampm}`;
  };

  const getEventForDayAndTime = (dayFullDate, timeLabel) => {
    return dbEvents.find(e => {
      const eDate = new Date(e.start_time);
      const sameDate = eDate.getFullYear() === dayFullDate.getFullYear() &&
                       eDate.getMonth() === dayFullDate.getMonth() &&
                       eDate.getDate() === dayFullDate.getDate();
      if (!sameDate) return false;
      const eTimeLabel = getTimeLabel(eDate);
      return eTimeLabel === timeLabel;
    });
  };

  const handleReschedule = async () => {
    try {
      const start = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
      const end = new Date(start.getTime() + 45 * 60 * 1000);
      
      const res = await api.patch(`/api/calendar/events/${selectedEvent.id}`, {
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
      
      // Update local state
      setDbEvents(dbEvents.map(e => e.id === selectedEvent.id ? res.data : e));
      setShowReschedule(false);
      setSelectedEvent(null);
      alert(`Meeting rescheduled successfully!`);
    } catch (err) {
      console.error("Error rescheduling meeting:", err);
      alert("Failed to reschedule meeting.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await api.delete(`/api/calendar/events/${selectedEvent.id}`);
      setDbEvents(dbEvents.filter(e => e.id !== selectedEvent.id));
      setSelectedEvent(null);
      alert("Meeting deleted successfully!");
    } catch (err) {
      console.error("Error deleting meeting:", err);
      alert("Failed to delete meeting.");
    }
  };

  const handleCreateMeeting = async () => {
    if (!newTitle || !newDate || !newTime) {
      alert("Please fill in the title, date, and time.");
      return;
    }
    
    try {
      const start = new Date(`${newDate}T${newTime}`);
      const end = new Date(start.getTime() + 45 * 60 * 1000);
      
      const payload = {
        title: newTitle,
        description: newDescription,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        lead_id: newLeadId || null,
        event_type: newEventType,
        attendees: newAttendees,
        is_all_day: false
      };
      
      const res = await api.post('/api/calendar/events', payload);
      setDbEvents([...dbEvents, res.data]);
      setShowNewMeeting(false);
      
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewDate('');
      setNewTime('');
      setNewLeadId('');
      setNewEventType('meeting');
      setNewAttendees('');
      
      alert('Meeting scheduled successfully!');
    } catch (err) {
      console.error("Error creating event:", err);
      alert("Failed to schedule meeting.");
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{
        padding: '24px 30px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-surface)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div>
            <h2 className="text-h2" style={{ margin: 0 }}>Schedule</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Connected to CRM database</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handlePrev} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--text)', fontWeight: 800 }}>←</button>
              <button onClick={handleNext} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--text)', fontWeight: 800 }}>→</button>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', minWidth: 200, textAlign: 'center' }}>{formatDateRange(baseDate)}</span>
            <button onClick={handleToday} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--text)' }}>Today</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            display: 'flex', background: 'var(--bg-subtle)',
            padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)'
          }}>
            {['Day', 'Week', 'Month'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 800,
                cursor: 'pointer', border: 'none',
                background: view === v ? 'var(--bg-surface)' : 'transparent',
                color: view === v ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: view === v ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}>{v}</button>
            ))}
          </div>
          <button onClick={() => setShowNewMeeting(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 800 }}>
            + New Meeting
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 30px' }} className="custom-scroll">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Loading calendar events...
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)',
            border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
            background: 'var(--border)'
          }}>
            {/* Header row */}
            <div style={{ background: 'var(--bg-subtle)' }} />
            {days.map(day => (
              <div key={day.label} style={{
                padding: '16px', textAlign: 'center', background: 'var(--bg-subtle)',
                fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1
              }}>
                <div style={{ marginBottom: 4 }}>{day.label}</div>
                <div style={{ fontSize: 18, color: 'var(--text)', fontWeight: 800 }}>{day.date}</div>
              </div>
            ))}

            {/* Time rows */}
            {times.map(time => (
              <React.Fragment key={time}>
                <div style={{
                  padding: '24px 12px', textAlign: 'right',
                  fontSize: 11, fontWeight: 800, color: 'var(--text-micro)',
                  background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)'
                }}>
                  {time}
                </div>
                {days.map(day => {
                  const event = getEventForDayAndTime(day.fullDate, time);
                  return (
                    <div key={day.label} style={{
                      position: 'relative', height: 100, padding: 4,
                      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', borderTop: '1px solid var(--border-subtle)'
                    }}>
                      {event && (
                        <div 
                          onClick={() => {
                            setSelectedEvent(event);
                            setRescheduleData({
                              date: new Date(event.start_time).toISOString().split('T')[0],
                              time: new Date(event.start_time).toTimeString().split(' ')[0].substring(0, 5)
                            });
                          }}
                          style={{
                            height: '100%', borderRadius: 10, padding: '10px 14px',
                            background: event.event_type === 'call'
                              ? 'rgba(16, 185, 129, 0.08)'
                              : event.event_type === 'followup'
                              ? 'rgba(217, 119, 6, 0.08)'
                              : 'rgba(79, 70, 229, 0.08)',
                            border: `1.5px solid ${
                              event.event_type === 'call' 
                                ? '#10B981' 
                                : event.event_type === 'followup' 
                                ? 'var(--owner-accent)' 
                                : 'var(--primary)'
                            }`,
                            cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                            position: 'relative', zIndex: 10
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            fontSize: 13, fontWeight: 800,
                            color: event.event_type === 'call' 
                              ? '#10B981' 
                              : event.event_type === 'followup' 
                              ? 'var(--owner-accent)' 
                              : 'var(--primary)'
                          }}>
                            {event.title}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>
                            {event.event_type?.toUpperCase()}
                          </div>
                          <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 14, opacity: 0.6 }}>
                            📅
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(79, 70, 229, 0.08)', border: '1.5px solid var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Meeting</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #10B981' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Call</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(217, 119, 6, 0.08)', border: '1.5px solid var(--owner-accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Follow-up</span>
          </div>
        </div>
      </div>

      {/* Event Details & Reschedule Side-by-Side */}
      {(selectedEvent || showReschedule) && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => { setSelectedEvent(null); setShowReschedule(false); }}
        >
          <div 
            className="animate-in"
            style={{ 
              width: '100%', 
              maxWidth: showReschedule ? 800 : 450, 
              background: 'var(--bg-surface)', 
              borderRadius: 24, 
              display: 'flex',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)', 
              border: '1px solid var(--border)',
              transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Details Panel */}
            <div style={{ flex: 1, padding: 32, borderRight: showReschedule ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>{selectedEvent?.event_type?.toUpperCase() || 'EVENT'}</div>
                  <h3 className="text-h2" style={{ margin: 0, fontSize: 24 }}>{selectedEvent?.title}</h3>
                </div>
                {!showReschedule && <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🕒</div>
                  <div>
                     <div style={{ fontSize: 14, fontWeight: 800 }}>
                       {selectedEvent ? new Date(selectedEvent.start_time).toLocaleString() : ''}
                     </div>
                     <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Duration: 45 minutes</div>
                  </div>
                </div>
                {selectedEvent?.attendees && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👥</div>
                    <div>
                       <div style={{ fontSize: 14, fontWeight: 800 }}>Attendees</div>
                       <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{selectedEvent.attendees}</div>
                    </div>
                  </div>
                )}
                {selectedEvent?.lead_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                    <div>
                       <div style={{ fontSize: 14, fontWeight: 800 }}>Associated Lead</div>
                       <a 
                         href={`/leads/${selectedEvent.lead_id}`} 
                         style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
                       >
                         View Lead Profile →
                       </a>
                    </div>
                  </div>
                )}
                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 12, fontSize: 14, color: 'var(--text)', lineHeight: 1.6, border: '1px solid var(--border-subtle)' }}>
                  {selectedEvent?.description || 'No description provided.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {!showReschedule && (
                  <>
                    <button 
                      className="btn-primary" 
                      onClick={() => setShowReschedule(true)}
                      style={{ flex: 1.5, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={handleDeleteEvent}
                      style={{ flex: 1, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800, background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Reschedule Panel (Pops up beside) */}
            {showReschedule && (
              <div style={{ flex: 1, padding: 32, background: 'var(--bg-subtle)', animation: 'fadeInRight 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Reschedule</h3>
                  <button onClick={() => setShowReschedule(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>NEW DATE</label>
                    <input 
                      type="date" 
                      className="input" 
                      value={rescheduleData.date}
                      onChange={e => setRescheduleData({...rescheduleData, date: e.target.value})}
                      style={{ background: 'white' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>NEW TIME</label>
                    <input 
                      type="time" 
                      className="input" 
                      value={rescheduleData.time}
                      onChange={e => setRescheduleData({...rescheduleData, time: e.target.value})}
                      style={{ background: 'white' }}
                    />
                  </div>
                  
                  <button 
                    onClick={handleReschedule} 
                    className="btn-primary" 
                    style={{ height: 52, borderRadius: 12, fontWeight: 800, marginTop: 12 }}
                    disabled={!rescheduleData.date || !rescheduleData.time}
                  >
                    Confirm Reschedule →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Meeting Modal */}
      {showNewMeeting && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowNewMeeting(false)}
        >
          <div 
            className="animate-in"
            style={{ width: '100%', maxWidth: 500, background: 'var(--bg-surface)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Schedule New Event</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Set up a calendar event for a prospect or team follow-up.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>ASSOCIATED LEAD (OPTIONAL)</label>
                <select 
                  className="input" 
                  value={newLeadId} 
                  onChange={e => setNewLeadId(e.target.value)}
                  style={{ background: 'white' }}
                >
                  <option value="">-- Select a Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.title} ({l.company || 'No Company'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>EVENT TITLE</label>
                <input 
                  placeholder="e.g. Product Demo Call" 
                  className="input" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>DATE</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>TIME</label>
                  <input 
                    type="time" 
                    className="input" 
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>EVENT TYPE</label>
                <select 
                  className="input" 
                  value={newEventType} 
                  onChange={e => setNewEventType(e.target.value)}
                  style={{ background: 'white' }}
                >
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="followup">Follow-up</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>ATTENDEES (EMAILS, COMMA SEPARATED)</label>
                <input 
                  placeholder="prospect@email.com, colleague@email.com" 
                  className="input" 
                  value={newAttendees}
                  onChange={e => setNewAttendees(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>DESCRIPTION</label>
                <textarea 
                  placeholder="Agenda or notes..." 
                  className="input" 
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{ height: 80, resize: 'none' }} 
                />
              </div>
              <button 
                onClick={handleCreateMeeting} 
                className="btn-primary" 
                style={{ height: 52, marginTop: 12, borderRadius: 12, fontSize: 16, fontWeight: 800 }}
              >
                Schedule Event →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Calendar;
