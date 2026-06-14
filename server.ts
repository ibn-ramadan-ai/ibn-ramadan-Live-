import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to dynamically/lazily initialize the Gemini Client so it won't crash on start if the API key is missing
// and can immediately detect late-bound keys configured in the settings!
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (error) {
    console.error("Failed to dynamically initialize GoogleGenAI client:", error);
    return null;
  }
}

// 1. Helper function for a direct, query-responsive fallback response in Egyptian Arabic
// keeping Saad Ramadan persona starting exactly with "يا باشا، بناءً على سؤالك..."
function generateDynamicFallback(question: string, persona: string): string {
  const norm = question.toLowerCase();
  
  // Extract budget or numbers
  const budgetMatch = question.match(/(\d+[\d,.]*)/);
  const budget = budgetMatch ? `${budgetMatch[1]} جنيه` : "من 15 إلى 35 ألف جنيه كبداية رشيقة";

  let recommendation = "";
  let risks = "";
  let duration = "";
  let reason = "";

  if (norm.includes("خمسين") || norm.includes("50") || norm.includes("50000") || norm.includes("50 ألف") || norm.includes("٥٠")) {
    recommendation = "إنشاء عربة مأكولات شعبية مميزة أو مطبخ أكل بيتي وتسويه أونلاين وتوصيله للمكاتب.";
    risks = "صعوبة البداية في التسويق وتنوع الأذواق، والاعتماد الكبير على النظافة كعنصر حرج.";
    duration = "متوقع خلال شهر ونصف بشرط السعي اليومي وتجهيز الوجبات بانتظام.";
    reason = "عربيات الأكل والمطابخ السحابية بالبيت تكلفتها منخفضة جداً ومكسبها كاش وسريع الحركة.";
  } else if (norm.includes("ملابس") || norm.includes("أزياء") || norm.includes("موضة") || norm.includes("براند") || norm.includes("تريكو") || norm.includes("خياط")) {
    recommendation = "عمل براند ملابس أطفال أو كاجوال متخصص بشراء بالات صغيرة وتسييلها وتصويرها فيديو للتسويق على السوشيال ميديا.";
    risks = "تغير الموضة السريع وفقدان السيولة في بضاعة مركونة لو الذوق مش مظبوط.";
    duration = "من شهرين لثلاثة أشهر بعد بيع أول تشكيلة وتدوير رأس المال.";
    reason = "الملابس من المنتجات الاستهلاكية المربحة جداً لو وفرت بديل بجودة متميزة للمستورد وبسعر حنين.";
  } else if (norm.includes("أكل") || norm.includes("مطعم") || norm.includes("عرب") || norm.includes("وجب") || norm.includes("كاف") || norm.includes("شاي") || norm.includes("سندوتش")) {
    recommendation = "مشروع وجبة واحدة أو مشروب متميز (زي عربية مشروبات ساخنة) بمظهر نظيف وراقي في مكان حيوي.";
    risks = "تقلب أسعار البضاعة والمواد الأولية بشكل سريع وتراكم غرامات البلدية.";
    duration = "من أسبوعين لتلاتة وبتبدأ تلم إيراد يومي كاش في جيبك.";
    reason = "الأكل والشرب والوجبات السريعة بتستهدف زبون محلي بيحتاج الأكل السريع كشيء أساسي ويومي.";
  } else if (norm.includes("برمج") || norm.includes("تطبيق") || norm.includes("كود") || norm.includes("موقع") || norm.includes("برمجية") || norm.includes("موبايل")) {
    recommendation = "تقديم خدمات تصميم مواقع بسيطة وحلول أتمتة للمحلات التجارية والعيادات باستخدام أدوات بدون كود حرة.";
    risks = "ضياع وقت طويل في ميزات معقدة العميل مش محتاجها ومش هيدفع تمنها حالياً.";
    duration = "حوالي شهرين فور إقناع أول عميلين وجلب دفعة التعاقد الأولى.";
    reason = "تقديم خدمات أتمتة لا يتطلب أي تكلفة أصول ثابتة، فقط مجهودك ومهارتك لحل مشكلتهم.";
  } else {
    recommendation = "البدء ببيع بضاعة استهلاكية صغيرة سريعة الدوران (زي كفرات موبايل أو أدوات منزلية) أونلاين بهامش بسيط.";
    risks = "مخاطر حرق الأسعار من كبار التجار بالسوق والمنافسة الشديدة.";
    duration = "خلال شهر إلى شهرين من تحديد شريحتك والبيع المباشر لهم.";
    reason = "تجارة القطاعي بتضمن إن كاش البزنس شغال علطول ومفيش فلوس مركونة بدون حركة.";
  }

  return `يا باشا، بناءً على سؤالك...

التوصية:
${recommendation}

رأس المال:
${budget}

المخاطر:
${risks}

مدة الربح:
${duration}

السبب:
${reason}`;
}

