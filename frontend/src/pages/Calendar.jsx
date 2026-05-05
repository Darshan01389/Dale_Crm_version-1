import React, { useState } from 'react';

const Calendar = () => {
  const [view, setView] = useState('Week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  
  // Use a proper date state for navigation
  const [baseDate, setBaseDate] = useState(new Date()); // Use current date as base

  const getWeekDays = (start) => {
    const days = [];
    const date = new Date(start);
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    for (let i = 0; i < 7; i++) {
      days.push({
        label: dayNames[i],
        date: date.getDate(),
        fullDate: new Date(date)
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getWeekDays(baseDate);
  const times = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

  const formatDateRange = (start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}, ${start.getFullYear()}`;
  };

  const handlePrev = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() - 7);
    setBaseDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + 7);
    setBaseDate(newDate);
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  const events = [
    { id: 1, day: 'MON', time: '10 AM', title: 'Sarah Jenkins', type: 'Product Demo', status: 'confirmed', description: 'Showcasing the new WhatsApp integration features.', meeting_link: 'https://meet.google.com/abc-defg-hij' },
    { id: 2, day: 'TUE', time: '2 PM', title: 'Michael Chen', type: 'Discovery Call', status: 'confirmed', description: 'Initial discovery to understand procurement needs.', meeting_link: 'https://wa.me/919876543210' },
    { id: 3, day: 'WED', time: '11 AM', title: 'Priya Patel', type: 'Pricing Review', status: 'awaiting', description: 'Reviewing the enterprise tier proposal.', meeting_link: 'https://meet.google.com/xyz-pdqr-stuv' },
    { id: 4, day: 'THU', time: '4 PM', title: 'Rajesh Kumar', type: 'Follow-up', status: 'confirmed', description: 'Checking in after the initial pilot period.', meeting_link: 'https://wa.me/919876543210' },
  ];

  const handleReschedule = () => {
    // In a real app, we'd update the event in state or database
    console.log(`Rescheduling ${selectedEvent.title} to ${rescheduleData.date} at ${rescheduleData.time}`);
    setShowReschedule(false);
    setSelectedEvent(null);
    alert(`Meeting rescheduled to ${rescheduleData.date} at ${rescheduleData.time}`);
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
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Google Calendar Connected</span>
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
                const event = events.find(e => e.day === day.label && e.time === time);
                return (
                  <div key={day.label} style={{
                    position: 'relative', height: 100, padding: 4,
                    background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', borderTop: '1px solid var(--border-subtle)'
                  }}>
                    {event && (
                      <div 
                        onClick={() => setSelectedEvent(event)}
                        style={{
                          height: '100%', borderRadius: 10, padding: '10px 14px',
                          background: event.status === 'confirmed'
                            ? 'rgba(31, 78, 121, 0.08)'
                            : 'rgba(217, 119, 6, 0.08)',
                          border: `1.5px solid ${event.status === 'confirmed' ? 'var(--primary)' : 'var(--owner-accent)'}`,
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
                          color: event.status === 'confirmed' ? 'var(--primary)' : 'var(--owner-accent)'
                        }}>
                          {event.title}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>
                          {event.type}
                        </div>
                        {/* Reschedule Icon */}
                        <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 16, color: 'var(--text-muted)', opacity: 0.6 }}>
                          ↩️
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(31, 78, 121, 0.08)', border: '1.5px solid var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Confirmed Meeting</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(217, 119, 6, 0.08)', border: '1.5px solid var(--owner-accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Pending Response</span>
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
              maxWidth: showReschedule ? 800 : 400, 
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
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>{selectedEvent?.type?.toUpperCase() || 'EVENT'}</div>
                  <h3 className="text-h2" style={{ margin: 0, fontSize: 24 }}>{selectedEvent?.title}</h3>
                </div>
                {!showReschedule && <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🕒</div>
                  <div>
                     <div style={{ fontSize: 14, fontWeight: 800 }}>Today, {selectedEvent?.time}</div>
                     <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Duration: 45 minutes</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📍</div>
                  <div>
                     <div style={{ fontSize: 14, fontWeight: 800 }}>Meeting Channel</div>
                     <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Google Meet / WhatsApp</div>
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 12, fontSize: 14, color: 'var(--text)', lineHeight: 1.6, border: '1px solid var(--border-subtle)' }}>
                  {selectedEvent?.description}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  className="btn-primary" 
                  onClick={() => window.open(selectedEvent?.meeting_link, '_blank')}
                  style={{ flex: 1.5, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}
                >
                  Join Meeting
                </button>
                {!showReschedule && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowReschedule(true)}
                    style={{ flex: 1, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}
                  >
                    Reschedule
                  </button>
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
            style={{ width: '100%', maxWidth: 450, background: 'var(--bg-surface)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Schedule New Meeting</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Set up a new calendar event for your prospect.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>PROSPECT NAME</label>
                <input placeholder="e.g. John Doe" className="input" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>MEETING TITLE</label>
                <input placeholder="e.g. Product Walkthrough" className="input" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>DATE</label>
                  <input type="date" className="input" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>TIME</label>
                  <input type="time" className="input" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>MEETING LINK (WHATSAPP/GOOGLE MEET)</label>
                <input placeholder="https://meet.google.com/..." className="input" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 8 }}>DESCRIPTION</label>
                <textarea placeholder="Agenda or notes..." className="input" style={{ height: 80, resize: 'none' }} />
              </div>
              <button 
                onClick={() => {
                  alert('Meeting scheduled successfully!');
                  setShowNewMeeting(false);
                }} 
                className="btn-primary" 
                style={{ height: 52, marginTop: 12, borderRadius: 12, fontSize: 16, fontWeight: 800 }}
              >
                Schedule Meeting →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Calendar;
