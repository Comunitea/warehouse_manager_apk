import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { VoiceService } from '../../services/voice.service';

@Component({
  selector: 'app-stock-location',
  templateUrl: './stock-location.page.html',
  styleUrls: ['./stock-location.page.scss'],
})
export class StockLocationPage implements OnInit {

  location: number;
  location_data: {};

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private audio: AudioService,
    public stock: StockService,
    private voice: VoiceService
  ) { }

  ngOnInit() {
    this.odoo.isLoggedIn().then((data)=>{
      if (data==false) {
        this.router.navigateByUrl('/login');
      } else {
        var location = this.route.snapshot.paramMap.get('id');
        this.voice.voice_command_refresh$.subscribe(data => {
          this.voice_command_check();
        });
        this.get_location_info(location);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
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

  get_location_info(location) {
    this.stock.get_location_info(location).then((data)=>{
      this.location_data = data[0];
      this.audio.play('click');   
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el location:', error);
    });
  }

  open_link(type, location_id){
    if (type == 'stock') {
      this.router.navigateByUrl('/stock-quant-list/'+location_id);
    } else {
      this.router.navigateByUrl('/stock-location-product-list/'+location_id);
    } 
  }

  // Voice command

  voice_command_check() {
    console.log("voice_command_check");
    console.log(this.voice.voice_command);
    if (this.voice.voice_command) {
      let voice_command_register = this.voice.voice_command;
      console.log("Recibida orden de voz: " + voice_command_register);
      
      if (this.check_if_value_in_responses("stock", voice_command_register)) {
        console.log("Stock");
        this.router.navigateByUrl('/stock-quant-list/'+this.location['id']);
      } else if (this.check_if_value_in_responses("productos", voice_command_register)){
        console.log("Productos");
        this.router.navigateByUrl('/stock-location-product-list/'+this.location['id']);
      }
    }
  }

  check_if_value_in_responses(value, dict) {
    if(value == dict[0] || value == dict[1] || value == dict[2]) {
      return true;
    } else {
      return false;
    }
  }

}
