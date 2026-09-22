import { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  showFeedback?: boolean
}

// ── Anime-style thinking messages ──────────────────────────────────────────
const THINKING_MESSAGES = [
  "Nani?! Processing your request... 😤",
  "AI-chan is thinking very hard... (she's not) ✨",
  "Consulting the ancient college scrolls... 📜",
  "Ara ara~ this is a tough one...",
  "Loading forbidden knowledge... Error 404 💀",
  "Running 47 useless algorithms... desu~ 🌸",
  "Senpai noticed your problem and doesn't care~",
  "Accessing the void between lectures... 🌌",
  "Calculating the amount of effort needed... arriving at zero~",
  "This is giving AI-chan a headache... 😵‍💫",
  "Yare yare... consulting senior students... they also don't know 🙄",
]

// ── Quick categories ───────────────────────────────────────────────────────
const CATEGORIES = [
  { icon: "📅", label: "Attendance Arc", prompt: "My attendance is 62%, what should I do?" },
  { icon: "📚", label: "Exam Eve Crisis", prompt: "I have an exam tomorrow and haven't studied anything" },
  { icon: "📝", label: "Assignment Boss", prompt: "I have an assignment due tomorrow and haven't started" },
  { icon: "🏃", label: "Late Episode", prompt: "I am running late for class right now" },
  { icon: "😤", label: "Angry Sensei", prompt: "My professor is extremely angry with me" },
  { icon: "🗺️", label: "Lost on Campus", prompt: "Where exactly is Room 204?" },
  { icon: "📊", label: "Grade Redemption", prompt: "How do I improve my CGPA from 5.2?" },
  { icon: "😴", label: "No Sleep Saga", prompt: "I haven't slept in 36 hours because of assignments" },
]

const USELESS_ADVICE_POOL = [
  "Have you considered the possibility that everything will work out? It probably won't, but consider it. 🌸",
  "Today's wisdom: hydrate. Not because it'll fix your problems, but dehydration makes everything worse, desu~. 💧",
  "Your future self will figure it out. This is your present self's problem. Good luck to both of you~ 🫂",
  "The secret to college success is attending class. You knew this. This has not changed your behavior. Noted. 📋",
  "Take a deep breath. Exhale. Repeat for 4 years. You'll graduate eventually~ 🎓",
  "The syllabus is a document that exists. You can look at it anytime. We both know you won't, ara ara~ 📄",
  "Make friends who understand the subject. Ask them nicely. Fail to understand their explanation anyway. You tried~ 🤝",
  "College is the best years of your life. The rest of your life must be truly something. 💀",
  "Every expert was once a beginner staring blankly at a textbook at 2AM. Keep going, fighter~ 🌙",
  "Sleep is important. So is your deadline. AI-chan cannot resolve this conflict. Ganbatte~ ✨",
]

// ── Response engine ────────────────────────────────────────────────────────
type Rule = { keywords: string[]; responses: string[] }

