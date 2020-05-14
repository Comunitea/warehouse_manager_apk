import { Injectable, ɵSWITCH_COMPILE_DIRECTIVE__POST_R3__ } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { OdooService } from './odoo.service';
import { format } from 'url';


@Injectable({
  providedIn: 'root'
})
export class StockService {

  Domains: {};

  STOCK_FIELDS = {

    'stock.picking': {
      tree: ['id', 'name', 'location_id', 'location_dest_id', 'scheduled_date', 'state', 'picking_fields'],
      form: ['id', 'name', 'location_id', 'location_dest_id', 'scheduled_date', 'state', 'group_code',
      'picking_type_id', 'priority', 'note', 'move_lines', 'move_line_ids', 'quantity_done', 'picking_fields',
      'reserved_availability', 'product_uom_qty', 'show_check_availability',
      'show_validate']
    },

    'stock.move': {
      tree: ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done', 'tracking'],
      form: ['id', 'product_id', 'product_uom_qty', 'reserved_availability', 'quantity_done', 'state', 'tracking']
    },

    'stock.move.line': {
      tree: ['id', 'product_id', 'product_uom_qty', 'qty_available', 'qty_done', 'location_id', 'location_dest_id', 'lot_id',
      'package_id', 'result_package_id', 'tracking'],
      form: ['id', 'product_id', 'product_uom_qty', 'qty_available', 'qty_done', 'location_id', 'location_dest_id', 'lot_id',
      'package_id', 'result_package_id', 'state', 'picking_id', 'tracking']
    },

    'product.product': {
      tree: ['id', 'name', 'default_code', 'list_price', 'qty_available', 'virtual_available'],
      form: ['id', 'name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'virtual_available', 'categ_id', 'tracking',
      'barcode', 'description_short', 'image_medium'],
      'location-tree': ['id', 'name', 'default_code', 'list_price', 'last_purchase_price', 'qty_available', 'virtual_available', 'tracking',
      'barcode', 'uom_id']
    },

    'stock.location': {
      tree: ['id', 'display_name', 'usage', 'company_id'],
      form: ['id', 'display_name', 'usage', 'company_id', 'picking_type_id']
    },

    'stock.quant': {
      tree: ['id', 'product_id', 'reserved_quantity', 'quantity'],
      form: ['id', 'product_id', 'reserved_quantity', 'quantity', 'location_id']
    },

    'stock.picking.type': {
      tree: ['id', 'name', 'color', 'warehouse_id', 'code'],
      form: ['id', 'name', 'color', 'warehouse_id', 'code', 'count_picking_ready',
      'count_picking_waiting', 'count_picking_late', 'group_code',
      'count_picking_backorders', 'rate_picking_late', 'rate_picking_backorders']
    }

  };

  BINARYPOSITION = {product_id: 0, location_id: 1, lot_id: 2, package_id: 3, location_dest_id: 4, result_package_id: 5, qty_done: 6};
  FLAG_PROP =  {view: 1, req: 2, done: 4};

  status: Array<{'model': BigInteger, 'ids': Array<BigInteger>, 'domain': []; filter: 'filter', limit: BigInteger, offset: BigInteger}>;
  ModelInfo: {};

  constructor(
    public odooCon: OdooService,
    public alertCtrl: AlertController,
    public storage: Storage
  ) {
    this.Domains = {};
    this.SetDomainsStates();
    
  }

  GetModelInfo(model, key){
    if ((Object.keys(this.ModelInfo).indexOf(model) !== -1) && (Object.keys(this.ModelInfo[model]).indexOf(key) !== -1))  {
      return this.ModelInfo[model][key];
    }
    return false;
  }
  SetModelInfo(model, key, value){
    if (Object.keys(this.ModelInfo).indexOf(model) === -1) { this.ModelInfo[model] = {}; }
    if (Object.keys(this.ModelInfo[model]).indexOf(key) === -1) {this.ModelInfo[model][key] = value; }
    else {this.ModelInfo[model][key] = value; }
  }

