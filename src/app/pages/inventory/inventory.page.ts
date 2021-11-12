import { Component, OnInit, ViewChild, Input, HostListener} from '@angular/core';
import { IonicSelectableComponent } from 'ionic-selectable';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController, AlertController, IonInfiniteScroll, ActionSheetController, LoadingController } from '@ionic/angular';
import { ScannerService } from '../../services/scanner.service';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { OdooService } from '../../services/odoo.service';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';


type Product = {'id': number, 'default_code': string, 'name': string} ;
type Location = {'id': number, 'barcode': string, 'name': string, 'display_name': string, 'usage': string};
type Lot = {'id': number, 'name': string, 'location_id': Location, 'virtual_tracking': boolean};

type Line = { 'id': number,
              'product_id': Product,
              'location_id': Location,
              'tracking': string
              'prod_lot_id': number, 
              'to_delete': boolean,
              'theoretical_qty': number,
              'product_qty': number,
              'product_uom_id': {'id': number, 'name': string}
            }
type Inventory = {'id': number, 
                  'name': string, 
                  'product_id': Product,
                  'location_id': Location, 
                  'inventory_type': string, 
                  'filter': string, 
                  'line_ids': Array<Line>}


@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
})

export class InventoryPage implements OnInit {
  //
  
  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;
  @Input() ScannerReading: string;

  //Navegación
  Selected: number; // -1 si no hay ninguno, si no es el indice del que está seleccionado
  SelectedLine: {};
  MoveSelectedId: number;
  MoveSelected: Line;

  inventory_type: string
  inventory_type_str = {'qty': 'Cantidad', 'serial': 'Nº de Serie'}; // qty o serial / Cantidad o Nº Serie
  product_id: Product; // id de producto seleccionado
  location_id: Location; // id de producto seleccionado
  product_ids: Array<Product>
  location_ids: Array<Location>
 