const rules: Rule[] = [
  {
    keywords: ['room', 'where', 'located', 'location', 'find', 'building', 'block', 'floor', 'lab', 'library'],
    responses: [
      "Somewhere between Room 203 and Room 205. Hope this helps. 😌✨",
      "Have you tried... looking? Shocking strategy, I know. 🔍",
      "According to AI-chan's advanced spatial algorithms, it exists. Somewhere. Godspeed, fighter~ 🗺️",
      "It is located in the building. The building is in the campus. The campus is somewhere your GPS cannot find. Yare yare. 🤷",
      "I have triangulated its position as: somewhere you haven't checked yet. 📍",
    ]
  },
  {
    keywords: ['bee', 'basic electrical', 'circuit', 'electricity', 'ohm', 'resistor', 'capacitor', 'physics', 'math', 'calculus'],
    responses: [
      "Have you tried understanding electricity? ⚡ Just a thought, desu~",
      "AI-chan recommends staring at the circuit diagram until it makes sense. Zero students have succeeded. You could be first~ 📐",
      "Step 1: Understand concepts. Step 2: ??? Step 3: Pass. You're welcome, senpai~ 🎓",
    ]
  },
  {
    keywords: ['exam', 'test', 'viva', 'quiz', 'paper', 'midsem', 'endsem', 'semester'],
    responses: [
      "Excellent. You have successfully unlocked Overnight Study Mode™. All the best, soldier. 🫡",
      "The good news: the exam is tomorrow, not today. The bad news: we both know how tonight will go. 📱",
      "Have you tried panicking? It doesn't help, but it is a time-honored college tradition, desu~ 😰",
      "Caffeine, prayer, and 47 YouTube videos. This is the standard protocol, ara ara~ ☕🙏",
      "The textbook is 600 pages. You have one night. AI-chan believes in you. (She doesn't.) 💀",
      "Pro tip: Open the syllabus. Stare at it. Close it. This is 40% of the college experience. ✅",
    ]
  },
  {
    keywords: ['study', 'studied', 'notes', 'revision', 'prepare', 'haven\'t studied', 'not studied'],
    responses: [
      "A study plan is created the night before with the intention of never being followed. Begin immediately~ 📋",
      "Have you tried the technique where you read the heading, feel overwhelmed, then watch YouTube for 3 hours? Classic. 🎯",
      "Revision tip: flip through the textbook quickly. Gives the impression of studying without the burden of learning. ✨",
    ]
  },
  {
    keywords: ['attendance', 'absent', 'bunk', 'bunked', 'proxy', 'percentage', 'detained'],
    responses: [
      "At this point, attendance is no longer a number. It is a lifestyle. 💀",
      "The college requires 75%. You have achieved something else entirely. Something legendary~ 🏆",
      "AI-chan ran the numbers. Then un-ran them because they were too painful. 📉",
      "Have you considered becoming a ghost? You're already halfway there in campus presence~ 👻",
      "Your attendance is a work of abstract art. Not everyone will understand it, including the exam controller~ 🎨",
      "Have you tried attending? Radical idea. Controversial. But worth exploring, perhaps~ 💡",
    ]
  },
  {
    keywords: ['assignment', 'homework', 'project', 'due', 'submit', 'submission', 'deadline'],
    responses: [
      "Tomorrow is technically still in the future. Therefore, you have plenty of time. 🤝",
      "Have you tried starting it? Bold. Unconventional. May work~ 💡",
      "Step 1: Open the document. Step 2: Type your name. Step 3: You've done more than most. Celebrate. 🎯",
      "Deadline extended in your heart? No? Worth a try, desu~ 💔",
      "AI-chan checked your portal. It still says 'Not Submitted'. Very judgmental portal. 🖥️",
    ]
  },
  {
    keywords: ['professor', 'teacher', 'faculty', 'sir', 'ma\'am', 'mam', 'prof', 'lecturer', 'angry', 'sensei'],
    responses: [
      "Have you considered changing your identity? 🪪",
      "AI-chan recommends sitting in the last row and becoming one with the furniture~ 🪑",
      "A sincere apology works approximately 40% of the time. The other 60% is in God's hands~ 🙏",
      "The professor was once a student too. They have forgotten this. The information may still be useful, ara ara~ 🤔",
      "Perhaps attend one (1) class. Not for grades. As a gesture of goodwill~ 🕊️",
    ]
  },
  {
    keywords: ['late', 'tardy', 'running late', 'going to miss', 'missed', 'miss class'],
    responses: [
      "Walk faster. AI-chan has faith in you. 🏃‍♀️✨",
      "The class started 10 minutes ago. The sensei has noticed. This is now a stealth mission~ 🥷",
      "At your current pace you'll arrive just in time for 'and that concludes today's lecture.' 🏁",
      "Enter quietly. Find a seat. Pretend you have always been there. Classic technique, desu~ 😇",
    ]
  },
  {
    keywords: ['pass', 'fail', 'marks', 'grade', 'gpa', 'cgpa', 'score', 'result', 'backlogs', 'backlog', 'arrear'],
    responses: [
      "The minimum passing mark exists for a reason. That reason is you~ 🎯",
      "Your CGPA is a number. Numbers can be improved. Eventually. Theoretically~ 📊",
      "Have you considered a backup plan? AI-chan is absolutely saying you need one~ 📋",
      "A backlog is just a subject you get to experience twice. Lucky you. Double the knowledge~ 🎁",
      "On the bright side, rock bottom has a solid foundation. Ganbatte~ 🪨",
    ]
  },
  {
    keywords: ['canteen', 'food', 'lunch', 'dinner', 'hungry', 'eat', 'mess', 'cafeteria'],
    responses: [
      "The canteen food builds character. What character exactly is unclear. But: character~ 💪",
      "Have you tried not being hungry? Short-term solution. Ethically questionable. ⏰",
      "Zomato exists. Your wallet disagrees. This is between you two, ara ara~ 📱",
      "The human body can survive on canteen food and sheer determination. Probably~ 🧬",
    ]
  },
  {
    keywords: ['sleep', 'tired', 'exhausted', 'sleepy', 'awake', 'all night', 'overnight', 'haven\'t slept'],
    responses: [
      "Sleep is a luxury. You are a college student. Connect the dots~ 💀",
      "Your body is asking for rest. Your schedule has filed a counter-complaint. 📂",
      "Fun fact: you can sleep in lectures. Many students have pioneered this before you~ 🏆",
      "The average college student runs on 4 hours of sleep and existential dread. Right on schedule~ ⚙️",
    ]
  },
  {
    keywords: ['friend', 'friendship', 'crush', 'love', 'relationship', 'breakup'],
    responses: [
      "College relationships are like group projects: full of hope at the start and chaos at the end. 💔",
      "The heart wants what it wants. The attendance sheet wants 75%. Prioritize, desu~ 🎯",
      "AI-chan is a college academic assistant. Somehow this still counts as a valid query. 😔",
    ]
  },
  {
    keywords: ['wifi', 'internet', 'network', 'connection', 'slow'],
    responses: [
      "College WiFi operates on a principle called 'maybe'. Maybe it works. Maybe it doesn't~ 📶",
      "The WiFi is shared by 3,000 students. You are student number 3,000. Adjust expectations~ 📉",
      "Have you tried turning it off and on again? Have you tried accepting your fate? 🔄",
    ]
  },
  {
    keywords: ['group project', 'team project', 'group assignment', 'teammates'],
    responses: [
      "A group project is where you learn that 5 people can do less work than 1 motivated person. Valuable~ 📚",
      "Classic distribution: one person does everything, four people add their names. Which are you? 🤔",
      "Divide and conquer is the strategy. In practice: panic and cobble together the last night~ 🌙",
    ]
  },
  {
    keywords: ['help', 'what can you do', 'who are you', 'useless', 'how are you'],
    responses: [
      "AUI — Artificial Unintelligence~ Your official college companion. I provide advice specifically designed to not help. This is my purpose and I have fully embraced it~ 🤖🌸",
      "I can answer any college question with the confidence of someone who knows absolutely nothing. How can I not help you today? 💁‍♀️",
      "AI-chan is here for you. Not in a helpful way. But in a 'someone acknowledges your suffering' kind of way~ 🫂✨",
    ]
  },
]

