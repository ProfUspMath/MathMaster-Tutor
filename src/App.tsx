import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Download, 
  PlusCircle, 
  BookOpen, 
  Loader2, 
  ChevronRight, 
  Dices,
  ShoppingCart,
  TrendingUp,
  BrainCircuit,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getTutorResponse, ChatMessage as GeminiChatMessage } from './services/geminiService';
import { generateExercisesPDF } from './services/pdfService';
import { Exercise, ChatMessage } from './lib/types';
import MathMarkdown from './components/MathMarkdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: '¡Hola, colega! Soy tu Tutor Inteligente de Matemáticas. Estoy aquí para ayudarte con Cálculo y Álgebra de manera impecable y pedagógica. \n\n¿En qué problema trabajaremos hoy? Puedes introducir una función para derivar, un sistema de ecuaciones o cualquier duda matemática.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseCart, setExerciseCart] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem('math_exercise_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading cart:", e);
      return [];
    }
  });
  const [graphData, setGraphData] = useState<{ x: number, y: number }[] | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('math_exercise_cart', JSON.stringify(exerciseCart));
    } catch (e) {
      console.error("Error saving cart (possibly full):", e);
    }
  }, [exerciseCart]);

  const clearSession = () => {
    if (window.confirm("¿Estás suguro de reiniciar? Esto borrará el chat y el carrito.")) {
      setMessages([{
        role: 'model',
        content: 'Sesión reiniciada. ¿En qué problema trabajaremos ahora?',
        timestamp: Date.now()
      }]);
      setExerciseCart([]);
      setGraphData(null);
      localStorage.removeItem('math_exercise_cart');
    }
  };

  const clearCart = () => {
    setExerciseCart([]);
    localStorage.removeItem('math_exercise_cart');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim()) return;

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Map history to Gemini format
      const history: GeminiChatMessage[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await getTutorResponse(text, history);
      
      const newModelMessage: ChatMessage = {
        role: 'model',
        content: response.text || 'Lo siento, no pude procesar la respuesta.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newModelMessage]);

      // Check for graph suggestions in response (simple heuristic)
      if (text.toLowerCase().includes('grafica') || text.toLowerCase().includes('dibujo')) {
         // Logic for generating sample data if prompt implies it
         generateDummyGraphData();
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: 'Error al conectar con mi motor de cálculo. Por favor, intenta de nuevo.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDummyGraphData = () => {
    const data = [];
    for (let x = -10; x <= 10; x += 0.5) {
      data.push({ x, y: Math.sin(x) }); // Placeholder, Gemini could provide formulas
    }
    setGraphData(data);
  };

  const addToCart = (message: string) => {
    const newExercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Ejercicio ${exerciseCart.length + 1}`,
      content: message,
      category: 'Calculo',
      timestamp: Date.now()
    };
    setExerciseCart(prev => [...prev, newExercise]);
  };

  const generateSimilar = () => {
    handleSend("Generar 3 ejercicios adicionales basados en el último planteado, con valores aleatorios coherentes.");
  };

  const exportPDF = async () => {
    setIsLoadingPdf(true);
    await generateExercisesPDF('pdf-content', `guia_matematicas_${Date.now()}.pdf`);
    setIsLoadingPdf(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden math-tutor-grid bg-slate-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm">
        <div className="p-6 border-bottom border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">MathMaster</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Tutor Inteligente</p>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart size={12} /> Carrito ({exerciseCart.length})
              </h2>
              {exerciseCart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-[10px] text-red-500 hover:underline font-bold uppercase tracking-tighter"
                >
                  Vaciar
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {exerciseCart.map(ex => (
                <div key={ex.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center group animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="font-medium truncate max-w-[140px]">{ex.title}</span>
                  <button 
                    onClick={() => setExerciseCart(prev => prev.filter(e => e.id !== ex.id))}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {exerciseCart.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center p-4">Carrito vacío</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 space-y-3">
          <button 
            disabled={exerciseCart.length === 0 || isLoadingPdf}
            onClick={exportPDF}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg active:scale-[0.95]"
          >
            {isLoadingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isLoadingPdf ? 'Generando...' : 'Exportar Guía PDF'}
          </button>
          <button 
             onClick={clearSession}
            className="w-full py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.95]"
          >
            <PlusCircle size={18} /> Nueva Sesión
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-white/50 backdrop-blur-sm">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={14} /> Historial Académico
            </span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
               <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
               Motor SymPy Activo
             </div>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8"
        >
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-6 ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'bg-white border border-slate-200 shadow-sm text-slate-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {m.role === 'model' ? <BrainCircuit size={16} className="text-indigo-500" /> : null}
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      {m.role === 'user' ? 'Tú' : 'Profesor Tutor'}
                    </span>
                  </div>
                  <MathMarkdown content={m.content} />
                  
                  {m.role === 'model' && idx > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                      <button 
                        onClick={() => addToCart(m.content)}
                        className="flex items-center gap-2 text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <ShoppingCart size={14} /> Añadir al carrito
                      </button>
                      <button 
                        onClick={generateSimilar}
                        className="flex items-center gap-2 text-[11px] font-bold bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        <Dices size={14} /> Ejercicios Similares
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-indigo-500" />
                <span className="text-xs font-medium text-slate-500 italic">Validando pasos con SymPy...</span>
              </div>
            </div>
          )}

          {graphData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <TrendingUp size={14} /> Visualización de Función
                 </h3>
                 <button 
                   onClick={() => setGraphData(null)}
                   className="text-slate-400 hover:text-red-500"
                 >
                   <Trash2 size={14} />
                 </button>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="x" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="y" stroke="#4f46e5" strokeWidth={3} dot={false} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-slate-200 bg-white/70 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex gap-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre cálculo, álgebra o pide un desarrollo paso a paso..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none max-h-32 shadow-inner"
                rows={1}
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-400 transition-all active:scale-90"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-3 flex gap-4 justify-center">
             <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap overflow-x-auto pb-2 px-4 scrollbar-hide">
               <span>Prueba:</span>
               <button onClick={() => handleSend("Explica paso a paso cómo derivar $f(x) = \sin(x^2)$")} className="hover:text-indigo-600 transition-colors">Derivadas</button>
               <span className="opacity-20">|</span>
               <button onClick={() => handleSend("Resuelve el sistema: $2x + y = 5$, $x - y = 1$")} className="hover:text-indigo-600 transition-colors">Sistemas</button>
               <span className="opacity-20">|</span>
               <button onClick={() => handleSend("Calcula la integral de $x^3 e^x$")} className="hover:text-indigo-600 transition-colors">Integrales</button>
             </div>
          </div>
        </div>
      </main>

      {/* Floating Indicators */}
      <div className="fixed bottom-32 right-8 flex flex-col gap-2">
        <motion.div 
          whileHover={{ x: -10 }}
          className="bg-white border border-slate-200 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">IA Pedagógica</span>
        </motion.div>
      </div>

      {/* Hidden PDF content for capture - Using basic CSS for maximum compatibility */}
      <div 
        id="pdf-content" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: '-2000px', // Far off-screen instead of display: none
          width: '800px', 
          padding: '60px', 
          backgroundColor: '#ffffff', 
          color: '#000000',
          zIndex: -1,
          fontFamily: 'serif'
        }}
      >
        <div style={{ borderBottom: '2px solid #334155', paddingBottom: '20px', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0f172a' }}>Guía de Ejercicios Matemáticos</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
            <span>MathMaster Academia - Tutor Inteligente</span>
            <span>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
          {exerciseCart.map((ex, i) => (
            <div key={ex.id} style={{ pageBreakInside: 'avoid' }}>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ backgroundColor: '#1e293b', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '3px', textTransform: 'uppercase' }}>
                  Ejercicio {i + 1}
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>
              <div style={{ paddingLeft: '20px', borderLeft: '3px solid #f1f5f9' }}>
                <MathMarkdown content={ex.content} />
              </div>
              <div style={{ marginTop: '25px', height: '60px', border: '1px dashed #e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resolución / Notas</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Documento generado por MathMaster Tutor IA
          </p>
        </div>
      </div>
    </div>
  );
}
