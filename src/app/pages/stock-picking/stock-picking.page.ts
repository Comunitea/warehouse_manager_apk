import { OdooService } from '../../services/odoo.service';
import { Component, OnInit, ViewChild, Input, HostListener} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ActionSheetController, ModalController } from '@ionic/angular';
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

  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;

  @Input() ScannerReading: string;
  @Input() voice_command: boolean;
  @Input() pick: {};
  ngSwitch: any;


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.stock.GetModelInfo('App', 'ActivePage') === 'StockPickingPage') {
    this.scanner.key_press(event);
    this.scanner.timeout.then((val) => {
      this.onReadingEmitted(val);
    });
  }
  }

  constructor(
    public modalController: ModalController,
    private scanner: ScannerService,
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    private audio: AudioService,
    private voice: VoiceService,
    public stock: StockService,
    private route: ActivatedRoute,
    private location: Location,
    public loadingController: LoadingController,
    public actionSheetController: ActionSheetController,
  ) {
    this.moves = ['up', 'down', 'left', 'right'];
  }


  OpenModal(ModelO, Id) {
    this.router.navigateByUrl('/info-sale-order/' + Id);
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
    this.GetPickingInfo(this.picking);
    this.voice.voice_command_refresh$.subscribe(VoiceData => {
    console.log(VoiceData);
    this.voice_command_check();
    });
    this.audio.play('click');
  }
  ngOnInit() {
    this.StateIcon = this.stock.getStateIcon('stock.move');
    this.TrackingIcon = this.stock.getTrackingIcon('stock.move');
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
async InputQty(Index)
  {
    const Move = this.data['move_lines'][Index];
    if (Move.reserved_availability == 0){
      return this.presentAlert('Aviso', 'No tienes ninguna cantidad reservada. Regulariza inventario')
    }
    this.audio.play('click');
    if (this.data['pick_state'].value === 'done') {return; }
    if (Move['tracking']['value'] !== 'none'){
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Cantidad',
      subHeader: '',
      inputs: [{name: 'qty_done',
               value: Number(Move['quantity_done']),
               type: 'number',
               id: 'qty-id',
               // cssClass: 'input-number primary',//
               // class: 'input-number',
               placeholder:  Move['quantity_done']}],
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
              this.stock.UpdateMoveQty( Move['id'], false, false, data['qty_done'], false).then((res) => {
                if (res !== false){
                  self.data['move_lines'][Index] = res[0];
                  return true;
                }
              }).catch((error) => {

              });
            }
          }
        }],
  });
    await alert.present();
  }

