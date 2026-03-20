import React, { useState, useEffect } from 'react';
import { Bot, Play, Square, Settings, Users, Trophy, MessageSquare, AlertCircle } from 'lucide-react';

interface Report {
  id: number;
  userId: number;
  username: string;
  text: string;
  score: number;
  feedback: string;
  date: string;
}

export default function App() {
  const [token, setToken] = useState('8728967781:AAHxtpZdgisfJz3tN47Ke1f-789iP-tItwc');
  const [channelId, setChannelId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchStatus();
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      const data = await res.json();
      setIsRunning(data.isRunning);
      if (data.channelId) setChannelId(data.channelId);
    } catch (e) {
      console.error('Failed to fetch status', e);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (e) {
      console.error('Failed to fetch reports', e);
    }
  };

  const startBot = async () => {
    if (!token) {
      setStatusMsg('يرجى إدخال توكن البوت أولاً.');
      return;
    }
    setStatusMsg('جاري تشغيل البوت...');
    try {
      const res = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, channel: channelId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRunning(true);
        setStatusMsg('البوت يعمل الآن بنجاح!');
      } else {
        setStatusMsg('حدث خطأ: ' + data.error);
      }
    } catch (e) {
      setStatusMsg('حدث خطأ في الاتصال بالخادم.');
    }
  };

  const stopBot = async () => {
    setStatusMsg('جاري إيقاف البوت...');
    try {
      const res = await fetch('/api/bot/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsRunning(false);
        setStatusMsg('تم إيقاف البوت.');
      }
    } catch (e) {
      setStatusMsg('حدث خطأ في الاتصال بالخادم.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md py-6 px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Bot size={32} />
          <h1 className="text-2xl font-bold">لوحة تحكم بوت التقارير الذكي</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar / Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 text-indigo-600">
              <Settings size={20} />
              <h2 className="text-lg font-semibold">إعدادات البوت</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">توكن البوت (Bot Token)</label>
                <input 
                  type="password" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left"
                  dir="ltr"
                />
                <p className="text-xs text-slate-500 mt-1">احصل عليه من @BotFather في تيلغرام</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">معرف القناة (Channel ID)</label>
                <input 
                  type="text" 
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="@mychannel"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left"
                  dir="ltr"
                />
                <p className="text-xs text-slate-500 mt-1">اختياري: لنشر الترتيب تلقائياً (تأكد من رفع البوت كأدمن)</p>
              </div>

              {statusMsg && (
                <div className="p-3 bg-indigo-50 text-indigo-700 text-sm rounded-lg flex gap-2 items-start">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                {!isRunning ? (
                  <button 
                    onClick={startBot}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play size={18} />
                    تشغيل البوت
                  </button>
                ) : (
                  <button 
                    onClick={stopBot}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Square size={18} />
                    إيقاف البوت
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-3">كيف يعمل البوت؟</h3>
            <ul className="text-sm text-indigo-800 space-y-2 list-disc list-inside">
              <li>يقوم الطلاب بإرسال تقاريرهم للبوت في الخاص.</li>
              <li>يحلل الذكاء الاصطناعي التقرير ويعطيه تقييم من 10.</li>
              <li>عند إرسال الكلمة السرية <strong>"هاتشو"</strong> للبوت، سيقوم بتجميع النقاط ونشر الترتيب.</li>
              <li>إذا تم تحديد قناة، سيتم نشر الترتيب فيها.</li>
            </ul>
          </div>
        </div>

        {/* Main Content / Reports */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-indigo-600">
                <MessageSquare size={20} />
                <h2 className="text-lg font-semibold">أحدث التقارير</h2>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm font-medium text-slate-600">
                الإجمالي: {reports.length}
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>لا توجد تقارير حتى الآن.</p>
                <p className="text-sm mt-1">بمجرد تشغيل البوت وإرسال الطلاب لتقاريرهم، ستظهر هنا.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {reports.slice().reverse().map((report) => (
                  <div key={report.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-slate-900">@{report.username}</div>
                      <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-sm font-bold">
                        <Trophy size={14} />
                        {report.score}/10
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm mb-3 whitespace-pre-wrap">{report.text}</p>
                    <div className="bg-white p-3 rounded-lg text-sm text-slate-600 border border-slate-200">
                      <span className="font-medium text-indigo-600 block mb-1">ملاحظات الذكاء الاصطناعي:</span>
                      {report.feedback}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
