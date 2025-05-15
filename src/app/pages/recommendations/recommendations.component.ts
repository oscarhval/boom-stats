import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatGptService, ChatMessagePayload } from '../../services/chatgpt.service';

interface ChatMessage {
  text: string;
  from: 'bot' | 'user';
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.scss']
})
export class RecommendationsComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  history: ChatMessagePayload[] = [];
  userInput = '';
  loading = false;

  constructor(private ai: ChatGptService) {}

  ngOnInit() {
    this.history.push({
      role: 'system',
      content: `
Eres un asistente musical que sugiere playlists según el estado de ánimo y preferencias.
Responde siempre con texto natural, preguntando lo necesario para recomendar música.
      `.trim()
    });

    this.addBot('¡Hola! Soy BoomStats, tu asistente musical. ¿En qué puedo ayudarte hoy?');
  }

  ngAfterViewChecked() {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
  }

  private addBot(text: string) {
    this.messages.push({ text, from: 'bot' });
  }

  private addUser(text: string) {
    this.messages.push({ text, from: 'user' });
  }

  async sendUserText() {
    const txt = this.userInput.trim();
    if (!txt) return;
    this.userInput = '';
    this.addUser(txt);
    this.loading = true;

    this.history.push({ role: 'user', content: txt });
    const resp = await this.ai.sendMessage({
      model: 'gpt-3.5-turbo',
      messages: this.history
    });
    this.loading = false;

    const raw = resp?.content ?? 'Lo siento, algo ha ido mal.';
    this.addBot(raw);
    this.history.push({ role: 'assistant', content: raw });
  }
}
