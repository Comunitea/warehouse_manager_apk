import { Component, OnInit, Input, ViewChild, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AlertController, ActionSheetController, IonInfiniteScroll, ToastController, ModalController} from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { Location } from '@angular/common';
import { LoadingController } from '@ionic/angular';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';
// import { setMaxListeners } from 'cluster';
import { ScannerService } from '../../services/scanner.service';
import { BarcodeMultilinePage } from '../barcode-multiline/barcode-multiline.page';
import {OverlayEventDetail} from '@ionic/core';


@Component({
  selector: 'app-move-form',
  templateUrl: './move-form.page.html',
  styleUrls: ['./move-form.page.scss'],
})

export class MoveFormPage implements OnInit {

  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;
  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;
  @Input() ScannerReading: string;



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
  LotNames: Array<string>;
  NewLotNames: Array<boolean>;
  ChangeLotNames: boolean;
  ShowLots: boolean;
  ShowMoves: boolean;
  WaitingQty: boolean;
  ActiveLine: any;
  
  DirtyLines: boolean;
  QtyDirty: boolean;
  offset: number;
  limit: number;
  LimitReached: boolean;
  MaxSmlCount: number;
  TotalSmlCount: number;
  ShowNavs: boolean;
  SmlCount: number;
  LoadingPrevMoves: boolean;
  SmlIndex: number;
  NeedScroll: boolean;
  LoadingMoves: boolean;
  Ready: boolean;
  BarcodeLength: number;
  Filter: string;
  PendingQty: number;
  LinesCount: number;
  ShowLocation: boolean;
  ShowLocationDest: boolean;
  ShowPackage: boolean;
  ShowPackageDest: boolean;



  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.scanner.ActiveScanner && this.stock.GetModelInfo('App', 'ActivePage') === 'MoveFormPage' && event.which !== 0 && this.Ready) {
      console.log('ENVIANDO TECLAS A ' + this.stock.GetModelInfo('App', 'ActivePage'));
      this.scanner.key_press(event);
      this.scanner.timeout.then((val) => {
      this.onReadingEmitted(val);
    });
  }
  }

  constructor(
    public scanner: ScannerService,
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private audio: AudioService,
    public stock: StockService,
    private storage: Storage,
    private location: Location,
    public loadingController: LoadingController,
    public toastController: ToastController,
    public actionSheetController: ActionSheetController,
    private modalController: ModalController,
  ) {
    this.moves = ['up', 'down', 'left', 'right'];
  }
  ChangeFilter(){
    if (this.Filter === 'Todos'){
      this.Filter = 'Pendientes';
    }
    else if (this.Filter === 'Pendientes'){
      this.Filter = 'Realizados';
    }
    else {
      this.Filter = 'Todos';
    }
    this.offset = 0;
    return this.GetMoveInfo(this.data['id']);
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
    // buttons.push(advise);
    if (this.data) {
      const button = {
        text: this.Filter,
        icon: 'search_outline',
        role: '',
        handler: () => {
          this.ChangeFilter();
        }
      };
      buttons.push(button);
      if (this.data['tracking'].value === 'serial' || true){
        const button = {
          text: 'Cambiar vistas',
          icon: 'eye-outline',
          role: '',
          handler: () => {
            this.AlternateShowLots();
          }
        };
        buttons.push(button);
      }
      if (['partially_available', 'confirmed'].indexOf(State) !== -1) {
        const button = {
          text: 'Reservar',
          icon: 'battery-charging-outline',
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
          icon: 'battery-dead-outline',
          role: '',
          handler: () => {
            this.ActionUnReserve(Id);
          }
        };
        buttons.push(button);
      }
      //ActionApplyLotNames()" *ngIf="ChangeLotNames && LotNames.length > 0
      if (this.ChangeLotNames && this.LotNames){
        const button = {
          text: 'Actualizar lotes',
          icon: 'checkmark-done-circle-outline',
          role: 'barcode-outline',
          handler: () => {
            this.PrevActionApplyLotNames();
          }
        };
        buttons.push(button);
      }
      if (this.LotNames && 'done' !== State && Tracking !== 'none'){
        const button = {
          text: 'Borrar lotes',
          icon: 'trash-bin-outline',
          role: '',
          handler: () => {
            this.CleanLots(Id);
          }
        };
        buttons.push(button);
      }
      if (this.BarcodeLength !== 0){
        const button = {
          text: 'Anular chequeo de nº serie',
          icon: 'chatbox-ellipses-outline',
          role: '',
          handler: () => {
            this.BarcodeLength = 0;
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
    this.limit = this.MaxSmlCount = 10;
    this.LimitReached = false;
    this.LoadingMoves = false;
    this.AdvanceOptions = false;
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
      this.presentAlert('Error al comprobar tu sesión:', error.msg.error_msg);
    });
  }
  InitVars() {
    this.stock.SetParam('ShowLots', false);
    //this.ShowLots = false;
    //this.ShowMoves = true;
    //this.stock.SetParam('ShowLots', this.ShowLots);
    this.StateIcon = this.stock.getStateIcon('stock.move');
    this.Ready = true;
    this.QtyDirty = false;
    this.Filter = 'Todos';
    this.InitData();
  }
  InitData() {
    this.ChangeLotNames = false;
    this.LotNames = [];
    this.NewLotNames = [];
    this.BarcodeLength = 0;
    // this.apply_views();
  }
  read_status(field, campo, propiedad) {
    return this.stock.read_status(field, campo, propiedad);
  }

  AlternateShowLots() {

    this.audio.play('click');
    if (this.data['tracking']['value'] !== 'none'){
      this.ShowLots = !this.ShowLots;
      this.ShowMoves = !this.ShowLots;
    }
    else {
      this.ShowLots = false;
      this.ShowMoves = true;
    }
    this.stock.SetParam('ShowLots', this.ShowLots);
  }

  AlternateAdvanceOptions() {
    this.audio.play('click');
    this.AdvanceOptions = !this.AdvanceOptions;
  }
  go_back() {
    this.audio.play('click');
    this.router.navigateByUrl('/stock-picking/' + this.data['batch_id']['id'] + '/1');
    // this.location.back();
  }
  onReadingEmitted(val: string) {
    const delay = 200;
    let index = 0;
    for (const scan of val){

      if (scan !== '') {
        index += 1;
        setTimeout(() => {
          this.ScannerReading= scan;
          this.audio.play('click');
          this.CheckScanner(scan);
        }, delay * index);
      }
    }
    return;
  }
  async presentAlert(titulo, texto) {
    this.audio.play('click');
    const alert = await this.alertCtrl.create({
        header: titulo,
        message: texto,
        buttons: ['Ok'],

    });
    await alert.present();
  }
  // SCROLL CONTROL
  MoveSml(Forward){
    if (Forward){
      if (this.LimitReached){return; }
      // this.offset += count;
      return this.GetMoveInfo();
    }
    else {
      
      if (this.offset <= this.SmlCount){return; }
      this.offset -= (this.SmlCount + this.MaxSmlCount) ;
      return this.GetMoveInfo();
    }
  }

  DeleteLotName(Index){
    this.LotNames.splice(Index, 1);
    this.NewLotNames.splice(Index, 1);
    this.PendingQty += 1;
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
              const QuantityDone = this.data['quantity_done'] - SmlId['qty_done'] + data['qty_done']
              if (QuantityDone > this.data['reserved_availability']) {
                return this.QtyError();
              }
              const values = {qty_done: data['qty_done']};
              this.UpdateSmlIdField(SmlId['id'], values);
            }
          }
        }],
  });
    await alert.present();
  }

  UpdateSmlIdField(SmlId, values){
    console.log('Update SMLIdField');
    if (this.data['state'].value === 'done') {return; }
    values['filter_move_lines'] = this.Filter;
    this.stock.UpdateSmlIdField(this.data['id'], SmlId, values).then((data) => {
      if (data) {
        this.apply_move_data(data);
      }
      })
    .catch((error) => {
      this.presentAlert('Error:', error.msg.error_msg);
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
    const values = {
      move_line_id: SmlId['id'],
      qty_done: SmlId['qty_done'],
      lot_id: false,
      filter_move_lines: this.Filter,
    };
    this.stock.UpdateMoveLineQty(values).then((res) => {}).catch((error) => {});

  }
  apply_views(){
    // this.ShowMoves = !this.ShowLots;
    // return;

    if (this.data && this.data['tracking'].value === 'serial'){
      this.ShowLots = true;
      this.ShowMoves = false;
    }
    else{
      this.ShowLots = false;
      this.ShowMoves = true;
    }
  }
  apply_move_data(data) {

    this.InitData();
    console.log("Entro en Apply move data")
    console.log(data);
    if (data['image'] === false) {
      data['base64'] = false;
      // data['image'] = this.placeholder;
    } else {
      data['base64'] = true;
    }
    this.data = data;
    this.BarcodeLength = 0;
    // this.ShowLocation = data['view_move_fields'][0] === '1';
    // this.ShowLocationDest = data['view_move_fields'][1] === '1';
    // this.ShowPackage = data['view_move_fields'][2] === '1';
    // this.ShowPackageDest = data['view_move_fields'][3] === '1';

    for (const sml of data['move_line_ids']) {
      if (sml.lot_name) {
        //this.LotNames.push(sml.lot_name);
        //this.NewLotNames.push(true);
      }
      if (sml.lot_id.id){
        this.BarcodeLength = sml.lot_id.name.length;
      }
    }
    this.apply_views();
    this.PendingQty = this.data['reserved_availability'] - this.data['quantity_done'];
    this.offset = this.data['offset'];
    this.LimitReached = this.data['limit_reached'];
    this.SmlCount = this.data['sml_count'];
    this.TotalSmlCount = this.data['sml_count_no_limit'];
    this.ShowNavs = this.TotalSmlCount > this.SmlCount;
    this.NeedScroll = false; // this.offset <= this.MaxSmlCount ;
    this.cancelLoading();


    // this.audio.play('click');
    if (data['message']){this.presentAlert('Odoo', data['message']); }
    console.log('Function apply_move_data. OK')

  }
  GetValuesMoveInfo(move, values){
    values['id'] = move;
    values['model'] = 'stock.move';
    values['view'] = 'form';
    values['sml_limit'] = this.MaxSmlCount;
    values['sml_offset'] = this.offset;
    values['filter_move_lines'] = this.Filter;
    return values;
  }

  GetMoveInfo(move = this.data['id'], values = {}) {
    console.log('Recupero MOVIMIENTO');
    this.presentLoading();
    const self = this;
    values = this.GetValuesMoveInfo(move, values);
    this.stock.GetMoveInfo(values).then((data) => {
      self.apply_move_data(data);
    })
    .catch((error) => {
      this.cancelLoading(true);
      this.presentAlert('Error:', error.msg.error_msg);
    });
  }

  cancelLoading(error= false){
    this.loading.dismiss();
    if (error){
      this.audio.play('error');
    }
    else {
      this.audio.play('click');
    }
    this.Ready = true;
  }

  async presentLoading(Message = "Trabajando ...") {
    this.audio.play('click');
    this.Ready = false;
    this.loading = await this.loadingController.create({
      message: Message,
      translucent: true,
      cssClass: 'custom-class custom-loading'
    });
    setTimeout(() => {
      this.loading.dismiss();
    }, 5000);
    await this.loading.present();
  }

  RemoveMoveLineId(SmlId) {
    console.log('RemoveMoveLineId: ' + SmlId)
    if (this.data['state'].value === 'done') {return; }
    this.presentLoading();
    const values = {move_id: this.data['id'],
                    sml_ids: SmlId,
                  filter_move_lines: this.Filter};
    this.stock.RemoveMoveLineId(values).then((data) => {
      this.cancelLoading();
      if (data) {
        this.reset_scanner() ;
        if (data['warning']) {this.presentAlert('Odoo', data['warning']); }
      }
      })
    .catch((error) => {
      this.cancelLoading(true);
      this.presentAlert('Error:', error.msg.error_msg);
    });
  }

  ProcessProductId() {
    console.log('ProcessProductId');
    if (this.data['state'].value === 'done') {return; }
    // this.presentLoading();
    const SmlId = this.data['move_line_ids'].filter(
      move => (this.data['active_location_id'].id === move[this.data['default_location'].value].id))[0];
    if (SmlId){
      // Si hay un sml_id
      // entonces miro a ver si  superamos la cantidad
      const QuantityDone = this.data['quantity_done'] + 1;
      if (QuantityDone > this.data['reserved_availability']) {
        return this.QtyError();
      }
      // Escribo el producto y l aubicación con ok. y ademas le sumo una a la cantidad
      this.ChangeQty(SmlId, 1);
    }
    this.reset_scanner() ;
    // this.cancelLoading();
  }
  GetMovesToChangeLoc(moves, confirm=false) {
    console.log('GetMovesToChangeLoc');
    const loc = this.data['default_location'].value;
    // Si confirmar:
    // filtro los movimientos que ya tienen esa ubicación y no hechos
    if (confirm){
      return moves.filter(move => (move['qty_done'] === 0));
    }
    // Si no confirmo filtro los movimeintos:
    // que ya tienen ubicación y no están hechos
    // y los que no tengan ubicación
    return moves.filter(move =>(move['qty_done'] !== 0));
  }

  ProcessLocation(Barcode) {
    if (this.data['state'].value === 'done') {return; }
    this.presentLoading();
    const field = this.data['default_location'].value;
    // Miro si coincide con algún ubicación necesaria de los movimientos
    const Confirm = this.LastReading === this.ScannerReading
    // const MovesToUpdate = this.GetMovesToChangeLoc(this.data['move_line_ids'], Confirm);
    const SmlIds = [];
    for (const move of this.data['move_line_ids']) {SmlIds.push(move['id']); }
    const vals = {
                    sml_ids: SmlIds,
                    field: this.data['default_location'].value,
                    active_location_id: this.data['active_location_id']['id'],
                    barcode: Barcode,
                    confirm: Confirm,
                    };
    const values = this.GetValuesMoveInfo(this.data['id'], vals);
    this.stock.AssignLocationToMoves(values)
      .then((data) => {
        if (data) {
          this.reset_scanner() ;
          this.apply_move_data(data);
          if (data['warning']) {this.presentAlert('Odoo', data['warning']); }
        }
        else {this.cancelLoading(); }
        })
      .catch((error) => {
        this.cancelLoading(true);
        this.presentAlert(error.tittle, error.msg.error_msg);
      });


  }
  AssignLocationId(MoveId, LocationId, LocationField) {
    if (this.data['state'].value === 'done') {return; }
    this.presentLoading();
    const vals = {id: MoveId, location_field: LocationField, location_id: LocationId};
    const values = this.GetValuesMoveInfo(this.data['id'], vals);
    this.stock.AssignLocationId(values).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
      else {this.cancelLoading(); }
    })
    .catch((error) => {
      this.cancelLoading(true);
      this.presentAlert('Error:', error.msg.error_msg);
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
    }
  }

  ActionAssign(MoveId) {
    if (this.data['state'].value === 'done') {return; }
    this.presentLoading();
    this.audio.play('click');
    this.offset = 0;
    const values = this.GetValuesMoveInfo(this.data['id'], {});
    this.stock.ActionAssign(values).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
      else {this.cancelLoading(); }
    })
    .catch((error) => {
      this.cancelLoading(true);
      this.presentAlert('Error:', error.msg.error_msg);
    });
  }

  CleanLots(MoveId) {
    console.log('Clena lots');
    if (this.data['state'].value === 'done') {return; }
    this.presentLoading();
    this.audio.play('click');
    const values = {id: MoveId, model: 'stock.move', filter_move_lines: this.Filter};
    this.stock.CleanLots(values).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
      else {this.cancelLoading(); }
    })
    .catch((error) => {
      this.cancelLoading(true);
      this.presentAlert('Error:', error.msg.error_msg);
    });
  }
  DeleteMoveLine(SmlId){
    //Necesito volver a cargar los mismos
    this.offset = this.offset - this.SmlCount;
    const values = this.GetValuesMoveInfo(this.data['id'], {sml_id: SmlId, filter_move_lines: this.Filter});
    this.presentLoading();
    this.audio.play('click');

    this.stock.DeleteMoveLine(values).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
      else {this.cancelLoading(); }
    })
    .catch((error) => {
      this.cancelLoading(true);
      this.presentAlert('Error:', error.msg.error_msg);
    });
  }
  ActionUnReserve(MoveId) {
    if (this.data['state'].value === 'done') {return; }
    this.presentLoading();
    this.audio.play('click');
    this.offset = 0;
    const values = this.GetValuesMoveInfo(this.data['id'], {});
    this.stock.MoveUnReserve(values).then((data) => {
      if (data) {
        this.reset_scanner() ;
        this.apply_move_data(data); }
      else {this.cancelLoading(); }
    })
    .catch((error) => {
      this.cancelLoading(true);
      this.presentAlert('Error:', error.msg.error_msg);
    });
  }

  async ChangeLineLocationId(SmlId){
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


  BacthLot() {
    // Booleano que indica cuando lo que se va aleer es un lote:
    if (!this.ShowLots) { return false; }
    return true;
  }
  ProcessLotId(){
    return this.ProcessSerialId();
  }

  ProcessSerialId() {
    if (this.data['quantity_done'] >= this.data['reserved_availability'] || this.LotNames.length >= this.data['reserved_availability']) {
      return this.QtyError();
    }
    if (this.data['state'].value === 'done') {return; }
    let LotsToAdd = [];
    LotsToAdd.push(this.ScannerReading);
    if (!this.ShowLots){
      if (LotsToAdd.length > 0){
        this.ActionApplyLotNames(LotsToAdd);
      }
    }
    else {
      const LotsToCheck = [];
      for (const lot of LotsToAdd) {
        if (this.BarcodeLength === 0) {this.BarcodeLength = lot.length; }
        if (lot.length === this.BarcodeLength){
          if (this.LotNames.indexOf(lot) === -1) {
            this.LotNames.unshift(lot);
            this.NewLotNames.unshift(false);
            this.ChangeLotNames = true;
            this.PendingQty -= 1;
          }
          else {
            LotsToCheck.unshift(lot);
            }
        }
        else {
          this.audio.play('error');
          this.presentToast('El código ' + lot + ' no cumple la validación')
        }
      }
      if (LotsToCheck.length > 0){
        // this.ActionApplyLotNames(LotsToCheck);
      }
    }
  }
  QtyError(){
    this.cancelLoading(true);
    return this.presentToast('No puedes realizar más cantidad de la reservada para el movimiento');
  }

  async presentToast(Str = 'Error de validación', Header = 'Aviso:' ) {
    const toast = await this.toastController.create({
      header: Header,
      message: Str,
      duration: 2000,
    });
    toast.present();
  }

  SetWaitingQty(SmlId){
    this.ActiveLine = SmlId;
    this.WaitingQty = true;
  }
  PrevActionApplyLotNames(){
    let LotsToAdd = [];
    const LotNamesCount = this.LotNames.length;
    for (let i = 0; i < LotNamesCount; i++){
      if (this.NewLotNames[i]){continue;
      }
      LotsToAdd.push(this.LotNames[i]);
    }

    return this.ActionApplyLotNames(LotsToAdd);
  }
  ActionApplyLotNames(LotNames = []) {
    let LotsToAdd = [];
    let LotNamesCount = this.LotNames.length;
    if (this.BarcodeLength === 0) {
      if (LotNamesCount > 0){
        this.BarcodeLength = this.LotNames[LotNamesCount - 1].length;
      }
      else {
        this.BarcodeLength = LotNames[0].length;
      }
    }
    for (const lot of LotNames){
      if (lot.length !== this.BarcodeLength){
        this.audio.play('error');
        this.presentToast('El código ' + lot + ' no cumple la validación')
        continue;
      }
      // const idx = this.LotNames.indexOf(lot);
      // if (false && idx > -1 && this.NewLotNames[idx]) {
      //  this.audio.play('error');
      //  this.presentToast('El código ' + lot + ' ya está en la lista');
      //  continue;
      // }
      LotsToAdd.push(lot);
    }
    if (LotsToAdd.length > 0) {
      this.presentLoading();
      let values = {id: this.data['id'],
                      lot_names: LotsToAdd,
                      active_location: this.data['default_location'].id,
                      filter_move_lines: this.Filter};
      this.offset = this.offset - this.SmlCount;
      values = this.GetValuesMoveInfo(this.data['id'], values);
      this.stock.CreateMoveLots(values).then((data) => {
        if (data) {
          this.reset_scanner() ;
          this.apply_move_data(data); }
        else {
          this.cancelLoading();
        }
      })
      .catch((error) => {
        this.audio.play('error');
        this.cancelLoading();
        this.presentAlert('Error:', error.msg.error_msg);
      });
    }
    return;

  }

  ActionApplyLotNamesBis(LotNames = []) {
    console.log('ActionApplyLotNames');
    if (this.data['state'].value === 'done') {return; }
    for (const lot of this.LotNames){
      if (this.BarcodeLength === 0) {
        this.BarcodeLength = lot.length;
      }
      if (LotNames && LotNames.indexOf(lot) > -1 ) {
        this.presentToast('El código ' + lot + ' ya está en la lista');
      }
      else if (lot.length === this.BarcodeLength){
        LotNames.push(lot);
      }
      else {
        this.audio.play('error');
        this.presentToast('El código ' + lot + ' no cumple la validación')
      }
    }
    // Saco la lista de lotes que no están los movimientos
    // Las lita de lotes siempre es la original más los que añado, por lo que tengo que quitar los de los movmientos
    if (LotNames.length > 0) {
      this.presentLoading();
      const values = {id: this.data['id'],
                      lot_names: LotNames,
                      active_location: this.data['default_location'].id,
                      filter_move_lines: this.Filter};

      this.stock.CreateMoveLots(values).then((data) => {
        if (data) {
          this.reset_scanner() ;
          this.apply_move_data(data); }
        else {
          this.cancelLoading();
        }
      })
      .catch((error) => {
        this.audio.play('error');
        this.cancelLoading();
        this.presentAlert('Error:', error.msg.error_msg);
      });
    }
    return;
  }

  SearchOtherMoveByScanner(){}

  reset_scanner() {
    this.WaitingQty = false;
    this.ActiveLine = {};
    this.LastReading = this.ScannerReading;
    this.ScannerFooter.ScanReader.controls.scan.setValue('');
    // this.scanner.reset_scan();
    // this.ScanReader.controls.scan.setValue =''
  }
  CheckScanner(val) {
    if (val === ''){
      this.reset_scanner();
    }
    // Primero buscon en el formulario si coincide con algo y despues decido que hacer
    // Caso 1. EAN 13
    // Busco
    console.log('ProcessReading: ' + val);
    const execreg = /\d+/.exec(val);
    if (execreg && val[0]  === '*' && val[val.length - 1] === '*'){
      this.audio.play('click');
      return this.CheckOrder(execreg[0]);
    }
    this.audio.play('click');
    if (this.data['state'].value === 'done') {
      this.SearchOtherMoveByScanner();
     }

    else if (eval(this.data['barcode_re']).exec(val) || /[\.]\d{3}[\.]/.exec(val) ) {
      // Leo UBICACION
      this.ProcessLocation(val);
      // if (this.data.default_location.value === 'location_id') {this.ProcessLocationId(val); }
      // else if (this.data.default_location.value === 'location_dest_id') {this.ProcessLocationDestId(val);}
    }
    else if (this.WaitingQty && this.ActiveLine && this.ActiveLine['id']){
      if (typeof val) {
        this.ActiveLine['qty_done'] = val;
        this.reset_scanner();
        return;
      }
      this.presentAlert('Error:', 'El valor introducido ' + val + 'no es válido');
      return;
    }
    else if (this.data['tracking'].value === 'none' &&
      (this.data['product_id']['wh_code'] === val || this.data['product_id'].barcode === val)) {
      this.ProcessProductId();
    }
    else if (this.data['tracking'].value === 'serial') {
      this.ProcessSerialId();
    }
    else if (this.data['tracking'].value === 'lot') {
      this.ProcessLotId();
    }
    else {
      this.presentAlert('Aviso', 'No se ha encontrado nada para ' + val);
    }
    this.reset_scanner() ;
    /*
    if (this.data['tracking'] == 'none' && Number(val)) {
      this.data['quantity_done'] = Number(val);
    } else if (this.data['tracking'] != 'none') {
      if(!this.new_lots){
        this.new_lots = new Array();
      }
      this.new_lots.push([val, 1]); /* Editar más adelante, serial cantidad = 1, lot cantidad = a introducir */
      /* Provisional, cuando estén preparada la función para gestionar cantidades en lot_ids editar */
      /* if (this.data['tracking'] == 'serial') {
      if (this.data['tracking'] == 'serial' || this.data['tracking'] == 'lot') {
        this.data['quantity_done']++;
      }
    }  */
  }

  OpenBarcodeMultiline(ProductId, PName, LName){
    this.scanner.ActiveScanner = false;
    this.stock.SetModelInfo('App', 'ActivePage', '');
    this.openModalBarcodeMulti(ProductId, PName, LName);
  }
  async openModalBarcodeMulti(PrId, pname, lname){
    const modal = await this.modalController.create({
      component: BarcodeMultilinePage,
      componentProps: { LocationId: this.data['active_location_id']['id'],
                        MoveId: this.data['id'],
                        ProductId: PrId,
                        LName: lname,
                        PName: pname,
                        IName: 'Multilinea'
                      },
    });
    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      this.stock.SetModelInfo('App', 'ActivePage', 'MoveFormPage');
      if (detail !== null && detail['data'].length > 0) {
        const values = {move_id: this.data['id'],
                        location_id: this.data['active_location_id']['id'] || this.data['location_id']['id'],
                        product_id: PrId,
                        ean_ids: detail['data']};
        this.LoadEans(values);
      }
    });
    await modal.present();
  }
  LoadEans(vals){
    this.presentLoading();
    const values = this.GetValuesMoveInfo(this.data['id'], vals);

    this.stock.LoadEansToMove(values).then((data) => {
      this.apply_move_data(data);
      this.loading.dismiss();
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
      this.loading.dismiss();
    });

  }



  NavigateStockPicking(PickingId){
    this.router.navigateByUrl('/stock-picking/' + PickingId);
  }
  GetRelativeMoveInfo(MoveId, Inc){
    const values = {RelativeIndex: Inc, Filter: this.Filter};
    return this.GetMoveInfo(MoveId, values);
  }
  CheckOrder(order){
    // ActionAssign();
    // DoUnreserve();
    // GetFilteredMoves();
    // ResetQties(this.data['id']);
    const MoveId = this.data['id'];
    let res = false;
    if (order === '39'){
      // this.GetRelativeMoveInfo(MoveId, 1);
      res = true;
    }
    if (order === '37'){
      // this.GetRelativeMoveInfo(MoveId, -1);
      res = true;
    }
    if (order === '38'){
      if (this.data['tracking'].value !== 'serial' && this.data['move_line_ids'].length === 1){
        const sml = this.data['move_line_ids'][0];
        if (sml.qty_done < sml.product_uom_qty){
          this.ChangeQty(sml, +1);
        }
      }
      res = true;
    }
    if (order === '40'){
      if (this.data['tracking'].value !== 'serial' && this.data['move_line_ids'].length === 1){
        const sml = this.data['move_line_ids'][0];
        if (sml.qty_done > 0){
          this.ChangeQty(sml, -1);
        }
      }
      res = true;
    }
    const F1 = '112'; // Actualiza los nombres de los números de serie
    const F2 = '113'; // Reserva los movimientos
    const F3 = '114'; // Anula reservas
    const F4 = '115'; // Borra números de serie
    const F5 = '116'; // Alterna entre números de serie o move_lines
    const F6 = '117'; // Nada
    const F7 = '118'; // Nada
    const F8 = '119'; // Nada
    const F9 = '120'; // Nada

    if (order === F8){
      // F1
      let str = '<p>Atajos de teclado</p>';
      str += 'Cursor Dcha: Siguiente</br>';
      str += 'Cursor Izqda: Anterior</br>';
      str += 'Cursor Arriba: +1 Qty</br>';
      str += 'Cursor Abajo: -1 Qty</br>';
      str += 'F1: Esta pantalla</br>';
      str += 'F2: Reservar</br>';
      str += 'F3: Anular reserva</br>';
      str += 'F4: Poner a 0</br>';
      str += 'F5: Validar</br>';
      str += 'F8: Aplicar lotes</br>';
      str += 'F9: Borrar lotes</br>';
      str += 'TAB: Alternar filtro</br>';
      this.presentAlert('TECLAS', str);
      res = true;
    }
    else if (order === F2){
      // F2
      this.ActionAssign(MoveId);
      res = true;
    }
    else if (order === F3){
      // F3
      this.ActionUnReserve(MoveId);
      res = true;
    }
    else if (order === F8){
      // F4
      // this.ResetQties();
      res = true;
    }
    else if (order === F8){
      // F5
      // this.ButtonValidate();
      // return true;
      res = true;
    }
    else if (order === F1){
      // F8
      this.PrevActionApplyLotNames();
      res = true;
    }
    else if (order === F4){
      // F9
      this.CleanLots(MoveId);
      res = true;
    }
    else if (order === F5){
      // F5
      this.AlternateShowLots();
      res = true;
    }
    this.audio.play('error');
    this.reset_scanner();
    return res;
  }
}