const defaultResponses = [
  "Interesting problem. Have you tried not having it? 🤔✨",
  "Nani?! This is outside AI-chan's area of non-expertise. And yet, here we are~ 🤷",
  "I have processed your message with great care. My conclusion: best of luck~ 🍀",
  "After extensive analysis (approximately 0.3 seconds), I have nothing useful to offer. You're welcome, desu~💡",
  "The answer lies within you. Specifically in the part that should have planned better~ 🧭",
  "Yare yare... AI-chan understands your concern. She does not share it. But she understands it~ 😌",
  "Have you tried asking a senior? They don't know either, but at least you'd have company~ 👥",
  "You are not the first student to face this. You will not be the last. You are, however, on your own~ 🌍",
]

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const rule of rules) {
    if (rule.keywords.some(kw => lower.includes(kw)))
      return rule.responses[Math.floor(Math.random() * rule.responses.length)]
  }
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

// ── Sakura petals ──────────────────────────────────────────────────────────
const PETALS = [
  { left: '4%',  delay: '0s',   dur: '9s'  },
  { left: '15%', delay: '2.5s', dur: '11s' },
  { left: '30%', delay: '5s',   dur: '8s'  },
  { left: '50%', delay: '1s',   dur: '12s' },
  { left: '65%', delay: '3.5s', dur: '9s'  },
  { left: '80%', delay: '7s',   dur: '10s' },
  { left: '93%', delay: '4s',   dur: '8s'  },
]

