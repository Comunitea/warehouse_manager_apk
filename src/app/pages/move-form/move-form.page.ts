import { Component, OnInit, Input, ViewChild, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AlertController, ActionSheetController, IonInfiniteScroll } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { Location } from '@angular/common';
import { LoadingController } from '@ionic/angular';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';
import { identifierModuleUrl } from '@angular/compiler';
// import { setMaxListeners } from 'cluster';
import { ScannerService } from '../../services/scanner.service';
import { appendFile } from 'fs';


@Component({
  selector: 'app-move-form',
  templateUrl: './move-form.page.html',
  styleUrls: ['./move-form.page.scss'],
})



export class MoveFormPage implements OnInit {

  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;
  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;


  @Input() scanner_reading: string;



  moves: any;
  data: {};
  placeholder: string;
  move: BigInteger;
  qty_done: BigInteger;
  loading: any;
  new_lots: any;
  LastReading: string;
  StateIcon: {};
  TrackingIcon: {};
  WaitingLot: boolean;
  AdvanceOptions: boolean;
  LotNames: any;
  ChangeLotNames: boolean;
  ShowLots: boolean;
  ShowMoves: boolean;
  WaitingQty: boolean;
  ActiveLine: any;
  FirstLoad: boolean;
  DirtyLines: boolean;
  QtyDirty: boolean;
  offset: number;
  limit: number;
  limit_reached: boolean;
  LoadingPrevMoves: boolean;
  loading: boolean;
  SmlIndex: 0;
  NeedScroll: boolean;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ( this.stock.GetModelInfo('App', 'ActivePage') === 'MoveFormPage') {
    this.scanner.key_press(event);
    this.scanner.timeout.then((val) => {
      this.onReadingEmitted(val);
    });
  }
  }

  constructor(
    private scanner: ScannerService,
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private audio: AudioService,
    public stock: StockService,
    private storage: Storage,
    private location: Location,
    public loadingController: LoadingController,
    public actionSheetController: ActionSheetController
  ) {
    this.moves = ['up', 'down', 'left', 'right'];
  }

  CreateButtons() {
    const Id = this.data['id'];
    const State = this.data['state'].value;
    const Tracking = this.data['tracking'].value;

    // tslint:disable-next-line:prefer-const
    let buttons = [{
      text: '',
      icon: 'close',
      role: 'Cancelar',
      handler: () => {
        console.log('Cancel clicked');
      }
    }];

    const advise = {
      text: 'Vistas: ' + this.ShowMoves + '-' + this.ShowLots,
      icon: '',
      role: '',
      handler: () => {
      }
    };
    buttons.push(advise);

    if (this.data) {
      if (['partially_available', 'confirmed'].indexOf(State) !== -1) {
        const button = {
          text: 'Reservar',
          icon: '',
          role: '',
          handler: () => {
            this.ActionAssign(Id);
          }
        };
        buttons.push(button);
      }
      if (['partially_available', 'assigned', 'confirmed'].indexOf(State) !== -1) {
        const button = {
          text: 'Quitar reserva',
          icon: '',
          role: '',
          handler: () => {
            this.ActionUnReserve(Id);
          }
        };
        buttons.push(button);
      }

      if (this.LotNames && 'done' !== State && Tracking !== 'none'){
        const button = {
          text: 'Borrar lotes',
          icon: '',
          role: '',
          handler: () => {
            this.CleanLots(Id);
          }
        };
        buttons.push(button);
      }
      if (this.LotNames && 'done' !== State && Tracking !== 'none'){
        const button = {
            text: 'Nuevo',
            icon: '',
            role: '',
            handler: () => {
              this.CreateNewSmlId(Id);
            }
          };
        buttons.push(button);
      }
      // buttons.push(button);
      // buttons.push(buttonReset);

    }

    return buttons;
  }
  async PresentMenuOptions() {
    this.audio.play('click');
    const actionSheet = await this.actionSheetController.create({
      buttons: this.CreateButtons()
    });

    await actionSheet.present();
  }
  ionViewDidEnter(){
    this.offset = 0;
    this.limit = 25;
    this.limit_reached = false;
    this.loading=false;
    this.stock.SetModelInfo('App', 'ActivePage', 'MoveFormPage');
    this.InitVars();
    const move = this.route.snapshot.paramMap.get('id');
    this.GetMoveInfo(move);
  }

  ngOnInit() {

    this.odoo.isLoggedIn().then((data) => {
      if (data === false) {
        this.router.navigateByUrl('/login');
      } else {
        this.storage.get('CONEXION').then((con) => {
          this.placeholder = con.url + '/web/static/src/img/placeholder.png';
        })
        .catch((error) => {
          this.presentAlert('Error al comprobar tu sesión:', error);
        });
      }
    })
    .catch((error) => {
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }
  InitVars() {
    this.StateIcon = this.stock.getStateIcon('stock.move');
    this.FirstLoad = true;
    this.QtyDirty = false;
    this.InitData();
  }
  InitData() {
    this.ChangeLotNames = false;
    this.LotNames = [];
  }
  read_status(field, campo, propiedad) {
    return this.stock.read_status(field, campo, propiedad);
  }

  AlternateShowLots() {
    this.audio.play('click');
    this.ShowLots = !this.ShowLots;
    this.ShowMoves = !this.ShowLots;
  }

  AlternateAdvanceOptions() {
    this.audio.play('click');
    this.AdvanceOptions = !this.AdvanceOptions;
  }
  go_back() {
    this.audio.play('click');
    this.location.back();
  }

  GetMovesDone(moves, value= true) {
    return moves.filter(move => this.stock.read_status(move['field_status_apk'], 'qty_done', 'done') === value);
  }

  onReadingEmitted(val: string) {
    if (this.moves.includes(val)) {
      this.page_controller(val);
    } else {
      this.scanner_reading = val;
      this.process_reading();
    }
  }

  // Navigation

  page_controller(direction) {
    if (direction === 'up') {
      console.log('up');
      this.router.navigateByUrl('/stock-picking/' + this.data['picking_id']['id'] + '/' + this.data['picking_id']['code']) ;
    } else if (direction === 'down') {
      console.log('down');
      if (this.data['ready_to_validate']){
        this.ButtonValidate(this.data['picking_id']['id']);
      } else {
        // this.action_confirm();
      }
    } else if (direction === 'left') {
      console.log('left');
      this.GetMoveInfo(this.data['id'], -1);
    } else if (direction === 'right') {
      console.log('right');
      this.GetMoveInfo(this.data['id'], +1);
    }
  }

  async presentAlert(titulo, texto) {
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok'],

    });
    await alert.present();
  }
  // SCROLL CONTROL

  EventLoadMoveLines(event, dir) {
    setTimeout(() => {
      console.log('Loading more locations');
      event.target.complete();
      // this.offset += 25;
      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      this.LoadMoveLines(dir);
        // event.target.disabled = true;
    }, 500);
  }
  onPageScroll(event) {
    console.log(event.target.scrollTop);
  }

  onScroll(event) {
    return;
    if (event.detail.currentY < 1){
      this.LoadingPrevMoves = true;
      // event.target.complete();
      this.offset = Math.max(0, this.offset - this.data['move_line_ids'].length - 25);
      this.LoadMoveLines(1);
    }
  }
  LoadMoveLines(Dir){
    if (Dir === 1 && this.limit_reached) {return; }
    if (Dir === -1){
      if (this.offset <= 25) {return; }
      this.offset = Math.max(0, this.offset - this.data['move_line_ids'].length - 25);
    }
    this.loading = true;
    // this.offset = Math.max(0, this.offset - this.data['move_line_ids'].length - 25);

    const SmlDomain = [['move_id', '=', this.data['id']]];
    const values = {model: 'stock.move.line', domain: SmlDomain, offset: this.offset, limit: this.limit};
    this.stock.get_apk_object(values).then((SmlIds: Array<{}>) => {
      this.limit_reached = SmlIds.length < this.limit;
      // this.data['move_line_ids'] = this.data['move_line_ids'].concat(SmlIds);
      this.data['move_line_ids'] = SmlIds;
      this.SmlIndex = this.offset; 
      this.offset += this.data['move_line_ids'].length;
      this.loading = false;
      // this.LoadingPrevMoves = false;
    })
    .catch((error) => {
      this.presentAlert(error.tittle, error.msg.error_msg);
    });
  }

  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }

  DeleteLotName(Index){
    this.LotNames.splice(Index, 1);
  }
  async InputQty(titulo, SmlId)
  {
    this.audio.play('click');
    if (this.data['state'].value === 'done') {return; }
    
    if (this.QtyDirty) {
      const values = {qty_done: SmlId['qty_done']};
      this.UpdateSmlIdField(SmlId['id'], values);
      this.QtyDirty = false;
      return;
    }
    const Qty = SmlId['qty_done'] || SmlId['product_uom_qty'];
    const alert = await this.alertCtrl.create({
      header: 'Cantidad',
      subHeader: '',
      inputs: [{name: 'qty_done',
               value: Qty,
               type: 'number',
               id: 'qty-id',
               placeholder: SmlId['qty_done']}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Aplicar',
          handler: (data) => {
            if (SmlId['qty_done'] !== data['qty_done']) {
              const values = {qty_done: data['qty_done']};
              this.UpdateSmlIdField(SmlId['id'], values);
            }
          }
        }],
  });
    await alert.present();
  }

  UpdateSmlIdField(SmlId, values){
    if (this.data['state'].value === 'done') {return; }
    this.stock.UpdateSmlIdField(this.data['id'], SmlId, values).then((data) => {
      if (data) {
        this.apply_move_data(data);
      }
      })
    .catch((error) => {
      this.presentAlert('Error al escribor en el movimiento:', error);
    });
  }

  ChangeQty(SmlId, qty) {
    this.audio.play('click');
    if (this.data['state'].value === 'done') {return; }
    this.QtyDirty = true;
    if (qty === 0) {
      if (SmlId['qty_done'] === 0){
        SmlId['qty_done'] = SmlId['product_uom_qty']; }
      else {SmlId['qty_done'] = 0; }
    }
    // tslint:disable-next-line:one-line
    else {
      if (!(SmlId['qty_done'] < 1 && qty === -1)) {
      SmlId['qty_done'] += qty; }
    }
    // actualizo en el servidor el movimiento yno me hace falta esperar ya que puede ser asycrono
    this.data['quantity_done'] += qty;
    this.stock.UpdateMoveLineQty(SmlId['id'], SmlId['qty_done'], false).then((res) => {}).catch((error) => {});

  }

  apply_move_data(data) {
    this.InitData();
    console.log(data);
    if (data['image'] === false) {
      data['base64'] = false;
      // data['image'] = this.placeholder;
    } else {
      data['base64'] = true;
    }
    this.data = data;

    console.log(this.data);
    for (const sml of data['move_line_ids']) {
      if (sml.lot_id.id) {
        this.LotNames.push(sml.lot_id.name);
      }
    }
    if (this.FirstLoad) {
      if (this.data['state'].value !== 'done') {
        this.ShowLots = this.data['tracking'].value === 'serial';
        this.ShowMoves = this.data['tracking'].value !== 'serial';
        this.FirstLoad = false; }
      else{
        this.ShowLots = false;
        this.ShowMoves = true;
        this.FirstLoad = false;
      }

    }
    this.offset = this.data['move_line_ids'].length;
    this.NeedScroll = this.offset >= 25;

    // this.audio.play('click');
    if (data['message']){this.presentAlert('Odoo', data['message']); }

  }
  GetMoveInfo(move, index = 0) {
    const self = this;
    this.stock.GetMoveInfo(move, index, this.limit, this.offset).then((data) => {
      self.apply_move_data(data);
      
    })
    .catch((error) => {
      this.presentAlert('Error al recuperar el movimiento:', error);
    });
  }

  DoMoveValidate(){
    if (this.data['state'].value === 'done') {return; }
    this.stock.DoMoveValidate(this.data['picking_id'].id, this.data['id'] ).then((data) => {
      if (data){this.apply_move_data(data); }
    })
    .catch((error) => {
      this.presentAlert('Error al validar el albarán:', error);
    });
  }

  /*
  action_confirm() {
    if (this.data['tracking'] === 'none') {
      this.stock.set_move_qty_done_from_apk(this.data['id'], this.data['quantity_done']).then((LinesData) => {
        console.log(LinesData);
        this.GetMoveInfo(this.data['id'], +1);
      })
      .catch((error) => {
        this.presentAlert('Error al validar el albarán:', error);
      });
    }
    // else if (this.data['tracking'] != 'none' && this.new_lots){
    // this.update_lots();
    // }
  }
  */
  ButtonValidate(PickingId) {
    this.audio.play('click');
    this.presentLoading();
    this.stock.ButtonValidate(Number(PickingId)).then((LinesData) => {
      if (LinesData && LinesData['err'] === false) {
        console.log('Reloading');
        this.loading.dismiss();
        this.location.back();
      } else if (LinesData['err'] !== false) {
        this.loading.dismiss();
        this.presentAlert('Error al validar el albarán:', LinesData['err']);
      }
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al validar el albarán:', error);
    });
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Validando...',
      translucent: true,
      cssClass: 'custom-class custom-loading'
    });
    await this.loading.present();
  }
  /*
  update_lots() {
    this.stock.CreateMoveLots(this.data['id'], this.new_lots, this.data['active_location_id'].id).then((data) => {
      this.GetMoveInfo(this.data['id']);
    })
    .catch((error) => {
      this.presentAlert('Error al validar el albarán:', error);
    });
  }

  done_status(field) {
    this.data['field_status_apk'] = this.stock.write_status(this.data['field_status_apk'], field, 'done');
  }
  */
  CreateNewSmlId(SmId){
    if (this.data['state'].value === 'done') {return; }
    this.stock.CreateNewSmlId(SmId).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data);
        if (data['warning']) {this.presentAlert('Odoo', data['warning']); }
      }
      })
    .catch((error) => {
      this.presentAlert('Error al borrar el movieminto:', error);
    });
  }

  RemoveMoveLineId(SmlId) {

    if (this.data['state'].value === 'done') {return; }
    this.stock.RemoveMoveLineId(this.data['id'], SmlId).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data);
        if (data['warning']) {this.presentAlert('Odoo', data['warning']); }
      }
      })
    .catch((error) => {
      this.presentAlert('Error al borrar el movieminto:', error);
    });
  }

  ProcessProductId() {
    if (this.data['state'].value === 'done') {return; }
    this.audio.play('click');
    const SmlId = this.data['move_line_ids'].filter(
      move => (this.data['active_location_id'].id === move[this.data['default_location'].value].id))[0];
    if (SmlId){
      // Si hay un sml_id
      // entonces
      // Escribo el producto y l aubicación con ok. y ademas le sumo una a la cantidad
      SmlId['field_status_apk'] = this.stock.write_status(SmlId['field_status_apk'], 'product_id', 'done');
      SmlId['field_status_apk'] = this.stock.write_status(SmlId['field_status_apk'], this.data['default_location'], 'done');
      this.ChangeQty(SmlId, 1);
    }
    this.reset_scanner() ;

  }
  GetMovesToChangeLoc(moves, confirm=false) {
    const loc = this.data['default_location'].value;
    // Si confirmar:
    // filtro los movimientos que ya tienen esa ubicación y no hechos
    if (confirm){
      return moves.filter(move => (this.stock.read_status(move['field_status_apk'], loc , 'done') === true) &&
      (this.stock.read_status(move['field_status_apk'], 'qty_done' , 'done') === false));
    }
    // Si no confirmo filtro los movimeintos:
    // que ya tienen ubicación y no están hechos
    // y los que no tengan ubicación
    return moves.filter(move =>
      (this.stock.read_status(move['field_status_apk'], loc , 'done') === false) ||
      (this.stock.read_status(move['field_status_apk'], loc , 'done') === true) &&
      (this.stock.read_status(move['field_status_apk'], 'qty_done' , 'done') === false));
  }

  ProcessLocation(barcode) {
    if (this.data['state'].value === 'done') {return; }
    const field = this.data['default_location'].value;
    // Miro si coincide con algún ubicación necesaria de los movimientos
    const confirm = this.LastReading === this.scanner_reading;
    const MovesToUpdate = this.GetMovesToChangeLoc(this.data['move_line_ids'], confirm);
    const SmlIds = [];
    for (const move of MovesToUpdate) {SmlIds.push(move['id']); }
    const values = {  move_id: this.data['id'],
                      field: this.data['default_location'].value,
                      value: this.data['active_location_id']['id'],
                      sml_ids: SmlIds};
    this.stock.AssignLocationToMoves(this.data['id'],
                                     SmlIds,
                                     this.data['default_location'].value,
                                     this.data['active_location_id']['id'],
                                     barcode,
                                     confirm)
      .then((data) => {
        if (data) {
          this.reset_scanner() ;
          this.apply_move_data(data);
          if (data['warning']) {this.presentAlert('Odoo', data['warning']); }
        }
        })
      .catch((error) => {
        this.presentAlert(error.tittle, error.msg.error_msg);
      });


  }
  AssignLocationId(MoveId, LocationId, LocationField) {
    if (this.data['state'].value === 'done') {return; }
    this.stock.AssignLocationId(MoveId, LocationId, LocationField).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
    })
    .catch((error) => {
      this.presentAlert('Error al asignar las ubicaciones de origen del movimiento:', error);
    });
  }

  ProcessLocationId(LocationId = '') {
    if (this.data['default_location'].value === 'location_id') {
      this.AssignLocationId(this.data['id'], this.data['default_location_id']['id'], 'location_id');
    }
  // Escribo en todos los que no tengan la ubicación como hecha la que pone, y además la marco como hecha
  }
  ProcessLocationDestId(LocationDestId = '') {
    if (this.data['default_location'].value === 'location_dest_id') {
      this.AssignLocationId(this.data['id'], this.data['active_location_id'].id, 'location_dest_id');
    // Escribo en todos los que no tengan la ubicación como hecha la que pone, y además la marco como hecha
    // this.data.field_status_apk = this.stock.write_status(this.data.field_status_apk, 'location_dest_id', 'done')
    }
  }

  ActionAssign(MoveId) {
    if (this.data['state'].value === 'done') {return; }
    this.audio.play('click');
    this.stock.ActionAssign(MoveId).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
    })
    .catch((error) => {
      this.presentAlert('Error al quitar la reserva del movimiento:', error);
    });
  }

  CleanLots(MoveId) {
    if (this.data['state'].value === 'done') {return; }
    this.audio.play('click');
    this.stock.CleanLots(MoveId).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
    })
    .catch((error) => {
      this.presentAlert('Error al quitar los lotes del movimiento:', error);
    });
  }

  ActionUnReserve(MoveId) {
    if (this.data['state'].value === 'done') {return; }
    this.audio.play('click');
    this.stock.MoveUnReserve(MoveId).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
    })
    .catch((error) => {
      this.presentAlert('Error al quitar la reserva del movimiento:', error);
    });
  }

  async ChangeLineLocationId(SmlId){
    if (this.data['state'].value === 'done') {return; }
    if (this.data['state'].value === 'done') {return; }
    const alert = await this.alertCtrl.create({
      header: 'Ubicación',
      subHeader: '',
      inputs: [{name: 'barcode',
               type: 'text',
               id: 'read_barcode'}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }}
        , {
          text: 'Aplicar',
          handler: (data) => {
            const values = {new_location_barcode: data['barcode']};
            this.UpdateSmlIdField(SmlId, values);
          }
        }],
      });
    await alert.present();
  }

  ChangeLineLotId(MoveId= false, SmlId= false, OldLotName= false, NewLotId= false) {
    if (this.data['state'].value === 'done') {return; }
    this.audio.play('click');
    if (!MoveId){MoveId = this.data['id'];}
    if (this.data['state'].value !== 'done'){
      this.stock.ChangeLineLotId(MoveId, SmlId, OldLotName, NewLotId).then((data) => {
        if (data) {
          this.reset_scanner() ;
          this.apply_move_data(data); }
      })
      .catch((error) => {
        this.presentAlert('Error al actualizar el lote del movimeinto:', error);
      });

    }
    return;

  }

  BacthLot() {
    // Booleano que indica cuando lo que se va aleer es un lote:
    if (!this.ShowLots) { return false; }
    return true;
  }
  ProcessLotId(){
    return this.ProcessSerialId();
    if (this.data['state'].value === 'done') {return; }
    const LotName = this.scanner_reading;
    const SmlIds = this.data['move_line_ids'].filter( move => (move['lot_id'] && move['lot_id']['name'] === LotName));
    if (SmlIds) {
      for (const SmlId of SmlIds) {
        SmlId['field_status_apk'] = this.stock.write_status(SmlId['field_status_apk'], 'lot_id', 'done');
        const values = {field_status_apk: SmlId['field_status_apk']};
        this.UpdateSmlIdField(SmlId, values);
      }
    }
  }
  ProcessSerialId() {
    if (this.data['state'].value === 'done') {return; }
    const LotsToAdd = this.scanner_reading.split(',');
    if (!this.ShowLots){
      if (LotsToAdd.length > 0){
        this.ActionApplyLotNames(LotsToAdd);
      }
    }
    else {
      const LotsToCheck = [];
      for (const lot of LotsToAdd) {
        if (this.LotNames.indexOf(lot) === -1) {
          this.LotNames.push(lot);
          this.ChangeLotNames = true; }
        else {
          LotsToCheck.push(lot);
          }
      }
      if (LotsToCheck.length > 0){
        this.ActionApplyLotNames(LotsToCheck);
      }
    }
  }
  SetWaitingQty(SmlId){
    this.ActiveLine = SmlId;
    this.WaitingQty = true;
  }
  ActionApplyLotNames(LotNames) {
    if (this.data['state'].value === 'done') {return; }
    const LotIds = LotNames || this.LotNames;
    // Saco la lista de lotes que no están los movimientos
    // Las lita de lotes siempre es la original más los que añado, por lo que tengo que quitar los de los movmientos
    if (LotIds.length > 0) {
      this.stock.CreateMoveLots(this.data['id'], LotIds, this.data['location_dest_id'].id).then((data) => {
        if (data) {
          this.reset_scanner() ;
          this.apply_move_data(data); }
      })
      .catch((error) => {
        this.presentAlert('Error al añadir los lotes el albarán:', error);
      });
    }
    return;
    /* PRUEBO enviando todo y actualizando

    let LotsToCheck = []
    for (const move of this.data.move_line_ids) {
      const lot = move.lot_id;
      if (lot.id) {
        if (LotsToAdd.indexOf(lot.name) !== -1) {
          LotsToAdd.pop(lot.name);
        }
      }
    }
    if (LotsToAdd.length > 0) {
      this.stock.CreateMoveLots(this.data['id'], LotsToAdd).then((data)=>{
        this.apply_move_data(data);
      })
      .catch((error)=>{
        this.presentAlert('Error al añadir los lotes el albarán:', error);
      });
    }
    */
  }

  SearchOtherMoveByScanner(){}
  reset_scanner() {
    this.WaitingQty = false;
    this.ActiveLine = {};
    this.LastReading = this.scanner_reading;
    this.ScannerFooter.ScanReader.controls.scan.setValue('');
    // this.scanner.reset_scan();
    // this.ScanReader.controls.scan.setValue =''
  }
  process_reading() {
    // Primero buscon en el formulario si coincide con algo y despues decido que hacer
    // Caso 1. EAN 13
    // Busco
    this.audio.play('click');
    if (this.data['state'].value === 'done') {this.SearchOtherMoveByScanner(); }

    else if (eval(this.data['barcode_re']).exec(this.scanner_reading) || /[\.]\d{3}[\.]/.exec(this.scanner_reading) ) {
      // Leo UBICACION
      this.ProcessLocation(this.scanner_reading);
      // if (this.data.default_location.value === 'location_id') {this.ProcessLocationId(this.scanner_reading); }
      // else if (this.data.default_location.value === 'location_dest_id') {this.ProcessLocationDestId(this.scanner_reading);}
    }


    else if (this.WaitingQty && this.ActiveLine && this.ActiveLine['id']){
      if (typeof this.scanner_reading) {
        this.ActiveLine['qty_done'] = this.scanner_reading;
        this.reset_scanner();
        return;
      }
      this.presentAlert('Error en los datos.', 'El valor introducido ' + this.scanner_reading + 'no es válido');
      return;
    }
    else if (this.data['tracking'].value === 'none' &&
      (this.data['product_id']['wh_code'] === this.scanner_reading || this.data['product_id'].barcode === this.scanner_reading)) {
      this.ProcessProductId();
    }
    else if (this.data['tracking'].value === 'serial') {
      this.ProcessSerialId();
    }
    else if (this.data['tracking'].value === 'lot') {
      this.ProcessLotId();
    }
    else {
      this.presentAlert('Aviso', 'No se ha encontrado nada para ' + this.scanner_reading);
    }
    this.reset_scanner() ;
    /*
    if (this.data['tracking'] == 'none' && Number(this.scanner_reading)) {
      this.data['quantity_done'] = Number(this.scanner_reading);
    } else if (this.data['tracking'] != 'none') {
      if(!this.new_lots){
        this.new_lots = new Array();
      }
      this.new_lots.push([this.scanner_reading, 1]); /* Editar más adelante, serial cantidad = 1, lot cantidad = a introducir */
      /* Provisional, cuando estén preparada la función para gestionar cantidades en lot_ids editar */
      /* if (this.data['tracking'] == 'serial') {
      if (this.data['tracking'] == 'serial' || this.data['tracking'] == 'lot') {
        this.data['quantity_done']++;
      }
    }  */
  }
  NavigateStockPicking(PickingId){
    this.router.navigateByUrl('/stock-picking/' + PickingId);
  }
}
