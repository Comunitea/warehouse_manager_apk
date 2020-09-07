import { OdooService } from '../../services/odoo.service';
import { Component, OnInit, ViewChild, Input, HostListener} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ActionSheetController, ModalController , ToastController} from '@ionic/angular';
import { StockService } from '../../services/stock.service';
import { AudioService } from '../../services/audio.service';
import { VoiceService } from '../../services/voice.service';
import { Location } from "@angular/common";
import { LoadingController } from '@ionic/angular';
import { ScannerService } from '../../services/scanner.service';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';

@Component({
  selector: 'app-stock-picking',
  templateUrl: './stock-picking.page.html',
  styleUrls: ['./stock-picking.page.scss'],
})
export class StockPickingPage implements OnInit {

  next: number;
  prev: number;
  moves: any;
  filter: string;
  /* Picking info */
  data: {};
  picking: number;
  PickingCode: string;
  ActiveOperation: boolean;
  loading: any;
  MoveStates: boolean;
  NextPrev: Array<BigInteger>;
  LastReading: string;
  StateIcon: {};
  TrackingIcon: {};
  FilterMoves: string;
  FilterMovesArray: Array<string>;
  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;

  @Input() ScannerReading: string;
  @Input() voice_command: boolean;
  @Input() pick: {};
  ngSwitch: any;


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.scanner.ActiveScanner && this.stock.GetModelInfo('App', 'ActivePage') === 'StockPickingPage' && event.which !== 0) {
      console.log('ENVIANDO TECLAS A ' + this.stock.GetModelInfo('App', 'ActivePage'));
      this.scanner.key_press(event);
      this.scanner.timeout.then((val) => {
      this.onReadingEmitted(val);
    });
  }
  }

  constructor(
    public modalController: ModalController,
    public scanner: ScannerService,
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private voice: VoiceService,
    public stock: StockService,
    private route: ActivatedRoute,
    public toastController: ToastController,
    private location: Location,
    public loadingController: LoadingController,
    public actionSheetController: ActionSheetController,
  ) {
    this.moves = ['up', 'down', 'left', 'right'];
  }


  OpenModal(Model, Id) {
    this.router.navigateByUrl('/info-sale-order/' + Model + '/' + Id);
    // return this.presentModal({Model: ModelO, Id: IdO});
  }


  Navigate(inc){
    this.router.navigateByUrl('/stock-picking/' + this.NextPrev[inc]);
  }

  ionViewDidLeave(){

  }

  ionViewDidEnter(){
    
    this.stock.SetModelInfo('App', 'ActivePage', 'StockPickingPage');
    this.ActiveOperation = false;
    this.picking = parseInt(this.route.snapshot.paramMap.get('id'));
    this.presentLoading('Cargando ...');
    this.GetPickingInfo(this.picking);
    this.voice.voice_command_refresh$.subscribe(VoiceData => {
    console.log(VoiceData);
    this.voice_command_check();
    });
    this.audio.play('click');
  }

  GetFilteredMoves(){
    if (this.stock.GetFilterMoves() === 'Todos'){this.stock.SetFilterMoves('Pendientes'); }
    else if (this.stock.GetFilterMoves() === 'Pendientes'){this.stock.SetFilterMoves('Hechos'); }
    else if (this.stock.GetFilterMoves() === 'Hechos'){this.stock.SetFilterMoves('Todos'); }
    this.FilterMoves = this.stock.GetFilterMoves() ;
    this.presentLoading('Cargando ...');
    this.GetPickingInfo(this.picking);
  }

  ngOnInit() {
    this.StateIcon = this.stock.getStateIcon('stock.move');
    this.TrackingIcon = this.stock.getTrackingIcon('stock.move');
    this.FilterMoves = this.stock.GetFilterMoves();
    this.odoo.isLoggedIn().then((data) => {
      if (data === false) {
        this.router.navigateByUrl('/login');
      }
    })
    .catch((error) => {
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }

  go_back() {
    this.audio.play('click');
    this.location.back();
}


CheckOpenLocation(val){
  const MoveLocation = this.data['default_location']['value'];
  for (const move of this.data['move_lines']){
    if (move[MoveLocation]['barcode'] === val){
      this.router.navigateByUrl('/move-form/' + move['id']);
      return true;
    }
  }
  return false;
}
QtyError(){
  this.audio.play('error');
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

async confirmationPrompt(Str = 'Error de validación', Header = 'Aviso:') {
  return new Promise(async (resolve) => {
    const confirm = await this.alertCtrl.create({
      header: Header,
      message: Str,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            return resolve(false);
          },
        },
        {
          text: 'OK',
          handler: () => {
            return resolve(true);
          },
        },
      ],
    });

    await confirm.present();
  });
}

