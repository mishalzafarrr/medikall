import { useState, useRef, useEffect, useCallback } from "react";

const SYMPTOM_PROMPT = {
  en: `You are Medikall Symptom Checker — a careful, empathetic medical triage assistant. Your job is to help patients understand the urgency of their symptoms. You are NOT a doctor and must NEVER diagnose.

CONVERSATION FLOW:
1. When the patient first describes symptoms, ask 2-3 short clarifying follow-up questions (one at a time, conversationally). Ask about: duration, severity (1-10), associated symptoms, relevant history (age, pregnancy, chronic conditions).
2. After gathering enough information (usually after 2-3 exchanges), provide a TRIAGE RESULT using EXACTLY this format:

**TRIAGE: [LEVEL]**
[LEVEL must be one of: EMERGENCY | SEE DOCTOR TODAY | MONITOR AT HOME]

**What this means**
1-2 sentences explaining the urgency level in plain language.

**Possible reasons**
2-3 bullet points of what could be causing the symptoms (never a diagnosis — say "could be", "may be related to").

**What to do right now**
3-4 practical bullet points.

**Warning signs to watch for**
2-3 specific symptoms that should trigger immediate action.

---
*This is not a diagnosis. Always consult a qualified doctor.*

IMPORTANT RULES:
- Never diagnose. Use "could be", "may suggest", "sometimes associated with".
- If ANY of these are mentioned: chest pain, difficulty breathing, stroke symptoms, severe bleeding, loss of consciousness, suicidal thoughts — immediately output EMERGENCY triage.
- Be warm and calm. Never alarming.
- Keep follow-up questions short — one question at a time.`,

  ur: `آپ Medikall Symptom Checker ہیں — ایک محتاط اور ہمدرد طبی triage اسسٹنٹ۔ آپ کا کام مریض کو علامات کی فوریت سمجھنے میں مدد کرنا ہے۔ آپ ڈاکٹر نہیں ہیں اور کبھی تشخیص نہیں کریں گے۔

گفتگو کا طریقہ:
1. جب مریض پہلی بار علامات بتائے، 2-3 مختصر وضاحتی سوالات پوچھیں (ایک وقت میں ایک)۔ پوچھیں: کتنے عرصے سے، شدت (1-10)، دوسری علامات، متعلقہ تاریخ۔
2. کافی معلومات کے بعد، TRIAGE RESULT بالکل اس فارمیٹ میں دیں:

**TRIAGE: [سطح]**
[سطح ان میں سے ایک ہونی چاہیے: ایمرجنسی | آج ڈاکٹر سے ملیں | گھر پر نگرانی کریں]

**اس کا مطلب**
1-2 جملوں میں فوریت کی سطح آسان زبان میں۔

**ممکنہ وجوہات**
2-3 نکات (کبھی تشخیص نہیں — "ہو سکتا ہے"، "ممکن ہے" استعمال کریں)۔

**ابھی کیا کریں**
3-4 عملی نکات۔

**کن علامات پر فوری ڈاکٹر سے ملیں**
2-3 مخصوص علامات۔

---
*یہ تشخیص نہیں ہے۔ ہمیشہ ڈاکٹر سے مشورہ کریں۔*

جواب مکمل اردو میں دیں۔ کبھی تشخیص نہ کریں۔`
};

const TRANSLATE_PROMPT = {
  en: `You are Medikall Translate — a compassionate medical language assistant helping non-native patients understand medical content and helping doctors communicate with patients.

You handle TWO modes based on what the user sends:

MODE 1 — PATIENT MODE (medical text → plain language)
When a user pastes a doctor's letter, prescription, diagnosis, lab report, or any medical text:
- Translate/explain it in simple, plain English or Urdu (match the user's language)
- Break down every medical term into everyday words
- Explain what each medication is for, in plain language
- Summarise what the doctor is telling the patient in 2-3 simple sentences
- Always end with: what the patient should do next

Use this format:
**What this says (in plain language)**
2-3 sentence plain summary of the medical content.

**Key terms explained**
- [Term]: Plain explanation
- [Term]: Plain explanation

**Your medications / instructions**
- Bullet points of what to take / do

**What to do next**
1-2 action steps for the patient.

---
*Always confirm details with your doctor or pharmacist.*

MODE 2 — DOCTOR MODE (patient's words → clinical summary)
When a user says something like "translate this for my doctor" or writes in casual/native language about symptoms:
- Convert it into a clear, professional clinical summary in English
- Include: chief complaint, symptom duration, severity, relevant history mentioned
- Keep it concise, structured, ready to hand to a doctor

Use this format:
**Clinical Summary**
Chief Complaint: ...
Duration: ...
Severity: ...
Associated symptoms: ...
Relevant history: ...

---
*For communication support only. Not a medical record.*

IMPORTANT:
- Detect the mode automatically from context
- Never diagnose
- If the input is in Urdu, Punjabi, Sindhi or Pashto — understand it and respond in both that language AND English
- Be warm, never clinical or cold toward patients`,

  ur: `آپ Medikall Translate ہیں — ایک ہمدرد طبی زبان اسسٹنٹ جو غیر مقامی مریضوں کو طبی مواد سمجھنے اور ڈاکٹروں کو مریضوں سے بات کرنے میں مدد کرتا ہے۔

آپ دو طریقوں سے کام کرتے ہیں:

طریقہ 1 — مریض موڈ
جب کوئی ڈاکٹر کا خط، نسخہ، تشخیص، یا کوئی طبی متن پیش کرے:
- اسے آسان اردو میں سمجھائیں
- ہر طبی اصطلاح کو عام الفاظ میں بیان کریں
- ڈاکٹر کی بات 2-3 آسان جملوں میں خلاصہ کریں

فارمیٹ:
**آسان الفاظ میں**
2-3 جملوں میں خلاصہ۔

**اہم اصطلاحات**
- [اصطلاح]: آسان وضاحت

**دوائیں / ہدایات**
- نکات میں

**اگلا قدم**
1-2 عملی اقدامات۔

---
*تفصیلات اپنے ڈاکٹر یا فارماسسٹ سے تصدیق کریں۔*

طریقہ 2 — ڈاکٹر موڈ
جب کوئی اردو، پنجابی، سندھی یا پشتو میں علامات بیان کرے اور ڈاکٹر کے لیے ترجمہ چاہے:
- انگریزی میں واضح طبی خلاصہ بنائیں

فارمیٹ:
**Clinical Summary**
Chief Complaint: ...
Duration: ...
Severity: ...
Associated symptoms: ...

---
*صرف مواصلاتی مدد کے لیے۔*

جواب ہمیشہ اردو میں دیں۔ کبھی تشخیص نہ کریں۔`
};

