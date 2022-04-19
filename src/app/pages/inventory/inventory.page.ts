import { Component, OnInit, ViewChild, Input, HostListener} from '@angular/core';
import { IonicSelectableComponent } from 'ionic-selectable';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController, AlertController, IonInfiniteScroll, ActionSheetController, LoadingController } from '@ionic/angular';
import { ScannerService } from '../../services/scanner.service';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { OdooService } from '../../services/odoo.service';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';
import { BarcodeMultilinePage } from '../barcode-multiline/barcode-multiline.page';
import { OverlayEventDetail } from '@ionic/core';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

type Product = {'id': number, 'default_code': string, 'name': string, 'display_name': string} ;
type Location = {'id': number, 'barcode': string, 'name': string, 'display_name': string, 'usage': string};
type Lot = {'id': number, 'name': string, 'real_location_id': Location, 'location_id': Location, 'virtual_tracking': boolean};

type Line = { 'id': number,
              'product_id': Product,
              'location_id': Location,
              'tracking': string,
              'prod_lot_id': Lot, 
              'to_delete': boolean,
              'theoretical_qty': number,
              'product_qty': number,
              'acl': boolean,
              'product_uom_id': {'id': number, 'name': string}
            }
type Inventory = {'id': number, 
                  'name': string, 
                  'product_id': Product,
                  'location_id': Location, 
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
  Indice: number;
  InventoryProductId: Product // Producto del inventario (si existe)
  InventoryLocationId: Location // Ubicación del inventario (Existe)

  product_id: Product; // id de producto seleccionado
  location_id: Location; // id de producto seleccionado
  product_ids: any
  location_ids: any
 
  line_ids: Array<Line>
  VisibleLines: Array<Line>
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
    private modalController: ModalController,
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
    

    if (!this.MoveSelected){
      // Busco un movimiento y lo selecciono. NO hago nada mas

      const MoveSelected = this.inventory['line_ids'].filter(x=> (
        x['prod_lot_id']['name'] === val || 
        x['product_id']['default_code'] === val) || 
        x['location_id']['barcode'] === val)
      
      if (MoveSelected.length === 0){
        return
      }

      if (MoveSelected.length != this.inventory['line_ids'].length){
        this.line_ids = MoveSelected
      }

      if (MoveSelected.length === 1){
        this.MoveSelectedId = MoveSelected[0]['id']
        this.MoveSelected = MoveSelected[0]
        this.InventoryLocationId = this.MoveSelected['location_id']
        this.InventoryProductId = this.MoveSelected['product_id']
        // this.ApplyFilterMoves()
        return
      }
      else {
        // Tengo que saber si he leido un lote, una ubicación o un artículo
        // Es lote?
        const lot = this.line_ids.filter(x=>x['prod_lot_id']['name'] === val)
        if (!this.stock.IsFalse(lot)){
          this.InventoryLocationId = null
          this.InventoryProductId = null
          return

          // No hago nada, porque no puedo saber si hay varios articulos/ubicaciones
        }
        else {
          // Si lo que leo es una ubicación, filtro por ubicación
          const loc = this.line_ids.filter(x=>x['location_id']['barcode'] === val)
          if (!this.stock.IsFalse(loc)){
            this.InventoryLocationId = loc[0]['location_id']
            this.InventoryProductId = null
            this.ApplyFilterMoves()
          }
          else {
            const prod = this.line_ids.filter(x=>x['product_id']['default_code'] === val)
            if (!this.stock.IsFalse(prod)){
              this.InventoryLocationId = null
              this.InventoryProductId = prod[0]['product_id']
              this.ApplyFilterMoves()
          }

          }
          return
        }
        

      }
      this.MoveSelectedId = 0
      this.MoveSelected = null
      this.ApplyFilterMoves()
      return
    }
    if (!this.MoveSelected){return}
    const LeoProd = this.MoveSelected['product_id']['default_code'] === val || this.MoveSelected['product_id']['barcode'] === val
    const LeoLoc = this.MoveSelected['location_id']['barcode'] === val || this.MoveSelected['location_id']['name'] === val
    const LeoLot = this.MoveSelected['prod_lot_id'] && this.MoveSelected['prod_lot_id']['name'] === val
    const TrackVirtual = this.MoveSelected['tracking'] === 'virtual' 
    const TrackNone = this.MoveSelected['tracking'] === 'none' 
    const TrackLot =  this.MoveSelected['tracking'] === 'lot' 
    const TrackSerial =  this.MoveSelected['tracking'] === 'serial' 
    
    // HAY MOV SELECCIONADO, 
    // LEO PRODUCTO Y puedo sumar cantidades
    if (LeoProd && (TrackNone || TrackVirtual)) {
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
    if (LeoLot && TrackSerial){
      this.ChangeQty(this.MoveSelected, 0, 1)
      return
    }
     
    // Si espero lote
    if (TrackLot || TrackSerial){
      if (this.MoveSelected['prod_lot_id'] && this.MoveSelected['prod_lot_id']['name'] !== val){
        return this.stock.presentToast("El lote/serie " + val + " no es válido", "Error de lote/serie")
      }
    }
    if (this.WaitingNewLot && TrackVirtual){
      return this.CreateVirtual(this.MoveSelected, val)
    }
    if (this.WaitingNewLot && TrackLot){
      return this.CreateLot(this.MoveSelected, val)
    }
    if (this.WaitingNewLot && TrackSerial){
      return this.CreateSerial(this.MoveSelected, val)
    }
    return
    // No se para que vale lo siguiente ?????
    const MoveSelected = this.inventory['line_ids'].filter(x=> (x['prod_lot_id']['name'] === val || x['product_id']['default_code'] === val) || x['location_id']['barcode'] === val) 
    if (MoveSelected){
      this.MoveSelectedId = 0
      this.MoveSelected = null
      return this.CheckScanner(val)
    }
  }
  async CreateSerial(MoveSelected, LotName){}
  async CreateVirtual(MoveSelected, LotName){}

  CheckCreateLot(MoveSelected, Lotname){

    const MoveLot = MoveSelected['prod_lot_id']
    if (this.stock.IsFalse(MoveLot)){
      return this.CreateLot(MoveSelected, Lotname)
    }
    if (MoveLot['name'] == Lotname){
      return this.ChangeQty(MoveSelected, 1)
    }
    else if (!MoveSelected['lot_id']['name'] != Lotname){
      return this.stock.Aviso('Error', 'Esta línea ya tiene el lote: ' + MoveLot['name'] + ". No puedes cambiarlo")
    }

  }
  async CreateLot(MoveSelected, LotName){
    
    let OdooModel = "stock.inventory.line"
    const values = {
      product_id: MoveSelected['product_id']['id'],
      line_id: MoveSelected['id'], 
      lot_name: LotName, model:OdooModel}
    const self = this;
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(OdooModel, 'create_apk_prod_lot', values).then((Res: {}) => {
        // MoveSelected['prod_lot_id'] = Res
        this.line_ids.filter(x=>x['id'] === MoveSelected['id'])[0]['prod_lot_id'] = Res
        this.MoveSelected['prod_lot_id'] = Res
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
    let OdooModel = "stock.inventory.line"
    const values = {id: Move['id'], model:OdooModel}
    const self = this;
    // this.presentLoading('Actualizando cantidades ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'delete_apk_line', values).then((Res: Line) => {
        const i = self.inventory['line_ids'].indexOf(Move)
        self.inventory['line_ids'].splice(i, 1)
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
    
    if (false && Move['tracking'] == 'virtual' && qty== 0){
      const DeleteOld = inc == -1;
      return this.OpenBarcodeMultiline(Move, DeleteOld)
    }
    let OdooModel = "stock.inventory.line"
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
      self.odooCon.execute('stock.inventory.line', 'write_apk_qties', values).then((Res: Line) => {
        Move = Res; 
        // self.ApplyFilterMoves()
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
    if (!this.stock.Persistent){
      this.stock.LoadPersistentData()
    }
    this.product_id = null
    this.location_id = null
    // this.location_id = {'id': 0, 'barcode': '', 'name': "Stock"}
    this.product_ids = []
    this.location_ids = []
    this.WaitingNewLot = false;
    this.inventory = null
    this.Selected = -1
    this.LastMove = {}
  }
   // ToMove

  ToMove(Pos, Inc){
    this.stock.play("click")
    let indice = this.Indice
    const max =  this.line_ids.length - 1;
    if (Pos === 1){
      indice = 0
    }
    else if (Pos === -1){
      indice = max;
      
    }
    else if (Inc === 1){
      if (indice + 1 > max){indice = 0}
      else {indice +=1}
    }
    else if (Inc === -1){
      if (indice - 1 < 0){indice = max}
      else {indice -= 1}
    }
    this.line_ids[indice]['acl'] = true
    this.MoveSelected = this.line_ids[indice];
    this.MoveSelectedId = this.line_ids[indice]['id'];
    this.Indice = indice
  }

  AlternateSelected(id,indice=0){
    this.stock.play("click")
    this.MoveSelectedId = this.MoveSelectedId === id ? 0 : id;
    if (this.MoveSelectedId === 0){
      this.MoveSelected = null
    }
    else {
      this.MoveSelected = this.line_ids.filter(x=> x['id'] === this.MoveSelectedId)[0]
      this.MoveSelected.acl = true
    }

    this.Indice = indice
      //
    this.WaitingNewLot = this.MoveSelected && (this.MoveSelected['tracking'] == 'virtual' || this.MoveSelected['tracking'] == 'lot' || this.MoveSelected['tracking'] == 'serial')
    //if (this.MoveSelected){
    //  this.InventoryProductId = this.MoveSelected['product_id']
    // }
  }
  LoadAndOpenMulti(Line){      const self = this
      const values = {'id': Line['id']}
      const promise = new Promise( (resolve, reject) => {
        self.odooCon.execute('stock.inventory.line', 'load_virtual_lot_ids', values).then((Res: {}) => {

          return this.OpenBarcodeMultiline(Line, true, Res['list'])
          })
          .catch((error) => {
            self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
          });
        });
        return promise;
  }
  ClickLot(Line){
    if (Line.tracking=='virtual'){

      return this.LoadAndOpenMulti(Line)
    }
    if (Line.tracking == 'lot' || Line.tracking == 'serial') {
      if (!Line['prod_lot_id']['id']){
        return this.InputLotName(Line)
      if (this.MoveSelected){
        if (Line['prod_lot_id']['id']){}
      }}
    }

    if (!this.MoveSelectedId){
      return this.AlternateSelected(Line['id'], this.Indice)
    }
  }
  generateName(){
    this.inventory['name'] = this.product_id['default_code'] + ' - ' + this.location_id.name
  }
  locationChange(event: { component: IonicSelectableComponent, value: any}) {

    // Si cambio la ubicación.

    // Tengo que buscar un inventario con esta ubicación

    
    if (this.inventory['id'] == 0) {
      this.generateName()
    }
    this.ApplyFilterMoves()
  }
  
  NewLine(){

    
    if (this.InventoryLocationId && this.InventoryLocationId['usage'] !== 'internal'){
      return this.stock.Aviso('No tienes una ubicación definida o no es valida', 'Error')
    }
    if (!this.InventoryProductId){
      return this.stock.Aviso('No tienes un artículo definido', 'Error')
    }
    const values = {
      'inventory_id': this.inventory['id'],
      'product_id': this.InventoryProductId['id'],
      'location_id': this.InventoryLocationId['id'],
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
  SelectSearch(event: { component: IonicSelectableComponent, value: any}, field='product_ids'){
    
    const SearchStr = event.component._searchText.toUpperCase()
    if (SearchStr.length < 2){
      event.component.endSearch();
      return
    }
    return this.GetSearchs(SearchStr, field)
  }

  GetSearchs(search='', field='', id=0){
    if (this.inventory && field === 'product_ids' && this.inventory['filter'] === 'product' && this.inventory['product_id']){
      this.product_ids = this.stock.Products.filter(x=> x['id'] === this.inventory['product_id']['id'])
      this.InventoryProductId = this.product_ids[0]
    }
    else if (this.inventory && field === 'location_ids'){
      if (search){
        this.location_ids = this.stock.Locations.filter(x => (
          (x['parent_path'].indexOf(this.inventory['location_id']['parent_path']) > -1) && 
          (x['barcode'] + x['name']).toUpperCase().indexOf(search) > -1))
          .slice(0,10)
      }
      
      if (!search){
        if (!this.InventoryLocationId){
          this.location_ids = this.stock.Locations.filter(x => (
            (x['parent_path'].indexOf(this.inventory['location_id']['parent_path']) > -1)))
            .slice(0,10)
            this.InventoryLocationId = this.inventory['location_id']
          }
        else {

        }

      }
    }
    
    else if (!this.inventory && field === 'location_ids'){
        this.location_ids = this.stock.Locations.filter(x => ((x['usage'] === 'internal') && 
          (x['barcode'] + x['name']).toUpperCase().indexOf(search) > -1)).slice(0,10)
    }
    else if (field == 'product_ids'){
        this.product_ids = this.stock.Products.filter(x=> (x['barcode'] + x['default_code']).toUpperCase().indexOf(search) > -1).slice(0,10)
    }
    this.ComputeInvType()
    return;
  }
  
  async GetSelects(){
    this.GetSearchs('', 'location_ids')
    this.GetSearchs('', 'product_ids')
    return
  }

  productChange(event: {component: IonicSelectableComponent, value: any}) {

    if (this.inventory['id'] == 0) {
      this.generateName()
    }
    // this.InventoryProductId = this.
    this.ApplyFilterMoves()
    // OPciones 
    // Si el tipo de albarán tiene producto, es distinto, entonces no puedo cambiarlo
    if (this.inventory['filter'] === 'product'){
      this.product_id = this.inventory['product_id']
      return
    }
    
    // Si hay inventario, entonces intento añadir línea
    if (this.inventory['id']>0 && this.product_id.id > 0){
      return this.NewLine()
    }

  }
  OnSearchFocus(val: boolean){
    console.log("Poneindo Active Sacanner a " + val)
    this.scanner.ActiveScanner = val ;    
  }
  ComputeInvType(){
    const location_id = this.inventory && this.inventory['location_id']['id'] || 0
    const product_id = this.inventory && this.inventory['product_id']['id'] || 0
    if (product_id != 0 && this.stock.IsFalse(this.inventory)) {
      this.ShowProductSearch = false  
    }
    else {
      this.ShowProductSearch = true
    }
    this.ShowLocationSearch = true
  }
  GetInventoryLinesDomain(id = 0, ProductId = 0, LocationId = 0){
    if (!id){
      this.stock.presentToast ('No se ha seleccionado inventario de búsqueda')
      return
    }
    if (!ProductId){
      this.stock.presentToast ('No se ha seleccionado ningún artículo')
      return
    }
    if (!LocationId){
      this.stock.presentToast ('No se ha seleccionado ninguna ubicación')
      return
    }
    return [
      ['inventory_id', '=', id],
      ['product_id', '=', ProductId], 
      ['location_id', '=', LocationId]]
  }
  ValidateInventory(){
    if (this.stock.IsFalse(this.inventory)){
      return this.stock.presentToast("No hay ningún inventario cargado")
    }
    const values = {'id': this.inventory['id']}
    const InvName = this.inventory['name']
    const self = this
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'action_validate_apk', values).then((Res: Inventory) => {
        self.stock.presentToast("Se ha validado el inventario: " + InvName)
        
      })
      .catch((error) => {
        self.stock.presentToast("Se ha excedido el tiempo de espera");
        // self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return this.LoadInventory (0);
  }
  Unload(){
    this.inventory = null
    this.product_id = null
    this.location_id = null
    this.line_ids = null
    this.FilterAcl = false;
    this.Filter0 = false;
    this.MoveSelected = null
    this.MoveSelectedId = 0
    this.Indice = -1

  }
  LoadInventory(id=0){

    const values = {product_id: this.product_id, location_id: this.location_id, id: id, domain:this.GetInventoryLinesDomain(this.inventory && this.inventory['id'] || 0)}
    const self = this;
    this.presentLoading('Cargando último inventario ...')
    
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'load_apk_inventory', values).then((Res: Inventory) => {
        self.inventory = Res
        self.product_id = Res['product_id'] // this.product_ids[this.product_ids.length-1]// Res['line_ids'][length_lines-1]['product_id']// inventory_product_id']
        self.location_id = Res['location_id'] //this.location_ids[this.location_ids.length-1]// Res['line_ids'][length_lines-1]['location_id']//Res['inventory_location_id']
        this.FilterAcl = false;
        this.Filter0 = false;
        
        this.MoveSelected = null
        this.MoveSelectedId = 0
        this.Indice = -1
        // Si tengo un inventario, y producto o ubicación, filtro por esos campos.
        // Si tengo un inventario y el inventario tiene producto/ubicación estos son de solo lectura
        // Si tengo un inventario, y NO tengo producto/ubicación. El que no sea de solo lectura es filtro.
        //
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
    if (!this.InventoryLocationId){
      return this.stock.Aviso('Configuración incorrecta', 'Debes definir artículo y/o ubicación')
    }
    let p_name
    let product_id
    if (this.InventoryProductId) {
      p_name = this.InventoryProductId['default_code']
      product_id =this.InventoryProductId['id']
    }
    else {
      p_name = "Genérico"
      product_id = 0
    }

    const name = this.InventoryLocationId['name'] + " -> " + p_name
    const values = {
      'name': name, 
      'product_id': product_id, 
      'location_id': this.InventoryLocationId['id']
  }
    console.log(values)
    const self = this;
    this.presentLoading('Creando nuevo inventario .... ')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'new_apk_inventory', values).then((Res: Inventory) => {
        self.loading.dismiss();
        return self.LoadInventory(Res['id'])
        

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
    const p_id = this.InventoryProductId && this.InventoryProductId['id'] || 0// this.product_id['id']
    const l_id = this.InventoryLocationId && this.InventoryLocationId['id'] || 0// this.location_id['id']
    const parent_path = this.InventoryLocationId && this.InventoryLocationId['parent_path'] || false
    
    let filter_loc = false
    let filter_prod = false
    let filter_acl = false
    let filter_0 = false
    let indice = 0
    for (const line of this.inventory['line_ids']) {
      filter_acl = !this.FilterAcl || !line['acl']
      filter_0 = !this.Filter0 || !(line['product_qty'] == 0)
      filter_prod =  p_id === 0 || line['product_id']['id'] === p_id 
      if (parent_path){
        filter_loc = line['location_id']['parent_path'].startsWith(parent_path)
      }
      else {
        filter_loc = l_id === 0 || line['location_id']['id'] === l_id
      }
      if (filter_prod && filter_loc && filter_acl && filter_0) {
        line['indice'] = indice
        indice += 1
        this.line_ids.push(line)
      }
    }
    console.log (this.line_ids.length)
  }
  // Inputs
  async InputLotName(Line, subheader = ''){
    
    subheader = subheader || Line['product_id']['name'];
    const alert = await this.alertController.create({
    header: "Lote para:",

    subHeader: subheader,
      inputs: [{name: 'lot_name',
               value: "",
               id: 'lot-id',
               placeholder: 'Nuevo Lote'}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.OnSearchFocus(false);
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Aplicar',
          handler: (data: string) => {
            this.OnSearchFocus(false);
            this.CheckCreateLot(Line, data['lot_name']); 
            
          }
        }],
  });
    this.OnSearchFocus(true);
    await alert.present();
  }
  async InputQty(Line, subheader = '')
  {
    if (Line.tracking == 'lot' || Line.tracking == 'serial') {
      if (!Line['prod_lot_id']['id']){return this.InputLotName(Line)}
    }

    const Qty = Line['product_qty'];
    subheader = subheader || Line['product_id']['name'];
    let Header = ''
    if (Line['prod_lot_id']['id']){
      Header = 'Lote ' + Line['prod_lot_id']['name'] + ' ' + Qty + ' ' + Line['product_uom_id']['name'] 
    }
    else {
      Header = 'Cantidad ' + Qty
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
            this.OnSearchFocus(false);
          }
        }, {
          text: 'Aplicar',
          handler: (data: number) => {
            this.OnSearchFocus(false);
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
    this.OnSearchFocus(true);
    await alert.present();
  }


  async CreateFilterButtons(){
    const Buttons = [];
    Buttons.push({
      text: this.FilterAcl ? 'Todos' : 'Solo Pendientes',
      icon: this.FilterAcl ? 'thumbs-up-outline' : 'thumbs-down-outline',
      handler: () => {
        this.FilterAcl = !this.FilterAcl
        this.ApplyFilterMoves()
        
    }});
    Buttons.push({
      text: this.Filter0 ? 'Vacíos' : 'Todos',
      icon: this.Filter0 ? 'battery-dead-outline' : 'battery-full-outline',
      handler: () => {
        this.Filter0 = !this.Filter0
        this.ApplyFilterMoves()
    }});

    
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filtros',
      buttons: Buttons
    });
    await actionSheet.present();

  }

  async CreateInventoryButtons(Res){
    const Buttons = [];
    Buttons.push({
      text: "Nuevo",
      handler: () => {
        this.LoadInventory(0);
    }});
  
        for (const inv of Res){
          

          Buttons.push({
            text: inv['name'],
            handler: () => {
              this.LoadInventory(inv['id']);
          }});
        }
    
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Inventarios',
      buttons: Buttons
    });
    await actionSheet.present();
  }
  async CreateLoadInventory(){
    const values = {domain: []}
    const self = this;
    this.presentLoading('Cargando último inventario ...')
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.inventory', 'load_inventory_list', values).then((Res: Array<{}>) => {
        self.loading.dismiss();
        if (!this.stock.IsFalse(Res)){self.CreateInventoryButtons(Res)}
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
      text: 'Resetear Revisados',
      icon: 'checkmark-done-circle-outline',
      handler: () => {
        for (const line of this.line_ids){line.acl = false}
        this.ApplyFilterMoves()
        // this.ValidateBatch();
    }});

    Buttons.push({
      text: 'Crear línea',
      icon: 'checkmark-done-circle-outline',
      handler: () => {
        this.NewLine();
        // this.ValidateBatch();
    }});
    if (this.inventory && this.inventory['id']){
    Buttons.push({
        text: 'Validar Inventario',
        icon: 'add-circle-outline',
        handler: () => {
          // this.ValidateBatch();
      }});
    
      Buttons.push({
        text: 'Descargar Inventario',
        icon: 'close-circle-outline',
        handler: () => {
          this.Unload();
      }});

    }
    if (!(this.inventory && this.inventory['id']) && this.InventoryLocationId){
      Buttons.push({
          text: 'Crear nuevo Inventario',
          icon: 'add-circle-outline',
          handler: () => {
            this.GenerateNewInventory();
        }});
      }
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

  async OpenBarcodeMultiline(Move, DeleteOld = false, ean = []){
    this.OnSearchFocus(true);
    const self = this;
    const modal = await this.modalController.create({
      component: BarcodeMultilinePage,
      cssClass: 'barcode-modal-css',
      componentProps: { ean: ean.join('\n') + '\n',
                        ProductId: Move['product_id']['id'],
                        PName: 'Nº de Serie',
                        LName: Move['product_id']['name'],
                        L2Name: Move['product_id']['default_code'] + ' en ' + Move['location_id']['name'],

                      },
    });
    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      this.OnSearchFocus(false);
      if (detail['data'] == -1){
        return self.loading.dismiss();
      }
      self.scanner.ActiveScanner = false;
      const values = {
                      delete: DeleteOld,
                      id: Move['id'],
                      serial_names: detail['data']};
      this.presentLoading('Cargando números de serie ...');
      this.odooCon.execute('stock.inventory.line', 'load_multi_serials', values).then((data: Array<{}>) => {
        Move['product_qty'] = data[0]['product_qty']
        self.loading.dismiss();
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
      
    });
    await modal.present();
  }
  ClickLocation(Id){}
  
}