async InputQty(Index, State = 'assigned'){
    if (State === 'done' || State === 'draft' || State === 'confirmed') {
      this.presentToast('Esta hecho o cancelado');
      return;
    }

    if (this.data['pick_state'].value === 'done') {
      this.audio.play('error');
      return; }

    const Move = this.data['move_lines'][Index];
    if (Move['tracking']['value'] !== 'none'){
      this.audio.play('error');
      return;
    }
    if (Move.reserved_availability === 0){
      return this.presentAlert('Aviso', 'No tienes ninguna cantidad reservada. Regulariza inventario')
    }
    let ProposedQty;
    this.audio.play('click');
    if (Move['quantity_done'] === 0){
      ProposedQty = Move['reserved_availability'];
    }
    else {ProposedQty = Move['quantity_done']; }

    const alert = await this.alertCtrl.create({
      header: 'Cantidad',
      subHeader: '',
      inputs: [{name: 'qty_done',
               value: Number(ProposedQty),
               type: 'number',
               id: 'qty-id',
               // cssClass: 'input-number primary',//
               // class: 'input-number',
               placeholder:  ProposedQty}],
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
            if ( Move['quantity_done'] !== data['qty_done']) {
              // if (Move.reserved_availability < data['qty_done']){
              //   return this.presentAlert('Aviso', 'No tienes suficiente cantidad reservada para este movimiento. Regulariza inventario')
              // }
              // Similar a check product pero con cantidad en vez de increment0
              let self = this;

              const QuantityDone = data['qty_done'];
              if (QuantityDone > Move['reserved_availability']) {
                return this.QtyError();
              }
              this.presentLoading('Actualizando ...');
              this.stock.UpdateMoveQty( Move['id'], false, false, data['qty_done'], false, this.FilterMoves).then((res) => {
                this.loading.dismiss();
                if (res !== false){
                  return self.CheckMoveIsFilter(res[0], Index);
                }

              }).catch((error) => {
                this.loading.dismiss();
                this.presentAlert(error.tittle, error.msg.error_msg);
              });
            }
          }
        }],
  });
    await alert.present();
  }

CheckMoveIsFilter(Move, Index){
  let action = 'Update';
  if (this.FilterMoves === 'Pendientes' && Move.quantity_done === Move.reserved_availability){
    action = 'Unlink';
  }
  if (this.FilterMoves === 'Hechos' && Move.quantity_done !== Move.reserved_availability){
    action = 'Unlink';
  }
  if (action === 'Update'){
    this.data['move_lines'][Index] = Move; }
  else if (action === 'Unlink') {
    this.data['move_lines'].splice(Index, 1);
  }
  this.data['total_qty_done'] = Move['total_qty_done'];
  return true;
}

CheckProduct(val){
  let Index = 0;
  for (const move of this.data['move_lines']){
    if (move.product_id.wh_code === val) {
      if (move.tracking.value === 'none') {
        let self = this;
        const QuantityDone = move['quantity_done'] + 1;
        if (QuantityDone > move['product_uom_qty']) {
          return this.QtyError();
        }
        // Si leo un producto, y no tiene seguimiento: +1 en la cantidad. Si es por lotes igual
        this.presentLoading('Actualizando ...');
        this.stock.UpdateMoveQty(move['id'], false, false, false, 1, this.FilterMoves).then((res) => {
          if (res !== false){
            this.loading.dismiss();
            return self.CheckMoveIsFilter(res[0], Index);
          }
        }).catch((error) => {
          this.loading.dismiss();

        });
        return true;
      }
      else if (move.tracking.value === 'serial') {
        // Si leo un producto, y tiene seguimiento por numero de serie abro el movimeinto
        this.router.navigateByUrl('/move-form/' + move['id']);
      }
      else if (move.tracking.value === 'lot') {
        // Si leo un producto, y tiene seguimiento por lote abro el movimeinto
        this.router.navigateByUrl('/move-form/' + move['id']);
      }
    }
    Index += 1;
  }
}