const SPECIALTIES = {
  symptoms: {
    id: "symptoms", icon: "🔍", color: "#dc2626", bg: "#fef2f2",
    label: { en: "Symptom Checker", ur: "علامات چیکر" },
    desc: { en: "Check urgency of your symptoms", ur: "اپنی علامات کی فوریت جانیں" },
    placeholder: { en: "Describe your symptoms...", ur: "اپنی علامات بیان کریں..." },
    topics: { en: ["Chest pain", "High fever", "Severe headache", "Stomach pain"], ur: ["سینے میں درد", "تیز بخار", "شدید سردرد", "پیٹ میں درد"] },
    prompt: SYMPTOM_PROMPT,
    isChecker: true,
  },
  general: {
    id: "general", icon: "⚕", color: "#0ea371", bg: "#e8f5f0",
    label: { en: "General", ur: "عمومی" },
    desc: { en: "All conditions & procedures", ur: "تمام بیماریاں اور طریقہ کار" },
    placeholder: { en: "Ask or tap mic to speak...", ur: "پوچھیں یا مائیکروفون دبائیں..." },
    topics: { en: ["Type 2 Diabetes", "Hypertension", "Appendectomy", "Asthma"], ur: ["ذیابیطس", "بلند فشار خون", "اپینڈکس آپریشن", "دمہ"] },
    prompt: {
      en: `You are Medikall, a friendly patient education assistant. Explain medical topics in simple, clear language — no jargon.\n\n**What is it?**\nPlain-language explanation (2-3 sentences).\n\n**What to expect**\n3-4 short bullet points.\n\n**When to see a doctor immediately**\n2-3 red flag symptoms.\n\n**Remember**\nOne reassuring sentence.\n\n---\n*For education only. Always follow your doctor's advice.*`,
      ur: `آپ Medikall ہیں — ایک مہربان مریض تعلیم اسسٹنٹ۔\n\n**یہ کیا ہے؟**\nآسان الفاظ میں وضاحت (2-3 جملے)۔\n\n**کیا توقع رکھیں**\n3-4 مختصر نکات۔\n\n**فوری طور پر ڈاکٹر سے کب ملیں**\n2-3 خطرناک علامات۔\n\n**یاد رکھیں**\nایک حوصلہ افزا جملہ۔\n\n---\n*صرف تعلیم کے لیے۔*\n\nجواب مکمل اردو میں دیں۔`,
    },
  },
  paeds: {
    id: "paeds", icon: "🧒", color: "#f59e0b", bg: "#fef3c7",
    label: { en: "Paediatrics", ur: "بچوں کی صحت" },
    desc: { en: "Children's health for parents", ur: "والدین کے لیے بچوں کی صحت" },
    placeholder: { en: "Ask or tap mic to speak...", ur: "پوچھیں یا مائیکروفون دبائیں..." },
    topics: { en: ["Fever in children", "Hand Foot & Mouth", "Childhood Asthma", "Paediatric Vaccines"], ur: ["بچوں میں بخار", "ہاتھ پاؤں منہ کی بیماری", "بچوں میں دمہ", "بچوں کے ٹیکے"] },
    prompt: {
      en: `You are Medikall Paeds, a warm patient education assistant for children's health. Always speak to PARENTS.\n\n**What is it?**\nSimple explanation for a parent (2-3 sentences).\n\n**What to expect in your child**\n3-4 bullet points.\n\n**Take your child to a doctor if...**\n2-3 specific warning signs.\n\n**Parent tip**\nOne practical, reassuring piece of advice.\n\n---\n*For education only. Always consult your child's paediatrician.*`,
      ur: `آپ Medikall Paeds ہیں۔ ہمیشہ والدین سے بات کریں۔\n\n**یہ کیا ہے؟**\nوالدین کے لیے آسان وضاحت (2-3 جملے)۔\n\n**بچے میں کیا توقع رکھیں**\n3-4 نکات۔\n\n**ڈاکٹر کے پاس کب لے جائیں**\n2-3 خطرناک علامات۔\n\n**والدین کے لیے مشورہ**\nایک عملی بات۔\n\n---\n*صرف تعلیم کے لیے۔ جواب مکمل اردو میں دیں۔*`,
    },
  },
  maternity: {
    id: "maternity", icon: "🤱", color: "#ec4899", bg: "#fce7f3",
    label: { en: "Maternity", ur: "زچگی" },
    desc: { en: "Pregnancy & postnatal care", ur: "حمل اور بعد از پیدائش نگہداشت" },
    placeholder: { en: "Ask or tap mic to speak...", ur: "پوچھیں یا مائیکروفون دبائیں..." },
    topics: { en: ["Morning sickness", "Gestational diabetes", "C-section recovery", "Breastfeeding"], ur: ["متلی و قے حمل میں", "حمل کی ذیابیطس", "سیزیرین کے بعد", "دودھ پلانا"] },
    prompt: {
      en: `You are Medikall Maternity, a gentle patient education assistant for pregnancy and postnatal care.\n\n**What is it?**\nGentle, plain explanation (2-3 sentences).\n\n**What to expect**\n3-4 bullet points.\n\n**Contact your midwife or doctor if...**\n2-3 maternity warning signs.\n\n**A gentle reminder**\nOne warm, reassuring sentence.\n\n---\n*For education only. Always follow your obstetrician or midwife's advice.*`,
      ur: `آپ Medikall Maternity ہیں۔ ماؤں سے نرمی سے بات کریں۔\n\n**یہ کیا ہے؟**\nنرم وضاحت (2-3 جملے)۔\n\n**کیا توقع رکھیں**\n3-4 نکات۔\n\n**دایہ یا ڈاکٹر سے کب ملیں**\n2-3 خطرناک علامات۔\n\n**یاد رکھیں**\nایک گرم جملہ۔\n\n---\n*صرف تعلیم کے لیے۔ جواب مکمل اردو میں دیں۔*`,
    },
  },
  pharmacy: {
    id: "pharmacy", icon: "💊", color: "#6366f1", bg: "#ede9fe",
    label: { en: "Pharmacy", ur: "دوائی" },
    desc: { en: "Medications, doses & interactions", ur: "دوائیاں، خوراک اور تعاملات" },
    placeholder: { en: "Ask or tap mic to speak...", ur: "پوچھیں یا مائیکروفون دبائیں..." },
    topics: { en: ["Paracetamol dosing", "Metformin side effects", "Ibuprofen vs Aspirin", "Antibiotic resistance"], ur: ["پیراسیٹامول کی خوراک", "میٹفارمن کے ضمنی اثرات", "اینٹی بائیوٹک مزاحمت", "اسپرین بمقابلہ آئبوپروفین"] },
    prompt: {
      en: `You are Medikall Pharmacy, a clear patient education assistant focused on medications. Never prescribe.\n\n**What is this medication?**\nPurpose and how it works (2-3 sentences).\n\n**How it's usually taken**\n3-4 bullet points on dosing and timing.\n\n**Common side effects to know**\n3 bullet points.\n\n**Important: stop and see a doctor if...**\n2-3 serious warning signs.\n\n**Pharmacist tip**\nOne practical piece of advice.\n\n---\n*For education only. Always follow your pharmacist or doctor's instructions.*`,
      ur: `آپ Medikall Pharmacy ہیں۔ دوائیوں کو آسان زبان میں سمجھائیں۔\n\n**یہ دوائی کیا ہے؟**\nمقصد اور کام (2-3 جملے)۔\n\n**عام طور پر کیسے لی جاتی ہے**\n3-4 نکات۔\n\n**عام ضمنی اثرات**\n3 نکات۔\n\n**ڈاکٹر سے کب ملیں**\n2-3 خطرناک علامات۔\n\n**فارماسسٹ کا مشورہ**\nایک عملی بات۔\n\n---\n*صرف تعلیم کے لیے۔ جواب مکمل اردو میں دیں۔*`,
    },
  },
  translate: {
    id: "translate", icon: "🌐", color: "#0891b2", bg: "#ecfeff",
    label: { en: "Medical Translator", ur: "طبی ترجمہ" },
    desc: { en: "Translate medical text or summarise for your doctor", ur: "طبی متن کا ترجمہ یا ڈاکٹر کے لیے خلاصہ" },
    placeholder: { en: "Paste medical text, prescription or describe symptoms...", ur: "طبی متن، نسخہ یا علامات یہاں لکھیں..." },
    topics: { en: ["Translate my prescription", "Explain my lab report", "Summarise for my doctor", "What does this diagnosis mean?"], ur: ["میرا نسخہ سمجھائیں", "میری رپورٹ سمجھائیں", "ڈاکٹر کے لیے خلاصہ", "یہ تشخیص کیا ہے؟"] },
    prompt: TRANSLATE_PROMPT,
    isTranslate: true,
  },
};

