import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { OdooService } from '../../services/odoo.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  
  loading:any

  constructor(
            public stock: StockFunctionsService,
            public loadingController: LoadingController,
            public odooCon: OdooService) { }
  

  ngOnInit() {
  }
  ActMasters(object){
    if (object=='location'){
      this.presentLoading("Cargando ubicaciones ...")
      this.stock.GetAppLocations().then((res: boolean) => {this.loading.dismiss()}).catch((error) =>{this.loading.dismiss()})
    }
    if (object=='product'){
      this.presentLoading("Cargando artículos ...")
      this.stock.GetAppProducts().then((res: boolean) => {this.loading.dismiss()}).catch((error) =>{this.loading.dismiss()})
      
    }
    if (object=='type'){
      this.presentLoading("Cargando tipos ...")
      this.stock.GetAppPickingTypeIds().then((res: boolean) => {this.loading.dismiss()}).catch((error) =>{this.loading.dismiss()})
    }
    
  }
  
  async presentLoading(Message= '...', duration=3500) {
    // this.loading.getTop().then(v => v ? this.loading && this.loading.dismiss() : null);
    this.loading = await this.loadingController.create({
      message: Message,
      duration: duration,
      keyboardClose: true,
      backdropDismiss: true,
      translucent: true,
      cssClass: 'custom-class custom-loading'
    });

    await this.loading.present();
  }
  
}