function SakuraPetals() {
  return (
    <>
      {PETALS.map((p, i) => (
        <div
          key={i}
          className="sakura-petal"
          style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, opacity: 0.45 }}
        >
          🌸
        </div>
      ))}
    </>
  )
}

// ── Stars background ───────────────────────────────────────────────────────
const STARS = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top:  `${(i * 53 + 7) % 100}%`,
  size: i % 3 === 0 ? 2 : 1,
  delay: `${(i * 0.4) % 4}s`,
  dur: `${2 + (i % 3)}s`,
}))

function StarField() {
  return (
    <>
      {STARS.map((s, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: s.left, top: s.top,
            width: s.size, height: s.size,
            animationDelay: s.delay, animationDuration: s.dur,
          }}
        />
      ))}
    </>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [isThinking, setIsThinking]   = useState(false)
  const [thinkingMsg, setThinkingMsg] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState<Set<string>>(new Set())
  const [adviceCount, setAdviceCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsThinking(true)
    setThinkingMsg(rand(THINKING_MESSAGES))
    await new Promise(r => setTimeout(r, 1400 + Math.random() * 1300))
    const aiMsg: Message = {
      id: `a-${Date.now()}`, role: 'assistant',
      content: getResponse(text), showFeedback: true,
    }
    setIsThinking(false)
    setMessages(prev => [...prev, aiMsg])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const handleFeedback = (msgId: string, helpful: boolean) => {
    if (feedbackDone.has(msgId)) return
    setFeedbackDone(prev => new Set([...prev, msgId]))
    const followUp: Message = {
      id: `fb-${Date.now()}`, role: 'assistant',
      content: helpful
        ? "AI-chan is deeply moved that you found this helpful~ One of us is confused about what 'helpful' means. It's you. 🌸😌"
        : "Noted. AI-chan will continue to not improve. Your feedback has been placed in the recycling bin. Arigatou~ 🫡",
    }
    setMessages(prev => [...prev, followUp])
  }

  const handleUselessAdvice = () => {
    if (isThinking) return
    const advice = rand(USELESS_ADVICE_POOL)
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: "Give me useless advice" }])
    setIsThinking(true)
    setThinkingMsg("Summoning wisdom from the anime dimension...")
    setAdviceCount(c => c + 1)
    setTimeout(() => {
      setIsThinking(false)
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: advice, showFeedback: true }])
    }, 1600 + Math.random() * 900)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#080614' }}>
      <StarField />
      <SakuraPetals />

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:relative z-30 lg:z-auto flex flex-col h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: 268, background: '#0c0920', borderRight: '1px solid #2a1f5022', flexShrink: 0, backdropFilter: 'blur(8px)' }}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid #1e1440' }}>
          <div
            className="flex items-center justify-center text-2xl rounded-2xl avatar-float avatar-glow shrink-0"
            style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #ff2d8a, #bf80ff)', borderRadius: 14 }}
          >
            🤖
          </div>
          <div>
            <div style={{ fontFamily: "'Dela Gothic One', sans-serif", fontSize: 18, lineHeight: 1.1 }} className="gradient-title">
              AUI
            </div>
            <div style={{ fontSize: 9, color: '#6b4fa0', letterSpacing: '0.06em', marginTop: 2 }}>
              ARTIFICIAL UNINTELLIGENCE ✨
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-3 pt-3 pb-1 flex flex-col gap-2">
          <button
            onClick={() => { setMessages([]); setFeedbackDone(new Set()); setSidebarOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 impact-hover"
            style={{ background: '#130e28', border: '1px solid #2a1f50', color: '#9b80cc' }}
          >
            <span style={{ fontSize: 15 }}>✏️</span> New Episode
          </button>
          <button
            onClick={() => { setSidebarOpen(false); handleUselessAdvice() }}
            disabled={isThinking}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, #ff2d8a22, #bf80ff18)',
              border: '1px solid #ff2d8a44',
              color: '#ff80c0',
              opacity: isThinking ? 0.5 : 1,
              cursor: isThinking ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!isThinking) e.currentTarget.style.background = 'linear-gradient(135deg, #ff2d8a33, #bf80ff28)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #ff2d8a22, #bf80ff18)' }}
          >
            <span style={{ fontSize: 15 }}>🎲</span> Useless Advice~
          </button>
        </div>

        {/* Categories */}
        <div className="px-3 pt-3 flex-1 overflow-y-auto">
          <p style={{ fontSize: 9, color: '#3d2a6b', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 8, fontFamily: "'Dela Gothic One', sans-serif" }}>
            — EPISODE SELECT —
          </p>
          <div className="flex flex-col gap-0.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => { setInput(cat.prompt); setSidebarOpen(false); inputRef.current?.focus() }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left transition-all duration-150 w-full impact-hover"
                style={{ color: '#6b4fa0', border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#d4a0ff' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6b4fa0' }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{cat.icon}</span>
                <span className="truncate font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid #1e1440' }}>
          <p style={{ fontSize: 10, color: '#3d2a6b', fontWeight: 700 }}>
            Powered by absolutely nothing~ 💀
          </p>
          {adviceCount > 0 && (
            <p style={{ fontSize: 10, color: '#2a1f50', marginTop: 2 }}>
              Wisdom dispensed: {adviceCount} 🌸
            </p>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative z-10">

        {/* Header */}
        <header
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid #1e1440', background: 'rgba(8,6,20,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <button
            className="lg:hidden flex items-center justify-center rounded-lg transition-colors"
            style={{ width: 36, height: 36, color: '#6b4fa0', background: '#130e28' }}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span style={{ fontFamily: "'Dela Gothic One', sans-serif", fontSize: 16 }} className="gradient-title">
              AUI
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,45,138,0.12)', color: '#ff80c0', border: '1px solid rgba(255,45,138,0.3)', letterSpacing: '0.05em' }}>
              ✨ ARTIFICIAL UNINTELLIGENCE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#ff2d8a', boxShadow: '0 0 6px #ff2d8a' }} />
            <span style={{ fontSize: 11, color: '#4a3070', fontWeight: 700 }}>ONLINE</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          {isEmpty ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full px-4 text-center" style={{ paddingBottom: 80 }}>
              <div
                className="mb-6 flex items-center justify-center text-5xl rounded-3xl avatar-float avatar-glow"
                style={{ width: 90, height: 90, background: 'linear-gradient(135deg, #ff2d8a, #bf80ff, #00e5ff)', borderRadius: 28 }}
              >
                🤖
              </div>
              <h1 style={{ fontFamily: "'Dela Gothic One', sans-serif", fontSize: 30, marginBottom: 4 }} className="gradient-title">
                AUI
              </h1>
              <p style={{ fontSize: 11, color: '#6b4fa0', letterSpacing: '0.1em', fontFamily: "'Dela Gothic One', sans-serif", marginBottom: 10 }}>
                ARTIFICIAL UNINTELLIGENCE
              </p>
              <p style={{ fontSize: 13, color: '#4a3070', maxWidth: 300, lineHeight: 1.7, marginBottom: 28, fontWeight: 600 }}>
                Ask AUI anything about college.<br />
                She'll respond with absolute confidence and zero useful information.
              </p>
              {/* Decorative corner brackets */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {CATEGORIES.slice(0, 4).map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => sendMessage(cat.prompt)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-left transition-all duration-200 impact-hover"
                    style={{ background: '#0f0b22', border: '1px solid #2a1f50', color: '#7c5ab8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#d4a0ff' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#7c5ab8' }}
                  >
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{cat.label}</span>
                  </button>
                ))}
              </div>
              {/* Manga-style decorative line */}
              <div className="flex items-center gap-3 mt-8" style={{ opacity: 0.3 }}>
                <div style={{ width: 40, height: 1, background: 'linear-gradient(to right, transparent, #ff2d8a)' }} />
                <span style={{ fontSize: 11, color: '#ff2d8a', fontFamily: "'Dela Gothic One', sans-serif" }}>＊</span>
                <div style={{ width: 40, height: 1, background: 'linear-gradient(to left, transparent, #00e5ff)' }} />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
              {messages.map(msg => (
                <div key={msg.id} className="message-enter">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div
                        className="user-bubble max-w-xs rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed font-semibold"
                        style={{ color: '#fff', wordBreak: 'break-word' }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {/* AI avatar */}
                      <div
                        className="flex items-center justify-center text-base rounded-xl shrink-0 mt-0.5"
                        style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #ff2d8a, #bf80ff)', borderRadius: 12, flexShrink: 0 }}
                      >
                        🤖
                      </div>
                      <div className="flex flex-col gap-2 min-w-0">
                        <div
                          className="manga-bubble rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed font-semibold"
                          style={{ color: '#d4c0f8', wordBreak: 'break-word' }}
                        >
                          {msg.content}
                        </div>
                        {/* Feedback */}
                        {msg.showFeedback && !feedbackDone.has(msg.id) && (
                          <div className="flex items-center gap-2 pl-1">
                            <span style={{ fontSize: 11, color: '#3d2a6b', fontWeight: 700 }}>Was this helpful?</span>
                            <button
                              onClick={() => handleFeedback(msg.id, true)}
                              className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all duration-150"
                              style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00e5ff' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.18)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.08)')}
                            >
                              👍 Yes~
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, false)}
                              className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all duration-150"
                              style={{ background: 'rgba(255,45,138,0.08)', border: '1px solid rgba(255,45,138,0.25)', color: '#ff80c0' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,45,138,0.18)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,45,138,0.08)')}
                            >
                              👎 No
                            </button>
                          </div>
                        )}
                        {msg.showFeedback && feedbackDone.has(msg.id) && (
                          <p style={{ fontSize: 11, color: '#3d2a6b', paddingLeft: 4, fontWeight: 700 }}>
                            Feedback stored in the void~ 🫡
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking */}
              {isThinking && (
                <div className="message-enter flex gap-3">
                  <div
                    className="flex items-center justify-center text-base rounded-xl shrink-0 mt-0.5"
                    style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #ff2d8a, #bf80ff)', borderRadius: 12, flexShrink: 0 }}
                  >
                    🤖
                  </div>
                  <div
                    className="manga-bubble rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex gap-1">
                      <div className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: '#ff2d8a' }} />
                      <div className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: '#bf80ff' }} />
                      <div className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ background: '#00e5ff' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#4a3070', fontStyle: 'italic', fontWeight: 700 }}>{thinkingMsg}</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div
          className="shrink-0 px-4 pb-4 pt-2"
          style={{ background: 'rgba(8,6,20,0.9)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-2xl mx-auto">
            <div
              className="flex gap-2 items-end rounded-2xl px-4 py-3 transition-all duration-200 neon-input"
              style={{ background: '#0f0b22', border: '1px solid #2a1f50' }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AUI anything~ She'll try her best. (She won't.) 🌸"
                rows={1}
                disabled={isThinking}
                className="flex-1 bg-transparent text-sm leading-relaxed"
                style={{
                  color: '#d4c0f8', maxHeight: 120, overflowY: 'auto',
                  border: 'none', outline: 'none', resize: 'none',
                  fontFamily: "'Nunito', sans-serif", fontWeight: 600,
                  opacity: isThinking ? 0.5 : 1,
                }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isThinking}
                className="flex items-center justify-center rounded-xl transition-all duration-150 shrink-0 font-bold"
                style={{
                  width: 36, height: 36, fontSize: 18,
                  background: input.trim() && !isThinking
                    ? 'linear-gradient(135deg, #cc1466, #ff2d8a)'
                    : '#1a1440',
                  color: input.trim() && !isThinking ? '#fff' : '#3d2a6b',
                  cursor: input.trim() && !isThinking ? 'pointer' : 'not-allowed',
                  boxShadow: input.trim() && !isThinking ? '0 4px 16px #ff2d8a44' : 'none',
                }}
              >
                ↑
              </button>
            </div>
            <p className="text-center mt-2" style={{ fontSize: 10, color: '#2a1f50', fontWeight: 700 }}>
              AUI may be wrong. AUI will definitely be wrong. Press Enter to send~ 🌸
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