  line_ids: Array<Line>
  VisibleLines: Array<Line>
  inventory: Inventory
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

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.scanner.ActiveScanner && this.stock.GetModelInfo('App', 'ActivePage') === 'Inventory' && event.which !== 0) {
        console.log('ENVIANDO TECLAS A ' + this.stock.GetModelInfo('App', 'ActivePage'));
        this.scanner.key_press(event);
        this.scanner.timeout.then((val) => {
        this.onReadingEmitted(val);
    });
  }
}

  constructor( 
    public router: Router,
    public scanner: ScannerService,
    public odooCon: OdooService,
    public loadingController: LoadingController,
    public alertController: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public stock: StockFunctionsService,) { }
  
    async presentLoading(Message= '...') {
      // this.loading.getTop().then(v => v ? this.loading && this.loading.dismiss() : null);
      this.loading = await this.loadingController.create({
        message: Message,
        duration: 5000,
        keyboardClose: true,
        backdropDismiss: true,
        translucent: true,
        cssClass: 'custom-class custom-loading'
      });
  
      await this.loading.present();
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
  getLastMove(MoveId){
    this.LastMove[MoveId] = MoveId
    console.log ("Asgino " + MoveId + ' a LastMove')
    return true
  }
  TabNavegarA(URL){
    this.router.navigateByUrl(URL);
  }

  CheckScanner(val) {
    console.log("Escaneo " + val)
    // NO HAY UN MOVIMIENTO SELECCIONADO
    if (this.MoveSelectedId === 0){
      // Busco un movimiento y lo selecciono. NO hago nada mas
      const MoveSelected = this.line_ids.filter(x=> (this.type==='product' && x['prod_lot_id']['name'] === val || x['product_id']['default_code'] === val) || x['location_id']['barcode'] === val) 
      if (MoveSelected.length === 1){
        this.MoveSelectedId = MoveSelected[0]['id']
        this.MoveSelected = MoveSelected[0]
        return
      }
      this.MoveSelectedId = 0
      this.MoveSelected = null
      return
    }  
    const LeoProd = this.MoveSelected['product_id']['default_code'] === val
    const LeoLoc = this.MoveSelected['location_id']['barcode'] === val
    const LeoLot = this.MoveSelected['prod_lot_id'] && this.MoveSelected['prod_lot_id']['name'] === val
    const TrackVirtual = this.MoveSelected['tracking'] === 'virtual' 
    const TrackNone = this.MoveSelected['tracking'] === 'none' 
    const TrackLot =  this.MoveSelected['tracking'] === 'lot' 
    const TrackSerial =  this.MoveSelected['tracking'] === 'serial' 
    // HAY MOV SELECCIONADO, 
    // LEO PRODUCTO Y puedo sumar cantidades
    if (LeoProd && (TrackNone || (TrackVirtual && this.type ==='qty'))) {
      this.ChangeQty(this.MoveSelected, +1)
      return
    }
    // LEO PRODUCTO de un movimiento seleccionado y quito cantidades
    if (LeoProd && (TrackLot || TrackSerial)){
      this.ChangeQty(this.MoveSelected, -1)
      return
    }
    // Leo lote y coincide con el de mov seleccionado, sumo cantidades.
    if (LeoLot && TrackLot){
      this.ChangeQty(this.MoveSelected, +1)
      return
    }
    
    // Espero Lote si, 
     
    // Si espero lote 
    if (this.WaitingNewLot && TrackVirtual){
      return this.CreateVirtual(this.MoveSelected, val)
    }
    if (this.WaitingNewLot && TrackLot){
      return this.CreateLot(this.MoveSelected, val)
    }
    if (this.WaitingNewLot && TrackSerial){
      return this.CreateSerial(this.MoveSelected, val)
    }
  }
  async CreateSerial(MoveSelected, LotName){}
  async CreateVirtual(MoveSelected, LotName){}

  async CreateLot(MoveSelected, LotName){
    
    let OdooModel = this.inventory_type === 'qty' ? "stock.inventory.line" : "stock.inventory.tracking"
    const values = {
      product_id: MoveSelected['product_id']['id'],
      line_id: MoveSelected['id'], 
      lot_name: LotName, model:OdooModel}

    const self = this;
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(OdooModel, 'create_apk_prod_lot', values).then((Res: {}) => {
        MoveSelected['prod_lot_id'] = Res
        // self.loading.dismiss();
      })
      .catch((error) => {
        // self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  async DeleteLine(Move){
    let OdooModel = this.inventory_type === 'qty' ? "stock.inventory.line" : "stock.inventory.tracking"
    const values = {id: Move['id'], model:OdooModel}
    const self = this;
    // this.presentLoading('Actualizando cantidades ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'delete_apk_line', values).then((Res: Line) => {
        const i = self.inventory.line_ids.indexOf(Move)
        self.inventory.line_ids.splice(i, 1)
        self.ApplyFilterMoves()
        // self.loading.dismiss();
      })
      .catch((error) => {
        // self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  async ChangeQty(Move: Line, inc, qty=0){
    let OdooModel = this.inventory_type === 'qty' ? "stock.inventory.line" : "stock.inventory.tracking"
    const values = {id: Move['id'], inc: inc, qty: qty, model:OdooModel}
    if (qty === 0) {
      Move['product_qty'] += inc
    }
    else {
      Move['product_qty'] = qty
    }
    const self = this;
    // this.presentLoading('Actualizando cantidades ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'write_apk_qties', values).then((Res: Line) => {
        Move = Res; 
        self.ApplyFilterMoves()
        // self.loading.dismiss();
      })
      .catch((error) => {
        // self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  ionViewDidEnter(){
    this.scanner.ActiveScanner = false;
    this.MoveSelectedId = 0;
    this.stock.SetModelInfo('App', 'ActivePage', 'Inventory');
    this.LoadInventory();
    // this.WaitingNewLot = false;
    // this.GetSelects();
  }

  ngOnInit() {
    this.product_id = {'id': 0, 'default_code': 'Todos', 'name': ""};
    this.location_id = {'id': 0, 'barcode': "Stock", 'name': 'Stock', 'display_name': 'Stock', 'usage': 'view'}
    this.inventory_type = 'qty';
    // this.location_id = {'id': 0, 'barcode': '', 'name': "Stock"}
    this.product_ids = [{'id': 0, 'default_code': "Todos", 'name': ''}]
    this.location_ids = [this.location_id]
    this.WaitingNewLot = false;
    this.inventory = {'id': 0, 
                      'name': "Nombre", 
                      'filter': 'none',
                      'product_id': this.product_id, 
                      'location_id': this.location_id, 
                      'inventory_type': 'qty' , 
                      'line_ids': []}
    this.Selected = -1
    this.LastMove = {}
  }
  AlternateSelected(id){
    this.MoveSelectedId = this.MoveSelectedId === id ? 0 : id;
    if (this.MoveSelectedId === 0){
      this.MoveSelected = null
    }
    else {
      this.MoveSelected = this.line_ids.filter(x=> x['id'] === this.MoveSelectedId)[0]
    }
  }

  ClickLot(Line){
    if (!this.MoveSelectedId){
      return this.AlternateSelected(Line['id'])
    }
  }
  generateName(){
    this.inventory['name'] = this.product_id['default_code'] + ' - ' + this.location_id.name
  }
  locationChange(event: { component: IonicSelectableComponent, value: any}) {
    if (this.inventory['id'] == 0) {this.generateName()}
    this.ApplyFilterMoves()
  }
  locationSearch(event: { component: IonicSelectableComponent, value: any}) {
    const SearchStr = event.component._searchText
    if (SearchStr.length >2){
      // this.GetLocations(SearchStr)
    }
  }
  SelectSearch(event: { component: IonicSelectableComponent, value: any}, field='product_ids'){
    const SearchStr = event.component._searchText
    if (SearchStr.length >2){
      this.GetSearchs(SearchStr, field)
    }
  }
  NewLine(){
    if (this.location_id['usage'] !== 'internal'){
      return this.stock.Aviso('No tienes una ubicación definida', 'Error')
    }
    if (this.product_id['id'] === 0){
      return this.stock.Aviso('No tienes un artículo definido', 'Error')
    }
    const values = {
      'inventory_id': this.inventory['id'],
      'product_id': this.product_id['id'],
      'location_id': this.location_id['id'],
      'lot_name': ''}
    const self = this;
      
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'create_apk_line', values).then((Res: Array<{}>) => {
        self.inventory['line_ids'] = Res['line_ids'];
        self.MoveSelectedId = Res['line_selected'][0]['id'];
        self.MoveSelected = Res['line_selected'][0]
        self.WaitingNewLot = Res['WaitingNewLot']
        self.ApplyFilterMoves()
        self.GetSelects()
        
        self.stock.presentToast('OK', 'Nueva línea añadida', 10);
        })
        .catch((error) => {
          self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
        });
      });
      return promise;

  }

  productChange(event: {component: IonicSelectableComponent, value: any}) {
    if (this.inventory['id'] == 0) {
      this.generateName()
    }
    this.ApplyFilterMoves()
    // OPciones 
    // Si el tipo de albarán tiene producto, es distinto, entonces no puedo cambiarlo
    if (this.inventory.filter === 'product'){
      this.product_id = this.inventory.product_id
      return
    }
    
    // Si hay inventario, entonces intento añadir línea
    if (this.inventory['id']>0 && this.product_id.id > 0){
      return this.NewLine()
    }

  }
  GetSearchs(search='', field='', id=0){
    let values = {}
    values = {'search': search, 'id': id, 'inventory_id': this['inventory'] && this['inventory']['id']}
    
   
    const self = this;
    
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'get_apk_' +field, values).then((Res: Array<{}>) => {
        self[field] = Res[field]
        self.stock.presentToast('OK', 'Carga completa', 10);
      })
      .catch((error) => {
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;
  }
  
  GetSelects(){
    this.GetSearchs('', 'location_ids')
    this.GetSearchs('', 'product_ids')
    return
  }
  ComputeInvType(){
    const location_id = this.inventory && this.inventory['location_id']['id'] || 0
    const product_id = this.inventory && this.inventory['product_id']['id'] || 0
    
    this.ShowLocationSearch = location_id['usage'] !== 'internal'
    this.ShowProductSearch = product_id === 0

    this.type = 'all'
    if (location_id == 0) {
      if (product_id == 0) {
        this.type = 'none'
      }
      else {this.type='product'}
    }
    else if (product_id == 0) {
      this.type='location'}
  
      console.log(this.type)
  }
  LoadInventory(id=0){
    const values = {id: id}
    const self = this;
    this.presentLoading('Cargando último inventario ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'load_apk_inventory', values).then((Res: Inventory) => {
        const length_lines = Res['line_ids'].length
        self.inventory = Res
        self.product_id = Res['product_id'] // this.product_ids[this.product_ids.length-1]// Res['line_ids'][length_lines-1]['product_id']// inventory_product_id']
        self.location_id = Res['location_id'] //this.location_ids[this.location_ids.length-1]// Res['line_ids'][length_lines-1]['location_id']//Res['inventory_location_id']
        self.ComputeInvType()
        self.ApplyFilterMoves()
        this.GetSelects()
        self.loading.dismiss();
      })
      .catch((error) => {
        self.loading.dismiss();
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }

  GenerateNewInventory(){
    console.log("Creo un inventario nuevo")
    if (this.product_id['id'] === 0 && this.location_id['id'] === 0){
      return this.stock.Aviso('Configuración incorrecta', 'Debes definir artículo y/o ubicación')
    }
    const values = {'name': this.inventory['name'], 'inventory_type': this.inventory_type, 'product_id': this.product_id['id'], 'location_id': this.location_id['id']}
    console.log(values)
    const self = this;
    this.presentLoading('Creando nuevo inventario ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'new_apk_inventory', values).then((Res: Inventory) => {
        self.inventory = Res
        self.ApplyFilterMoves()
        self.ComputeInvType()
        self.loading.dismiss();
      })
      .catch((error) => {
        self.loading.dismiss();
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

      });
    });
    return promise;
  }
  ApplyFilterMoves(){
    
    this.line_ids = []
    console.log ('Aplico filtro sobre ' + this.inventory['line_ids'] + ' con prod:' + this.product_id['id'] + ' y loc: ' + this.location_id['id'] )
    const p_id = this.product_id['id']
    const l_id = this.location_id['id']
    let filter_loc = false
    let filter_prod = false
    for (const line of this.inventory['line_ids']) {
      filter_prod =   p_id === 0 || line['product_id']['id'] === p_id
      filter_loc = l_id === 0 || this.location_id['usage'] !== 'internal' || line['location_id']['id'] === l_id
      if (filter_prod && filter_loc) {
        this.line_ids.push(line)
      }
    }
    console.log (this.line_ids.length)
  }
  // Inputs

  async InputQty(Line, subheader = '')
  {
    const Qty = Line['product_qty'];
    subheader = subheader || Line['product_id']['name'];
    let Header = ''
    if (Line['prod_lot_id']['id']){
      Header = 'Lote ' + Line['prod_lot_id']['name'] + ' ' + Qty + ' ' + Line['product_uom_id']['name'] 
    }
    else {
      Header = 'Cantidad ' + Qty + ' ' + Line['product_uom_id']['name']
    }
    const alert = await this.alertController.create({
      header: Header,

      subHeader: subheader,
      inputs: [{name: 'product_qty',
               value: Qty,
               type: 'number',
               id: 'qty-id',
               placeholder: Qty}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Aplicar',
          handler: (data: number) => {
            const QtyDone = Number(data['product_qty']);
            if (Number(QtyDone) >= 0) {
              this.ChangeQty(Line, 0, QtyDone);
            }
            else {
              this.stock.play('error');
              this.InputQty(Line, 'No válido');
            }
          }
        }],
  });
    await alert.present();
  }

   // BOTONES DE ACCION
   async presentButtons() {
    const Buttons = [];
    if (this.Selected !== -1){
      Buttons.push({
        text: 'Resetear',
        icon: 'refresh-circle-outline',
        handler: () => {
          //this.ResetearMoves();
      }});
      Buttons.push({
        text: 'Reservar',
        icon: 'battery-charging-outline',
        handler: () => {
          //this.Reserve();
      }});
      Buttons.push({
        text: 'Anular reserva',
        icon: 'battery-dead-outline',
        handler: () => {
          //this.UnReserve();
      }});
      Buttons.push({
        text: 'Duplicar línea',
        icon: 'git-network-outline',
        handler: () => {
          //this.AddNewSml();
      }});
    }
    Buttons.push({
        text: 'Validar Batch',
        icon: 'checkmark-done-circle-outline',
        handler: () => {
          // this.ValidateBatch();
      }});
    Buttons.push({
      text: this.Limit === 0 ? 'Cargar todos' : 'Cargar ' + this.stock.Limit(),
      icon: '',
      handler: () => {
        this.Limit = this.Limit === 0 ? this.stock.Limit() : 0;
        //this.GetInfo();
    }});
    if (this.Selected > -1){
      Buttons.push({
        //text: this.ToDelete ? 'Borrar' : 'Añadir',
        icon: '',
        handler: () => {
          //this.ToDelete = !this.ToDelete;
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
      header: 'Acciones',
      buttons: Buttons
    });
    await actionSheet.present();
  }
}
