import express from 'express';
import { createServer as createViteServer } from 'vite';
import TelegramBot from 'node-telegram-bot-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
let bot: TelegramBot | null = null;
let channelId: string = '';

interface Report {
  id: number;
  userId: number;
  username: string;
  text: string;
  score: number;
  feedback: string;
  date: string;
}
const reports: Report[] = [];

app.post('/api/bot/start', (req, res) => {
  const { token, channel } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  if (bot) bot.stopPolling();

  try {
    bot = new TelegramBot(token, { polling: true });
    channelId = channel || '';

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const userId = msg.from?.id;
      const username = msg.from?.username || msg.from?.first_name || 'طالب';

      if (!text || !userId || msg.chat.type === 'channel') return;

      if (text === 'هاتشو') {
        const leaderboard = generateLeaderboard();
        if (channelId) {
          bot?.sendMessage(channelId, leaderboard).catch(console.error);
          bot?.sendMessage(chatId, 'تم إرسال الترتيب إلى القناة!');
        } else {
          bot?.sendMessage(chatId, leaderboard);
        }
        return;
      }

      if (text.startsWith('/start')) {
        bot?.sendMessage(chatId, 'أهلاً بك في مدرسة الصراط! أرسل تقريرك للتقييم.');
        return;
      }

      bot?.sendMessage(chatId, 'جاري التحليل بواسطة Gemini...');
      try {
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `قيم التقرير التالي من 10 وأعطِ ملاحظات بالعربية. التنسيق JSON: {"score": 0, "feedback": ""}. التقرير: "${text}"`;

        const resultAI = await model.generateContent(prompt);
        const responseAI = await resultAI.response;
        const cleanJson = responseAI.text().replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleanJson);

        reports.push({
          id: Date.now(), userId, username, text,
          score: result.score, feedback: result.feedback,
          date: new Date().toISOString()
        });

        bot?.sendMessage(chatId, `✅ التقييم: ${result.score}/10\n${result.feedback}`);
      } catch (e) {
        bot?.sendMessage(chatId, 'خطأ في التحليل، تأكد من الـ API Key.');
      }
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/bot/stop', (req, res) => {
  if (bot) { bot.stopPolling(); bot = null; }
  res.json({ success: true });
});

app.get('/api/reports', (req, res) => res.json(reports));

function generateLeaderboard() {
  const userScores: Record<string, number> = {};
  reports.forEach(r => userScores[r.username] = (userScores[r.username] || 0) + r.score);
  const sorted = Object.entries(userScores).sort((a, b) => b[1] - a[1]);
  let msg = '🏆 ترتيب طلاب مدرسة الصراط 🏆\n\n';
  sorted.forEach(([user, score], i) => {
    msg += `${i === 0 ? '🥇' : '🏅'} ${user}: ${score} نقطة\n`;
  });
  return sorted.length ? msg : 'لا توجد تقارير بعد.';
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server: http://localhost:${PORT}`));
}
startServer();