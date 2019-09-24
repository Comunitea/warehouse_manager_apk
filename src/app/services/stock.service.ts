import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { OdooService } from './odoo.service';


@Injectable({
  providedIn: 'root'
})
export class StockService {

  STOCK_FIELDS = {

    'stock.picking': {
      'tree': ['id', 'name', 'location_id', 'location_dest_id', 'scheduled_date', 'state'],
      'form': ['id', 'name', 'location_dest_id', 'scheduled_date', 'state']
    }

  }                            

  constructor(private odooCon: OdooService, public alertCtrl: AlertController, public storage: Storage) {
    console.log('Hello StockProvider Provider');  
  }

  // Pickings

  get_picking_list(picking_state, partner_id) {
    let self = this;
    let domain = [['state', '=', picking_state]];
    //['partner_id', '=', partner_id], 

    let model = 'stock.picking';
    let fields = this.STOCK_FIELDS[model]['tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, 0, 0).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          console.log(data);
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

}
