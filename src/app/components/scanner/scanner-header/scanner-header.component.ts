import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ScannerOptions } from '../../../interfaces/scanner-options';
import { Storage } from '@ionic/storage';
import { AudioService } from '../../../services/audio.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-scanner-header',
  templateUrl: './scanner-header.component.html',
  styleUrls: ['./scanner-header.component.scss'],
})
export class ScannerHeaderComponent implements OnInit {  

  scanner_options: ScannerOptions = { reader: true, microphone: false, sound: false };

  @Input() volume: boolean
  @Input() show_scan_form: boolean
  @Input() escuchando: boolean
  @Output() show_scan_form_changed = new EventEmitter<boolean>();
  @Output() show_escuchando = new EventEmitter<boolean>();
  @Output() show_volume = new EventEmitter<boolean>();

  constructor(
    private storage: Storage,
    private audio: AudioService,
    public alertCtrl: AlertController,
  ) { }

  ngOnInit() {
    this.storage.get('SCANNER').then((val) => {
      if (val){
        this.scanner_options = val;
        this.update_show_vals();
      } else {
        this.save_scanner_options();
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al acceder a las opciones del scanner:', error);
    });
  }

  async presentAlert(titulo, texto) {
    if (this.volume == true) {
      this.audio.play('error');
    }
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }

  change_volume() {
    this.volume = !this.volume;
    this.scanner_options['sound'] = this.volume;
    this.save_scanner_options();
    this.show_volume.emit(this.volume);
  }

  change_escuchando() {
    this.escuchando = !this.escuchando;
    this.scanner_options['microphone'] = this.escuchando;
    this.save_scanner_options();
    this.show_escuchando.emit(this.escuchando);
  }

  change_hide_scan_form() {
    this.show_scan_form = !this.show_scan_form;
    this.scanner_options['reader'] = this.show_scan_form;
    this.save_scanner_options();
    this.show_scan_form_changed.emit(this.show_scan_form)
  }

  save_scanner_options() {
    this.storage.set('SCANNER', this.scanner_options).then(() => {
    })
  }

  update_show_vals() {
    this.volume = this.scanner_options['sound'];
    this.escuchando = this.scanner_options['microphone'];
    this.show_scan_form = this.scanner_options['reader'];
  }


}