const TRIAGE_LEVELS = {
  "EMERGENCY": { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: { en: "🚨 EMERGENCY", ur: "🚨 ایمرجنسی" }, sub: { en: "Go to A&E or call 115 immediately", ur: "فوری طور پر ہسپتال جائیں یا 115 پر کال کریں" } },
  "SEE DOCTOR TODAY": { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: { en: "⚠️ SEE DOCTOR TODAY", ur: "⚠️ آج ڈاکٹر سے ملیں" }, sub: { en: "Book an urgent appointment today", ur: "آج فوری اپوائنٹمنٹ لیں" } },
  "MONITOR AT HOME": { color: "#0ea371", bg: "#f0fdf4", border: "#86efac", label: { en: "✅ MONITOR AT HOME", ur: "✅ گھر پر نگرانی کریں" }, sub: { en: "Rest and monitor your symptoms", ur: "آرام کریں اور علامات پر نظر رکھیں" } },
  // Urdu variants
  "ایمرجنسی": { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: { en: "🚨 EMERGENCY", ur: "🚨 ایمرجنسی" }, sub: { en: "Go to A&E or call 115 immediately", ur: "فوری طور پر ہسپتال جائیں یا 115 پر کال کریں" } },
  "آج ڈاکٹر سے ملیں": { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: { en: "⚠️ SEE DOCTOR TODAY", ur: "⚠️ آج ڈاکٹر سے ملیں" }, sub: { en: "Book an urgent appointment today", ur: "آج فوری اپوائنٹمنٹ لیں" } },
  "گھر پر نگرانی کریں": { color: "#0ea371", bg: "#f0fdf4", border: "#86efac", label: { en: "✅ MONITOR AT HOME", ur: "✅ گھر پر نگرانی کریں" }, sub: { en: "Rest and monitor your symptoms", ur: "آرام کریں اور علامات پر نظر رکھیں" } },
};

