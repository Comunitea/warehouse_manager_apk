import { Component, OnInit, HostListener, ViewChild, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, AlertController, IonContent,  } from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { AudioService } from '../../services/audio.service';
import { StockService } from '../../services/stock.service';
import { VoiceService } from '../../services/voice.service';
import { ScannerService } from '../../services/scanner.service';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';


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
  ActiveLocationEl: any;
  loading: any;
  Queue: Array<string>;
  timeout: any;
  LastReading: string;
  Filter = {location_id: false, product_id: false};

  @Input() ScannerReading: string;
  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;
  @ViewChild(IonContent) LocationDiv: IonContent;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.stock.GetModelInfo('App', 'ActivePage') === 'StockLocationPage' && event.which !== 0) {
      console.log('ENVIANDO TECLAS A ' + this.stock.GetModelInfo('App', 'ActivePage'));
      this.scanner.key_press(event);
      this.scanner.timeout.then((val) => {
      this.onReadingEmitted(val);
    });
    }
  }

  constructor(
    private odoo: OdooService,
    public router: Router,
    public alertCtrl: AlertController,
    public loadingController: LoadingController,
    private route: ActivatedRoute,
    private audio: AudioService,
    public stock: StockService,
    private voice: VoiceService,
    private scanner: ScannerService
  ) { }

  ionViewDidEnter(){

    this.odoo.isLoggedIn().then((data)=>{
      if (data === false) {
        this.router.navigateByUrl('/login');
      } else {
        this.Queue = [];
        this.ShowStock = true;
        this.ShowInfo = false;
        this.ShowInventory = false;
        this.stock.SetModelInfo('App', 'ActivePage', 'StockLocationPage');
        const location = this.route.snapshot.paramMap.get('id');
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
  async presentAlert(titulo, texto) {
    this.audio.play('error');
    const alert = await this.alertCtrl.create({
        header: titulo,
        subHeader: texto,
        buttons: ['Ok']
    });
    await alert.present();
  }
  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Cargando ...',
      translucent: true,
      cssClass: 'custom-class custom-loading'
    });
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
  NewInventory(Filter){
    const values = {location_id: this.location_data['id'], filter: Filter};
    this.stock.NewInventory(values).then((data) => {
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
    this.Filter.location_id = false;
    let self = this;
    const values = {inventory_id: InventoryId, location_id: LocationId, option: Option }
    this.stock.DeleteLocation(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
    });
  }

  OnClickLocation(LocationId){
    if (this.Filter.location_id === LocationId) {
      this.Filter.location_id = false;
      this.ActiveLocation = 0;
    }
    else {
      this.Filter.location_id = LocationId;
      this.ActiveLocation = LocationId;
    }
    this.ActiveProduct = 0;
    const values = {inventory_id: this.location_data['inventory_id'], filter: this.Filter};
    return this.GetInventoryId(values);
  }
  OnClickProduct(LocationIndex, ProductIndex){
    const Product = this.location_data['inventory_location_ids'][LocationIndex]['product_ids'][ProductIndex];
    this.ActiveProduct = Product['id'];
  }
  OnClickLot(LocationIndex, ProductIndex, LineIndex){
    return;
    const Line = this.location_data['inventory_location_ids'][LocationIndex]['product_ids'][ProductIndex]['line_ids'][LineIndex];
    if (this.ActiveLine !== LineIndex) {
      this.ActiveLine = LineIndex;
      }
    else {
      this.ActiveLine = -1;
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
  ChangeLineQty(values){
    //this.presentLoading();
    let self = this;
    this.stock.ChangeInventoryLineQty(values).then((data) => {
      self.location_data['inventory_location_ids'] = data['inventory_location_ids'];
      self.ActiveLocation =  data['ActiveLocation'];
      self.ActiveProduct = data['ActiveProduct'];
      self.ActiveLine = 0;
      //self.loading.dismiss();
    })
    .catch((error) => {
      this.presentAlert(error.title, error.msg.error_msg);
      //this.loading.dismiss();
    });
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
      this.router.navigateByUrl('/stock-quant-list/'+location_id);
    } else {
      this.router.navigateByUrl('/stock-location-product-list/'+location_id);
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
        this.router.navigateByUrl('/stock-quant-list/'+this.location['id']);
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
  CheckSerial(val){
    // if (this.ActiveLocation === -1){
    //  this.presentAlert('Aviso', 'Debes seleccionar una estantería');
    //  return true;
    // }
    const values = {inventory_id: this.location_data['inventory_id'],
                    location_id: this.ActiveLocation,
                    product_id: this.ActiveProduct,
                    filter: this.Filter,
                    wh_code: val,
                    serial: val};

    if (this.ActiveLocation === 0){
      return this.GetInventoryId(values);
    }
    this.ChangeLineQty(values);
    return;
  }
  CheckProduct(val){
    if (this.ActiveLocation === 0){
      this.presentAlert('Aviso', 'Debes seleccionar una estantería');
      return true;
    }
    const location = this.location_data['inventory_location_ids'];
    for (const product of location['product_ids']){
      if (product['wh_code'] === val) {
        this.ActiveProduct = product['id'];
        if (product['tracking'] === 'none'){
          const line = product['line_ids'][0];
          const values = {line: line['id'],
                          inventory_id: this.location_data['inventory_id'],
                          location_id: this.ActiveLocation,
                          product_id: this.ActiveProduct,
                          inc: 1,
                          filter: this.Filter};
          this.ChangeLineQty(values);
          return true;
        }
        break;
      }
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
    else if (eval(this.location_data['product_re']).exec(val) ) {
      // Leo PRODUCTO. Busco el primer movieminto que tenga ese warehouse_cpde que tenga esa ubicación en el codigo de barras.
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

    for (const scan of val){
      this.ScannerReading = scan;
      this.audio.play('click');
      this.CheckScanner_TimeOut(scan);
    }
    return;
  }
}
