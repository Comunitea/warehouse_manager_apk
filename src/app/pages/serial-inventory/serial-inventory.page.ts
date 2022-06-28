import { Component, OnInit, ViewChild, Input, HostListener} from '@angular/core';
import { IonicSelectableComponent } from 'ionic-selectable';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController, AlertController, IonInfiniteScroll, ActionSheetController, LoadingController } from '@ionic/angular';
import { ScannerService } from '../../services/scanner.service';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { OdooService } from '../../services/odoo.service';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';



type Product = {'id': number, 'default_code': string, 'name': string, 'display_name': string} ;
type Location = {'id': number, 'barcode': string, 'name': string, 'display_name': string, 'usage': string};

@Component({
  selector: 'app-serial-inventory',
  templateUrl: './serial-inventory.page.html',
  styleUrls: ['./serial-inventory.page.scss'],
})

export class SerialInventoryPage implements OnInit {

  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;
  @Input() ScannerReading: string;

  //Navegación
  Selected: number; // -1 si no hay ninguno, si no es el indice del que está seleccionado
  SelectedLine: {};
  MoveSelected: {};
  Indice: number;
  InventoryProductId: Product // Producto del inventario (si existe)
  InventoryLocationId: Location // Ubicación del inventario (Existe)

  product_id: {}; // id de producto seleccionado
  location_id: {}; // id de producto seleccionado
  product_ids: any
  location_ids: any
  SerialInventory: {};
  line_ids: Array<{}>
  VisibleLines: Array<{}>
  inventory: {}
  type: string; // product, location, none u all
  //
  ShowLocationSearch: boolean;
  ShowProductSearch: boolean;

  // LOADING CONTROLLER
  loading: any;
  timeout: any;
  LastMove: {};

  Limit: number;
  WaitingNewLot: boolean;
  
