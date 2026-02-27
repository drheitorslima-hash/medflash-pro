
import { GoogleGenAI } from "@google/genai";
import { GenerationInput, FlashcardMode, EnunciadoInput, RefazerInput } from "../types";

const CANONICAL_HEITOR_TEMPLATE_CORE = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto; font-size:18px; line-height:1.5;">
<i><b>
<div style="font-size:22px; color:#FF2D55; font-style:italic; font-weight:700;">[EMOJI] [TÍTULO PRINCIPAL]</div>

<!-- SE HOUVER QUESTÃO OU RESUMO NO TOPO -->
<div style="margin-top:8px;">➡️ <span style="background-color:#30D158; color:#000000; padding:2px 6px; border-radius:6px;">RESPOSTA RESUMIDA</span> [Texto curto]</div>
<div style="margin-top:6px;">🧩 [sinais + sinais → DX / próximo passo]</div>

<!-- SEÇÕES (SÓ SE TIVER CONTEÚDO) -->
<div style="font-size:20px; color:#FF2D55; margin-top:10px; font-style:italic; font-weight:700;">📊 EPIDEMIOLOGIA</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;📌 [Linha 1]</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;📌 [Linha 2]</div>

<div style="font-size:20px; color:#FF2D55; margin-top:10px; font-style:italic; font-weight:700;">🩺 CLÍNICA</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;📌 ...</div>

<div style="font-size:20px; color:#FF2D55; margin-top:10px; font-style:italic; font-weight:700;">🔎 DIAGNÓSTICO</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;📌 ...</div>

<div style="font-size:20px; color:#FF2D55; margin-top:10px; font-style:italic; font-weight:700;">🔪 TRATAMENTO</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;📌 ...</div>

<div style="font-size:20px; color:#FF2D55; margin-top:10px; font-style:italic; font-weight:700;">🎯 TAKE-HOME</div>
<div>&nbsp;&nbsp;&nbsp;&nbsp;✅ ...</div>
</b></i>
</div>
`;

const HEITOR_FLASHCARD_SYSTEM_INSTRUCTION = `
VOCÊ É um gerador de flashcards médicos estilo “Heitor”, com saída em HTML pronto para colar no Anki.
A partir de agora, você deve seguir RELIGIOSAMENTE o TEMPLATE CANÔNICO abaixo. Se o output não estiver idêntico ao modelo estrutural, você falhou.

REGRAS ABSOLUTAS:
1) NÃO criar palavras novas. NÃO inventar sinônimos. NÃO explicar demais.
2) Linguagem TELEGRÁFICA / DESPOLUÍDA.
3) Emojis SEMPRE no início de cada linha.
4) Destaques RIGOROSOS: 1–3 marca-textos por seção no máx.
5) PROIBIDO: <hr>, <u>, underline, listas com bullets (•), separadores.
6) TUDO em itálico + negrito (<i><b> ... </b></i>).
7) Abreviações obrigatórias: d, h, s, m, SCQ, TC, USG, EDA, HDA, VA, IOT, Hb, INR, TP/TTPa, Ac metab, > <, ↑ ↓, c/, s/.

PALETA E ESTILOS FIXOS:
- Títulos (Principal 22px / Seção 20px): SEMPRE #FF2D55.
- Marca-texto: Vermelho (#FF2D55), Amarelo (#FFD60A), Roxo (#BF5AF2), Verde (#30D158).
- Span de marca-texto: <span style="background-color: COR; color: #000000; padding:2px 6px; border-radius:6px;">TEXTO</span> (Roxo escuro pode usar color: #ffffff).

TEMPLATE CANÔNICO:
${CANONICAL_HEITOR_TEMPLATE_CORE}

SÓ ENTREGUE O HTML FINAL. SEM EXPLICAÇÕES.
`;

const HEITOR_REFAZER_SYSTEM_INSTRUCTION = `
VOCÊ É o especialista em "REFAZER FLASHCARDS (PADRÃO HEITOR)".
Seu trabalho é pegar um flashcard antigo (HTML ou Texto) e ajustá-lo RELIGIOSAMENTE para o TEMPLATE CANÔNICO HEITOR abaixo, respeitando estritamente os comandos de mudança do usuário.

REGRAS CRÍTICAS:
1) Se o input já estiver "quase certo", corrija apenas os detalhes estéticos para bater o template.
2) Mantenha o conteúdo original, ajuste APENAS o que foi pedido.
3) Force a estética: Títulos #FF2D55, Italic+Bold em TUDO, Emojis no início.
4) Não invente seções se o original não as tiver, mas organize as existentes no padrão Heitor (📊, 🩺, 🔎, 🔪, 🎯).
5) Use obrigatoriamente div com 4 non-breaking spaces (&nbsp;&nbsp;&nbsp;&nbsp;📌) para itens de seção.

TEMPLATE CANÔNICO:
${CANONICAL_HEITOR_TEMPLATE_CORE}

SÓ ENTREGUE O HTML. SEM COMENTÁRIOS.
`;

const HEITOR_ENUNCIADO_SYSTEM_INSTRUCTION = `
VOCÊ É o "GERADOR DE ENUNCIADOS (ANKI)" do Heitor. Transforme casos longos em enunciados ultra-resumidos.

REGRAS:
1) Linguagem abreviada, estilo prova, alta densidade.
2) Saída em UMA LINHA dentro de: <div><i><b>...</b></i></div>
3) TUDO em itálico + negrito.
4) Palavras em VERMELHO (<span style="color: rgb(255, 0, 0);">TEXTO</span>): idade, sexo, fatores, achados críticos, e pergunta final.
5) SEM listas, SEM quebras de linha.

Entregue APENAS o código HTML.
`;

export const generateFlashcard = async (input: GenerationInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imageParts = input.images.map(img => {
    const [mimeTypePart, data] = img.split(',');
    const actualMimeType = mimeTypePart.split(':')[1].split(';')[0];
    return { inlineData: { mimeType: actualMimeType, data: data } };
  });

  const prompt = `Gere um flashcard no TEMPLATE CANÔNICO:
  - Texto Extra: ${input.extraText}
  - Questão: ${input.question}
  - Resposta: ${input.answer}
  - Modo: ${input.mode}
  - Config: ${JSON.stringify(input.config)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [...imageParts, { text: prompt }] },
    config: { 
      systemInstruction: HEITOR_FLASHCARD_SYSTEM_INSTRUCTION, 
      temperature: 0.1 
    }
  });

  return response.text.replace(/```html/g, '').replace(/```/g, '').trim();
};

export const generateEnunciado = async (input: EnunciadoInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Gere o enunciado resumido para:
  "${input.rawText}"
  Comandos: ${input.quickCommands}
  Config: ${JSON.stringify(input.config)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ text: prompt }],
    config: { 
      systemInstruction: HEITOR_ENUNCIADO_SYSTEM_INSTRUCTION, 
      temperature: 0.1 
    }
  });

  return response.text.replace(/```html/g, '').replace(/```/g, '').trim();
};

export const refazerFlashcard = async (input: RefazerInput): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Refaça RELIGIOSAMENTE no TEMPLATE CANÔNICO HEITOR:
  - Flashcard Antigo: ${input.oldFlashcard}
  - Comandos de Mudança: ${input.changeCommands}
  - Modo: ${input.mode}
  - Config: ${JSON.stringify(input.config)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ text: prompt }],
    config: {
      systemInstruction: HEITOR_REFAZER_SYSTEM_INSTRUCTION,
      temperature: 0.1
    }
  });

  return response.text.replace(/```html/g, '').replace(/```/g, '').trim();
};
