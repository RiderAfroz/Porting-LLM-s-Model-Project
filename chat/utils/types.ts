export interface LlamaContext {
  completion: (params: {
    messages: { role: string; content: string }[];
    n_predict: number;
    temperature: number;
  }) => Promise<{ text: string }>;
}

// Optional structured data for tasks (if they need it)
export interface CalendarEvent {
  title: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  location?: string;
  notes?: string;
  reminder?: number;
}
// types.ts
export type RootTabParamList = {
  Models: undefined;
  Chat: undefined;
  Settings: undefined;
};
export interface AlarmEvent {
  Day?: string;
  Time?: string;
}