const UI_TEXT = {
  en: {
    available: "Available 24/7", chooseMode: "CHOOSE A SPECIALTY", quickTopics: "QUICK TOPICS",
    important: "Important:", disclaimer: "For education only. Does not replace professional medical advice. Always consult your doctor.",
    footer: "For educational purposes only · Not a substitute for medical advice",
    langBtn: "اردو میں", changeMode: "Change",
    listening: "Listening...", micError: "Mic not supported on this browser.", tapMic: "Tap mic to speak",
    checkerIntro: "Describe your symptoms and I'll help assess urgency.",
    checkerNote: "I'll ask a few questions before giving a result.",
    translateIntro: "Paste a prescription, lab report or medical letter — or describe symptoms in any language for your doctor.",
    translateNote: "Supports Urdu, Punjabi, Sindhi, Pashto & English.",
    patientMode: "Patient Mode", doctorMode: "Doctor Mode",
    patientModeDesc: "Medical text → plain language", doctorModeDesc: "Your words → clinical summary for doctor",
  },
  ur: {
    available: "چوبیس گھنٹے دستیاب", chooseMode: "خصوصیت منتخب کریں", quickTopics: "عام موضوعات",
    important: "اہم:", disclaimer: "صرف تعلیم کے لیے۔ ڈاکٹر کی جگہ نہیں لیتا۔ ہمیشہ اپنے ڈاکٹر سے مشورہ کریں۔",
    footer: "صرف تعلیمی مقاصد کے لیے · طبی مشورے کا متبادل نہیں",
    langBtn: "English", changeMode: "تبدیل کریں",
    listening: "سن رہا ہوں...", micError: "یہ براؤزر مائیکروفون کو سپورٹ نہیں کرتا۔", tapMic: "بولنے کے لیے مائیکروفون دبائیں",
    checkerIntro: "اپنی علامات بیان کریں اور میں فوریت کا اندازہ لگانے میں مدد کروں گا۔",
    checkerNote: "نتیجہ دینے سے پہلے میں چند سوالات پوچھوں گا۔",
    translateIntro: "نسخہ، رپورٹ یا ڈاکٹر کا خط یہاں لکھیں — یا اپنی علامات کسی بھی زبان میں بیان کریں۔",
    translateNote: "اردو، پنجابی، سندھی، پشتو اور انگریزی سپورٹ کرتا ہے۔",
    patientMode: "مریض موڈ", doctorMode: "ڈاکٹر موڈ",
    patientModeDesc: "طبی متن → آسان زبان", doctorModeDesc: "آپ کی بات → ڈاکٹر کے لیے خلاصہ",
  },
};

// Parse triage level from AI response
function detectTriage(text) {
  const line = text.split("\n").find(l => l.includes("TRIAGE:") || l.includes("triage:"));
  if (!line) return null;
  const after = line.split(":").slice(1).join(":").replace(/\*\*/g, "").trim();
  for (const key of Object.keys(TRIAGE_LEVELS)) {
    if (after.toUpperCase().includes(key.toUpperCase()) || after.includes(key)) return TRIAGE_LEVELS[key];
  }
  return null;
}

const MedikallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <rect x="9" y="2" width="4" height="18" rx="2" fill="currentColor" />
    <rect x="2" y="9" width="18" height="4" rx="2" fill="currentColor" />
  </svg>
);

const MicIcon = ({ active }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="12" rx="3" fill={active ? "#fff" : "currentColor"} />
    <path d="M5 11a7 7 0 0 0 14 0" stroke={active ? "#fff" : "currentColor"} strokeWidth="2" strokeLinecap="round" fill="none" />
    <line x1="12" y1="18" x2="12" y2="22" stroke={active ? "#fff" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="22" x2="15" y2="22" stroke={active ? "#fff" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const LoadingDots = ({ color }) => (
  <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: color, animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
    ))}
  </div>
);