CheckProduct(val){
  let index = 0;
  for (const move of this.data['move_lines']){
    if (move.product_id.wh_code === val) {
      if (move.tracking.value === 'none') {
        let self = this;
        // Si leo un producto, y no tiene seguimiento: +1 en la cantidad. Si es por lotes igual
        this.stock.UpdateMoveQty(move['id'], false, false, false, 1).then((res) => {
          if (res !== false){
            self.data['move_lines'][index] = res[0];
            // ThisMove = res[0];
            // const UpMove = res[0];
            // for (const move in self.data['move_lines']){
            //  if (self.data['move_lines'][move]['id'] === UpMove['id']) {self.data['move_lines'][move] = UpMove; }
            // }
            return true;
          }
        }).catch((error) => {

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
    index += 1;
  }
}
CheckAddQty(val){
  for (const move of this.data['move_lines']){
    if (move.tracking.value === 'none' && move.product_id.wh_code === val){
      if (move.tracking.value === 'none') {
        move.quantity_done += 1;
        // actualizo en el servidor el movimiento ya no me hace falta esperar ya que puede ser asycrono
        this.stock.UpdateMoveQty(move['id'], false, false, move['quantity_done'], false).then((res) => {}).catch((error) => {});
        return true;
      }
    }
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
  this.stock.FindSerialForMove(val, this.picking, remove).then ((res) => {
    if (res !== false){
      const UpMove = res[0];
      for (const move in self.data['move_lines']){
        if (self.data['move_lines'][move]['id'] === UpMove['id']) {self.data['move_lines'][move] = UpMove; }
      }
      return true;
    }
  }) .catch((error) => {
    this.presentAlert(error.tittle, error.msg.error_msg);
  });
  return false;
}

do_local_search(val) {
  if (this.CheckAddQty(val)){return true; }
  if (val.length === 12){
    if (this.CheckOpenPicking(val)){return true; }
  }
  return false;
}
reset_scanner() {
  this.LastReading = this.ScannerReading;
  this.ScannerFooter.ScanReader.controls.scan.setValue('');
  // this.scanner.reset_scan();
  // this.ScanReader.controls.scan.setValue =''
}
CheckScanner(val) {
  if (val === ''){
    this.reset_scanner();
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


  const model = 'stock.move';
  // tslint:disable-next-line:prefer-const
  let ids = [];
  for (const move of this.data['move_lines']) {
    ids.push(move['id']);
  }

  const domain = [];
  this.stock.get_obj_by_scanreader(model, val, ids, domain).then ((MoveToNavigate) => {
    if (MoveToNavigate !== false) {
      // Comprobar casod e que devuelva varios ids
      this.router.navigateByUrl('/move-form/' + MoveToNavigate[0]);
    }
  })
  .catch((error) => {
    this.presentAlert('error al buscar en ' + val + 'en ' + model, error);
  });
  this.LastReading = val;
}

  onReadingEmitted(val: string) {
    if (this.moves.includes(val)) {
      this.page_controller(val);
    } else {
      this.ScannerReading = val;
      return this.CheckScanner(val);
    }
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

  OpenLink(LocationId, model= 'move-form'){
    this.audio.play('click');
    this.router.navigateByUrl('/' + model + '/' + LocationId);
  }

  ActionAssign(){
    // Las funciones debería devolver ya la  recarga para ahorrar una llamada
    this.stock.ActionAssignPick(this.picking).then((data) => {
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al asignar cantidades:', error);
    });
  }
  DoUnreserve(){
    // Las funciones debería devolver ya la  recarga para ahorrar una llamada
    this.stock.DoUnreservePick(this.picking).then((data) => {
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al asignar cantidades:', error);
    });
  }
  ChangePickingValue(Field, Value){
    let self = this;
    const values = {model: 'stock.picking.batch', id: this.picking, field: Field, value: Value};
    this.stock.ChangeFieldValue(values).then((OK: Array<{}>) => {
      for (const Item of OK){
        self.data[Item['field']] = Item['value'];
      }
    }).catch((error) => {
      this.presentAlert('Error', error);
    });
  }
  ButtonValidate(){
    if (this.data['current_packages'] * this.data['current_height'] === 0) {
      this.presentAlert('Aviso!', 'Rellena correctamente los campos de paquetes y peso');
      return;
    }
    this.presentLoading();
    this.stock.ButtonValidate(Number(this.picking)).then((data) => {
      this.loading.dismiss();
      this.router.navigateByUrl('/stock-picking-list');
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al validar el albarán:', error);
    });
  }

  async force_set_qty_done(MoveId, field, model = 'stock.picking.batch'){
    await this.stock.force_set_qty_done(Number(MoveId), field, model).then((data) => {
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al forzar la cantidad:', error);
    });
  }

  async force_reset_qties(PickId){
    await this.stock.force_reset_qties(Number(PickId), 'stock.picking.batch').then((data) => {
      console.log(data);
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al forzar la cantidad:', error);
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

  NavigatePickingList(){
    this.audio.play('click');
    let ActiveIds = this.stock.GetModelInfo('stock.picking.batch', 'ActiveIds');
    this.router.navigateByUrl('/stock-picking-list');
  }
  ApplyPickData(data){
    this.data = data;
    this.NextPrev = this.stock.GetNextPrev('stock.picking.batch', data['id']);

  }
  GetPickingInfo(PickId, index = 0) {
    this.stock.GetPickingInfo(PickId, index).then((data) => {
      this.ApplyPickData(data);
    })
    .catch((error) => {
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
              this.force_reset_qties(this.data['id']);
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
      const buttonReset = {
          text: 'Reset',
          icon: '',
          role: '',
          handler: () => {
            this.force_reset_qties(this.data['id']);
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
