import React, { useState, useEffect, useRef } from 'react';
import { pipeline, Pipeline } from '@xenova/transformers';

interface AppState {
  input: string;
  response: string;
  loading: boolean;
  modelReady: boolean;
  error: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    input: '',
    response: '',
    loading: false,
    modelReady: false,
    error: ''
  });

  const generatorRef = useRef<Pipeline | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setState(prev => ({ ...prev, response: '🔄 Se încarcă modelul AI...' }));
        
        generatorRef.current = await pipeline(
          'text-generation', 
          'Xenova/TinyLlama-1.1B-Chat-v1.0',
          { quantized: true }
        );
        
        setState(prev => ({ 
          ...prev, 
          modelReady: true, 
          response: '✅ Modelul AI este gata! Scrie ceva mai jos.' 
        }));
      } catch (err) {
        setState(prev => ({ 
          ...prev, 
          error: 'Eroare la încărcarea modelului.' 
        }));
      }
    };
    
    loadModel();
    return () => { generatorRef.current = null; };
  }, []);

  const handleGenerate = async () => {
    if (!state.input.trim() || !state.modelReady) return;
    setState(prev => ({ ...prev, loading: true, response: '⏳ Generare...', error: '' }));
    
    try {
      const prompt = `<|system|>Ești asistent AI pentru energie verde și panouri solare.<|user|>${state.input.trim()}<|assistant|>`;
      
      const output = await generatorRef.current?.(prompt, {
        max_new_tokens: 256,
        temperature: 0.7,
        repetition_penalty: 1.1,
        return_full_text: false,
      });
      
      let generatedText = output?.[0]?.generated_text || 'Nu am putut genera un răspuns.';
      generatedText = generatedText.replace(/<\|.*?\|>/g, '').trim();
      
      setState(prev => ({ ...prev, response: generatedText }));
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Eroare la generare' }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const { input, response, loading, modelReady, error } = state;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '15px' }}>
        <h1>🌞 Solaris-CET</h1>
        <p>Asistent AI pentru Energie Verde - Rulează 100% gratuit în browser</p>
      </header>

      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', 
        marginBottom: '20px', minHeight: '150px', border: '1px solid #dee2e6' }}>
        {error ? <div style={{ color: '#dc3545', fontWeight: 'bold' }}>⚠️ {error}</div> :
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#333' }}>
            {response || 'Așteptăm să începem conversația...'}
          </div>
        }
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <textarea value={input} onChange={(e) => setState(prev => ({ ...prev, input: e.target.value }))} 
          onKeyPress={handleKeyPress} placeholder="Întreabă despre panouri solare..." 
          disabled={!modelReady || loading} style={{ flex: 1, padding: '12px', borderRadius: '8px' }}/>
        <button onClick={handleGenerate} disabled={!modelReady || loading || !input.trim()}
          style={{ padding: '12px 24px', backgroundColor: (!modelReady || loading) ? '#ccc' : '#28a745', 
          color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {loading ? '⏳' : 'Trimite'}
        </button>
      </div>
    </div>
  );
};

export default App;
