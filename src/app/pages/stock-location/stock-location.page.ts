import { Component, OnInit, HostListener, ViewChild, Input } from '@angular/core';
import {OverlayEventDetail} from '@ionic/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, AlertController, IonContent, ToastController, ActionSheetController, ModalController } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { VoiceService } from '../../services/voice.service';
import { ScannerService } from '../../services/scanner.service';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';
import { BarcodeMultilinePage } from '../barcode-multiline/barcode-multiline.page';
import { ThrowStmt } from '@angular/compiler';



@Component({
  selector: 'app-stock-location',
  templateUrl: './stock-location.page.html',
  styleUrls: ['./stock-location.page.scss'],
})

export class StockLocationPage implements OnInit {

  location: number;
  location_data: {};
  ShowInfo: boolean;
  ShowStock: boolean;
  ShowInventory: boolean;
  ActiveLocation: number;
  ActiveProduct: number;
  ActiveLine: number;
  ActiveLineIndex: number;
  ActiveLocationEl: any;
  loading: any;
  Queue: Array<string>;
  timeout: any;
  LastReading: string;
  Filter = {location_id: 0, product_id: 0};
  BarcodeLength: number;
  ActiveInventory: number;

  @Input() ScannerReading: string;
  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;
  @ViewChild(IonContent) LocationDiv: IonContent;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.scanner.ActiveScanner && this.stock.GetModelInfo('App', 'ActivePage') === 'StockLocationPage' && event.which !== 0) {
      console.log('ENVIANDO TECLAS A ' + this.stock.GetModelInfo('App', 'ActivePage'));
      this.scanner.key_press(event);
      this.scanner.timeout.then((val) => {
      this.onReadingEmitted(val);
    });
    }
  }

  constructor(
    private modalController: ModalController,
    private odoo: OdooService,
    public toastController: ToastController,
    public router: Router,
    public alertCtrl: AlertController,
    public loadingController: LoadingController,
    private route: ActivatedRoute,
    private audio: AudioService,
    public stock: StockService,
    private voice: VoiceService,
    public scanner: ScannerService,
    public actionSheetController: ActionSheetController,
  ) { }

  ionViewDidEnter(){
    this.odoo.isLoggedIn().then((data) => {
      if (data === false) {
        this.router.navigateByUrl('/login');
      } else {
        this.Queue = [];
        this.ShowStock = true;
        this.ShowInfo = false;
        this.ShowInventory = false;
        this.stock.SetModelInfo('App', 'ActivePage', 'StockLocationPage');
        const location = parseInt(this.route.snapshot.paramMap.get('id'));
        this.ActiveProduct = parseInt(this.route.snapshot.paramMap.get('product_id'));
        this.ActiveInventory = parseInt(this.route.snapshot.paramMap.get('inventory_id'));
        if (this.ActiveProduct) {
          this.Filter['product_id'] = this.ActiveProduct;
        }
        if (this.ActiveInventory) {
          this.Filter['inventory_id'] = this.ActiveInventory;
          this.ShowStock = false;
          this.ShowInventory = true;
        }

        this.voice.voice_command_refresh$.subscribe(data => {
          this.voice_command_check();
        });
        this.ActiveLocationEl = null;
        this.GetLocationInfo(location, true, this.Filter);
      }
    })
    .catch((error)=>{
      this.presentAlert('Error al comprobar tu sesión:', error);
    });
  }
  ngOnInit() {
  }
  OpenLocation(LocationId){
    this.router.navigateByUrl('/stock-location/' + LocationId);
  }

  scrollToElement(elementId){
    const ElId = document.getElementById(elementId);
    if (ElId){
      const yOffset = document.getElementById(elementId).offsetTop;
      return this.LocationDiv.scrollToPoint(0, yOffset, 500);
    }
  }

  async presentToast(Str = 'Error de validación', Header = 'Aviso:' ) {
    const toast = await this.toastController.create({
      header: Header,
      message: Str,
      duration: 2000,
    });
    toast.present();
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
  async presentLoading(Message='Cargando ...') {
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
  SetShow(Badge){
    this.ShowStock = false;
    this.ShowInfo = false;
    this.ShowInventory = false;
    this[Badge] = true;
    if (this.ShowInfo){return; }
    this.GetLocationInfo(this.location_data['id'], this.ShowInventory, this.Filter);
  }
  NewInventory(Filter, LocationId, ProductId){
    const values = {location_id: LocationId, product_id: ProductId, create_inventory : true, filter: Filter};
    this.stock.NewInventory(values).then((data) => {
      this.ApplyData(data[0]);
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
    });
  }
  CancelInventory(){
    const values = {cancel: true, location_id: this.location_data['id'], inventory_id: this.location_data['inventory_id']};
    this.stock.ValidateInventory(values).then((data) => {
      this.ApplyData(data[0]);
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
    });
  }
  ValidateInventory(){
    const values = {location_id: this.location_data['id'], inventory_id: this.location_data['inventory_id']};
    this.stock.ValidateInventory(values).then((data) => {
      this.ApplyData(data[0]);
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
    });
  }
  ApplyData(Data) {
    this.location_data = Data;
    this.ActiveLocation =  Data['ActiveLocation'];
    this.ActiveProduct = Data['ActiveProduct'];
    this.ActiveLine = 0;
    this.loading.dismiss();
  }
  RefreshView(){

  }

  DeleteLocation(InventoryId, LocationId, Option){
    this.Filter.location_id = 0;
    let self = this;
    const values = {inventory_id: InventoryId, location_id: LocationId, option: Option}
    this.stock.DeleteLocation(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
    });
  }

  OnClickLocation(LocationId){
    if (this.Filter.location_id === LocationId) {
      this.Filter['location_id'] = 0;
      this.ActiveLocation = 0;
    }
    else {
      this.Filter.location_id = LocationId;
      this.ActiveLocation = LocationId;
    }
    this.ActiveProduct = this.ActiveLineIndex = 0;
    this.Filter['product_id'] = 0;
    const values = {inventory_id: this.location_data['inventory_id'], filter: this.Filter};
    return this.GetInventoryId(values);
  }
  OnClickProduct(LocationIndex, ProductIndex){
    this.ActiveLineIndex = 0;
    const Product = this.location_data['inventory_location_ids'][LocationIndex]['product_ids'][ProductIndex];
    const Location = this.location_data['inventory_location_ids'][LocationIndex]['id'];
    if (this.ActiveProduct === Product['id'] && this.ActiveLocation){
      return this.CheckProduct(Product['wh_code']);
    }
    this.Filter['product_id'] = this.ActiveProduct = Product['id'];
    // this.Filter['location_id'] = this.ActiveLocation =  this.location_data['inventory_location_ids']['id']
    // this.Filter['inventory_id'] = this.ActiveInventory = this.location_data['inventory_id']
    this.BarcodeLength = 0;
    // this.Filter.product_id = true;
    const values = {inventory_id: this.location_data['inventory_id'],
                    location_id: Location,
                    product_id: this.ActiveProduct,
                    filter: this.Filter};
    return this.GetInventoryId(values);
  }
  OnClickLot(LocationIndex, ProductIndex, LineIndex){
    if (this.ActiveLineIndex === 0){
      this.ActiveLineIndex = LineIndex;
    }
    else {
      this.ActiveLineIndex = 0;
    }
  }

  OnClick(LocationIndex, ProductIndex, LineIndex = 0){
    const Location = this.location_data['inventory_location_ids'][LocationIndex];
    const Product = Location['product_ids'][ProductIndex];
    const Line = Product['line_ids'][LineIndex];
    this.ActiveLocation = Location['id'];
    this.ActiveProduct = ProductIndex;
    this.ActiveLine = LineIndex;
    this.RefreshView();
  }

  UpdateLine(values){
    let self = this;
    this.stock.ChangeInventoryLineQty(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
      self.ActiveLocation =  data['ActiveLocation'];
      self.ActiveProduct = data['ActiveProduct'];
      self.ActiveLine = 0;
      self.BarcodeLength = this.location_data['inventory_location_ids'][0].product_ids[0].barcode_length;
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
      //this.loading.dismiss();
    });
  }

  ChangeLineQty(values){
    //this.presentLoading();
    let self = this;
    if (this.ActiveLocation === 0 || this.ActiveProduct === 0){
      this.presentToast('No hay suficiente información para el número de serie/lote');
    }
    if (this.BarcodeLength !== 0 && this.BarcodeLength !== values['serial'].length){
      this.presentToast ('El codigo ' +  values['serial'] + ' no cumple la validación');
      return;
    }
    return this.UpdateLine(values);
  }


  GetLocationInfo(location, StockInventory = false, Filter= {}) {
    this.presentLoading();
    this.stock.GetLocationInfo(location, StockInventory = !this.ShowStock, Filter, true).then((data) => {
      this.ApplyData(data[0]);
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
      this.loading.dismiss();
    });
  }
  folded(quant) {
    quant.folded = !quant.folded;

  }
  GetInventoryId(values){
    this.presentLoading();
    let self = this;
    this.stock.GetInventoryId(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
      this.BarcodeLength = data['barcode_length'];
      this.ActiveLocation = data['ActiveLocation'];
      this.loading.dismiss();
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
      this.loading.dismiss();
    });

  }
  open_link(type, location_id){
    if (type === 'stock') {
      this.router.navigateByUrl('/stock-quant-list/' + location_id);
    } else {
      this.router.navigateByUrl('/stock-location-product-list/' + location_id);
    } 
  }

  // Voice command

  voice_command_check() {
    console.log("voice_command_check");
    console.log(this.voice.voice_command);
    if (this.voice.voice_command) {
      let voice_command_register = this.voice.voice_command;
      console.log("Recibida orden de voz: " + voice_command_register);
      if (this.check_if_value_in_responses("stock", voice_command_register)) {
        console.log("Stock");
        this.router.navigateByUrl('/stock-quant-list/' + this.location['id']);
      } else if (this.check_if_value_in_responses("productos", voice_command_register)){
        console.log("Productos");
        this.router.navigateByUrl('/stock-location-product-list/'+this.location['id']);
      }
    }
  }
  async InputQty(LocationIndex, ProductIndex, LineIndex)
  {
    const Line = this.location_data['inventory_location_ids'][LocationIndex]['product_ids'][ProductIndex]['line_ids'][LineIndex];
    this.audio.play('click');

    const alert = await this.alertCtrl.create({
      header: 'Cantidad',
      subHeader: '',
      inputs: [{name: 'product_qty',
                label: 'Cambio de cantidad. Contada: ' + Line['theoretical_qty'],
                //text: 'Cambio de cantidad. Contada: ' + Line['theoretical_qty'],
                value: Number(Line['product_qty']),
                type: 'number',
                id: 'qty-id',
                }],
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
            if ( Line['product_qty'] !== data['product_qty']) {
              const values = {id: Line['id'],
                              line_id: Line['id'],
                              inventory_id: this.location_data['inventory_id'],
                              location_id: this.ActiveLocation,
                              product_id: this.ActiveProduct,
                              product_qty: data['product_qty'],
                              filter: this.Filter};
              this.ChangeLineQty(values);
            }
          }
        }],
  });
    await alert.present();
  }
  reset_scanner() {
    this.LastReading = this.ScannerReading;
    this.ScannerFooter.ScanReader.controls.scan.setValue('');
    // this.scanner.reset_scan();
    // this.ScanReader.controls.scan.setValue =''
  }
  CheckOpenLocation(val){
    let location = false;
    for (const loc of this.location_data['inventory_location_ids']){
      if (loc.barcode === val){
        this.ActiveLocation = loc['id'];
        location = true;
      }
    }
    if (!location){
      const values = {active_product: this.ActiveProduct,
                      inventory_id: this.location_data['inventory_id'],
                      filter: this.Filter,
                      empty_location: val};
      return this.GetInventoryId(values);
    }
    const LocationDiv = 'Div' + val;
    const ElId = document.getElementById(LocationDiv);
    if (ElId){
      this.ActiveLocationEl = ElId;
      const yOffset = ElId.offsetTop;
      return this.LocationDiv.scrollToPoint(0, yOffset, 500);
    }
  }

  VaciarUbicacionyProducto(){
    return this.DeleteInventoryLine()
  }

  DeleteProductQties(ActiveProduct = 0, ActiveLocation = 0){
    const values = {inventory_id: this.location_data['inventory_id'],
                    location_id: ActiveLocation,
                    product_id: ActiveProduct,
                    product_qty : 0,
                    filter: this.Filter
                    };
    if (this.ActiveLocation === 0){
      this.presentToast("No tienes una ubicación definida")
      return;
    }
    this.presentLoading('Actualizando ...')
    let self = this;
    this.stock.DeleteInventoryLine(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
      // self.ActiveLocation =  data['ActiveLocation'];
      // self.ActiveProduct = data['ActiveProduct'];
      // self.ActiveLine = 0;
      self.loading.dismiss();
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert(error.title, error.msg.error_msg);
    });
    return;
  }

  DeleteInventoryLine(LineId = 0, NewQty = 0){
    const values = {inventory_id: this.location_data['inventory_id'],
                    location_id: this.ActiveLocation,
                    product_id: this.ActiveProduct,
                    filter: this.Filter,
                    line_id: LineId,
                    product_qty : NewQty,
                    };
    if (this.ActiveLocation === 0){
      this.presentToast("No tienes una ubicación definida")
      return;
    }
    this.presentLoading('Actualizando ...')
    let self = this;
    this.stock.DeleteInventoryLine(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
      // self.ActiveLocation =  data['ActiveLocation'];
      // self.ActiveProduct = data['ActiveProduct'];
      // self.ActiveLine = 0;
      self.loading.dismiss();
    })
    .catch((error) => {
      this.loading.dismiss();
      this.presentAlert(error.title, error.msg.error_msg);
    });
    return;
  }


  CheckSerial(val){
    // if (this.ActiveLocation === -1){
    //  this.presentAlert('Aviso', 'Debes seleccionar una estantería');
    //  return true;
    // }
    const values = {inventory_id: this.location_data['inventory_id'],
                    location_id: this.ActiveLocation,
                    product_id: this.ActiveProduct,
                    filter: this.Filter,
                    barcode_length: this.BarcodeLength,
                    wh_code: val,
                    serial: val};

    if (this.ActiveLocation === 0 || this.ActiveProduct === 0){
      return this.GetInventoryId(values);
    }
    this.ChangeLineQty(values);
    return;
  }

  CheckProduct(val){
    var self = this;
    if (this.ActiveLocation === 0){

      this.presentToast('Debes seleccionar una estantería');
      return true;
    }
    let LocProductIds = [];
    for (const Location of this.location_data['inventory_location_ids']){
      if (Location['id'] === this.ActiveLocation){
        LocProductIds = Location['product_ids'];
      }
    }
    for (const product of LocProductIds){
      console.log (product);
      if (product['wh_code'] === val) {
        let incr = 0;
        if (this.ActiveProduct === product['id']) {
          incr = 1;
        }
        else {
          this.ActiveProduct = product['id'];
          const values = {inventory_id: this.location_data['inventory_id'],
                    location_id: this.ActiveLocation,
                    product_id: this.ActiveProduct,
                    filter: this.Filter};
          return this.GetInventoryId(values);
        }
        this.Filter.product_id = this.ActiveProduct;
        if (product['tracking'] === 'none'){
          const line = product['line_ids'][0];
          const values = {line_id: line['id'],
                          inventory_id: this.location_data['inventory_id'],
                          location_id: this.ActiveLocation,
                          product_id: this.ActiveProduct,
                          inc: incr,
                          filter: this.Filter};
          return this.ChangeLineQty(values);
        }
        else {
          const values = {inventory_id: this.location_data['inventory_id'],
                    location_id: this.ActiveLocation,
                    product_id: this.ActiveProduct,
                    filter: this.Filter,
                    wh_code: val};

          if (this.ActiveLocation !== 0){
            return this.GetInventoryId(values);
          }
        }
        break;
      }
    }
    // SI LLEGO AQUÍ DEBO AÑADIR UNA LINEA NUEVA
    if (this.ActiveLocation !== 0 && this.ActiveProduct === 0){
      const values = {
                      inventory_id: this.location_data['inventory_id'],
                      location_id: this.ActiveLocation,
                      wh_code: val,
                      filter: this.Filter};
      return this.UpdateLine(values);
    }
    return false;
  }


  CheckScanner(val){
    for (const scan of val){
      this.CheckScanner_TimeOut(scan);
    }
    return;
    if (val.length < 2){
      this.reset_scanner();
      return;
    }
    console.log('Me llega a check scanner ' + val);
    const time = (this.Queue.length + 1) * 150;
    this.Queue.push(val);
    this.timeout = new Promise ((resolve) => {
      setTimeout(() => {
        if (this.Queue){
          const scan = this.Queue[0];
          this.Queue.splice(0, 1);
          resolve(this.CheckScanner_TimeOut(scan));
        }
       }, time); });
    return this.timeout;
    // este 500 es el tiempo que suma pulsaciones
  }


  CheckScanner_TimeOut(val) {
    if (val === ''){
      this.reset_scanner();
      return;
    }
    // ESCANEO DE ALBARAN. SUPONGO SIEMPRE QUE NO HAY UBICACIONES REQUERIDAS
    // CASO 1: EAN O DEFAULT CODE: SUMO UNA CANTIDAD
    // CASO 2: NUMERO DE SERIE: ESCRIBO SERIE Y CANTIDAD 1 EN LA LINEA
    // compruebo si hay un lote y ven algún movimiento
    // al ser asycrono tengo que hacer las busquedas anidadas
    this.audio.play('click');
    if (eval(this.location_data['barcode_re']).exec(val) ) {

      // Leo UBICACION. Busco el primer movieminto interno que tenga esa ubicación en el codigo de barras.
      this.CheckOpenLocation(val);
    }
      // Busco los movimeintos que pertenecemn a esta albrán
      //
    else if (this.ActiveProduct){
      this.CheckSerial(val);
    }
    else {
      this.CheckProduct(val);
    }

    this.reset_scanner();
    return;
  }

  check_if_value_in_responses(value, dict) {
    if (value === dict[0] || value === dict[1] || value === dict[2]) {
      return true;
    } else {
      return false;
    }
  }

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
  onReadingEmitted(val: string) {
    const delay = 200;
    let index = 0;
    for (const scan of val){
      if (scan !== ''){
        index += 1;
        setTimeout(() => {
          this.ScannerReading = scan;
          this.audio.play('click');
          this.CheckScanner_TimeOut(scan);
        }, delay * index);
      }
    }
    return;
  }
  GetProductName(ProductId){
    const Quants = this.location_data['quants']
    for (const quant in Quants){
      if (Quants[quant]['id'] === ProductId){
        return {  index: quant,
                  product_index: quant,
                  default_code: Quants[quant]['default_code'],
                  wh_code: Quants[quant]['wh_code']
};
      }
    }
    const LocIds = this.location_data['inventory_location_ids'];
    // tslint:disable-next-line:forin
    for (const Idx in LocIds){
      for (const IdxP in LocIds[Idx]['product_ids']) {
        if (ProductId === LocIds[Idx]['product_ids'][IdxP]['id']){
          return {  index: Idx,
                    product_index: IdxP,
                    default_code: LocIds[Idx]['product_ids'][IdxP]['default_code'],
                    wh_code: LocIds[Idx]['product_ids'][IdxP]['wh_code']
          };
        }
      }
    }

  }
  GetLocationName(LocationId){
    const LocationIds = this.location_data['inventory_location_ids'];
    for (const Idx in LocationIds){
      if (LocationId === LocationIds[Idx]['id']){
        return {index: Idx,
                name: LocationIds[Idx]['name'],
                barcode: LocationIds[Idx]['barcode'] }
      }

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
    let Button = {
      text: 'Validar inventario',
      icon: 'checkmark-done-circle-outline',
      role: '',
      handler: () => {
        this.ValidateInventory();
      }
    };
    buttons.push(Button);

    if (this.ActiveLocation){
      let msg = 'Vaciar ' + this.GetLocationName(this.ActiveLocation)['name'];
      if (this.ActiveProduct){
        msg += '[' + this.GetProductName(this.ActiveProduct)['default_code'] + ']';
      }

      Button = {
        text: msg,
        icon: 'share-outline',
        role: '',
        handler: () => {
          this.VaciarUbicacionyProducto();
        }
      };
      buttons.push(Button);
    }

    // <ion-icon style="margin: 3px" slot="end" name="flash-off-outline" (click)="GetLocationInfo(location_data['id'], true)"></ion-icon>
    Button = {
      text: 'Validar inventario',
      icon: 'checkmark-done-circle-outline',
      role: '',
      handler: () => {
        this.ValidateInventory();
      }
    };
    buttons.push(Button);

    Button = {
      text: 'Cancelar  inventario',
      icon: 'trash-outline',
      role: '',
      handler: () => {
        this.CancelInventory();
      }
    };
    buttons.push(Button);

    if (this.BarcodeLength) {
      Button = {
        text: 'Anular chequeo nº de serie',
        icon: '',
        role: '',
        handler: () => {
          this.BarcodeLength = 0;
        }
      };
      buttons.push(Button);
    }
    // <!--ion-icon style="margin: 3px" slot="end" name="checkmark-done-circle-outline" (click)="ValidateInventory()"></ion-icon-->
    // <!--ion-icon slot="end" name="reload-circle-outline" (click)="DeleteLocation(location_data['inventory_id'], loc.id, 'reset')"></ion-icon-->
    if (this.ActiveLocation && false){
      Button = {
      text: 'Resetar datos',
      icon: 'reload-circle-outline',
      role: '',
      handler: () => {
        this.DeleteLocation(this.location_data['inventory_id'], this.ActiveLocation, 'reset');
        }
      };
      buttons.push(Button);
    }
    return buttons;
  }

  async ShowOptions() {
    this.audio.play('click');
    const actionSheet = await this.actionSheetController.create({
      buttons: this.create_buttons()
    });

    await actionSheet.present();
  }

  OpenBarcodeMultiline(ProductId, p_name, l_name){
    this.scanner.ActiveScanner = false;
    this.stock.SetModelInfo('App', 'ActivePage', '');
    this.openModalBarcodeMulti(ProductId, p_name, l_name);
  }
  async openModalBarcodeMulti(PrId, p_name, l_name){
    const modal = await this.modalController.create({
      component: BarcodeMultilinePage,
      componentProps: { LocationId: this.ActiveLocation,
                        InventoryId: this.location_data['inventory_id'],
                        ProductId: PrId,
                        LName: l_name,
                        PName: p_name,
                        IName: this.location_data['inventory_name']
                      },
    });
    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      this.stock.SetModelInfo('App', 'ActivePage', 'StockLocationPage');
      if (detail !== null) {
        const values = {inventory_id: this.location_data['inventory_id'],
                        location_id: this.ActiveLocation,
                        product_id: PrId,
                        ean_ids: detail['data']};
        this.LoadEans(values);
      }
    });
    await modal.present();
  }
  LoadEans(values){
    this.presentLoading();
    let self = this;
    this.stock.LoadEans(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
      this.BarcodeLength = data['barcode_length'];
      this.ActiveLocation = data['ActiveLocation'];
      this.loading.dismiss();
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
      this.loading.dismiss();
    });

  }
}
