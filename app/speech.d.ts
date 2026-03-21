// speech.d.ts

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onaudiostart?: (event: Event) => void;
    onsoundstart?: (event: Event) => void;
    onspeechstart?: (event: Event) => void;
    onspeechend?: (event: Event) => void;
    onsoundend?: (event: Event) => void;
    onaudioend?: (event: Event) => void;
    onresult?: (event: SpeechRecognitionEvent) => void;
    onnomatch?: (event: Event) => void;
    onerror?: (event: SpeechRecognitionErrorEvent) => void;
    onstart?: (event: Event) => void;
    onend?: (event: Event) => void;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item: (index: number) => SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item: (index: number) => SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
}

export {};