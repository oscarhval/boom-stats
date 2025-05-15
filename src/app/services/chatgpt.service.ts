import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../../config';

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatGptService {
  private client = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  async sendMessage(params: {
    model: string;
    messages: ChatMessagePayload[];
  }): Promise<ChatMessagePayload | null> {
    try {
      const res = await this.client.chat.completions.create(params);
      const msg = res.choices[0]?.message;
      if (msg && msg.content !== null) {
        return { role: msg.role as any, content: msg.content };
      }
      return null;
    } catch (e) {
      console.error('Error al llamar a OpenAI:', e);
      return null;
    }
  }
}
