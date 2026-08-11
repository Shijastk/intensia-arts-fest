import React, { useState } from 'react';
import { Copy, CheckCircle2, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { Toast } from '../ui/Toast';

export const AIUploadPrompt: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const promptText = `CRITICAL INSTRUCTION: Do NOT generate visual cards, image widgets, HTML previews, or UI components. Output ONLY a real downloadable .csv file.

Task: Convert all event/item details from the attached file/image into a downloadable .csv file using Python code execution.

CSV Schema (Columns):
1. name (Required: string) - The exact item/event name written in the file.
2. category (Required: string) - The category or section header written in the file.
3. zone (Optional: string) - Zone if mentioned; leave blank if not.
4. duration (Optional: number) - Duration in minutes. Default to 30.
5. isGroup (Required: boolean) - Must be 'true' or 'false'.
6. participantsCount (Required: number) - Maximum participants allowed. If not mentioned, default to 1 for individuals, 15 for groups.
7. groupCount (Optional: number) - Required if isGroup is true. Default to 10 if not mentioned.
8. membersPerGroup (Optional: number) - Required if isGroup is true (same as participantsCount). Default to 15 if not mentioned.
9. description (Optional: string) - Short description ("[Category] - [Name]").

Rules:
1. Extract all text dynamically as written in the attachment.
2. Write and execute code to generate a true downloadable .csv file.
3. DO NOT output image elements or graphical table cards.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section id="ai-prompt" className="py-24 bg-gradient-to-b from-white to-indigo-50/30 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100/50 text-indigo-700 font-semibold text-sm mb-6 border border-indigo-200/50">
            <Sparkles className="w-4 h-4" />
            AI-Powered Onboarding
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Convert Photos to Schedules Instantly
          </h2>
          <p className="text-xl text-slate-600 font-medium">
            Don't waste time typing out your entire event schedule. Use our prompt with ChatGPT or Gemini to automatically convert photos, PDFs, or documents into a perfectly formatted CSV file for one-click upload.
          </p>
        </div>

        <div className="max-w-4xl mx-auto" data-aos="fade-up" data-aos-delay="100">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
            {/* Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative bg-slate-900 rounded-2xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-slate-200">AI Prompt Template</span>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    copied 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 hover:text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Prompt
                    </>
                  )}
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 bg-slate-900/50 backdrop-blur-sm">
                <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium font-mono">
                  {promptText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar Notification */}
      {copied && (
        <Toast 
          message="Prompt Copied! Paste it into ChatGPT or Gemini to convert your files."
          type="success"
          onClose={() => setCopied(false)}
        />
      )}
    </section>
  );
};
