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
      'form': ['id', 'name', 'location_id', 'location_dest_id', 'scheduled_date', 'state', 'picking_type_id', 'priority', 'note', 'move_lines']
    },

    'stock.move': {
      'tree': ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done'],
      'form': ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done']
    }

  }                            

  constructor(private odooCon: OdooService, public alertCtrl: AlertController, public storage: Storage) {
    console.log('Hello StockProvider Provider');  
  }

  // Pickings

  get_picking_list(picking_state, partner_id) {
    let self = this;
    let domain = [];
    //['partner_id', '=', partner_id],['state', '=', picking_state] 

    let model = 'stock.picking';
    let fields = this.STOCK_FIELDS[model]['tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, 0, 0).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  get_picking_info(picking_id) {
    let self = this;
    let domain = [['id', '=', picking_id]];

    let model = 'stock.picking';
    let fields = this.STOCK_FIELDS[model]['form']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, 0, 0).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  // Move_lines

  get_move_lines_list(line_ids) {
    let self = this;
    let domain = [['id', 'in', line_ids]];

    let model = 'stock.move';
    let fields = this.STOCK_FIELDS[model]['tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, 0, 0).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

}