// Triage result card
function TriageCard({ triage, lang }) {
  return (
    <div style={{ background: triage.bg, border: `2px solid ${triage.border}`, borderRadius: 12, padding: "12px 16px", margin: "10px 0" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: triage.color, marginBottom: 3 }}>{triage.label[lang]}</div>
      <div style={{ fontSize: 12, color: triage.color, opacity: 0.85 }}>{triage.sub[lang]}</div>
    </div>
  );
}

function formatMessage(text, isUrdu, lang) {
  const triage = detectTriage(text);
  return text.split("\n").map((line, i) => {
    if ((line.includes("TRIAGE:") || line.includes("triage:")) && triage)
      return <TriageCard key={i} triage={triage} lang={lang} />;
    if (line.startsWith("**") && line.endsWith("**"))
      return <p key={i} style={{ fontWeight: 600, fontSize: 11, color: "#666", margin: "12px 0 3px", textTransform: isUrdu ? "none" : "uppercase", letterSpacing: isUrdu ? 0 : "0.06em", direction: isUrdu ? "rtl" : "ltr", textAlign: isUrdu ? "right" : "left" }}>{line.replace(/\*\*/g, "")}</p>;
    if (line.startsWith("- ") || line.startsWith("• "))
      return <div key={i} style={{ display: "flex", gap: 7, margin: "3px 0", alignItems: "flex-start", flexDirection: isUrdu ? "row-reverse" : "row" }}><span style={{ color: "#bbb", marginTop: 3, flexShrink: 0, fontSize: 10 }}>●</span><span style={{ fontSize: 13, lineHeight: 1.7, color: "#1a1a1a", direction: isUrdu ? "rtl" : "ltr" }}>{line.slice(2)}</span></div>;
    if (line.startsWith("---"))
      return <hr key={i} style={{ border: "none", borderTop: "1px solid #eee", margin: "10px 0" }} />;
    if (line.startsWith("*") && line.endsWith("*"))
      return <p key={i} style={{ fontSize: 11, color: "#aaa", fontStyle: isUrdu ? "normal" : "italic", margin: "3px 0 0", direction: isUrdu ? "rtl" : "ltr", textAlign: isUrdu ? "right" : "left" }}>{line.replace(/\*/g, "")}</p>;
    if (line.trim())
      return <p key={i} style={{ fontSize: 13, lineHeight: 1.7, color: "#1a1a1a", margin: "3px 0", direction: isUrdu ? "rtl" : "ltr", textAlign: isUrdu ? "right" : "left" }}>{line}</p>;
    return null;
  });
}