  FilterAcl : boolean; // Si está marcado filtramos por pendientes
  Filter0 : boolean // Si está marcado, filteramos por no existencias

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.scanner.ActiveScanner){
      console.log("Escaner Desactivado")
    }
    else {console.log("Escaner Activado")}
    if (!this.scanner.ActiveScanner && this.stock.GetModelInfo('App', 'ActivePage') === 'SerialInventory' && event.which !== 0) {
        console.log('ENVIANDO TECLAS A ' + this.stock.GetModelInfo('App', 'ActivePage'));
        this.scanner.key_press(event);
        this.scanner.timeout.then((val) => {
        this.onReadingEmitted(val);
    });
  }
}
  constructor( public router: Router,
    public scanner: ScannerService,
    public odooCon: OdooService,
    public loadingController: LoadingController,
    public alertController: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public stock: StockFunctionsService,) { }
  
    async presentLoading(Message= '...', duration=3500) {
      // this.loading.getTop().then(v => v ? this.loading && this.loading.dismiss() : null);
      this.loading = await this.loadingController.create({
        message: Message,
        duration: duration,
        keyboardClose: true,
        backdropDismiss: true,
        translucent: true,
        cssClass: 'custom-class custom-loading'
      });
  
      await this.loading.present();
    }

  TabNavegarA(URL){
      this.router.navigateByUrl(URL);
    }
  
  onReadingEmitted(val: string) {
    const delay = 200;
    let index = 0;
    console.log("ANALIZO EN Inventory:" + val);
    for (const scan of val){
      if (scan !== '') {
        index += 1;
        setTimeout(() => {
          this.ScannerReading = scan;
          this.stock.play('click');
          this.CheckScanner(scan);
        }, delay * index);
      }
    }
    return;
  }
  CheckScanner(scan) {
    if (!this.location_id){
      const location_id = this.stock.Locations.filter(x=> x['barcode'] == scan || x['name'] == scan)
      if (location_id.length == 1){
        this.location_id = location_id[0]
      }
      return
    }
    if (!this.product_id){
      const product_id = this.stock.Products.filter(x=> x['default_code'] == scan || x['name'] == scan)
      if (product_id.length == 1){
        this.product_id = product_id[0]
      }
      return
    }
    if (!this.inventory){
      return this.stock.presentToast("No hay datos completos para leer números de serie")
    }
    if (this.inventory){
      const serial = this.inventory['serial_ids'].filter(x => x['name'] == scan)
      if (serial.length == 1){
        
        console.log("LO REORDENO")
        const serial_ids = this.inventory['serial_ids'].filter(x => x['name'] != serial[0]['name'])
        serial_ids.unshift(serial[0])
        this.inventory['serial_ids'] = serial_ids
        this.ClickSerial(this.inventory['serial_ids'][0])
      }
      if (serial.length == 0){
        // Hay que crearlo.
        const NewSerial = {'id': -1, 'name': scan, 'to_delete': false}
        this.inventory['serial_ids'].unshift(NewSerial)
        this.CreateSerialAsync(NewSerial)
      }
    }


  }

  ionViewDidEnter(){
    this.scanner.ActiveScanner = false;
    this.stock.SetModelInfo('App', 'ActivePage', 'SerialInventory');
    // this.LoadInventory();
    // this.WaitingNewLot = false;
    // this.GetSelects();
  }

  ngOnInit() {
    if (!this.stock.Persistent){
      this.stock.LoadPersistentData()
    }
    // this.location_id = {'id': 0, 'barcode': '', 'name': "Stock"}
    this.product_ids = []
    this.location_ids = []
    this.WaitingNewLot = false;
    this.inventory = null
    this.Selected = -1
    this.LastMove = {}
    this.GetSelects()
  }
  OnSearchFocus(val: boolean){
    console.log("Poneindo Active Sacanner a " + val)
    this.scanner.ActiveScanner = val ;    
  }
  SelectSearch(event: { component: IonicSelectableComponent, value: any}, field='product_ids'){
    
    const SearchStr = event.component._searchText.toUpperCase()
    if (SearchStr.length < 2){
      event.component.endSearch();
      return
    }
    return this.GetSearchs(SearchStr, field)
  }
  OnClear(field=''){
    if (field=='location_ids'){this.location_id = null}
    if (field=='product_ids'){this.product_id = null}
    this.inventory = null
  }

  GetSearchs(search='', field='', id=0){
    if (this.inventory){
      return
    }
    if (field === 'location_ids'){
        this.location_ids = this.stock.Locations.filter(x => (x['no_child_ids'] && (x['usage'] === 'internal') && 
          (x['barcode'] + x['name']).toUpperCase().indexOf(search) > -1)).slice(0,10)
    }
    else if (field == 'product_ids'){
        this.product_ids = this.stock.Products.filter(x=> x['virtual_tracking'] == true && (x['barcode'] + x['name']).toUpperCase().indexOf(search) > -1).slice(0,10)
    }
    return;
  }
  
  async GetSelects(){
    this.GetSearchs('', 'location_ids')
    this.GetSearchs('', 'product_ids')
    return
  }

  locationChange(event: { component: IonicSelectableComponent, value: any}) {
    let value = event['value']
    console.log(event['component'])
    console.log(event['value'])
    if (value){
      this.location_id = value
    }
   
  }

  productChange(event: {component: IonicSelectableComponent, value: any}) {
    let value = event['value']
    console.log(event['component'])
    console.log(event['value'])
    if (value){
      this.product_id = value
    }
  }
  CreateSerialAsync(Serial){
    const values={inventory_id: this.inventory['id'], name: Serial['name']}
    console.log("Generate New Serial Line")
    const self = this;
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.serial.inventory', 'create_serial_async', values).then((Res: {}) => {
        // Res es la línea
        console.log(Res)
        let s_id = this.inventory['serial_ids'].filter(x => x['name'] == Res['name'])[0] 
        s_id['id'] = Res['id']
        s_id['to_delete'] = Res['to_delete']
        s_id['serial_id'] = Res['serial_id']
        
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  ApplyInventory(inventory){
    this.inventory = inventory
    console.log(inventory)
    this.location_id = this.stock.Locations.filter(x=> x['id'] == inventory['location_id']['id'])[0]
    this.product_id = this.stock.Products.filter(x=> x['id'] == inventory['product_id']['id'])[0]
  }
  GenerateNewSerialInventory(inventory=0, location=0, product=0, create=true){
    if (!inventory) {
      if (!location){
        location = this.location_id['id']
      }
      if (!product){
        product = this.product_id['id']
      }
    }
    console.log("Generate New Serial Inventory")
    const self = this;
    const values = {inventory_id: inventory, product_id: product, location_id: location, create: create }
    this.presentLoading('Creando/Buscando nuevo inventario de nuemros de serie.... ')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.serial.inventory', 'load_serial_inventory', values).then((Res: {}) => {
        self.loading.dismiss();
        self.ApplyInventory(Res)
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  ClickSerial(Serial){
    Serial['to_delete'] = !Serial['to_delete']
    this.WriteAsyn('serial.line.wzd', [Serial['id']], {'to_delete': Serial['to_delete']})
  }

  OnChangeUpdateQty(){
    console.log("Acualizando Update QTY a " + this.inventory['update_quant_qty'])
    return this.WriteAsyn('stock.serial.inventory', [this.inventory['id']], {'update_quant_qty': this.inventory['update_quant_qty']})
  }
  // ESCRITURA EN SML ASYNCRONA > NO NECESITA RECARGAR
  WriteAsyn(model, ids= [], vals= {}){
    const self = this;
    const promise = new Promise((resolve, reject) => {
      self.odooCon.write(model, ids, vals).then((Res: boolean) => {
        // Todo ok
        self.loading.dismiss();
      })
    .catch((error) => {
      self.loading.dismiss();
      this.stock.play('error');
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;
  }

  async CreateInventoryButtons(Res){
    const Buttons = [];
    if (this.product_id && this.location_id) {
    Buttons.push({
      text: "Nuevo",
      handler: () => {
        this.GenerateNewSerialInventory();
      }});
    }
    for (const inv of Res){
        Buttons.push({
            text: inv['name'],
            handler: () => {
              this.GenerateNewSerialInventory(inv['id']);
          }});
        }
    Buttons.push( {
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    });
  
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Inventarios',
      buttons: Buttons
    });
    await actionSheet.present();
  }
  async CreateLoadInventory(domain=null){
    const values = {domain: domain}
    const self = this;
    this.presentLoading('Cargando último inventario ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.serial.inventory', 'load_inventory_list', values).then((Res: Array<{}>) => {
        self.loading.dismiss();
        self.CreateInventoryButtons(Res)
      })
      .catch((error) => {
        self.loading.dismiss();
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  async Validate(){
    const values = {id: this.inventory['id']}
    const self = this;
    this.presentLoading('Validando Nº de serie ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.serial.inventory', 'validate_apk', values).then((Res: boolean) => {
        self.loading.dismiss();
        if (Res){
          this.product_id = null
          this.location_id = null
          this.inventory = null
          this.InventoryLocationId = this.InventoryProductId = null
        }
        else {
          self.stock.presentToast("Ha ocurrido un error durante la validación")
        }
      })
      .catch((error) => {
        self.loading.dismiss();
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  async Resetear(reset=true){
    const values = {id: this.inventory['id'], reset: reset}
    const self = this;
    this.presentLoading('Reseteando Nº de serie ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.serial.inventory', 'reset_apk', values).then((Res: {}) => {
        self.loading.dismiss();
        if (!reset){
          this.product_id = null
          this.location_id = null
          this.inventory = null
          this.InventoryLocationId = this.InventoryProductId = null
        }
        else if (Res){
          self.ApplyInventory(Res)
        }
        else {
          self.stock.presentToast("Ha ocurrido un error durante el reseteo")
        }
      })
      .catch((error) => {
        self.loading.dismiss();
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
   // BOTONES DE ACCION
   async presentButtons() {
    const Buttons = [];
    if (this.inventory){
      Buttons.push({
        text: 'Validar Inventario',
        icon: 'add-circle-outline',
        handler: () => {
          this.Validate();
      }});

      Buttons.push({
        text: 'Resetear',
        icon: 'refresh-circle-outline',
        handler: () => {
          this.Resetear(true);
      }});
      Buttons.push({
        text: 'Nuevo',
        icon: 'battery-charging-outline',
        handler: () => {
          this.Resetear(false);
      }});
      
    }
    if (!this.inventory){

    }

    Buttons.push( {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Acciones',
      buttons: Buttons
    });
    await actionSheet.present();
  }

}
