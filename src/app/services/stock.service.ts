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
      'tree': ['id', 'name', 'location_id', 'location_dest_id', 'scheduled_date', 'state','picking_fields'],
      'form': ['id', 'name', 'location_id', 'location_dest_id', 'scheduled_date', 'state', 'group_code',
      'picking_type_id', 'priority', 'note', 'move_lines', 'move_line_ids', 'quantity_done', 'picking_fields',
      'reserved_availability', 'product_uom_qty', 'show_check_availability', 
      'show_validate']
    },

    'stock.move': {
      'tree': ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done', 'tracking'],
      'form': ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done', 'state', 'tracking']
    },

    'stock.move.line': {
      'tree': ['id', 'product_id', 'product_uom_qty', 'qty_available', 'qty_done', 'location_id', 'location_dest_id', 'lot_id',
      'package_id', 'result_package_id', 'tracking'],
      'form': ['id', 'product_id', 'product_uom_qty', 'qty_available', 'qty_done', 'location_id', 'location_dest_id', 'lot_id',
      'package_id', 'result_package_id', 'state', 'picking_id', 'tracking']
    },

    'product.product': {
      'tree': ['id', 'name', 'default_code', 'list_price', 'qty_available', 'virtual_available'],
      'form': ['id', 'name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'virtual_available', 'categ_id', 'tracking', 
      'barcode', 'description_short', 'image_medium'],
      'location-tree': ['id', 'name', 'default_code', 'list_price', 'last_purchase_price', 'qty_available', 'virtual_available', 'tracking', 
      'barcode', 'uom_id']
    },

    'stock.location': {
      'tree': ['id', 'display_name', 'usage', 'company_id'],
      'form': ['id', 'display_name', 'usage', 'company_id', 'picking_type_id']
    },

    'stock.quant': {
      'tree': ['id', 'product_id', 'reserved_quantity', 'quantity'],
      'form': ['id', 'product_id', 'reserved_quantity', 'quantity', 'location_id']
    },

    'stock.picking.type': {
      'tree': ['id', 'name', 'color', 'warehouse_id', 'code'],
      'form': ['id', 'name', 'color', 'warehouse_id', 'code', 'count_picking_ready', 'count_picking_waiting', 'count_picking_late', 'group_code',
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
  get_picking_list(view_domain=null, type_id=null, offset=0, limit=0, search=null) {
    let self = this
    let domain = [];
    if (view_domain){
      view_domain.forEach(lit_domain => {
        domain.push(lit_domain);
      });
    }

    if (type_id) {
      domain.push(['picking_type_id', '=', Number(type_id)]);
    }
    
    if(search) {
      domain.push(['name', 'ilike', '%'+search+'%']);
    }
    let values = {
      'domain': domain,
      'model': 'stock.picking',
      'offset': offset,
      'limit': limit
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  get_picking_info(picking_id) {
    let self = this
    let domain = [['id', '=', picking_id]];

    let values = {
      'domain': domain,
      'model': 'stock.picking',
      'offset': 0,
      'limit': 0,
      'fields': ['id', 'display_name', 'location_id', 'location_dest_id', 'scheduled_date', 'state', 'group_code',
      'picking_type_id', 'priority', 'note', 'move_lines', 'move_line_ids', 'quantity_done', 'picking_fields',
      'reserved_availability', 'product_uom_qty', 'show_check_availability', 'move_fields', 'move_line_fields', 
      'show_validate']
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  get_picking_types(picking_codes, offset=0, limit=0, search=null) {
    let self = this
    let domain = [];
    domain = [['code', 'in', picking_codes], ['active', '=', true], ['app_integrated','=', true]];
    
    if(search) {
      domain.push(['name', 'ilike', '%'+search+'%']);
    }
    let values = {
      'domain': domain,
      'model': 'stock.picking.type',
      'offset': offset,
      'limit': limit,
      'fields': ['id', 'name', 'color', 'warehouse_id', 'code', 'count_picking_ready', 'count_picking_waiting', 'count_picking_late', 'group_code',
      'count_picking_backorders', 'rate_picking_late', 'rate_picking_backorders']
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
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

  // Move

  get_move_info(move_id, index=0) {
    let self = this;
    let values = {'id': move_id, 'index': index};
    let model = 'stock.move';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'get_move_info_apk', values).then((data) => {
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  set_lot_ids_apk(move_id, reading) {
    let self = this;
    let values = {'id': move_id, 'reading': reading};
    let model = 'stock.move';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'set_lot_ids_apk', values).then((data) => {
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  set_move_qty_done_from_apk(move_id, qty_done) {
    let self = this 
    let values = {
      'id': move_id,
      'quantity_done': qty_done
    }

    let model = 'stock.move';
    console.log(values);
     
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'set_qty_done_from_apk', values).then((done) => {
       resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar")
    });
    })
    
    return promise
  }

  // Move_lines
  
  find_move_line_id(code, picking_id){
    let self = this;
    let values = {'code': code, 'picking_id': picking_id};
    let model = 'stock.move.line';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'find_move_line_id', values).then((data) => {
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }
  get_move_line_info(move_id, index=0) {
    let self = this;
    let values = {'id': move_id, 'index': index};
    let model = 'stock.move.line';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'get_move_line_info_apk', values).then((data) => {
          resolve(data)
      })
      .catch((err) => {
        reject(err)
    });
    })
    return promise
  }

  get_move_lines_list_search(line_ids) {
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

  get_move_lines_list(picking_id) {
    let self = this
    let domain = [['picking_id', '=', parseInt(picking_id)]];

    let values = {
      'domain': domain,
      'model': 'stock.move',
      'offset': 0,
      'limit': 0
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  get_move_lines_details_list(picking_id) {
    let self = this
    let domain = [['picking_id', '=', parseInt(picking_id)]];

    let values = {
      'domain': domain,
      'model': 'stock.move.line',
      'offset': 0,
      'limit': 0
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
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

  set_qty_done_from_apk(move_id, qty_done) {
    let self = this 
    let values = {
      'id': move_id,
      'qty_done': qty_done
    }

    let model = 'stock.move.line';
    console.log(values);
     
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'set_qty_done_from_apk', values).then((done) => {
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

  force_set_qty_done(move_id, field, model='stock.move.line') {
    let self = this 
    let values = {
      'id': move_id,
      'field': field
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

  force_set_qty_done_by_product_code_apk(product_code, field, model='stock.move.line', picking) {
    let self = this 
    let values = {
      'default_code': product_code,
      'field': field,
      'picking': picking
    }
    
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_qty_done_by_product_code_apk', values).then((done) => {
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

  get_product_list(offset=0, limit=0, search=null) {
    let self = this
    let domain = [];

    if(search) {
      domain.push('|',['name', 'ilike', '%'+search+'%'], ['default_code', 'ilike', '%'+search+'%']);
    }

    let values = {
      'domain': domain,
      'model': 'product.product',
      'offset': offset,
      'limit': limit
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  get_product_info(product_id) {
    let self = this
    let domain = [['id', '=', product_id]];

    let values = {
      'domain': domain,
      'model': 'product.product',
      'offset': 0,
      'limit': 0,
      'fields': ['id', 'name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'virtual_available', 'categ_id', 'tracking', 
      'barcode', 'description_short', 'image_medium', 'stock_quant_ids']
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  get_location_products(location, offset=0, limit=0, search) {
    let self = this
    let domain = [];

    if (location) {
      domain.push(['product_tmpl_id.location_id', 'child_of', Number(location)]);
    }
    
    if(search) {
      domain.push(['default_code', 'ilike', search]);
    }

    let values = {
      'domain': domain,
      'model': 'product.product',
      'offset': offset,
      'limit': limit,
      'fields': ['id', 'display_name', 'default_code', 'qty_available', 'tracking', 'barcode', 'uom_id']
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }
  
  // Location

  get_location_list(location_state, offset=0, limit=0, search=null) {
    let self = this
    let domain = [];

    if (location_state != 'all') {
      domain = [['usage', '=', location_state]];
    }
    
    if(search) {
      domain.push(['name', 'ilike', search]);
    }

    let values = {
      'domain': domain,
      'model': 'stock.location',
      'offset': offset,
      'limit': limit
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  get_location_info(location_id) {
    let self = this
    let domain = [['id', '=', location_id]];

    let values = {
      'domain': domain,
      'model': 'stock.location',
      'offset': 0,
      'limit': 0,
      'fields': ['id', 'display_name', 'usage', 'company_id']
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  // Quants

  get_location_quants(location, offset=0, limit=0, search, ftype=null) {
    let self = this
    let domain = [];

    if (location) {
      domain.push(['location_id', 'child_of', Number(location)]);
    }
    
    if(search) {
      domain.push(['product_id.default_code', 'ilike', search]);
    }

    let values = {
      'domain': domain,
      'model': 'stock.quant',
      'offset': offset,
      'limit': limit
    }
    if(ftype != null){
      values['fields'] = ['id', 'product_id', 'reserved_quantity', 'quantity', 'location_id'];
    }
    console.log(values);
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
       resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false)
        console.log("Error al realizar la consulta:"+ err['msg']['error_msg']);
    });
    })
    
    return promise
  }

  // Move location

  create_new_move_location(location_barcode) {
    let self = this
    let model
    
    let values = {
      'location_barcode': location_barcode
    }
     
    model = 'wiz.stock.move.location';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'create_wiz_from_apk', values).then((done) => {
        if(done['err'] == true) {
          reject(done['error']);
        }
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar:" + err)
    });
    })
    
    return promise
  }

  create_new_move_location_line(location_move_id, location_id, location_dest_id, product_barcode) {
    let self = this
    let model
    
    let values = {
      'origin_location_id': location_id,
      'product_barcode': product_barcode,
      'move_location_wizard_id': location_move_id,
      'destination_location_id': location_dest_id
    }
     
    model = 'wiz.stock.move.location.line';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'create_wiz_line_from_apk', values).then((done) => {
        if(done['err'] == true) {
          reject(done['error']);
        }
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar:" + err)
    });
    })
    
    return promise
  }

  change_qty(line_id, qty) {
    let self = this
    let model
    
    let values = {
      'id': line_id,
      'move_quantity': qty
    }
     
    model = 'wiz.stock.move.location.line';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'edit_wiz_line_qty_from_apk', values).then((done) => {
        if(done['err'] == true) {
          reject(done['error']);
        }
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar:" + err)
    });
    })
    
    return promise
  }

  change_move_location(location_move_id, type, location_id) {
    let self = this
    let model
    let values

    if (type=="origin") {
      values = {
        'id': location_move_id,
        'origin_location_id': location_id
      }
    } else if (type=="destination") {
      values = {
        'id': location_move_id,
        'destination_location_id': location_id
      }
    }
     
    model = 'wiz.stock.move.location';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'edit_wiz_location_from_apk', values).then((done) => {
        if(done['err'] == true) {
          reject(done['error']);
        }
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar:" + err)
    });
    })
    
    return promise
  }

  set_multiple_move_location(location_move_id, type) {
    let self = this
    let model
    let values

    values = {
      'id': location_move_id,
      'action': type
    }

    model = 'wiz.stock.move.location';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'set_multiple_move_location', values).then((done) => {
        if(done['err'] == true) {
          reject(done['error']);
        }
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar:" + err)
    });
    })
    
    return promise
  }

  action_move_location(location_move_id) {
    let self = this
    let model
    let values

    values = {
      'id': location_move_id
    }

    model = 'wiz.stock.move.location';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'action_move_location_apk', values).then((done) => {
        if(done['err'] == true) {
          reject(done['error']);
        }
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar:" + err)
    });
    })
    
    return promise
  }

  // QR 

  process_qr_lines(qr_codes) {
    let self = this
    let model
    let values

    values = {
      'qr_codes': qr_codes
    }

    model = 'stock.picking';
    let promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'process_qr_lines', values).then((done) => {
        if(done['err'] == true) {
          reject(done['error']);
        }
        resolve(done)
      })
      .catch((err) => {
        reject(false)
        console.log("Error al validar:" + err)
    });
    })
    
    return promise
  }
  
}