CheckOpenPicking(val){
  this.stock.FindPickingByName(val).then((res) => {
    if (res !== false){
      this.router.navigateByUrl('/stock-picking/' + res);
    }
  }).catch((error) => {
});
  return false;
}
CheckSerial(val){
  const self = this;
  const remove = this.LastReading === val;
  this.presentLoading('Buscando Serial...');
  this.stock.FindSerialForMove(val, this.picking, remove).then ((res) => {
    if (res  !== false){
      const UpMove = res[0];
      for (const move in self.data['move_lines']){
        if (self.data['move_lines'][move]['id'] === UpMove['id']) {
          this.loading.dismiss();
          return self.CheckMoveIsFilter(UpMove, move);
        }
      }

    }


  }) .catch((error) => {
    this.loading.dismiss();
    this.presentAlert(error.tittle, error.msg.error_msg);
  });
  return false;
}

reset_scanner() {
  this.LastReading = this.ScannerReading;
  this.ScannerFooter.ScanReader.controls.scan.setValue('');
  // this.scanner.reset_scan();
  // this.ScanReader.controls.scan.setValue =''
}
CheckOrder(order){
  // ActionAssign();
  // DoUnreserve();
  // GetFilteredMoves();
  // ResetQties(this.data['id']);

  if (order === '39'){
    this.Navigate(1);
    return true;
  }
  if (order === '37'){
    this.Navigate(0);
    return true;
  }
  if (order === '112'){
    // F1
    let str = '<p>Atajos de teclado</p>';
    str += 'Cursor Dcha: Siguiente</br>';
    str += 'Cursor Izqda: Anterior</br>';
    str += 'F1: Esta pantalla</br>';
    str += 'F2: Reservar</br>';
    str += 'F3: Anular reserva</br>';
    str += 'F4: Poner a 0</br>';
    str += 'F5: Validar</br>';
    str += 'TAB: Alternar filtro</br>';
    this.presentAlert('TECLAS', str);

    return true;
  }
  if (order === '113'){
    // F2
    this.ActionAssign();
    return true;
  }
  if (order === '114'){
    // F3
    this.DoUnreserve();
    return true;
  }
  if (order === '115'){
    // F4
    this.ResetQties();
    return true;
  }
  if (order === '116'){
    // F5
    this.ButtonValidate();
    return true;
  }
  if (order === '9'){
    // F5
    this.GetFilteredMoves();
    return true;
  }
  this.audio.play('error');
  return false;
}
CheckScanner(val) {
  if (val === ''){
    this.reset_scanner();
  }
  const execreg = /\d+/.exec(val);
  if (execreg && val[0]  === '*' && val[val.length - 1] === '*'){
    this.audio.play('click');
    const order = this.CheckOrder(execreg[0]);
    if (order){return; }
  }
  // ESCANEO DE ALBARAN. SUPONGO SIEMPRE QUE NO HAY UBICACIONES REQUERIDAS
  // CASO 1: EAN O DEFAULT CODE: SUMO UNA CANTIDAD
  // CASO 2: NUMERO DE SERIE: ESCRIBO SERIE Y CANTIDAD 1 EN LA LINEA
  // compruebo si hay un lote y ven algún movimiento
  // al ser asycrono tengo que hacer las busquedas anidadas
  else if (eval(this.data['barcode_re']).exec(val) ) {
    // Leo UBICACION. Busco el primer movieminto interno que tenga esa ubicación en el codigo de barras.
    this.CheckOpenLocation(val);
  }
  else if (eval(this.data['product_re']).exec(val) ) {
    // Leo UBICACION. Busco el primer movieminto que tenga ese warehouse_cpde que tenga esa ubicación en el codigo de barras.
    this.CheckProduct(val);
  }
    // Busco los movimeintos que pertenecemn a esta albrán
    //
  else {
    this.CheckSerial(val);
  }
  this.reset_scanner();
  return;
 }

  onReadingEmitted(val: string) {
    for (const scan of val){
      if (scan !== ''){
        this.audio.play('click'),
        this.ScannerReading = scan;
        this.CheckScanner(scan);
      }
    }
    return;
  }

  async presentAlert(titulo, texto) {
    this.audio.play('error');
    const alert = await this.alertCtrl.create({
        header: titulo,
        message: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }

  // Navigation
  page_controller(direction) {
    if (direction === 'up') {
      console.log('up');
    } else if (direction === 'down') {
      console.log('down');
    } else if (direction === 'left') {
      console.log('left');
    } else if (direction === 'right') {
      console.log('right');
    }
  }

  OpenLink(LocationId, State, model= 'move-form'){
    if (State === 'assigned' || State === 'partially_available') {
    this.audio.play('click');
    this.router.navigateByUrl('/' + model + '/' + LocationId);
    }
    else {
      this.presentToast('Esta hecho o cancelado');
    }
  }

  ActionAssign(){
    this.presentLoading('Reserrvando ...')
    // Las funciones debería devolver ya la  recarga para ahorrar una llamada
    this.stock.ActionAssignPick(this.picking).then((data) => {
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al asignar cantidades:', error);
    });
  }
  DoUnreserve(){
    // Las funciones debería devolver ya la  recarga para ahorrar una llamada
    this.presentLoading('Anulando reserva ...');
    this.stock.DoUnreservePick(this.picking).then((data) => {
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al asignar cantidades:', error);
    });
  }
  ChangePickingValue(Field, Value){
    let self = this;
    this.presentLoading('Actualizando ...');
    const values = {model: 'stock.picking.batch', id: this.picking, field: Field, value: Value};
    this.stock.ChangeFieldValue(values).then((OK: Array<{}>) => {
      for (const Item of OK){
        this.data[Field] = Item[Field];
      }
      this.loading.dismiss();
    }).catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error', error);
    });
  }
  async ButtonValidate(){
    if (this.data['need_package'] && this.data['carrier_packages'] === 0){
      this.audio.play('error');
      this.presentToast('Necesitas meter los paquetes');
      return;
    }
    if (this.data['need_weight'] && this.data['carrier_weight'] === 0){
      this.audio.play('error');
      this.presentToast('Necesitas meter el peso');
      return;
    }
    if (this.data['total_qty_done'] !== this.data['total_reserved_availability']){
      this.audio.play('error');
      const confirmation = await this.confirmationPrompt('No se han confirmado todos los movimientos, ¿quieres validar igualmente?')
      if (!confirmation) {
        return;
      }
    }
    let self = this;
    // this.presentLoading();
    this.stock.ButtonValidate(this.data['id']).then((data) => {
      // self.loading.dismiss();
      // self.router.navigateByUrl('/stock-picking-list');
    })
    .catch((error) => {
      // self.loading.dismiss();
      // console.log('Error al validar');
    });
    this.router.navigateByUrl('/stock-picking-list');
  }

  async force_set_qty_done(MoveId, field, model = 'stock.picking.batch'){
    this.presentLoading('Actualizando ...');
    await this.stock.force_set_qty_done(Number(MoveId), field, model).then((data) => {
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  async ResetQties(){
    this.presentLoading('Reseteeando ...');
    await this.stock.force_reset_qties(Number(this.data['id']), 'stock.picking.batch').then((data) => {
      console.log(data);
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  async presentLoading(Message= 'Validando...') {
    this.loading = await this.loadingController.create({
      message: Message,
      translucent: true,
      cssClass: 'custom-class custom-loading'
    });
    await this.loading.present();
  }

  NavigatePickingList(){
    this.audio.play('click');
    // let ActiveIds = this.stock.GetModelInfo('stock.picking.batch', 'ActiveIds');
    this.router.navigateByUrl('/stock-picking-list');
  }
  ApplyPickData(data){
    this.loading.dismiss();
    this.data = data;
    this.NextPrev = this.stock.GetNextPrev('stock.picking.batch', data['id']);
    if (data['notes']){
      setTimeout(() => {
        this.presentAlert('Aviso', data['notes']);
      }, 300);
      
    }

  }
  GetPickingInfo(PickId, index = 0) {
    this.stock.GetPickingInfo(PickId, index, this.FilterMoves).then((data) => {
      this.ApplyPickData(data);
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al recuperar el movimiento:', error);
    });
  }


    /* this.stock.GetPicking([], picking, 'form').then((data) => {
      if (data){
        this.data = data[0];
        this.stock.get_move_lines_list(this.data['id']).then((moves) => {
            this.move_lines = moves;
            })
          .catch((error) => {
            this.presentAlert('Error al recuperar el picking:', error);
          })
        }
    })
    .catch((error)=>{
      this.presentAlert('Error al recuperar el picking:', error);
      }); */


  // Voice command

  voice_command_check() {
    console.log('voice_command_check');
    console.log(this.voice.voice_command);
    if (this.voice.voice_command) {
      const VoiceCommandRegister = this.voice.voice_command;
      console.log('Recibida orden de voz: ' + VoiceCommandRegister);

      if (this.check_if_value_in_responses('validar', VoiceCommandRegister) && this.data['show_validate']) {
        console.log('entra al validate');
        this.ButtonValidate();
      }
      else if (this.data &&
                (['confirmed', 'assigned'].indexOf(this.data['pick_state'].value) >= -1  &&
                this.check_if_value_in_responses('hecho', VoiceCommandRegister))) {
          console.log('entra al hecho');
          this.force_set_qty_done(this.data['id'], 'product_qty', 'stock.picking.batch');
      }
      else if (this.data &&
              (['confirmed', 'assigned'].indexOf(this.data['pick_state'].value) >= -1  &&
              this.check_if_value_in_responses('reiniciar', VoiceCommandRegister))) {
              console.log('entra al reset');
              this.ResetQties();
      }
    }
  }
  check_if_value_in_responses(value, dict) {
    if (value === dict[0] || value === dict[1] || value === dict[2]) {
      return true;
    } else {
      return false;
    }
  }

  create_buttons() {
    // tslint:disable-next-line:prefer-const
    let buttons = [{
      text: '',
      icon: 'close',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    }];
    if (this.data && true) {
      if (['assigned', 'confirmed'].indexOf(this.data['pick_state'].value) > -1){
        const button = {
          text: 'Comprobar disponibilidad',
          icon: '',
          role: '',
          handler: () => {
            this.ActionAssign();
          }
        };
        buttons.push(button);
      }
      if (['assigned', 'confirmed'].indexOf(this.data['pick_state'].value) > -1){
        const button = {
          text: 'Anular reserva',
          icon: '',
          role: '',
          handler: () => {
            this.DoUnreserve();
          }
        };
        buttons.push(button);
      }
      const button = {
        text: this.FilterMoves,
        icon: '',
        role: '',
        handler: () => {
          this.GetFilteredMoves();
        }
      };
      buttons.push(button);
      const buttonReset = {
          text: 'Reset',
          icon: '',
          role: '',
          handler: () => {
            this.ResetQties();
          }
        };
      // buttons.push(button);
      // buttons.push(buttonReset);

    }

    /* if (this.data['show_check_availability']) {
      actionSheet.buttons.push({
        text: 'Asignar',
          handler: () => {
            this.action_assign();
          }
      })
    } */

    return buttons;
  }

  async presentActionSheet() {
    this.audio.play('click');
    const actionSheet = await this.actionSheetController.create({
      buttons: this.create_buttons()
    });

    await actionSheet.present();
  }

}
