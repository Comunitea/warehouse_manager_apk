import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ScannerOptions } from '../../../interfaces/scanner-options';
import { Storage } from '@ionic/storage';
import { AudioService } from '../../../services/audio.service';
import { VoiceService } from '../../../services/voice.service';
import { ScannerService } from '../../../services/scanner.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-scanner-header',
  templateUrl: './scanner-header.component.html',
  styleUrls: ['./scanner-header.component.scss'],
})
export class ScannerHeaderComponent implements OnInit {

  scanner_options: ScannerOptions = { reader: true, microphone: false, sound: false };

  @Input() disabled_reader: boolean;

  constructor(
    private storage: Storage,
    private audio: AudioService,
    private voice: VoiceService,
    public alertCtrl: AlertController,
    private scanner: ScannerService
  ) { }

  ngOnInit() {
    this.storage.get('SCANNER').then((val) => {
      if (val){
        this.scanner_options = val;
        this.update_show_vals();
      } else {
        this.save_scanner_options();
      }
      if (this.voice.available == null){
        this.voice.isAvailable();
      }
    })
    .catch((error) => {
      this.presentAlert('Error al acceder a las opciones del scanner:', error);
    });
    if (this.voice.available){
      this.check_escuchando();
    }
  }

  async presentAlert(titulo, texto) {
    this.audio.play('error');
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }

  change_volume() {
    this.audio.ActiveAudio = !this.audio.ActiveAudio;
    this.scanner_options['sound'] = this.audio.ActiveAudio;
    this.save_scanner_options();
  }

  change_escuchando() {
    this.voice.active_voice = !this.voice.active_voice;
    this.scanner_options['microphone'] = this.voice.active_voice;
    this.save_scanner_options();
    this.check_escuchando();
  }

  check_escuchando() {
    if (this.voice.active_voice) {
      this.voice.startListening();
    } else {
      this.voice.stopListening();
    }
  }

  change_hide_scan_form() {
    this.scanner.ActiveScanner = !this.scanner.ActiveScanner;
    this.scanner_options['reader'] = this.scanner.ActiveScanner;
    this.save_scanner_options();
  }

  save_scanner_options() {
    this.storage.set('SCANNER', this.scanner_options).then(() => {
    });
  }

  update_show_vals() {
    this.audio.ActiveAudio = this.scanner_options['sound'];
    this.voice.active_voice = this.scanner_options['microphone'];
    this.scanner.ActiveScanner = this.scanner_options['reader'];
  }

}