  Mapped(Object: Array<{}>, Element: {}){
    let push = true;
    for (const Obj of Object){
      if (Element['value'] === Obj['value']) {
        push = false;
        break;
      }
    }
    if (push){Object.push(Element); }
    return Object;
  }
  InitVars(){
    this.ModelInfo = {};
    for (const model of ['stock.picking.type', 'stock.location', 'stock.move', 'stock.picking']){
      this.SetModelInfo(model, 'name', model);
    }
  }
  read_status(StatusField, campo, propiedad) {
    const field = parseInt(StatusField.charAt(this.BINARYPOSITION[campo]));
    return (field & this.FLAG_PROP[propiedad]) === this.FLAG_PROP[propiedad];
  }

  write_status(status_field, campo, propiedad, value = true) {
    const ActVal = this.read_status(status_field, campo, propiedad);
    let field = parseInt(status_field.charAt(this.BINARYPOSITION[campo]));
    if (ActVal && !value ) {
      field -= this.FLAG_PROP[propiedad];
      return status_field.slice(0, this.BINARYPOSITION[campo]) + field + status_field.slice(this.BINARYPOSITION[campo] + 1);
    }
    if (!ActVal && value) {
      field += this.FLAG_PROP[propiedad];
      return status_field.slice(0, this.BINARYPOSITION[campo]) + field + status_field.slice(this.BINARYPOSITION[campo] + 1);
    }
    return status_field;
  }
  
   // PickinDomain
   GetDomains(key) {
    return this.Domains[key];
  }
  SetDomains(key, data) {
    this.Domains[key] = data;
    console.log ('Escribiendo el dominio: ' + key + ' -> ' + data + ' <-');
  }
  SetDomainsStates() {
    const options = {day: 'numeric', month: 'numeric', year: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h24'};
    this.Domains['state'] = ['state', 'in', ['assigned', 'partially_available', 'confirmed']];
    this.Domains['state_ready'] = [['state', '=', 'assigned']];
    this.Domains['state_waiting'] = [['state', 'in', ['waiting', 'confirmed']]];
    this.Domains['state_late'] = [
      ['state', 'in', ['assigned', 'waiting', 'confirmed']],
      ['scheduled_date', '<', new Date().toLocaleString('es-ES', options)]
    ];
    this.Domains['state_backorders'] = [['state', 'in', ['waiting', 'confirmed', 'assigned']], ['backorder_id', '!=', false]];
  }

  get_obj_by_scanreader(model_to_search, search_str, search_in_data, domain) {
    const values = {model: model_to_search, search_str, ids: search_in_data, domain};
    const promise = new Promise( (resolve, reject) => {
    this.odooCon.execute('info.apk', 'find_apk_object', values).then((done) => {
       console.log(done);
       resolve(done);
      })
      .catch((err) => {
         reject(false);
         console.log('Error al realizar la consulta:' + err.msg.error_msg);
      });
    });
    return promise;

  }

  getStateIcon(model) {
    if (model === 'stock.model') {
      return {
        confirmed: 'battery-dead-outline',
        waiting: 'battery-charging-outline',
        partially_available: 'battery-half-outline',
        assigned: 'battery-full-outline'
      };
    }
    return {
      confirmed: 'battery-dead-outline',
      waiting: 'battery-charging-outline',
      partially_available: 'battery-half-outline',
      assigned: 'battery-full-outline'
      };
  }

  getTrackingIcon(model) {
    const TrackingIcon = {
      none: 'phone-portrait-outline',
      serial: 'barcode-outline',
      lot: 'pricetag-outline',
      };
    return TrackingIcon;
  }
  GetStates(Model, Field, Type= 'Selection'){
    const self = this;
    const values = {  model: Model, field: Field, type: Type};

    self.odooCon.execute('info.apk', 'get_field_group', values).then((data) => {
        this.SetModelInfo(Model, 'filter_' + Field, data);
      })
      .catch((err) => {
        console.log('Error al calcular los campos de un modelo: ' + err.msg.error_msg);
    });


  }


  RemoveMoveLineId(MoveId, SmlIds){
    const self = this;
    const values = {  move_id: MoveId,
                      sml_ids: SmlIds};
    const promise = new Promise( (resolve, reject) => {
    self.odooCon.execute('stock.move.line', 'remove_line_id', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al elliminar la linea ubicación a los movimientos pendientes: ' + err.msg.error_msg);
    });
    });
    return promise;
  }

