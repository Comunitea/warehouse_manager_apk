import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  
  public active_voice: boolean;
  public voice_command: any[];
  public available: boolean;
  private voice_command_refresh = new Subject();
  voice_command_refresh$ = this.voice_command_refresh.asObservable();

  constructor(private voice: SpeechRecognition) {}

  isAvailable(){
    this.voice.isRecognitionAvailable().then(
      (available: boolean) => {
        this.available = available;
        console.log(available);
      }
    ).catch((error)=>{
      this.available = false;
      console.log("Voz no disponible: " +error);
    });
  }

  publishVoiceRefresh(){
    this.voice_command_refresh.next();
  }

  getSupportedLanguages(): void {
    // Get the list of supported languages
    this.voice
      .getSupportedLanguages()
      .then(
          (languages: Array<string>) => console.log(languages),
          error => console.log(error)
      );
  }

  stopListening() {
    this.voice.stopListening();
  }
  
  getPermission() {
    this.voice.hasPermission()
      .then((hasPermission: boolean) => {
        console.log(hasPermission);
        if (!hasPermission) {
          this.voice.requestPermission();
        }
      })
      .catch((error)=>{
        console.log("Sin permisos.");
        this.voice.requestPermission();
      });
  }  

  startListening() {
    this.voice_command = [];
    this.getPermission();
    this.getSupportedLanguages();
    console.log("Escucha");
    let options = {
      language: 'es-ES',
      matches: 1000,
      prompt: "Te escucho",
      showPopup: true,
      showPartial: false
    }
    this.voice.startListening(options).subscribe((matches => {
      this.voice_command = matches;
      this.publishVoiceRefresh();
      this.voice.stopListening().then(() => {
        this.active_voice = false;
        console.log("Dejo de escuchar");
      });
    }),(onerror) => {
      this.active_voice =false;
      this.voice.stopListening();
      console.log('error:', onerror)
    });
  }
}
