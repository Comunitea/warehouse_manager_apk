import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { NativeAudio } from '@ionic-native/native-audio/ngx';
import { Storage } from '@ionic/storage';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  public ActiveAudio: boolean;

  audioType = 'html5';
  sounds: any = [];

  constructor(
      public nativeAudio: NativeAudio,
      public platform: Platform,
      public storage: Storage,
      public alertCtrl: AlertController
    ) {
    if (platform.is('cordova')){
      this.audioType = 'native';
    }
    this.ActiveAudio = true;
  }

  async presentAlert(titulo, texto) {
    this.play('error');
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }

  preload(Key, Asset) {
    if (this.audioType === 'html5'){
        const audio = {
            key: Key,
            asset: Asset,
            type: 'html5'
        };

        this.sounds.push(audio);

    } else {
        this.nativeAudio.preloadSimple(Key, Asset);
        const audio = {
            key: Key,
            asset: Key,
            type: 'native'
        };
        this.sounds.push(audio);
    }
  }

  play(key){
    if (this.ActiveAudio === true) {
      const audio = this.sounds.find((sound) => {
          return sound.key === key;
      });
      if (audio.type === 'html5'){

          const audioAsset = new Audio(audio.asset);
          audioAsset.play();

      } else {
        this.nativeAudio.play(audio.asset).then((res) => {
            console.log(res);
        }, (err) => {
            console.log(err);
        });

      }

    }
  }
}
