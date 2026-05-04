export interface Exercise {
  id: string;
  title: string;
  content: string;
  category: 'Calculo' | 'Algebra' | 'Otro';
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
