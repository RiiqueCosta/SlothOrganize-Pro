
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Task, PrioritizedTaskResult, SubtasksResult, TimeBoxResult, CoachResult, EmotionalInsightsResult, VoiceCommandResult } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// 1. Prioritizador por Humor
export const prioritizeByMood = async (
  mood: string,
  energy: number,
  availableMinutes: number,
  tasks: Task[]
): Promise<PrioritizedTaskResult | null> => {
  try {
    const ai = getAI();
    const taskData = tasks.map(t => ({
      id: t.id,
      title: t.title,
      desc: t.description || "",
      estimated_minutes: t.estimatedMinutes || t.duration || 30,
      difficulty: t.difficulty || 3
    }));

    const prompt = JSON.stringify({
      mood,
      energy,
      available_minutes: availableMinutes,
      tasks: taskData
    });

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        prioritized_tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              rank: { type: Type.INTEGER },
              reason: { type: Type.STRING },
              suggested_subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    estimated_minutes: { type: Type.INTEGER }
                  }
                }
              },
              action: { type: Type.STRING, enum: ['start_now', 'suggest_later', 'delegate'] }
            }
          }
        },
        summary: { type: Type.STRING },
        total_estimated_minutes: { type: Type.INTEGER }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `Você é um assistente de produtividade. Receba o humor, energia (0-100) e tarefas. Retorne JSON priorizado.
        Regras:
        - mood=cansado: priorizar difficulty <= 2.
        - mood=produtivo: priorizar difficulty >= 4.
        - energy < 30: sugerir tarefas curtas.
        - Não exceder available_minutes para 'start_now'.
        - Razões empáticas e curtas.`,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || "{}") as PrioritizedTaskResult;
  } catch (e) {
    console.error("Mood prioritize error", e);
    return null;
  }
};

// 2. Gerador de Subtarefas
export const generateSubtasksDetailed = async (
  title: string,
  description: string
): Promise<SubtasksResult | null> => {
  try {
    const ai = getAI();
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        subtasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimated_minutes: { type: Type.INTEGER },
              difficulty: { type: Type.INTEGER }
            }
          }
        },
        total_estimated_minutes: { type: Type.INTEGER },
        notes: { type: Type.STRING }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify({ title, description, user_preferences: { max_subtasks: 6 } }),
      config: {
        systemInstruction: "Gere 3-8 subtarefas acionáveis, com tempo (multiplo de 5) e dificuldade (1-5). Títulos curtos.",
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || "{}") as SubtasksResult;
  } catch (e) {
    console.error("Subtasks error", e);
    return null;
  }
};

// 3. Sugestor Time-box
export const suggestTasksForTime = async (
  availableMinutes: number,
  tasks: Task[],
  preference: 'impacto' | 'rápido' | 'misturado'
): Promise<TimeBoxResult | null> => {
  try {
    const ai = getAI();
    const taskData = tasks.map(t => ({
      id: t.id,
      title: t.title,
      estimated_minutes: t.estimatedMinutes || t.duration || 15,
      priority: t.priority === 'Alta' ? 3 : t.priority === 'Média' ? 2 : 1
    }));

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        selection: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              estimated_minutes: { type: Type.INTEGER }
            }
          }
        },
        total_minutes: { type: Type.INTEGER },
        reason: { type: Type.STRING }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify({ available_minutes: availableMinutes, preference, items: taskData }),
      config: {
        systemInstruction: "Selecione tarefas que caibam no tempo. Maximize prioridade se 'impacto', quantidade se 'rápido'. Não exceda o tempo.",
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || "{}") as TimeBoxResult;
  } catch (e) {
    console.error("Timebox error", e);
    return null;
  }
};

// 4. Coach Anti-procrastinação
export const getCoachingAdvice = async (
  taskTitle: string,
  taskDesc: string,
  userNote: string
): Promise<CoachResult | null> => {
  try {
    const ai = getAI();
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        conversation: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING, enum: ['coach', 'suggestions', 'plan10min'] },
              text: { type: Type.STRING },
              items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING } } } },
              steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { minute: { type: Type.INTEGER }, action: { type: Type.STRING } } } }
            }
          }
        },
        summary: { type: Type.STRING }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify({ task: { title: taskTitle, description: taskDesc }, user_note: userNote }),
      config: {
        systemInstruction: "Coach gentil. Valide sentimento, identifique bloqueio, ofereça 3 intervenções, crie plano de 10 min. Empático.",
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || "{}") as CoachResult;
  } catch (e) {
    console.error("Coach error", e);
    return null;
  }
};

// 5. Painel Emocional
export const getEmotionalInsights = async (
  completedTasks: Task[]
): Promise<EmotionalInsightsResult | null> => {
  try {
    const ai = getAI();
    const historyData = completedTasks.map(t => ({
      title: t.title,
      category: t.category || "geral",
      feeling: t.feeling || "😐",
      duration: t.estimatedMinutes || t.duration || 30,
      difficulty: t.difficulty || 3
    }));

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        top_tiring: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, count: { type: Type.INTEGER }, avg_duration: { type: Type.NUMBER } } }
        },
        top_pleasure: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, count: { type: Type.INTEGER }, avg_duration: { type: Type.NUMBER } } }
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        visuals: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, field: { type: Type.STRING }, note: { type: Type.STRING } } } }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify({ completed_tasks: historyData, period: "last_week" }),
      config: {
        systemInstruction: "Analise histórico. Tiring = 😫 > 50%. Pleasure = 😁. Gere recomendações de balanceamento.",
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || "{}") as EmotionalInsightsResult;
  } catch (e) {
    console.error("Insights error", e);
    return null;
  }
};

// 6. Processamento de Voz
export const processAudioCommand = async (base64Audio: string): Promise<VoiceCommandResult | null> => {
  try {
    const ai = getAI();
    
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        tipo: { type: Type.STRING, enum: ['tarefa', 'lembrete', 'evento', 'projeto'] },
        titulo: { type: Type.STRING },
        descricao: { type: Type.STRING },
        data: { type: Type.STRING, description: "YYYY-MM-DD" },
        hora: { type: Type.STRING, description: "HH:MM" },
        local: { type: Type.STRING },
        categoria: { type: Type.STRING },
        prioridade: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta'] },
        subtarefas: { type: Type.ARRAY, items: { type: Type.STRING } },
        necessitaConfirmacao: { type: Type.BOOLEAN },
        perguntaParaUsuario: { type: Type.STRING }
      }
    };

    const systemInstruction = `
      Você é uma IA especializada em transformar áudios naturais em tarefas organizadas.
      Sua função é interpretar a fala e converter em um objeto estruturado.
      OBJETIVO: Gerar dados estruturados mesmo com fala informal.
      
      INTENÇÃO: Identifique o que, quando, onde e prioridade.
      TEMPO: Reconheça "amanhã", "dia 14", "às 15h". Converta datas relativas para YYYY-MM-DD com base na data atual (considere hoje ${new Date().toISOString().split('T')[0]}).
      CATEGORIA: Deduza (Trabalho, Casa, Pessoal, etc).
      PROJETOS: Se houver muitos itens, crie subtarefas.
      EMOÇÃO: Se soar cansado/estressado, ajuste prioridade.
      CONFIRMAÇÃO: Se faltar info crítica (ex: data para um compromisso), marque necessitaConfirmacao=true e gere a pergunta.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/webm; codecs=opus", data: base64Audio } }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || "{}") as VoiceCommandResult;
  } catch (e) {
    console.error("Voice processing error", e);
    return null;
  }
};