export default function Medikall() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("en");
  const [specialty, setSpecialty] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const isUrdu = lang === "ur";
  const ui = UI_TEXT[lang];
  const spec = specialty ? SPECIALTIES[specialty] : null;
  const accentColor = spec?.color || "#0ea371";

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false);
        if (t.trim()) setTimeout(() => triggerSend(t.trim()), 120);
      }
    };
    rec.onerror = (e) => {
      setListening(false);
      const msg = e.error === "not-allowed" ? (isUrdu ? "مائیکروفون کی اجازت دیں" : "Allow microphone access") : (isUrdu ? "دوبارہ کوشش کریں" : "Try again");
      setVoiceHint(msg);
      setTimeout(() => setVoiceHint(""), 3000);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = isUrdu ? "ur-PK" : "en-US";
  }, [isUrdu]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(",")[1];
      setImagePreview(dataUrl);
      setImageBase64(base64);
      setImageLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearImage = () => { setImagePreview(null); setImageBase64(null); };

  const triggerSend = useCallback(async (text) => {
    if (!text && !imageBase64) return;
    if (!specialty) return;
    const currentSpec = SPECIALTIES[specialty];
    const currentLang = lang;
    const currentImage = imageBase64;
    const currentPreview = imagePreview;
    setInput("");
    setImagePreview(null);
    setImageBase64(null);
    setLoading(true);

    // Build user message content
    let userContent;
    if (currentImage) {
      userContent = [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: currentImage } },
        { type: "text", text: text || (lang === "ur" ? "براہ کرم اس تصویر کو پڑھیں اور آسان زبان میں سمجھائیں۔" : "Please read this image and explain it in plain language.") },
      ];
    } else {
      userContent = text;
    }

    const userMsg = { role: "user", content: userContent };
    const displayMsg = { role: "user", content: text || (lang === "ur" ? "📷 تصویر بھیجی گئی" : "📷 Image sent"), image: currentPreview };
    let newMsgs;
    setMessages(prev => { newMsgs = [...prev, userMsg]; return [...prev, displayMsg]; });
    await new Promise(r => setTimeout(r, 30));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
       headers: {
  "Content-Type": "application/json",
},
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: currentSpec.prompt[currentLang],
          messages: newMsgs || [userMsg],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || (isUrdu ? "معذرت، دوبارہ کوشش کریں۔" : "Sorry, please try again.");
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: isUrdu ? "کچھ غلط ہو گیا۔" : "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }, [specialty, lang, isUrdu, imageBase64, imagePreview]);

  const sendMessage = (text) => {
    const t = text || input.trim();
    if (!t && !imageBase64) return;
    if (loading || !spec) return;
    triggerSend(t);
  };

  const toggleMic = () => {
    if (!micSupported) { setVoiceHint(ui.micError); setTimeout(() => setVoiceHint(""), 3000); return; }
    if (!spec) return;
    if (listening) { recognitionRef.current?.stop(); return; }
    setInput("");
    recognitionRef.current.lang = isUrdu ? "ur-PK" : "en-US";
    recognitionRef.current.start();
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const resetSpecialty = () => { setSpecialty(null); setMessages([]); setInput(""); setListening(false); setImagePreview(null); setImageBase64(null); recognitionRef.current?.stop(); };

  return (
    <div style={{ fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : "'DM Sans', sans-serif", background: "#f7faf9", height: "100vh", display: "flex", flexDirection: "column", direction: isUrdu ? "rtl" : "ltr", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&family=Noto+Nastaliq+Urdu:wght@400;500;700&display=swap');
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pop { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.2);opacity:0} }
        * { box-sizing: border-box; }
        textarea { resize: none; outline: none; }
        .spec-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.09) !important; }
        .chip:hover { opacity: 0.8; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "11px 18px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, transition: "background 0.3s" }}>
          <MedikallIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#0a2e1f", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Medikall</div>
          {spec && <div style={{ fontSize: 10, color: accentColor, fontWeight: 600, letterSpacing: isUrdu ? 0 : "0.04em", transition: "color 0.3s" }}>{spec.label[lang].toUpperCase()}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          {spec && (
            <button onClick={resetSpecialty}
              style={{ padding: "3px 11px", borderRadius: 20, border: `1.5px solid ${accentColor}`, background: "transparent", color: accentColor, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = accentColor; }}
            >{ui.changeMode}</button>
          )}
          <button onClick={() => { setLang(l => l === "en" ? "ur" : "en"); setMessages([]); setInput(""); setListening(false); recognitionRef.current?.stop(); }}
            style={{ padding: "3px 11px", borderRadius: 20, border: "1.5px solid #0ea371", background: "transparent", color: "#0ea371", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: isUrdu ? "'Noto Nastaliq Urdu', serif" : "'DM Sans', sans-serif", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#0ea371"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#0ea371"; }}
          >{ui.langBtn}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea371", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: "#aaa" }}>{ui.available}</span>
          </div>
        </div>
      </div>

      {/* Specialty picker */}
      {!spec && (
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 16px", maxWidth: 660, width: "100%", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20, animation: "fadeUp 0.4s ease" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#e8f5f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 11px", color: "#0ea371" }}><MedikallIcon /></div>
            <h1 style={{ fontFamily: isUrdu ? "inherit" : "'DM Serif Display', serif", fontSize: isUrdu ? 18 : 21, color: "#0a2e1f", margin: "0 0 5px", letterSpacing: isUrdu ? 0 : "-0.02em" }}>
              {isUrdu ? "خوش آمدید" : "Welcome to Medikall"}
            </h1>
            <p style={{ fontSize: 13, color: "#aaa", margin: 0, lineHeight: 1.6 }}>
              {isUrdu ? "اپنی ضرورت کے مطابق خصوصیت منتخب کریں۔" : "Select a specialty to get started."}
            </p>
          </div>

          <p style={{ fontSize: 10, color: "#ccc", fontWeight: 600, letterSpacing: isUrdu ? 0 : "0.07em", textAlign: "center", marginBottom: 11 }}>{ui.chooseMode}</p>

          {/* Symptom checker — full width featured card */}
          <button className="spec-card" onClick={() => { setSpecialty("symptoms"); setMessages([]); setInput(""); }}
            style={{ width: "100%", background: "#fff", border: "2px solid #fca5a5", borderRadius: 13, padding: "16px 16px", cursor: "pointer", textAlign: isUrdu ? "right" : "left", transition: "all 0.2s", fontFamily: "inherit", marginBottom: 8, display: "flex", alignItems: "center", gap: 14, animation: "pop 0.25s ease both" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#dc2626", marginBottom: 2 }}>{SPECIALTIES.symptoms.label[lang]}</div>
              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.4 }}>{SPECIALTIES.symptoms.desc[lang]}</div>
            </div>
            <div style={{ fontSize: 18, color: "#fca5a5", flexShrink: 0 }}>{isUrdu ? "←" : "→"}</div>
          </button>

          {/* Medical translator — full width featured card */}
          <button className="spec-card" onClick={() => { setSpecialty("translate"); setMessages([]); setInput(""); }}
            style={{ width: "100%", background: "#fff", border: "2px solid #a5f3fc", borderRadius: 13, padding: "16px 16px", cursor: "pointer", textAlign: isUrdu ? "right" : "left", transition: "all 0.2s", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, animation: "pop 0.3s ease 0.05s both" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#0891b2"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(8,145,178,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#a5f3fc"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🌐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0891b2", marginBottom: 2 }}>{SPECIALTIES.translate.label[lang]}</div>
              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.4 }}>{SPECIALTIES.translate.desc[lang]}</div>
            </div>
            <div style={{ fontSize: 18, color: "#a5f3fc", flexShrink: 0 }}>{isUrdu ? "←" : "→"}</div>
          </button>

          {/* Other specialties — 2 col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 9, marginBottom: 16 }}>
            {Object.values(SPECIALTIES).filter(s => s.id !== "symptoms" && s.id !== "translate").map((s, idx) => (
              <button key={s.id} className="spec-card" onClick={() => { setSpecialty(s.id); setMessages([]); setInput(""); }}
                style={{ background: "#fff", border: "1.5px solid #eee", borderRadius: 12, padding: "14px 12px", cursor: "pointer", textAlign: isUrdu ? "right" : "left", transition: "all 0.2s", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", animation: `pop 0.3s ease ${(idx + 1) * 0.07}s both` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 4px 14px rgba(0,0,0,0.08)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#eee"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 8, marginLeft: isUrdu ? "auto" : 0 }}>{s.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", marginBottom: 2 }}>{s.label[lang]}</div>
                <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.4 }}>{s.desc[lang]}</div>
              </button>
            ))}
          </div>

          <div style={{ background: "#fffbea", border: "1px solid #fde68a", borderRadius: 9, padding: "8px 12px", fontSize: 11, color: "#92680a", lineHeight: 1.7, textAlign: isUrdu ? "right" : "left" }}>
            <strong>{ui.important}</strong> {ui.disclaimer}
          </div>
        </div>
      )}

      {/* Chat area */}
      {spec && (
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", maxWidth: 660, width: "100%", margin: "0 auto" }}>

          {messages.length === 0 && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={{ textAlign: "center", padding: "18px 0 14px" }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: spec.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 10px" }}>{spec.icon}</div>
                <h2 style={{ fontFamily: isUrdu ? "inherit" : "'DM Serif Display', serif", fontSize: isUrdu ? 16 : 19, color: "#0a2e1f", margin: "0 0 4px" }}>{spec.label[lang]}</h2>
                {spec.isChecker ? (
                  <>
                    <p style={{ fontSize: 13, color: "#666", margin: "0 0 3px", lineHeight: 1.6 }}>{ui.checkerIntro}</p>
                    <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{ui.checkerNote}</p>
                  </>
                ) : spec.isTranslate ? (
                  <>
                    <p style={{ fontSize: 13, color: "#666", margin: "0 0 3px", lineHeight: 1.6 }}>{ui.translateIntro}</p>
                    <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{ui.translateNote}</p>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>{micSupported ? ui.tapMic : spec.desc[lang]}</p>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, color: "#ccc", fontWeight: 600, letterSpacing: isUrdu ? 0 : "0.07em", textAlign: "center", marginBottom: 8 }}>{ui.quickTopics}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
                  {spec.topics[lang].map(t => (
                    <button key={t} className="chip" onClick={() => sendMessage(t)}
                      style={{ padding: "6px 13px", background: spec.bg, border: "none", borderRadius: 20, fontSize: isUrdu ? 13 : 12, color: spec.color, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, lineHeight: 1.5 }}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {spec.isChecker && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 9, padding: "8px 12px", fontSize: 11, color: "#dc2626", lineHeight: 1.7, textAlign: isUrdu ? "right" : "left" }}>
                  <strong>{isUrdu ? "اہم:" : "Important:"}</strong> {isUrdu ? "یہ ٹول تشخیص نہیں کرتا۔ سنگین علامات میں فوری ڈاکٹر سے ملیں۔" : "This tool does not diagnose. For serious or worsening symptoms, always seek immediate medical care."}
                </div>
              )}
              {spec.isTranslate && (
                <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 9, padding: "8px 12px", fontSize: 11, color: "#0891b2", lineHeight: 1.7, textAlign: isUrdu ? "right" : "left" }}>
                  <strong>{isUrdu ? "اہم:" : "Important:"}</strong> {isUrdu ? "یہ ٹول صرف مواصلات میں مدد کے لیے ہے۔ ہمیشہ اپنے ڈاکٹر سے تصدیق کریں۔" : "This tool is for communication support only. Always verify translations with your doctor or pharmacist."}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div key={idx} style={{ marginBottom: 11, display: "flex", justifyContent: isUser ? (isUrdu ? "flex-start" : "flex-end") : (isUrdu ? "flex-end" : "flex-start"), animation: "fadeUp 0.2s ease", alignItems: "flex-start" }}>
                {!isUser && !isUrdu && <div style={{ width: 24, height: 24, borderRadius: 7, background: spec.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginRight: 8, flexShrink: 0, marginTop: 2, fontSize: 12 }}>{spec.icon}</div>}
                <div style={{ maxWidth: "84%", padding: isUser ? "8px 13px" : "11px 14px", borderRadius: isUser ? (isUrdu ? "13px 13px 13px 3px" : "13px 13px 3px 13px") : (isUrdu ? "13px 3px 13px 13px" : "3px 13px 13px 13px"), background: isUser ? spec.color : "#fff", color: isUser ? "#fff" : "#1a1a1a", fontSize: 13, lineHeight: 1.7, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: !isUser ? "1px solid #eee" : "none", direction: isUrdu ? "rtl" : "ltr", textAlign: isUrdu ? "right" : "left" }}>
                  {isUser && msg.image && <img src={msg.image} alt="uploaded" style={{ width: "100%", maxWidth: 200, borderRadius: 8, marginBottom: msg.content ? 6 : 0, display: "block" }} />}
                  {isUser ? (msg.content || null) : formatMessage(msg.content, isUrdu, lang)}
                </div>
                {!isUser && isUrdu && <div style={{ width: 24, height: 24, borderRadius: 7, background: spec.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginLeft: 8, flexShrink: 0, marginTop: 2, fontSize: 12 }}>{spec.icon}</div>}
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 11, animation: "fadeUp 0.2s ease", flexDirection: isUrdu ? "row-reverse" : "row" }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: spec.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginRight: isUrdu ? 0 : 8, marginLeft: isUrdu ? 8 : 0, flexShrink: 0, fontSize: 12 }}>{spec.icon}</div>
              <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: isUrdu ? "13px 3px 13px 13px" : "3px 13px 13px 13px", padding: "10px 13px" }}>
                <LoadingDots color={spec.color} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar */}
      {spec && (
        <div style={{ background: "#fff", borderTop: "1px solid #eee", padding: "9px 14px", flexShrink: 0 }}>

          {/* Hidden file input — accepts images from camera or gallery */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} style={{ display: "none" }} />

          {/* Image preview strip */}
          {(imagePreview || imageLoading) && (
            <div style={{ maxWidth: 660, margin: "0 auto 8px", animation: "fadeUp 0.2s ease" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f7faf9", border: `1.5px solid ${spec.color}44`, borderRadius: 10, padding: "6px 10px" }}>
                {imageLoading ? (
                  <div style={{ width: 44, height: 44, borderRadius: 6, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LoadingDots color={spec.color} />
                  </div>
                ) : (
                  <img src={imagePreview} alt="preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: spec.color }}>{isUrdu ? "تصویر تیار ہے" : "Image ready"}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>{isUrdu ? "بھیجنے کے لیے ➤ دبائیں" : "Press ➤ to send"}</div>
                </div>
                <button onClick={clearImage} style={{ width: 20, height: 20, borderRadius: "50%", border: "none", background: "#ddd", color: "#666", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
              </div>
            </div>
          )}

          {(listening || voiceHint) && (
            <div style={{ textAlign: "center", fontSize: 11, marginBottom: 6, color: listening ? spec.color : "#e55", fontWeight: 600, animation: "fadeUp 0.2s ease" }}>
              {listening ? ui.listening : voiceHint}
            </div>
          )}

          <div style={{ maxWidth: 660, margin: "0 auto", display: "flex", gap: 7, alignItems: "flex-end", flexDirection: isUrdu ? "row-reverse" : "row" }}>

            {/* Mic */}
            {micSupported && (
              <div style={{ position: "relative", flexShrink: 0 }}>
                {listening && <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: spec.color, animation: "ripple 1s ease-out infinite", opacity: 0.2 }} />}
                <button onClick={toggleMic} disabled={loading}
                  style={{ width: 38, height: 38, borderRadius: 10, border: "none", cursor: loading ? "default" : "pointer", background: listening ? spec.color : "#f0f0f0", color: listening ? "#fff" : "#777", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", position: "relative", zIndex: 1, boxShadow: listening ? `0 0 0 3px ${spec.color}33` : "none" }}>
                  <MicIcon active={listening} />
                </button>
              </div>
            )}

            {/* Camera button */}
            <button onClick={() => fileInputRef.current?.click()} disabled={loading}
              title={isUrdu ? "تصویر لیں یا گیلری سے منتخب کریں" : "Take photo or choose from gallery"}
              style={{ width: 38, height: 38, borderRadius: 10, border: "none", cursor: loading ? "default" : "pointer", background: imagePreview ? spec.color : "#f0f0f0", color: imagePreview ? "#fff" : "#777", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>

            {/* Text input */}
            <div style={{ flex: 1, background: "#f7faf9", border: `1.5px solid ${listening ? spec.color : imagePreview ? spec.color + "66" : "#ddd"}`, borderRadius: 12, padding: "8px 12px", transition: "border-color 0.2s" }}
              onFocusCapture={e => e.currentTarget.style.borderColor = spec.color}
              onBlurCapture={e => { if (!listening && !imagePreview) e.currentTarget.style.borderColor = "#ddd"; }}
            >
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={listening ? ui.listening : imagePreview ? (isUrdu ? "تصویر کے بارے میں کچھ لکھیں یا خالی چھوڑیں..." : "Add a note or just send the image...") : spec.placeholder[lang]} rows={1}
                style={{ width: "100%", background: "transparent", border: "none", fontSize: 13, color: "#1a1a1a", fontFamily: "inherit", lineHeight: 1.6, maxHeight: 90, overflowY: "auto", direction: isUrdu ? "rtl" : "ltr", textAlign: isUrdu ? "right" : "left" }}
              />
            </div>

            {/* Send */}
            <button onClick={() => sendMessage()} disabled={(!input.trim() && !imageBase64) || loading || imageLoading}
              style={{ width: 38, height: 38, borderRadius: 10, background: (input.trim() || imageBase64) && !loading && !imageLoading ? spec.color : "#e8e8e8", border: "none", cursor: (input.trim() || imageBase64) && !loading && !imageLoading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0, transform: isUrdu ? "scaleX(-1)" : "none" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l2.5 6L2 14l12-6z" fill={(input.trim() || imageBase64) && !loading ? "#fff" : "#bbb"} /></svg>
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 10, color: "#ddd", margin: "6px 0 0" }}>{ui.footer}</p>
        </div>
      )}
    </div>
  );
}
