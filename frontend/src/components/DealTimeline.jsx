import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, AlertCircle, Clock, Zap, MessageCircle } from 'lucide-react';

export const DealTimeline = ({ dealId }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        if (dealId === 'demo-deal-123') {
          setTimeout(() => {
            setPrediction({
              deal_id: dealId,
              base_ml_probability: 62.5,
              multi_modal_probability: 87.2,
              expected_value: 7800000,
              original_close_date: '2026-04-25',
              predicted_close_date: '2026-04-15',
              reasons: [
                "Base ML Engine calculated a 62.5% probability.",
                "Voice Tone Intelligence: Detected positive language in 2 call(s). Increased probability by +10.0%.",
                "WhatsApp Intelligence: High engagement signals urgency. Increased probability by +14.7%."
              ]
            });
            setLoading(false);
          }, 800);
          return;
        }

        const token = localStorage.getItem('voiceiq_token');
        const response = await fetch(`/api/deals/${dealId}/prediction`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch prediction');
        const data = await response.json();
        setPrediction(data);
      } catch (err) {
        console.error("Prediction fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [dealId]);

  if (loading || !prediction) {
    return (
      <div className="glass-card p-6 border-foreground/[0.06] animate-pulse flex flex-col gap-4">
        <div className="h-6 w-1/3 skeleton rounded-lg" />
        <div className="h-4 w-1/2 skeleton rounded-lg" />
        <div className="flex gap-4 mt-4">
           <div className="h-16 w-16 skeleton rounded-full" />
           <div className="h-16 flex-grow skeleton rounded-lg" />
        </div>
      </div>
    );
  }

  const probDiff = (prediction.multi_modal_probability - prediction.base_ml_probability).toFixed(1);
  const isPositiveShift = parseFloat(probDiff) > 0;

  return (
    <div className="glass-card p-6 border-foreground/[0.06] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
        <Target className="w-32 h-32" />
      </div>
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <h3 className="text-xl font-black text-foreground flex items-center gap-2 tracking-tight">
            <Zap className="w-5 h-5 text-amber-400" />
            AI Deal Prediction
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest">Multi-Modal Intelligence Engine</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black gradient-text">
            {prediction.multi_modal_probability}%
          </div>
          <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            {isPositiveShift ? '+' : ''}{probDiff}% vs Base ML
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 relative z-10">
        <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
          <div 
            className="h-full gradient-primary rounded-full transition-all duration-1000"
            style={{ width: `${prediction.multi_modal_probability}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">
          <span>Base: {prediction.base_ml_probability}%</span>
          <span>AI Enhanced: {prediction.multi_modal_probability}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
        <div className="bg-foreground/[0.03] border border-foreground/10 p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-widest">Expected Value</p>
          <p className="text-lg font-black text-foreground">₹{(prediction.expected_value / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-foreground/[0.03] border border-foreground/10 p-4 rounded-xl">
          <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-widest flex items-center gap-1">
            <Clock className="w-3 h-3"/> Predicted Close
          </p>
          <p className="text-lg font-black text-foreground">{prediction.predicted_close_date}</p>
          {prediction.predicted_close_date !== prediction.original_close_date && (
            <p className="text-[10px] text-emerald-500 mt-0.5 font-bold">Shifted from {prediction.original_close_date}</p>
          )}
        </div>
      </div>

      <div className="space-y-2.5 relative z-10">
        <h4 className="text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-widest">Intelligence Reasoning</h4>
        {prediction.reasons.map((reason, idx) => {
          let Icon = AlertCircle;
          let color = "text-blue-400";
          
          if (reason.includes("Voice"))    { Icon = Zap;           color = "text-indigo-400"; }
          if (reason.includes("WhatsApp")) { Icon = MessageCircle; color = "text-emerald-400"; }

          return (
            <div key={idx} className="flex gap-3 items-start bg-foreground/[0.03] p-3 rounded-xl border border-foreground/[0.06]">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
              <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