  AssignLocationToMoves(MoveId, SmlIds, FieldId, ActiveLocationId, Barcode, Confirm) {
    const self = this;
    const values = {  move_id: MoveId,
                      sml_ids: SmlIds,
                      field: FieldId,
                      active_location_id: ActiveLocationId,
                      barcode: Barcode,
                      confirm: Confirm,
                      };
    const promise = new Promise( (resolve, reject) => {
    self.odooCon.execute('stock.move.line', 'assign_location_to_moves', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al asignar ubicación a los movimientos pendientes: ' + err.msg.error_msg);
    });
    });
    return promise;
  }
  AssignLocationId(MoveId, LocationId, LocationField) {
    const self = this;
    const values = {id: MoveId, location_field: LocationField, location_id: LocationId};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.move', 'assign_location_id', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al quitar la reserva del movimiento: ' + err.msg.error_msg);
    });
    });
    return promise;
  }
  CleanLots(MoveId){
    const self = this;
    const values = {id: MoveId, model: 'stock.move'};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.move', 'clean_lots', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al quitar la reserva del movimiento: ' + err.msg.error_msg);
    });
    });
    return promise;
  }

  ActionAssign(MoveId) {
    const self = this;
    const values = {id: MoveId, model: 'stock.move'};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.move', 'move_assign_apk', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al quitar la reserva del movimiento: ' + err.msg.error_msg);
    });
    });
    return promise;
  }
  MoveUnReserve(MoveId) {
    const self = this;
    const values = {id: MoveId, model: 'stock.move'};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.move', 'move_unreserve_apk', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al quitar la reserva del movimiento: ' + err.msg.error_msg);
    });
    });
    return promise;
  }

  get_apk_object(values) {
    const self = this;
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al realizar la consulta: ' + err.msg.error_msg);
    });
    });
    return promise;
  }

  GetPicking(domain = [], id= null, view= 'tree', offset= 0, limit= 0, search= null) {
    const values = {
      domain,
      id,
      model: 'stock.picking',
      offset,
      limit,
      search
    };
    return this.get_apk_object(values);
  }
  // Pickings
  get_picking_list_no_usar(view_domain= null, type_id= null, offset= 0, limit= 0, search= null) {
    const self = this;
    const domain = [];
    if (view_domain) {
      view_domain.forEach(lit_domain => {
        domain.push(lit_domain);
      });
    }
    if (type_id) {
      domain.push(['picking_type_id', '=', Number(type_id)]);
    }
    if (search) {
      domain.push(['name', 'ilike', '%' + search + '%']);
    }
    const values = {
        domain,
        model: 'stock.picking',
        offset,
        limit };
    return this.get_apk_object(values);
 }

  get_picking_info(picking_id, view= 'tree', offset= 0, limit= 0, search= null) {
    const values = {
      fields_type: view,
      domain: [['id', '=', picking_id]],
      model: 'stock.picking',
      offset: 0,
      limit: 1
    };
    return this.get_apk_object(values);
  }

  GetPickingTypesMenu(){
    const self = this;
    const Domain = [['app_integrated', '=', true]];
    const values = {domain: Domain, model: 'stock.picking.type'};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
    });
    });
    return promise;
  }
  GetPickingTypes(Code = null, Search= null, Offset= 0, Limit= 0) {
    const self = this;
    let Domain = [];
    if (Search) {
      Domain = ['|'];
      Domain.push(['barcode', 'ilike', '%' + Search + '%']);
      Domain.push(['name', 'ilike', '%' + Search + '%']); }

    else {if (Code){
            if (Code == 'all'){Domain = []; }
            else{
            Domain = [['barcode', '=', Code]];}
            }
          }
    Domain.push(['app_integrated', '=', true]) ;
    const values = {domain: Domain,
                    model: 'stock.picking.type',
                    view: 'tree',
                    limit: Limit,
                    offset: Offset};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        resolve(done);
      })
      .catch((err) =>  {
        reject(false);
    });
    });
    return promise;
  }

  GetNextPrev(model, id){
    // Saca el prev y el next de una lista
    let ActiveIds = [];
    ActiveIds = this.GetModelInfo(model, 'ActiveIds');
    if (ActiveIds){
      const max = ActiveIds.length;
      if (max === 1) {
        return [id, id];
      }
      const pos = ActiveIds.indexOf(id);
      if (pos === 0){
        return [ActiveIds[max - 1], ActiveIds[pos + 1]];
      }
      if (pos === (max - 1)) {
        return [ActiveIds[pos - 1], ActiveIds[0]];
      }
      return [ActiveIds[pos - 1], ActiveIds[pos + 1]];

    }

  }
  GetPickingList(Search= null, Offset= 0, Limit= 0, State = null){
    const self = this;

    if (State && State['value'] === 'all'){State = null; }
    const TypeId = this.GetModelInfo('stock.picking.type', 'PickingTypeId');
    const DomainName = this.GetModelInfo ('stock.picking.type', 'DomainName');
    const ActiveIds = this.GetModelInfo('stock.picking', 'ActiveIds') || [];
    const values = {picking_type_id: TypeId,
                    domain_name: DomainName,
                    active_ids: ActiveIds,
                    state: State,
                    search: Search,
                    limit: Limit,
                    offset: Offset};
    const promise = new Promise( (resolve, reject) => {
    self.odooCon.execute('stock.picking', 'get_picking_list', values).then((done: Array <{}>) => {
        const ActiveIds = [];
        for (const pick of done) {
          ActiveIds.push(pick['id']);
        }
        this.SetModelInfo('stock.picking', 'ActiveIds', ActiveIds);
        resolve(done);

      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });
    return promise;
  }
  action_assign(pick_id) {
    const self = this;
    let model;
    const values = {
      id: pick_id
    };

    model = 'stock.picking';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'action_assign_pick', values).then((done) => {
       resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });

    return promise;
  }

  button_validate(pick_id) {
    const self = this;
    let model;
    const values = {
      id: pick_id
    };

    model = 'stock.picking';
    const promise = new Promise( (resolve, reject) => {
      console.log('button validate pick');
      console.log(pick_id);
      self.odooCon.execute(model, 'button_validate_pick', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(err.msg.error_msg);
        console.log('Error al validar');
    });
    });
    return promise;
  }



  GetPickingInfo(PickId, index= 0) {
    const self = this;
    const values = {id: PickId, index, model: 'stock.picking', view: 'form'};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }

  GetMoveInfo(MoveId, index= 0) {
    const self = this;
    const values = {id: MoveId, index, model: 'stock.move', view: 'form'};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }
  DoMoveValidate(PickId, SmId){
    const self = this;
    const values = {id: PickId, move_id: SmId};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.picking', 'action_done_apk', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }
  ChangeLineLocationId(MoveId, MoveLineId, FieldLocation, OldLocationId, NewLocationBarcode){
    const self = this;
    const values = { move_id: MoveId,
                     sml_ids: MoveLineId,
                     field_location: FieldLocation,
                     old_loc_id: OldLocationId,
                     new_loc_id: NewLocationBarcode};
    const model = 'stock.move.line';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'update_move_location', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }

  ChangeLineLotId(MoveId, MoveLineId, OldLotName, NewLotId){
    const self = this;
    const values = {move_id: MoveId, sml_ids: MoveLineId, new_lot_id: NewLotId, old_lot_name: OldLotName};
    const model = 'stock.move.line';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'change_line_lot_id', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }

  CreateMoveLots(MoveId, LotNames, ActiveLocationId) {
    const self = this;
    const values = {id: MoveId, lot_names: LotNames, active_location: ActiveLocationId};
    const model = 'stock.move';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'create_move_lots', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }

  CreateNewSmlId(MoveId) {
    const self = this;
    const values = {id: MoveId};
    const model = 'stock.move';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'create_new_sml_id', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }


  UpdateSmlIdField(MoveId, SmlId, DictValues){
      const self = this;
      const values = {
      move_id: MoveId,
      sml_id: SmlId,
      values: DictValues
      };
      const promise = new Promise( (resolve, reject) => {
        self.odooCon.execute('stock.move.line', 'update_sml_field', values).then((done) => {
         resolve(done);
        })
        .catch((err) => {
          reject(false);
          console.log('Error al validar');
      });
      });
  
      return promise;
  }

  set_move_qty_done_from_apk(move_id, qty_done) {
    const self = this;
    const values = {
      id: move_id,
      quantity_done: qty_done
    };

    const model = 'stock.move';
    console.log(values);

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'set_qty_done_from_apk', values).then((done) => {
       resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });

    return promise;
  }

  // Move_lines

  find_move_line_id(code, picking_id) {
    const self = this;
    const values = {code, picking_id};
    const model = 'stock.move.line';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'find_move_line_id', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }
  get_move_line_info(move_id, index= 0) {
    const self = this;
    const values = {id: move_id, index};
    const model = 'stock.move.line';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'get_move_line_info_apk', values).then((data) => {
          resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }

  get_move_lines_list_search(line_ids) {
    const self = this;
    const domain = [['id', 'in', line_ids]];

    const model = 'stock.move';
    const fields = this.STOCK_FIELDS[model].tree;
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.search_read(model, domain, fields, 0, 0).then((data: any) => {
        for (const sm_id of data) {sm_id.model = model; }
        resolve(data);
      })
      .catch((err) => {
        reject(err);
    });
    });
    return promise;
  }

  get_move_lines_list(picking_id) {
    const self = this;
    const domain = [['picking_id', '=', parseInt(picking_id)]];

    const values = {
      domain,
      model: 'stock.move',
      offset: 0,
      limit: 0
    };
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  get_move_lines_details_list(picking_id) {
    const self = this;
    const domain = [['picking_id', '=', parseInt(picking_id)]];

    const values = {
      domain,
      model: 'stock.move.line',
      offset: 0,
      limit: 0
    };
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  force_set_assigned_qty_done(move_id, model= 'stock.move') {
    const self = this;
    const values = {
      id: move_id
    };

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_qty_done_apk', values).then((done) => {
       resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });

    return promise;
  }

  set_qty_done_from_apk(move_id, qty_done) {
    const self = this;
    const values = {
      id: move_id,
      qty_done
    };

    const model = 'stock.move.line';
    console.log(values);

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'set_qty_done_from_apk', values).then((done) => {
       resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });

    return promise;
  }

  force_set_reserved_qty_done(move_id, model= 'stock.move') {
    const self = this;
    const values = {
      id: move_id
    };

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_reserved_qty_done_apk', values).then((done) => {
       resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });

    return promise;
  }

  force_set_qty_done(move_id, field, model= 'stock.move.line') {
    const self = this;
    const values = {
      id: move_id,
      field
    };

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_qty_done_apk', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });

    return promise;
  }

  force_set_qty_done_by_product_code_apk(product_code, field, model= 'stock.move.line', picking) {
    const self = this;
    const values = {
      default_code: product_code,
      field,
      picking
    };

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_set_qty_done_by_product_code_apk', values).then((done) => {
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });
    return promise;
  }

  force_reset_qties(pick_id, model= 'stock.picking') {
    const self = this;
    const values = {
      id: pick_id
    };

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'force_reset_qties_apk', values).then((done) => {
       resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar');
    });
    });

    return promise;
  }


  // Products

  get_product_list(offset= 0, limit= 0, search= null) {
    const self = this;
    const domain = [];

    if (search) {
      domain.push('|', ['name', 'ilike', '%' + search + '%'], ['default_code', 'ilike', '%' + search + '%']);
    }

    const values = {
      domain,
      model: 'product.product',
      offset,
      limit
    };
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  get_product_info(product_id) {
    const self = this;
    const domain = [['id', '=', product_id]];

    const values = {
      domain,
      model: 'product.product',
      offset: 0,
      limit: 0,
      fields: ['id', 'name', 'default_code', 'list_price', 'standard_price', 'qty_available', 'virtual_available', 'categ_id', 'tracking',
      'barcode', 'description_short', 'image_medium', 'stock_quant_ids']
    };
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  get_location_products(location, offset= 0, limit= 0, search) {
    const self = this;
    const domain = [];

    if (location) {
      domain.push(['product_tmpl_id.location_id', 'child_of', Number(location)]);
    }

    if (search) {
      domain.push(['default_code', 'ilike', search]);
    }

    const values = {
      domain,
      model: 'product.product',
      offset,
      limit,
      fields: ['id', 'display_name', 'default_code', 'qty_available', 'tracking', 'barcode', 'uom_id']
    };
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  // Location

  get_location_list(LocationState, offset= 0, limit= 0, search= null) {
    const self = this;
    let domain = [];

    if (LocationState !== 'all') {
      domain = [['usage', '=', LocationState]];
    }

    if (search) {
      domain.push(['name', 'ilike', search]);
    }

    const values = {
      domain,
      model: 'stock.location',
      offset,
      limit
    };
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  get_location_info(location_id) {
    const self = this;
    const domain = [['id', '=', location_id]];

    const values = {
      domain,
      model: 'stock.location',
      offset: 0,
      limit: 0,
      fields: ['id', 'display_name', 'usage', 'company_id']
    };
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  // Quants

  get_location_quants(location, offset= 0, limit= 0, search, ftype= null) {
    const self = this;
    const domain = [];

    if (location) {
      domain.push(['location_id', 'child_of', Number(location)]);
    }

    if (search) {
      domain.push(['product_id.default_code', 'ilike', search]);
    }

    const values = {
      domain,
      model: 'stock.quant',
      offset,
      limit
    };
    if (ftype != null) {
      values['fields'] = ['id', 'product_id', 'reserved_quantity', 'quantity', 'location_id'];
    }
    console.log(values);
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('info.apk', 'get_apk_object', values).then((done) => {
        console.log(done);
        resolve(done);
      })
      .catch((err) => {
        console.log(err);
        reject(false);
        console.log('Error al realizar la consulta:' + err.msg.error_msg);
    });
    });

    return promise;
  }

  // Move location

  create_new_move_location(location_barcode) {
    const self = this;
    let model;
    const values = {
      location_barcode
    };

    model = 'wiz.stock.move.location';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'create_wiz_from_apk', values).then((done) => {
        // tslint:disable-next-line:no-string-literal
        if (done['error'] === true) {
          reject(done['error']);
        }
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar:' + err);
    });
    });

    return promise;
  }

  create_new_move_location_line(location_move_id, location_id, location_dest_id, product_barcode) {
    const self = this;
    let model;

    const values = {
      origin_location_id: location_id,
      product_barcode,
      move_location_wizard_id: location_move_id,
      destination_location_id: location_dest_id
    };

    model = 'wiz.stock.move.location.line';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'create_wiz_line_from_apk', values).then((done) => {
        if (done['error'] === true) {
          reject(done['error']);
        }
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar:' + err);
    });
    });

    return promise;
  }

  change_qty(line_id, qty) {
    const self = this;
    let model;

    const values = {
      id: line_id,
      move_quantity: qty
    };

    model = 'wiz.stock.move.location.line';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'edit_wiz_line_qty_from_apk', values).then((done) => {
        if (done['error'] === true) {
          reject(done['error']);
        }
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar:' + err);
    });
    });

    return promise;
  }

  change_move_location(location_move_id, type, location_id) {
    const self = this;
    let model;
    let values;

    if (type === 'origin') {
      values = {
        id: location_move_id,
        origin_location_id: location_id
      };
    } else if (type === 'destination') {
      values = {
        id: location_move_id,
        destination_location_id: location_id
      };
    }

    model = 'wiz.stock.move.location';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'edit_wiz_location_from_apk', values).then((done) => {
        if (done['error'] === true) {
          reject(done['error']);
        }
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar:' + err);
    });
    });

    return promise;
  }

  set_multiple_move_location(LocationMoveId, type) {
    const self = this;
    let model;
    let values;

    values = {
      id: LocationMoveId,
      action: type
    };

    model = 'wiz.stock.move.location';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'set_multiple_move_location', values).then((done) => {
        if (done['error'] === true) {
          reject(done['error']);
        }
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar:' + err);
    });
    });

    return promise;
  }

  action_move_location(LocationMoveId) {
    const self = this;
    let model;
    let values;

    values = {
      id: LocationMoveId
    };

    model = 'wiz.stock.move.location';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'action_move_location_apk', values).then((done) => {
        if (done['error'] === true) {
          reject(done['error']);
        }
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar:' + err);
    });
    });

    return promise;
  }

  // QR

  process_qr_lines(qr_codes) {
    const self = this;
    let model;
    let values;

    values = {
      qr_codes
    };

    model = 'stock.picking';
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(model, 'process_qr_lines', values).then((done) => {
        if (done['error'] === true) {
          reject(done['error']);
        }
        resolve(done);
      })
      .catch((err) => {
        reject(false);
        console.log('Error al validar:' + err);
    });
    });

    return promise;
  }

}
