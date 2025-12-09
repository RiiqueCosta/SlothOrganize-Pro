
import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { processAudioCommand } from '../services/geminiService';
import { VoiceCommandResult, Priority } from '../types';
import { Button } from './Button';

interface VoiceInputProps {
  onTaskCreated: (taskData: VoiceCommandResult) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTaskCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' }); // Prefer webm/opus
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm; codecs=opus' });
        await handleProcessing(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Clean up
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const handleProcessing = async (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const aiResult = await processAudioCommand(base64String);
      setResult(aiResult);
      setIsProcessing(false);
      if (aiResult) setShowModal(true);
    };
  };

  const handleConfirm = () => {
    if (result) {
      onTaskCreated(result);
      setShowModal(false);
      setResult(null);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setResult(null);
  };

  return (
    <>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`fixed bottom-24 right-8 md:bottom-8 md:right-24 z-40 p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
            : isProcessing 
              ? 'bg-slate-200 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
        }`}
        title="Comando de Voz"
      >
        {isProcessing ? (
          <Loader2 size={24} className="text-slate-500 animate-spin" />
        ) : isRecording ? (
          <Square size={24} className="text-white fill-current" />
        ) : (
          <Mic size={24} className="text-white" />
        )}
      </button>

      {/* Confirmation Modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <Mic size={18} /> Entendi isso:
              </h3>
              <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>

            <div className="p-5 space-y-4">
              {result.necessitaConfirmacao && (
                 <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-800 text-sm flex gap-2">
                    <AlertCircle size={20} className="shrink-0 text-amber-500" />
                    <p>{result.perguntaParaUsuario}</p>
                 </div>
              )}

              <div>
                <h4 className="font-bold text-lg text-slate-800 leading-tight">{result.titulo}</h4>
                {result.descricao && <p className="text-slate-500 text-sm mt-1">{result.descricao}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                 <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                     result.prioridade === 'Alta' ? 'bg-red-100 text-red-700' : 
                     result.prioridade === 'Média' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                 }`}>{result.prioridade}</span>
                 {result.categoria && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">{result.categoria}</span>}
                 {result.data && <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">{result.data} {result.hora}</span>}
              </div>
              
              {result.tipo === 'projeto' && result.subtarefas.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Subtarefas sugeridas</p>
                      <ul className="space-y-1">
                          {result.subtarefas.map((sub, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> {sub}
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button variant="secondary" onClick={handleCancel} className="flex-1">Cancelar</Button>
              <Button onClick={handleConfirm} className="flex-1" icon={<Check size={18} />}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
