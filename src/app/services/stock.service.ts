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
      'form': ['id', 'name', 'location_id', 'location_dest_id', 'scheduled_date', 'state', 
      'picking_type_id', 'priority', 'note', 'move_lines', 'move_line_ids', 'quantity_done', 
      'quantity_done_lines', 'reserved_availability', 'reserved_availability_lines', 'show_check_availability', 
      'show_validate']
    },

    'stock.move': {
      'tree': ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done'],
      'form': ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done', 'state']
    },

    'stock.move.line': {
      'tree': ['id', 'product_id', 'product_uom_qty', 'qty_available', 'qty_done', 'location_id', 'location_dest_id', 
      'package_id', 'result_package_id'],
      'form': ['id', 'product_id', 'product_uom_qty', 'qty_available', 'qty_done', 'location_id', 'location_dest_id', 
      'package_id', 'result_package_id', 'state', 'picking_id']
    },

    'product.product': {
      'tree': ['id', 'name', 'default_code', 'list_price', 'qty_available', 'virtual_available'],
      'form': ['id', 'name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'virtual_available', 'categ_id', 
      'barcode', 'description_short', 'image_medium'],
      'location-tree': ['id', 'name', 'default_code', 'list_price', 'last_purchase_price', 'qty_available', 'virtual_available', 
      'barcode', 'uom_id']
    },

    'stock.location': {
      'tree': ['id', 'display_name', 'usage', 'company_id'],
      'form': ['id', 'display_name', 'usage', 'company_id', 'picking_type_id']
    },

    'stock.quant': {
      'tree': ['id', 'product_id', 'reserved_quantity', 'quantity'],
      'form': ['id', 'product_id', 'reserved_quantity', 'quantity']
    },

    'stock.picking.type': {
      'tree': ['id', 'name', 'color', 'warehouse_id', 'code'],
      'form': ['id', 'name', 'color', 'warehouse_id', 'code', 'count_picking_ready', 'count_picking_waiting', 'count_picking_late', 
      'count_picking_backorders', 'rate_picking_late', 'rate_picking_backorders']
    }

  }                            

  constructor(
    private odooCon: OdooService, 
    public alertCtrl: AlertController, 
    public storage: Storage
  ) {
    console.log('Hello StockProvider Provider');  
  }

  // Pickings

  get_picking_list(view_domain, type_id, offset=0, limit=0, search) {
    let self = this;
    let domain = view_domain;

    if (type_id) {
      domain.push(['picking_type_id', '=', Number(type_id)]);
    }
    
    if(search) {
      domain.push(['name', 'ilike', search]);
    }

    let model = 'stock.picking';
    let fields = this.STOCK_FIELDS[model]['tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, offset, limit).then((data:any) => {
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

  get_picking_types(picking_codes, offset=0, limit=0, search) {
    let self = this;
    let domain = [];
    
    domain = [['code', 'in', picking_codes], ['active', '=', true]];

    if(search) {
      domain.push(['name', 'ilike', search]);
    }

    let model = 'stock.picking.type';
    let fields = this.STOCK_FIELDS[model]['form']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, offset, limit).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  action_assign(pick_id) {
    let self = this
    let model
    let values = {
      'id': pick_id
    }
     
    model = 'stock.picking';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'action_assign_pick', values).then((done) => {
       resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar")
    });
    })
    
    return promise
  }

  button_validate(pick_id) {
    let self = this
    let model
    let values = {
      'id': pick_id
    }
     
    model = 'stock.picking';
    let promise = new Promise( (resolve, reject) => {
      console.log("button validate pick"); 
      console.log(pick_id)
      self.odooCon.execute(model, 'button_validate_pick', values).then((done) => {
        resolve(done)
      })
      .catch((err) => {
        reject(err['msg']['error_msg']);
        console.log("Error al validar")
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

  get_move_lines_details_list(line_ids) {
    let self = this;
    let domain = [['id', 'in', line_ids]];

    let model = 'stock.move.line';
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

  force_set_qty_done(move_id, model='stock.move') {
    let self = this
    let values = {
      'id': move_id
    }
     
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_qty_done_apk', values).then((done) => {
       resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar")
    });
    })
    
    return promise
  }

  force_set_assigned_qty_done(move_id, model='stock.move') {
    let self = this 
    let values = {
      'id': move_id
    }
     
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_assigned_qty_done_apk', values).then((done) => {
       resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar")
    });
    })
    
    return promise
  }

  force_set_reserved_qty_done(move_id, model='stock.move') {
    let self = this 
    let values = {
      'id': move_id
    }
     
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_reserved_qty_done_apk', values).then((done) => {
       resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar")
    });
    })
    
    return promise
  }

  force_set_available_qty_done(move_id, model='stock.move.line') {
    let self = this 
    let values = {
      'id': move_id
    }
    
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_available_qty_done_apk', values).then((done) => {
        console.log(done)
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar")
    });
    })
    
    return promise
  }

  force_reset_qties(pick_id, model='stock.picking') {
    let self = this 
    let values = {
      'id': pick_id
    }
     
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_reset_qties_apk', values).then((done) => {
       resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar")
    });
    })
    
    return promise
  }


  // Products

  get_product_list(offset=0, limit=0, search) {
    let self = this;
    let domain = [];

    if(search) {
      domain.push('|',['name', 'ilike', search], ['default_code', 'ilike', search]);
    }

    let model = 'product.product';
    let fields = this.STOCK_FIELDS[model]['tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, offset, limit).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  get_product_info(product_id) {
    let self = this;
    let domain = [['id', '=', product_id]];

    let model = 'product.product';
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

  get_location_products(location, offset=0, limit=0, search) {
    let self = this;
    let domain = [['product_tmpl_id.location_id', 'child_of', Number(location)]];
    
    if(search) {
      domain.push(['name', 'ilike', search]);
    }

    let model = 'product.product';
    let fields = this.STOCK_FIELDS[model]['location-tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, offset, limit).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }
  
  // Location

  get_location_list(location_state, offset=0, limit=0, search) {
    let self = this;
    let domain = [];
    if (location_state != 'all') {
      domain = [['usage', '=', location_state]];
    }
    
    if(search) {
      domain.push(['name', 'ilike', search]);
    }

    let model = 'stock.location';
    let fields = this.STOCK_FIELDS[model]['tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, offset, limit).then((data:any) => {
        for (let sm_id in data){data[sm_id]['model'] = model}
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  get_location_info(location_id) {
    let self = this;
    let domain = [['id', '=', location_id]];

    let model = 'stock.location';
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

  // Quants

  get_location_quants(location, offset=0, limit=0, search) {
    let self = this;
    let domain = [['location_id', 'child_of', Number(location)]];
    
    if(search) {
      domain.push(['product_id.name', 'ilike', search]);
    }

    let model = 'stock.quant';
    let fields = this.STOCK_FIELDS[model]['tree']
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, offset, limit).then((data:any) => {
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