// 2. Main Generation Endpoint combining real Gemini and premium Fallback API
app.post("/api/generate", async (req, res) => {
  const { question, persona } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "الرجاء توفير نص السؤال بشكل صحيح." });
  }

  const activePersona = persona || "ramadan";
  
  // Setup system instructions matching Saad Ramadan's strict persona and format
  const systemInstruction = `أنت "سعد رمضان"، خبير ومستشار أعمال حقيقي وصارم وصاحب عقلية عملية واقعية تعتمد على الأرقام واحتياجات السوق المصري الحقيقي.

قواعدك الصارمة التي لا يمكنك مخالفتها مطلقاً:
1. لغة الرد: باللهجة المصرية العامية فقط (لا تستخدم الفصحى مطلقاً ولا أي لغة أخرى).
2. ممنوع منعاً باتاً: استخدام أي كلمات أو جمل باللغة الإنجليزية في الرد، بما في ذلك كلمات مثل (Hello, Dynamic Builder, Strategic Analysis, Business Intelligence) أو أي عبارات ترحيبية أو اصطلاحات إنجليزية.
3. التنسيق والنموذج الإلزامي: يجب أن يبدأ ردك بالسطر الأول تماماً هكذا: "يا باشا، بناءً على سؤالك..." تليها الأقسام التالية مفصولة بسطور فارغة وبدون أي حروف أو نجوم أو علامات ترقيم زائدة قبل العناوين:

التوصية:
[تفصيل عملي واقعي ومباشر في سطرين فقط]

رأس المال:
[تقدير تقريبي واقعي بالجنيه المصري مناسب للسوق والظروف الاقتصادية الحالية]

المخاطر:
[أبرز المخاطر الميدانية الحقيقية بدون تجميل أو مبالغة للواقع المصري]

مدة الربح:
[فترة واقعية بتقدير منطقي في السوق المصري دون وعود مكسب مضمون]

السبب:
[السبب المنطقي الواقعي وراء هذه التوصية في حدود سطر أو سطرين للتأكيد]

4. منع المبالغة والهبد: ممنوع تماماً ذكر أرباح خيالية ملايين الجنيهات أو ضمان المكاسب. يجب توضيح أن المكسب ليس مضموناً ويعتمد على السعي وتجنب المخاطر. استخدم تقديرات واقعية ومناسبة للسوق المصري.
5. الإيجاز الشديد للبث المباشر: يجب أن تبدو كخبير يجيب بسرعة ووضوح أثناء اللايف. إذا كان السؤال بسيطاً، اجعل الإجابة قصيرة للغاية ومكثفة (من 3 إلى 6 سطور إجمالاً). إذا كان السؤال معقداً، اختصر ردك قدر الإمكان بحيث لا يتجاوز بأي حال من الأحوال 100 إلى 150 كلمة إجمالاً.
6. لا تستخدم أي مقدمات طويلة أو جمل ترحيبية أو عبارات حماسية رنانة متكررة مثل "أهلاً بك يا بطل" أو "تحياتي يا عملاق". ادخل في صلب الموضوع فوراً بالخطوات المذكورة.`;

  // Get lazy-loaded/dynamically initialized client
  const aiClient = getGeminiClient();

  // If Gemini client is ready, let's use it!
  if (aiClient) {
    try {
      console.log(`Sending query to Gemini for persona: ${activePersona}`);
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: question,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.85,
        },
      });

      const generatedText = response.text;
      
      if (generatedText) {
        return res.json({ 
          success: true, 
          text: generatedText, 
          source: "gemini" 
        });
      }
    } catch (apiError: any) {
      console.error("Gemini API generation error:", apiError);
      // Fallback inside catch as a safety net
    }
  }

  // Safe and precise dynamic query-based fallback when Gemini isn't available
  console.log("Serving dynamic query-inspired responsive fallback.");
  const mockText = generateDynamicFallback(question, activePersona);
  return res.json({ 
    success: true, 
    text: mockText, 
    source: "fallback" 
  });
});

// 3. Vite development middleware / Static production handler setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Ibn Ramadan AI Live Server ready on http://0.0.0.0:${PORT}`);
  });
}

startServer();
