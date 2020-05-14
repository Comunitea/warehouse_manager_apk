import { OdooService } from '../../services/odoo.service';
import { Component, OnInit, Input, HostListener} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ActionSheetController, ModalController } from '@ionic/angular';
import { StockService } from '../../services/stock.service';
import { AudioService } from '../../services/audio.service';
import { VoiceService } from '../../services/voice.service';
import { Location } from "@angular/common";
import { LoadingController } from '@ionic/angular';
import { ScannerService } from '../../services/scanner.service';


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
  picking: string;
  PickingCode: string;
  ActiveOperation: boolean;
  loading: any;
  MoveStates: boolean;
  NextPrev: Array<BigInteger>;

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
    public actionSheetController: ActionSheetController
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
    this.picking = this.route.snapshot.paramMap.get('id');
    this.GetPickingInfo(this.picking);
    this.voice.voice_command_refresh$.subscribe(VoiceData => {
    console.log(VoiceData);
    this.voice_command_check();
    });
    this.audio.play('click');
  }
  ngOnInit() {
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
do_local_search(val) {
  return false;
}
check_Scanner(val) {
  // compruebo si hay un lote y ven algún movimiento
  if (this.data) {
    if (this.do_local_search(val)) {
      return;
    }
    // Busco los moviemintos que pertenecemn a esta albrán
    //
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
  }
}

  onReadingEmitted(val: string) {
    
    if (this.moves.includes(val)) {
      this.page_controller(val);
    } else {
      this.ScannerReading = val;
      return this.check_Scanner(val);
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

  open_link(LocationId){
    this.audio.play('click');
    this.router.navigateByUrl('/stock-location/' + LocationId);
  }

  action_assign(){
    // Las funciones debería devolver ya la  recarga para ahorrar una llamada
    this.stock.action_assign(this.picking).then((data) => {
      if (data === true) {
        console.log('Reloading');
        this.GetPickingInfo(this.picking);
      }
    })
    .catch((error) => {
      this.presentAlert('Error al asignar cantidades:', error);
    });
  }

  button_validate(){
    this.presentLoading();
    this.stock.button_validate(Number(this.picking)).then((data) => {
      if (data && data['err'] === false) {
        console.log('Reloading');
        this.loading.dismiss();
        this.location.back();
      } else if (data['err'] !== false) {
        this.loading.dismiss();
        this.presentAlert('Error al validar el albarán:', data['err']);
      }
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert('Error al validar el albarán:', error);
    });
  }

  async force_set_qty_done(MoveId, field, model = 'stock.picking'){
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
    await this.stock.force_reset_qties(Number(PickId), 'stock.picking').then((data) => {
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
    let ActiveIds = this.stock.GetModelInfo('stock.picking', 'ActiveIds');
    this.router.navigateByUrl('/stock-picking-list');
  }
  ApplyPickData(data){
    this.data = data;
    this.NextPrev = this.stock.GetNextPrev('stock.picking', data['id']);
  }
  GetPickingInfo(PickId, index = 0) {
    this.stock.GetPickingInfo(PickId, index).then((data) => {
      this.ApplyPickData(data);
    })
    .catch((error) => {
      this.presentAlert('Error al recuperar el movimiento:', error);
    });
  }

  get_picking_info(PickId) {
      return this.GetPickingInfo(PickId);
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
        this.button_validate();
      }
      else if (this.data &&
                (['confirmed', 'assigned'].indexOf(this.data['state'].value) >= -1  &&
                this.check_if_value_in_responses('hecho', VoiceCommandRegister))) {
          console.log('entra al hecho');
          this.force_set_qty_done(this.data['id'], 'product_qty', 'stock.picking');
      }
      else if (this.data &&
              (['confirmed', 'assigned'].indexOf(this.data['state'].value) >= -1  &&
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
      if (this.data['field_status'] || this.data['state'].value === 'assigned') {
        const button = {
          text: 'Validar',
          icon: '',
          role: '',
          handler: () => {
            this.button_validate();
          }
        };
        buttons.push(button);
      }
      if (['assigned', 'confirmed'].indexOf(this.data['state'].value) > -1){
        const button = {
          text: 'Comprobar disponibilidad',
          icon: '',
          role: '',
          handler: () => {
            this.action_assign();
          }
        };
        buttons.push(button);
      }
      if (['assigned', 'confirmed'].indexOf(this.data['state'].value) > -1){
        const button = {
          text: 'Anular reserva',
          icon: '',
          role: '',
          handler: () => {
            this.action_assign();
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
