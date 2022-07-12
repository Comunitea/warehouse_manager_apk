
import { Component, OnInit, ViewChild, Input, HostListener, ComponentFactoryResolver} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ScannerService } from '../../services/scanner.service';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { OdooService } from '../../services/odoo.service';
import { ModalController, AlertController, IonInfiniteScroll, ActionSheetController, LoadingController, ToastController } from '@ionic/angular';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';
import { OverlayEventDetail } from '@ionic/core';
import { BarcodeMultilinePage } from '../barcode-multiline/barcode-multiline.page';
import { DEFAULT_INTERPOLATION_CONFIG } from '@angular/compiler';



@Component({
  selector: 'app-move-list',
  templateUrl: './move-list.page.html',
  styleUrls: ['./move-list.page.scss'],
})
export class MoveListPage implements OnInit {

  @ViewChild(ScannerFooterComponent) ScannerFooter: ScannerFooterComponent;
  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;
  // @ViewChild('NewAddSerialI', {read: ElementRef})
  @Input() ScannerReading: string;

  // private locationSearchRef: ElementRef;
  // SCANNER
  LastReading: string;

  // INFINITISCROLL
  Offset: number;
  Limit: number;
  LimitReached: boolean;

  // LOADING CONTROLLER
  loading: any;
  timeout: any;

  Batch: {};
  Moves: Array<{}>;
  AllMoves: Array<{}>;
  
  TypeId: {};
  id: number;
  BatchId: number;

  ngSwitch: any;

  // DEFAULT
  StateDomain: any ;
  BatchDomain: any;

  //FILTROS
  AvailableStates: {};
  AvailableQties: {};
  FilterStates: {};
  FilterQties: {};

  //
  Selected: number; // -1 si no hay ninguno, si no es el indice del que está seleccionado
  SelectedMove: {};
  StateIcons: {};

  //
  NewSerial: string;

  Barcodes: {};
  // Locations: {};
  AvailableLotsForMove: Array<any>;
  AvailableLotsForMoveStr: string;
  SelectedLotsForMoveStr: string;
  ToDelete: boolean;
  StockLocation: {}; // Listado de todas las ubicaciones disponibles en el sistema y leibles por la pistola (internas)
  WaitingSerials: boolean; //=True solo lee serials/Lotes
  ChangeQty: boolean; // Si es false no permite cambiar cantidades
  LastSerial: string; // último código escaneado
  ZIndex: number
  TouchTimeout: any;
  AllowTouch: Boolean;
  AllowScanner: Boolean; 
  PrevId: number; //Id previo al que se ha creado, y el que se carga si está establecido 
  
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    clearTimeout(this.TouchTimeout)
    this.AllowTouch = true;
    
    if (!this.AllowScanner || this.scanner.ActiveScanner || event.which == 0){return}
    console.log("PASO 1: Pulsación: >>" + " Code:< "+ event.code + " >: Which:< " + event.which + " >. Letra: <" +  String.fromCharCode(event.which) +">")
    
    if (this.stock.GetModelInfo('App', 'ActivePage') === 'MoveList') {
      this.scanner.key_press(event);
      this.scanner.timeout.then((val) => {
        this.onReadingEmitted(val);
      });

  }
  }
  constructor(// public audio: AudioService,
    public router: Router,
    public scanner: ScannerService,
    public stock: StockFunctionsService,
    private route: ActivatedRoute,
    public loadingController: LoadingController,
    public toastController: ToastController,
    public actionSheetCtrl: ActionSheetController,
    public alertController: AlertController,
    private modalController: ModalController,
    public odooCon: OdooService) { }

  onReadingEmitted(val: string) {
    const delay = 75;
    this.scanner.ActiveScanner = false;
    let index = 0;
    console.log("ANALIZO EN MOVELIST:" + val);
    for (const scan of val){
      if (scan !== '') {
        if (this.scanner.TECLAS.indexOf(scan)>-1){
          return this.KeyOrder(scan)
        }
        index += 1;
        setTimeout(() => {
          this.ScannerReading = scan;
          // this.stock.play('click'); No se aún si es error o que es
          this.CheckScanner(scan);
        }, delay * index);
      }
    }
    return;
  }
  ngOnInit() {
    // NO FILTRAMOS POR ESTADO INICIALMENTE, SI SE ENTRA EN EL BATCH Y HAY MALA SUERETE
    // this.StateDomain = ['state', 'in', ['assigned', 'partially_available', 'confirmed']];
    // this.FiltersChecked = {state: {checked: ['assigned', 'partially_available', 'partially_available']}};
    this.Offset = 0;
    this.Limit = this.stock.Limit();
    this.StateIcons = {
      draft: 'battery-dead-outline',
      confirmed: 'battery-dead-outline',
      waiting: 'battery-dead-outline',
      in_progress: 'battery-half-outline',
      partially_available: 'battery-half-outline',
      picked: 'battery-charging-outline',
      assigned: 'battery-full-outline',
      done: 'battery-full-outline'};
    this.ToDelete = false
    this.scanner.ActiveScanner = false;
    this.FilterQties = {}
    this.FilterStates ={}

    this.AvailableQties = {zero:'Por hacer', to_do:'Incompletas', done: 'Completas'}
    this.AvailableStates = {
      confirmed: 'Por hacer', 
      waiting: 'En espera', 
      partially_available: 'Incompleta', 
      assigned:'Reservada',
      done: 'Hecha'}
    
  }
  ionViewWillLeave(){
    this.AllowScanner = false
  }
  ionViewDidEnter(){
    this.AllowScanner = true
    this.stock.SetModelInfo('App', 'ActivePage', 'MoveList');
    this.SetSelected(-1);
    console.log ('Entra en listado de albaranes');
    this.BatchId = parseInt(this.route.snapshot.paramMap.get('BatchId'));
    this.BatchDomain = ['picking_id.batch_id', '=', this.BatchId];

    // this.Locations = this.stock.Locations;
    this.scanner.ActiveScanner = false;
    
    this.WaitingSerials = true;
    this.GetInfo();
    console.log("Rellenando StockLocation")
    this.StockLocation = {}
    //for (let loc in this.stock.Locations){
    //  let location = this.stock.Locations[loc]
    //  this.StockLocation[location['name']] = loc
    //}
    if (!this.stock.Locations){
      this.stock.LoadPersistentData()
    }
  }
  async presentToast(Str = 'Error de validación', Header = 'Aviso:', duration= 2000 ) {
    const toast = await this.toastController.create({
      header: Header,
      message: Str,
      duration: duration,
    });
    toast.present();
  }

  TabNavegarA(URL){
    if (this.SelectedMove){
      this.SelectedMove = null
      this.Selected = -1

    }
    else {
      this.router.navigateByUrl(URL);
    }
  }
  SetSelected(indice){
    
    if (!this.Moves){
      return
    } 
    if (this.SelectedMove){this.SelectedMove['need_confirm_product_id'] = this.TypeId['need_confirm_product_id']}
    if (this.Moves.length == 1){
      this.Selected = 0
      this.SelectedMove = this.Moves[0]
      return
    }
    // Selecciona Deselleciona un movimiento
    this.Selected = indice
    if (indice > -1) {
      if (this.Moves){
        this.SelectedMove = this.Moves[indice]
      }
    }
    else {
      this.SelectedMove = null
    }
    if (this.SelectedMove){this.SelectedMove['need_confirm_product_id'] = this.TypeId['need_confirm_product_id']}
  }

  ApplyGetInfo(Res, values){
    this.LimitReached = Res['Moves'].length < this.Limit;
    if (this.LimitReached) {
      this.infiniteScroll.disabled = true;
    }
    if (values['load_type'] === 'load') {
      this.Batch = Res['Moves'][0]['batch_id'];
      this.AllMoves = Res['Moves'];
      this.TypeId = this.stock.PickingTypeIds.filter(x=> x['id'] == Res['Moves'][0]['picking_type_id'])[0];
      
      // tslint:disable-next-line:forin
    }
    else {
      // Tengo que insertar. Siempre debería de recibir los movimientos de un stock move line o de un scroll
      // NO SCROLL.
      if (values['delete_move']){
        const MoveId = values['delete_move'];
        const MovesFiltered = this.AllMoves.filter(field => (field['move_id'] === MoveId));
        for (const SmlId of MovesFiltered) {
          this.AllMoves.splice(SmlId['indice'], 1);
        }
      }
    }
    this.Moves = this.FilterMoves(this.AllMoves)
    let NewSelected = -1;
    if (this.PrevId){
      const MoveSelected = this.Moves.filter(x => x['id'] == this.PrevId)
      if (MoveSelected.length != 0) {
        let NewSelected = MoveSelected[0]['indice']
      }
    }
    this.SetSelected(NewSelected)
    this.loading.dismiss();
  }

  GetInfoDomain(Domain = []){
    if (this.BatchId){
      Domain.push(this.BatchDomain);
    }
    return Domain;
  }

  GetInfo(Domain = [], Model = 'stock.move.line', LoadType = 'load'){
    const self = this;
    let values = {};
    Domain = this.GetInfoDomain(Domain);
    if (this.Offset === 0){this.LimitReached = false;  this.infiniteScroll.disabled = false; }
    values = {domain: Domain, offset: this.Offset, limit: this.Limit, model: Model, load_type: LoadType};
    console.log('Conectando a Odoo para recuperar' + values['domain']);
    self.presentLoading('Cargando movimeintos');
    const promise = new Promise( (resolve, reject) => {
        self.odooCon.execute('stock.move.line', 'get_apk_tree', values).then((Res: Array<{}>) => {
          if (Res['Moves'].length > 0){
            self.ApplyGetInfo(Res, {load_type: LoadType});
          }
          else {
            self.LimitReached = true;
            self.infiniteScroll.disabled = true;
          }
          // self.UpdateAsyncLots(Res['Moves'], values);
          self.loading.dismiss();
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
    });
    });
    return promise;
  }
  AlternateWaitingSerials(){
    this.WaitingSerials = !this.WaitingSerials
    
  }
  ScrollToId(ElemId){
    document.getElementById(ElemId).scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  async presentLoading(Message= 'Cargando...', duration=3500) {
    this.loading = await this.loadingController.create({
      message: Message,
      translucent: true, 
      backdropDismiss: true,
      duration: duration,
      cssClass: 'custom-class custom-loading'
    });
    await this.loading.present();
  }

  // INFINITI SCROLL
   loadData(event) {
    if (this.Selected > -1){return}
    clearTimeout(this.timeout);
    setTimeout(() => {
      console.log('Loading more MOVES');
      event.target.complete();
      this.Offset = this.Moves.length;
      this.GetInfo();
      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      // Esta lógica debe ir depués de recuperar la info pq es un rpomise
      // if (this.LimitReached) {
      //   event.target.disabled = true;
      // }
    }, 300);
  }
  AddNewSml(){
    if (!this.SelectedMove){
      return;
    }
    const id = this.SelectedMove['id']
    const move_id = this.SelectedMove['move_id']
    let self = this
    const values = {'id': id}
    this.odooCon.execute('stock.move.line', 'action_copy_line', values).then((NewMoves:Array<{}>) => {
      
      self.AllMoves = self.AllMoves.filter(x=> x['move_id'] != move_id)
      for (const NewMove of NewMoves) {self.AllMoves.push(NewMove)}
      self.Moves = self.FilterMoves(self.AllMoves, true)
      let MoveSelected = self.Moves.filter(x =>  x['move_id'] == move_id && x['qty_done'] == 0 )
      if (MoveSelected.length == 0) {
        MoveSelected = self.Moves.filter(x => x['move_id'] == move_id )
      }
      
      if (MoveSelected) {
        self.SetSelected(MoveSelected[0]['indice'])
      }
      else {
        
        self.SetSelected(-1)
      }
      self.loading.dismiss();
      })
      .catch((error) => {
        this.loading.dismiss();
        this.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
  }
  Reserve(){
    this.stock.Aviso("Aviso", "Función no habilitada");
    //  TO_DO DEBERIA DE RESERVAR EL MOVIMIENTO
    // Quito todos los moves de move_id
    // Hago action_assign en el servidor
    // Recupero todos los movimientos
    // 
    if (!this.SelectedMove){
      return;
    }
    if (['in_progress', 'waiting', 'confirmed'].indexOf(this.SelectedMove['state']['value']) != -1){
      return
    }
    // Quito todos los moves de move_id
    const move_id = this.SelectedMove['move_id']
    const batch_id = this.SelectedMove['batch_id']['id']
    let self = this
    this.AllMoves = this.AllMoves.filter(x=> x['move_id'] != move_id)
    const values = {'move_id': move_id, 'batch_id': batch_id}
    this.odooCon.execute('stock.move', 'action_assign_apk', values).then((Res:Array<{}>) => {
      for (const Move of Res) {
        self.AllMoves.push(Move)
      }
      self.Moves = self.FilterMoves(self.AllMoves, true)
      const MoveSelected = self.Moves.filter(x => x['move_id'] == move_id)
      if (MoveSelected.length != 0) {
        self.SetSelected(MoveSelected[0]['indice'])
      }
      else {
        self.SetSelected(-1)
      }
      self.loading.dismiss();
      })
      .catch((error) => {
        this.loading.dismiss();
        this.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
  }

  UnReserve(){
    this.stock.Aviso("Aviso", "Función no habilitada");
    // TO_DO
    if (this.Selected === -1){return; }
    const self = this;
    let msg = '';
    const Model = 'stock.move';
    const move = this.SelectedMove;
    
    if (['in_progress', 'waiting', 'confirmed', 'assigned'].indexOf(move['state']['value']) == -1){
      msg += '<hr/>' + move['name'] + ': Estado incorrecto';
      msg += '<hr/>No se reserva nada';
      this.stock.play('error');
      this.presentToast(msg, 'AVISO:');
      
    }
    else {
      console.log('Se van a desreservar ' + move['move_id']);
      this.stock.play('click');
      const values = {id: [move['move_id']]};
      this.odooCon.execute(Model, 'do_unreserve_apk', values).then((done) => {
        console.log(done);
        self.GetInfo();
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    }

  }
  ValidateBatch(){
    // this.presentLoading("Validando Movimientos ...")
    let qty = 0.0
    for (const move of this.AllMoves){
      if (move['need_location_id'] || move['need_location_dest_id'] || move['need_confirm_lot_id']){
        this.stock.play("error")
        this.presentToast ("Movimientos incompletos", "Condiciones de validación:")
        return
      }
      qty += move['qty_done']
    }
    if (qty == 0.0){
      this.stock.play("error")
      this.presentToast ("No se ha hecho ninguna cantidad", "Condiciones de validación:")
      return
    }
    this.presentLoading("Validando Movimientos ...")
    this.stock.ButtonValidateApk(this.BatchId)
      .then((res: boolean) => {
        this.loading.dismiss()
        //this.router.navigateByUrl('/listado-albaranes/' + this.TypeId['id']);
      })
      .catch((error) =>{
        this.loading.dismiss()
      })
    this.router.navigateByUrl('/listado-albaranes/' + this.TypeId['id']);
  }
  // ToMove

  ToMove(Pos, Inc){
    const max = this.Moves.length
    let Selected = this.Selected
    if (Pos === 1){
      Selected = 0;
    }
    else if (Pos === -1){
      Selected = max - 1;
    }
    else if (Inc === 1){
      Selected += 1;
      if (Selected > max -1){
        Selected = 0;
      }
    }
    else if (Inc === -1){
      Selected += -1;
      if (Selected < 0){Selected = max -1}
    }
    this.SetSelected(Selected)
  }

  // BOTONES DE ACCION
  async presentButtons() {
    const Buttons = [];
    if (this.Selected !== -1){
      Buttons.push({
        text: 'Resetear',
        icon: 'refresh-circle-outline',
        handler: () => {
          this.ResetearMoves();
      }});
      Buttons.push({
        text: 'Reservar',
        icon: 'battery-charging-outline',
        handler: () => {
          this.Reserve();
      }});
      Buttons.push({
        text: 'Anular reserva',
        icon: 'battery-dead-outline',
        handler: () => {
          this.UnReserve();
      }});
      Buttons.push({
        text: 'Duplicar línea',
        icon: 'git-network-outline',
        handler: () => {
          this.AddNewSml();
      }});
    }
    if (this.Selected == -1 || this['Moves'].length == 1){
    Buttons.push({
        text: 'Validar Batch',
        icon: 'checkmark-done-circle-outline',
        handler: () => {
          this.ValidateBatch();
      }});
    }

    if (this.Selected > -1){
      Buttons.push({
        text: this.ToDelete ? 'Borrar' : 'Añadir',
        icon: '',
        handler: () => {
          this.ToDelete = !this.ToDelete;
      }});
    }
    
    Buttons.push({
      text: this.scanner.ActiveScanner ? 'Teclado' : 'Barcode',
      icon: this.scanner.ActiveScanner ? 'text-outline' : 'barcode',
      handler: () => {
        this.scanner.ActiveScanner = !this.scanner.ActiveScanner;
    }});
    

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
  // FILTROS
  // BOTONES DE FILTERS
  // primero creo un botón para cada filtro y esto abre el ratio conlos filtros para ese botón
  async CreateFilterButtons() {
    const Buttons = [];
    // Boton de Estado
    Buttons.push ({
        text: 'Estado',
        icon: this.FilterStates ? 'add-circle-outline' : 'funnel-outline',
        handler: () => {
          actionSheet.dismiss().then(() => {
            this.CreateFilterRadios('Estado');
          });
        }
      });
    Buttons.push ({
        text: 'Cantidades',
        icon: this.FilterQties ? 'add-circle-outline' : 'funnel-outline',
        handler: () => {
          actionSheet.dismiss().then(() => {
            this.CreateFilterRadios('Cantidades');
          });
        }
      });

    const actionSheet = await this.actionSheetCtrl.create({
        header: 'FILTRO',
        buttons: Buttons
      });
    await actionSheet.present();
  }
  async CreateFilterRadios(FilterField){
    const Radios = [];
    let FilterHeader = 'Valores';
    const self = this;
    let FilterList
    let FilterApplied
    if (FilterField == 'Estado') {
      FilterList = this.AvailableStates;
      FilterApplied = this.FilterStates;
    }
    else if (FilterField == 'Cantidades'){
      FilterList = this.AvailableQties;
      FilterApplied = this.FilterQties;
    }
    let Active: boolean = false;
    for (let key in FilterList){
      FilterHeader = FilterField;
      Active = FilterApplied.hasOwnProperty(key)
      Radios.push ({
        name: 'Nombre_' + key,
        type: 'checkbox',
        label: FilterList[key],
        value: key,
        checked: Active,
      });
    }
    console.log(Radios);
    const actionSheet = await this.alertController.create({

        header: FilterHeader,
        inputs: Radios,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              console.log('Cancelar');
            }
          }, {
            text: 'Ok',
            handler: (data: Array <string>) => {
              actionSheet.dismiss().then(() => {
                console.log('Confirm Ok' + data);
                this.ApplyFilter(FilterField, data);
              });

            }
          }
        ]
      });
    await actionSheet.present();
  }

  ApplyFilter(Filter, data){
    console.log(data)
    console.log(Filter)
    
    if (Filter == 'Estado') {
      this.FilterStates = {}
      for (let key of data){
        this.FilterStates[key] = this.AvailableStates[key]
      }
    }
    else if (Filter == 'Cantidades'){
      this.FilterQties = {}
      for (let key of data){
        this.FilterQties[key] = this.AvailableQties[key]
      }
    }
    this.Moves = this.FilterMoves(this.AllMoves)
  }

  //
  // this.AvailableQties = {zero:'Por hacer', to_do:'Pendientes', done: 'Hechas'}
  // this.AvailableStates = {
    // confirmed: 'Por hacer', 
    // waiting: 'En espera', 
    // partially_available: 'Incompleta', 
    // assigned:'Reservada',
    // done: 'Hecha'}

  //
  FilterMoves(Moves, Reorder=true){
    const filterqties = this.stock.IsEmpty(this.FilterQties)
    const filterstates = this.stock.IsEmpty(this.FilterStates)
    let Filtered: Array<{}> = []
    if (filterqties && filterstates){
      Filtered = Moves
    }
    else {
      let Filtered: Array<{}> = []
      let to_add    
      for (const Move of Moves){
        to_add = true
        if (!filterqties){
          for (let key in this.FilterQties){
            if (key == 'zero' && Move['qty_done']> 0) {
              to_add = false
              continue
            }
            if (key == 'to_do' && Move['qty_done'] >= Move['product_uom_qty']) {
              to_add = false
              continue
            }
            if (key == 'done' && Move['qty_done'] < Move['product_uom_qty']) {
              to_add = false
              continue
            }
          }
        }
        if (!to_add && !filterstates && !this.FilterStates.hasOwnProperty(Move['state']['value'])){
          continue
        }
        if (to_add){
          Filtered.push(Move)
        }
      }
    }
    if (Reorder) {
      console.log("REORDENANDO ...")
      Filtered = this.stock.OrderArrayOfDict(Filtered, true, ['removal_priority', 'product_id', 'picking_id'], [true, true, true]);
    }
    else {
      let indice = 0
      for (let move of Filtered){
        move['indice'] = indice
        indice +=1
      }

    }

    return Filtered
  }
  //
  DeSeleccionar(){
    this.SetSelected(-1);
  }

  ResetearMoves(){
    let Moves = []
    let Ids = []; 
    if (this.Selected !== -1){
      Ids.push(this.Moves[this.Selected]['id'])
      Moves.push(this.Moves[this.Selected])
    }
    else {
      let Ids = []
      for (const Move1 of this.Moves){
        Ids.push(Move1['id']);
      }
      Moves = this.Moves
    }
    let vals = {need_location_id: this.TypeId['need_location_id'], 
                need_location_dest_id: this.TypeId['need_location_dest_id'],
                need_loc_before_qty: this.TypeId['need_loc_before_qty'],
                lot_id: false,
                lot_name: false,
                lot_ids: [[5, 0, 0]],
                qty_done: 0}
    let values = {values: vals, ids: Ids}
    for (const Move of Moves){
      Move['need_location_id'] = this.TypeId['need_location_id'];
      Move['need_location_dest_id'] = this.TypeId['need_location_dest_id'];
      Move['need_loc_before_qty'] = this.TypeId['need_loc_before_qty'];
      Move['lot_name'] = ''
      Move['lot_ids_string'] = ''
      Move['lot_id'] = false;
      Move['qty_done'] = 0;
      Move['lot_ids'] = []
      Move['serials'] = []
    }
    
    this.stock.ResetMoves(values)
    this.SelectedLotsForMoveStr = '';
    

  }
  // FILTROS ONLINE
  CheckMoveVisibilityByQty(Index, value){
    // ('0', 'Pendientes'): Cantidades pendientes. Da igual como estén las ubicaciones
    // ('1', 'En proceso'): Algo pendiente. Cantidades o ubicaciones pendientes
    // ('2', 'Pick Completo'): Todo Completo. Completas
    let splice = true;
    const Move = this.Moves[Index]
    const QtyDone = Move['qty_done'];
    const ProducUomQty = Move['product_uom_qty'];

    if (value['checked'].indexOf('0') !== -1 && QtyDone < ProducUomQty){
      splice = false;
    }
    if (value['checked'].indexOf('1') !== -1 && (QtyDone < ProducUomQty || Move['need_location_id'] || Move['need_location_dest_id'])){
      splice = false;
    }
    if (value['checked'].indexOf('2') !== -1 && QtyDone >= ProducUomQty){
      splice = false;
    }
    if (splice) {
      this.Moves.splice(Index, 1);
    }
    return splice;
  }
  // UBICACIONES
 
  // UBICACIONES
  async OpenGetLocation(Move, LocationField){
    
    const LocationStr = LocationField === 'location_id' ? 'Origen' : 'Destino';
    const LocationNeed = 'need_' + LocationField;
    const AllowChange = 'allow_change_' + LocationField;
    //Si no lo necesito no permito cambiarlo, por lo que lo cambio a necesitarlo
    Move[LocationNeed] = !Move[LocationNeed]
    if (!this.TypeId[LocationNeed]){return;}
    // Para cambiarlo tengo que "necesitarlo", por lo que debería forazarlo antes

    // Si no puedo cambiar y NO necesita ubicación >> NO hago nada
    if (!this.TypeId[AllowChange] && !this.TypeId[LocationNeed]){
      return;
    }
    console.log('Preguntamos por la ubicación ' + LocationStr + '. Campo ' + LocationField);
    this.scanner.ActiveScanner = true;
    const alert = await this.alertController.create({
      subHeader: 'para ' + Move['product_id']['name'] ,
      header: 'Confirma ' + LocationStr,
      inputs: [{name: 'barcode',
               type: 'text',
               id: 'LocationBarcodeId',
               placeholder: Move[LocationField]['barcode'] || Move[LocationField]['name']}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            // Si cancelo, reseteo la marca de ubicación. Es decir lo pongo por defecto
            // TO_CHECK o no
            console.log('Confirm Cancel');
            this.scanner.ActiveScanner = false;
          }
        }, {
          text: 'Aplicar',
          handler: (data: number) => {
            // Activo el scanner
            // Saco la ubicación
            let barcode = data['barcode'] || Move[LocationField]['barcode']
            let values = {}
            

            if (barcode in this.stock.LocBarcodes){
              // Si el que leo es el mismo que hay ... CONFIRMO y EScribo en odoo
              if (Move[LocationField]['barcode'] === barcode){
                Move[LocationNeed] = false;
                values[LocationNeed] = false        
              }
              // Si leo una ubicación permitida pero disinta
              else if (AllowChange){
                // Permito cambiar. => Cambio
                // Reseteo la lectura y cambio la ubicación. Necesita una 2ª lectura para modificarlo
                Move[LocationField]= this.stock.Locations[barcode]
                Move[LocationField] = this.stock.GetObjectByBarcode(this.stock.Locations, barcode)
                values[LocationNeed] = this.TypeId[LocationNeed]
                values[LocationField] = Move[LocationField]['id']
                

              }
              if (values){
                this.WriteAsyn('stock.move.line', Move['id'], values);
                this.stock.play('click');
                this.scanner.ActiveScanner = false;
                this.CheckIfNext(Move)
                return
              }
            }
            else {
              // NO SE ENCUENTRA EL BARCODE EN EL LISTADO
              this.scanner.ActiveScanner = true;
              this.stock.play('error');
              return;
            }
            
          }
        }],
    });

    await alert.present().then((a) => {
      const elem = document.getElementById('LocationBarcodeId');
      setTimeout(() => { elem.focus(); }, 50);
    });
  }

  

  UpdateLoc(indice, Field, SmlId, Barcode){
    const self = this;
    const Model = 'stock.move.line';
    const Values = {sml_id: SmlId, barcode: Barcode, location: Field, domain: this.GetInfoDomain()};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(Model, 'update_loc', Values).then((Res: Array<{}>) => {
        // Devuelvo los movimientos:
        // Si es una listaself.Moves[indice] = Res;
        self.Moves[indice][Field] = Res[0][Field];

        // self.LoadReturnMoves(Res, SmlId, indice);
        // this.ApplyQtiesFilterx1(indice);
      })
    .catch((error) => {
      self.stock.play('error');
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;
  }
  // NewSerials

  // Add Lots:

  onEnter(event, indice){
    const ReadedSerial = event.target.value;
    event.target.value = ''
    this.scanner.ActiveScanner = false
    this.CheckScanner(ReadedSerial)
    //return this.AddSetLot(this.SelectedMove, ReadedSerial)
    
  }

  IonFocus(indice, action){
    this.scanner.ActiveScanner = action;
    //REVISAR
    // this.scanner.ActiveScanner = false;
    if (!action){
      this.WaitingSerials = true;
    }
  }
  AddNewSerialEvent(event, indice){
    const value = event.target.value;
    this.NewSerial = value
  }
  ToDoToday(){}
  // LOTES Y SERIES
  


  AlternateSelected(indice){
    this.SetSelected (this.Selected === indice ? -1 : indice);
    
  }
  
  // Rellenar INFO LOTS AND SERIALS
  // CANTIDADES
  ClickQty(Move){

    const indice = Move['indice'];
    const MoveId = Move['id'];
    if (this.Selected !== indice){
      this.SetSelected(indice);
      return;
    }
    if (Move['tracking'] !== 'none'){
      this.OpenVirtualBarcodeMultiline(Move);
    }
    // EL BARCODE NO VARIA CANTIDAD SI HAY LOTES
    // if (Move['tracking'] === 'lot' && Move['selected'] && Move['lot_id']){
    //   this.InputQty(indice);
    // }
  }

  async InputQty(Move, subheader = ''){
    if (Move['tracking'] === 'virtual' || Move['tracking'] === 'serial') {
      return
    }
    // Este if me permite llamar desde la vista independientemente del Movieminto
    if (Move['tracking'] === 'lot' && (!Move['lot_name'] && !Move['lot_id'])){
      this.presentToast('No hay lote asignado', 'Error de formulario');
      return;
    }
    this.scanner.ActiveScanner = true;
    let Qty = ''
    if (Move['qty_done'] > 0){
      Qty = Move['qty_done']
    }
    else {
      Qty = Move['product_uom_qty'];
    }
    
    subheader = subheader || Move['product_id']['name'];
    const alert = await this.alertController.create({
      header: 'Cantidad en ' + Move['uom_id']['name'] ,
      subHeader: subheader,
      inputs: [{name: 'qty_done',
               value: Qty,
               type: 'number',
               id: 'qty-id',
               placeholder: Qty}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.scanner.ActiveScanner = false;
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Aplicar',
          handler: (data: number) => {
            this.scanner.ActiveScanner = false;
            const QtyDone = Number(data['qty_done']);
            if (Number(QtyDone) >= 0) {
              this.UpdateQties(Move, 0, QtyDone);
              this.stock.play('ok');

            }
            else {
              this.stock.play('no_ok');
              this.InputQty(Move, 'No válido');
            }
          }
        }],
  });
    await alert.present();
  }
  TextAreaChange(indice){
    const lines = this.Moves[indice]['serials'].split(/\r*\n/);
    this.Moves[indice]['qty_done'] = lines.length;

  }
  OpenQtiesIndex(Index, IncQty = 0, Qty = 0){
    return this.UpdateQties(this.Moves[Index], IncQty, Qty)
  }
  CheckIfNext(Move){
    if (this.TypeId['next_move_on_qty_done'] && 
      Move['qty_done'] >= Move['product_uom_qty'] && 
      !Move['need_location_dest_id'] && 
      !Move['need_location_id'] 
      
      ){
      return this.ToMove(0,1);
    }
  }
  UpdateQties(Move, IncQty = 0, Qty = 0){

    // Compruebo cantidades.
    // Puedo recibir incrementos o cantidades fijas
    // Si puedo hacer más del o que me piden
    this.presentLoading("Update Qty")
    let write = false;
    let QtyDone = Move['qty_done'];
    if (Move['tracking'] === 'lot' && Move['need_confirm_lot_id']){
      this.loading.dismiss()
      this.stock.play('error');
      this.presentToast ('Debes primero confirmar el lote', 'Error de formulario:');
      return;
    }
    // si recibo incremento. Entonces
    if (IncQty !== 0) {
      QtyDone += IncQty;
      write = true;
    }
    else {
      QtyDone = Qty;
      write = true;
    }
    // Si la nueva cantidad es mayor que la pedida y NO oevrprocess => CANCELO Y NO HAGO NADA
    if (QtyDone > Move['product_uom_qty'] && !this.TypeId['allow_overprocess']){
      this.loading.dismiss()
      this.presentToast ('El tipo ' + this.TypeId['name'] + ' no permite más cantidad que la reservada', 'Error de formulario:');
      this.stock.play('no_ok');
      return;
    }
    // SI ES MENOR QUE CERO, CANCELO ....
    else if (QtyDone < 0) {
      this.loading.dismiss()
      this.presentToast ('No puedes poner negativos', 'Error de forumlario: ');
      this.stock.play('no_ok');
      return;
    }
    // Si llego aquí y he modificado la QtyDOne:
    if (write) {
      this.stock.play('ok');
      // Si llego aquí permito cambiar cantidad
      Move['qty_done'] = QtyDone;
      // Escribo asíncrono la cantidad. No necesito esperar respuesta
      // this.presentToast ('Cant: ' + QtyDone, Move['name'], 27);
      this.WriteAsyn('stock.move.line', Move['id'], {qty_done: QtyDone}) ;
      return this.CheckIfNext(Move)
    }
    this.loading.dismiss()
    return
   
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
  
  // SCANNER FUNCITONS
  ResetScanner() {
    this.LastReading = this.ScannerReading;
    this.ScannerFooter.ScanReader.controls.scan.setValue('');
    this.scanner.ResetScan();
    // this.ScanReader.controls.scan.setValue =''
  }

  UpdateTrackMoveQtyDone(Move = {}, Serial = {}, val = ''){
    
    let write = false;
    const Delete = false;
    let lot_id = {}
    const QtyDone = Move['qty_done'] + 1;
    if (!this.ToDelete){
      if (QtyDone > Move['product_uom_qty'] && !this.TypeId['allow_overprocess']){
        this.presentToast ('El tipo ' + this.TypeId['name'] + ' no permite más cantidad que la reservada', 'Error de formulario:');
        this.stock.play('error');
        return;
      }
      else if (QtyDone < 0) {
        this.presentToast ('No puedes poner negativos', 'Error de formulario:');
        this.stock.play('error');
        return;
      }
    }
    else {
      if (QtyDone < 0) {
        this.presentToast ('No puedes poner negativos', 'Error de formulario:');
        this.stock.play('error');
        return;
      }
    }
    if (Serial === {}){return}
    // Tracking Virtual.
    // Si llego aquí escribo
    lot_id = {'id': Serial['id'], 'name': val}
    if (Move['tracking'] === 'virtual'){
      const move_lot_id = Move['lot_ids'].filter(x => x['id'] === lot_id['id'])
      if (!this.ToDelete){
        //Añadir
        if (move_lot_id.length === 0) {
          this.stock.play('ok')
          Move['lot_ids'].push(Serial);
          Move['qty_done'] = Move['lot_ids'].length;
          const values =  {qty_done: Move['qty_done'], lot_ids: [[4, Serial['id']]] };
          this.WriteAsyn('stock.move.line', Move['id'], values);
          this.CheckIfNext(Move)
          return
        }
        else {
          return this.presentToast('Has intentado entrar un serie ya leido en el movimiento', 'Error de formulario:');
        }
      }
      else {
        //Eliminar
        if (move_lot_id > 0) {
            Move['lot_ids'].pop(Serial);
            Move['qty_done'] = Move['lot_ids'].length;
            this.stock.play('ok')
            const values =  {qty_done: Move['qty_done'], lot_ids: [[3, Serial['id']]] };
            this.WriteAsyn('stock.move.line', Move['id'], values) ;
            this.CheckIfNext(Move)
          return
        }
        else {
          return this.presentToast('Has intentado quitar un serie qu eno está en el movimiento', 'Error de formulario:');
        }
      }
    }
    if (Move['tracking'] === 'lot'){
      // Si es un lote, primero tengo que mirar si está puesto
      let move_lot_id = Move['lot_id']
      if (!move_lot_id['id']){
        Move['lot_id'] = lot_id
        Move['qty_done'] = 1;
        const values = {qty_done: 1, lot_id: Serial['id']}
        this.stock.play('ok')
        this.WriteAsyn('stock.move.line', Move['id'], values) ;
      }
      else if (move_lot_id['id'] !== Serial['id']){
        //Cambio el número de serie
        Move['lot_id'] = lot_id
        Move['qty_done'] = 0;
        const values = {qty_done: 0, lot_id: Serial['id']}
        this.stock.play('ok')
        this.WriteAsyn('stock.move.line', Move['id'], values) ;
      }
      else if (move_lot_id['id'] === Serial['id']){
        //Sumo uno
        Move['qty_done'] = QtyDone;
        const values = {qty_done: QtyDone}
        this.stock.play('ok')
        this.WriteAsyn('stock.move.line', Move['id'], values) ;
        
      }
      this.CheckIfNext(Move)
      return

    }

  }

  ScannedSerial(MoveSelected={}, Serials={}, val){
    let MovesSelected = []
    if (!Serials){
      // Serials = this.Serials[val]
      if (!Serials) {
        return this.presentToast('No se ha recibido ningún serial para el código ' + val, 'Error de lectura:');
      }
    }
    // Tengo un movimiento seleccionado pero no coincide con el que me llega, solo cambio la seleccion pero NO HAGO NADA
    if (MoveSelected && MoveSelected['indice'] !== this.Selected){
      this.stock.play('ok1')
      this.SetSelected(MoveSelected['indice']);
      return
    }

    // Si no me llega movimiento pero tengo uno seleccionado, lo cojo como ese. ESTO NO TINE LOGICA
    if (!MoveSelected && this.Selected > -1){
      MoveSelected = this.Moves[this.Selected]
    }

    
    if (!MoveSelected){
    
      MovesSelected = this.Moves.filter(x => x['product_id']['id'] === [0])
      if (MovesSelected.length > 1){
        this.stock.play('ok1')
        this.SetSelected (MovesSelected[0]['indice']);
        return ;
      }
      if (MovesSelected.length = 0){
        return ;
      }
    }
      // Si no hay movimiento seleccionado, no puedo pasar de aquí
    if (!MoveSelected){
      this.stock.play('error')
      return
    }
    // Ya llego con un solo movimiento
   // const product_id = MoveSelected['product_id']['id']
    //let Serial = Serials[product_id]
    this.ScrollToId(MoveSelected['id']);
    this.UpdateTrackMoveQtyDone(MoveSelected, Serials, val);
    return
  }
// ESCANEO UN BARCODES

  

  CheckScannerForSelect(val){
    if (this.SelectedMove){
      return this.stock.Aviso("Error", "NO debería entrar aquí con selección")
    }
    // Tengo que buscar:
    // Es un producto???
    let MovesSelected = []
    MovesSelected = this.Moves.filter(field => (
      field[this.TypeId['default_location']]['barcode'] == val ||
      field['product_id']['default_code'] == val || 
      field[this.TypeId['default_location']]['name'] == val|| 
      field['product_id']['barcode'] == val));

    if (MovesSelected.length > 0){
      this.SetSelected(MovesSelected[0]['indice'])
      return;
    }
    this.presentToast("No reconozco " + val, "Error de lectura:")
  }
  CheckScanner(val) {

    // AQUI DETECTO LO QUE SE HA LEIDO
    // PUEDES SER 
    // BARCODE >> ARTICULO
    // LOTE >> DETECTO ARTICULO + LOTE
    // SERIAL >> DETECTO ARTICULO + LOTE
    // LOCATION >> DETECTO UBICACION Y ACTUO SI PROCEDE
    
    console.log('CHECK SCANNER: ' + val + '. Movimiento Seleccionado ' + this.Selected );
    if (val === ''){
      this.ResetScanner();
    }
    // Primero buscon en el formulario si coincide con algo y despues decido que hacer
    let MoveFiltered = {};
    let MovesFiltered = [];

    //Si no tengo selección, la lectura debe seleccionar. Ojo no hago nada más
    if (!this.SelectedMove) {
      return this.CheckScannerForSelect(val)
    }
    

    // Si leo 2 veces, es un serial y leo lo mismo 2 veces abro multicode
    if (this.LastSerial == val && this.SelectedMove['tracking'] == 'virtual'){
        // abro multicode
        this.stock.play("ok")
        return this.OpenVirtualBarcodeMultiline(this.SelectedMove)
    }
    
    // SI YA HAY SELECCION

    // ESCANEO PRODUCTO
    if (this.SelectedMove['product_id']['barcode'] == val || this.SelectedMove['product_id']['default_code'] == val){
      if (this.SelectedMove['need_confirm_product_id']){
        return this.SelectedMove['need_confirm_product_id'] = false
      }
      
      // Leo el producto del movimiento seleccionado
      //Si necesito ller origen, ya no
      if (this.SelectedMove['need_location_id']){
        this.stock.play("error")
        return this.presentToast("Confirma origen primero", "Error de formulario:")
      }
      //Si es por 'none' sumo cantidad
      if (this.SelectedMove['tracking'] == 'none'){
        this.stock.play("ok")
        return this.UpdateQties(this.SelectedMove, 1, 0)
      }
      if (this.SelectedMove['tracking'] == 'lot' && !this.SelectedMove['need_confirm_lot_id']){
        if (this.SelectedMove['lot_id'] || this.SelectedMove['lot_name']){
          this.stock.play("ok")
          return this.UpdateQties(this.SelectedMove, 1, 0)
        }
        else {
          this.stock.play("Error")
          return this.presentToast("No hay lote asignado", "Error de formulario: ")
        }
      }
      // EN CASO DE VIRTUAL O SERIAL NO HAGO NADA
    }
    if (this.SelectedMove['need_confirm_product_id']){
      return this.presentToast("Lee primero el articulo", "Aviso ..", 150)
    }
    // ESCANEO ORIGEN
    if (this.SelectedMove['location_id']['barcode'] == val || this.SelectedMove['location_id']['name'] == val){
      if (this.SelectedMove['need_location_id']){
        this.SelectedMove['need_location_id'] = false
        this.stock.play("ok")
        return
      }
    }

    if (this.SelectedMove['location_dest_id']['barcode'] == val || this.SelectedMove['location_dest_id']['name'] == val){
      if (this.SelectedMove['need_location_dest_id']){
        this.SelectedMove['need_location_dest_id'] = false
        this.stock.play("ok")
        return
      }
    }

    // Es lote del movimientoç
    


    // CAMBIO DE UBICACIONES
    //Si perimito cambiar origen/destino busco si es ubicaciópn si no ya no me sirve de nada evito buscar
    // Es una ubicación si existe LocationRead
    const locs = this.stock.Locations.filter(x=> x['barcode'] == val || x['name'] == val)
    let LocationRead
    if (locs.length > 0){
      LocationRead = locs[0]
    }
    else {
      LocationRead = false
    }
    if (LocationRead && (this.TypeId['allow_change_location_id'] || this.TypeId['allow_change_location_dest_id'])){
      if (this.TypeId['allow_change_location_id'] && this.SelectedMove['need_location_id']){
        //SI LEO UBICACIÓN Y NECESITO ORIGEN ESTABLEZCO ORIGEN
        if (this.SelectedMove['qty_done'] > 0){
          this.stock.play("error")
          return this.presentToast('No puedes cambiar origen con cantidad hecha', "Error de formulario:")
          }
        
        this.SelectedMove['location_id'] = locs[0]
        this.stock.play("ok")
        this.WriteAsyn('stock.move.line', this.SelectedMove['id'], {'location_id': locs[0]['id']}) ;
        return this.presentToast('Nuevo origen: ' + locs[0]['name'] , "Cambio:")
        }
        //SI LEO UBICACIÓN Y NECESITO DESTINO ESTABLEZCO DESINO
        if (this.TypeId['allow_change_location_dest_id'] && this.SelectedMove['need_location_dest_id']){
          this.SelectedMove['location_dest_id'] = locs[0]
          this.stock.play("ok")
          this.WriteAsyn('stock.move.line', this.SelectedMove['id'], {'location_dest_id': locs[0]['id']}) ;
          return this.presentToast('Nuevo destino: ' + locs[0]['name'], "Cambio:")
        }
    }
    if (LocationRead){
      
      this.stock.play("error")
      return this.presentToast('No esperaba una ubicación', "Error de formulario:")
    }
    // Es un lote
    if (!this.SelectedMove['need_location_id']){
      if (this.SelectedMove['tracking'] == 'virtual') {
        return this.AddVirtualSerial(this.SelectedMove, val)
      }
      if (this.SelectedMove['tracking'] == 'lot') {
        if (this.SelectedMove['lot_id']['name'] == val || this.SelectedMove['lot_name'] == val){
          this.stock.play("ok")
          if (this.SelectedMove['need_confirm_lot_id']){
            return this.SelectedMove['need_confirm_lot_id'] = false
          }
          return this.UpdateQties(this.SelectedMove, 1, 0)
        }
        else {
          return this.AddSetLot(this.SelectedMove, val)
        }
      }
    }

    if (false && this.TypeId['use_create_lots'] && !this.SelectedMove['need_location_id'] && (this.SelectedMove['tracking'] != 'none')) {
      return this.AssignNewLot(this.SelectedMove, val)
    }
    if (this.SelectedMove['tracking'] != 'none' && !this.TypeId['use_create_lots']){
      this.presentToast("Código " + val + " no válido", "Error de lectura:")  
    }
    this.stock.play('no_ok');
  }
  
  async AddSetLot(Move, LotName){
    console.log('Añado virtual al movimiento')
    if (this.SelectedMove['tracking'] != 'lot'){
      return this.stock.Aviso("Error", "Tracking incorrecto")
    }
    this.presentLoading('Actualizando ..' + LotName);
    this.PrevId = Move['id'];
    const values = {
      'create_new_line': false,
      'product_id': Move['product_id']['id'], 
      'id': Move['id'],
      'lot_name': LotName}
    
    this.odooCon.execute('stock.move.line', 'add_set_lot', values).then((Res:{}) => {
      Res['move']['indice'] = Move['indice']
      this.SelectedMove = this.Moves[this.Selected] = Res['move']
      this.loading.dismiss();
      this.stock.play('ok');
    })
      .catch((error) => {
        this.stock.play('error');
        this.loading.dismiss();
        this.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    return;
  }
  
  async AddVirtualSerial(Move, LotName, ToDelete=false){
    console.log('Añado virtual al movimiento')
    if (this.SelectedMove['tracking'] != 'virtual'){
      return this.stock.Aviso("Error", "Tracking incorrecto")
    }
    if (!ToDelete && this.TypeId['allow_overprocess'] == false && (Move['qty_done'] + 1) > Move['product_uom_qty']){
      this.presentToast("No puedes procesar más cantidad de la pedida", "Error de usuario")
      this.stock.play('error');
      return;
    }
    

    if (!ToDelete && Move['serials'].indexOf(LotName) > -1){
      this.stock.play('error');
      return this.presentToast(LotName + " ya está en el movimiento", "Error de lectura:")
    }
    this.PrevId = Move['id'];
    const values = {
      'to_delete': ToDelete,
      'create_new_line': false,
      'product_id': Move['product_id']['id'], 
      'id': Move['id'],
      'serial_names': [LotName]}
    //this.presentLoading('Actualizando ..' + LotName);
    this.presentToast("Actualizando ...", LotName, 750)
    this.odooCon.execute('stock.move.line', 'add_virtual_serial', values).then((Res:{}) => {
      //this.loading.dismiss();
      if (Res['move']){
        Res['move']['indice'] = Move['indice']
        this.SelectedMove = this.Moves[this.Selected] = Res['move']
        this.stock.play('ok');
        this.CheckIfNext(this.SelectedMove);
      }
      else {
        this.stock.play('error');
        this.presentToast(Res['error'], "Error de validación:", 1500)
      }
      })
      .catch((error) => {
        this.stock.play('error');
        //this.loading.dismiss();
        this.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    return;
  }
  async AssignNewLot(Move, LotName, confirm=false, create_new_line=false){
    // const values = {'id': Move['id'], 'lot_name': LotName}
    if (!confirm && (Move['tracking'] == 'serial' || Move['tracking'] == 'lot')){
      const alert = await this.alertController.create({
        header:LotName,
        message: "Se añadirá al albarán",
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
            handler: (blah) => {
              console.log('Confirm Cancel: blah');
            },
          },
          {
            text: 'Aceptar',
            handler: ()=> {
              
              this.AssignNewLot(Move, LotName, true)}
          },
        ],
      });
      await alert.present();
      return;
    }
    this.presentToast("Nuevo lote/serie:" + LotName, "Cambio:")
    this.PrevId = Move['id'];
    const values = {
      'create_new_line': create_new_line,
      'product_id': Move['product_id']['id'], 
      'id': Move['id'],
      'lot_name': LotName}
    this.presentLoading('Generando nuevo lote/movimiento');
    this.odooCon.execute('stock.move.line', 'action_assign_apk', values).then((Res:Array<{}>) => {
        // Move.qty_done = Res[0]['qty_done']
        // Move.lot_id = Res[0]['lot_id']
        for (let ResMove of Res){
          if (ResMove['id'] !== Move['id']){
            // Si hay un nuevo movimiento
            this.AllMoves.push(ResMove)
            this.Moves = this.FilterMoves(this.AllMoves, true)
          }
          else {
            Move.qty_done = ResMove['qty_done']
            Move.lot_id = ResMove['lot_id']
            Move['product_uom_qty'] =  ResMove['product_uom_qty']
          }
        }
        this.loading.dismiss();
      })
      .catch((error) => {
        this.loading.dismiss();
        this.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    return;
  




  }

  KeyOrder(val){
    if (val == 'ArrowLeft'){return this.ToMove(0,-1)}
    if (val == 'ArrowRight'){return this.ToMove(0,1)}
    if (val == 'ArrowUp' || val == 'ArrowDown'){
      if (this.SelectedMove) {
        
        if (this.SelectedMove['tracking'] == 'none' || (this.SelectedMove['lot_id'] && this.SelectedMove['tracking'] == 'lot')){
          const IncQty = val == 'ArrowUp' ? 1 :-1;
          return this.UpdateQties(this.SelectedMove, IncQty, 0)
        }
      }
      else {
        if (val == 'ArrowUp'){
          return this.SetSelected(0)
        }
        if (val == 'ArrowDown'){
          return this.SetSelected(this.Moves.length - 1)
        }
      }
    }

  }

  async OpenVirtualBarcodeMultiline(Move){
    if (!this.SelectedMove){
      return
    }
    this.scanner.ActiveScanner = true;
    const self = this;
    const indice = Move['indice']
    const modal = await this.modalController.create({
      component: BarcodeMultilinePage,
      cssClass: 'barcode-modal-css',
      componentProps: {
                        ProductId: Move['product_id']['id'],
                        LName: Move['product_id']['name'],
                        L2Name: Move['qty_done'] + "  Nº de serie",
                        PName: "",
                      },
    });
    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      self.scanner.ActiveScanner = false;
      if (detail['data'] == -1){
        return self.loading.dismiss();
      }
      if (detail['data'] && detail['data'].length > 0) {
        const values = {id: Move['id'],
                        domain: self.GetInfoDomain(),
                        serial_names: detail['data']};
        this.presentLoading('Cargando números de serie ...');
        this.odooCon.execute('stock.move.line', 'load_multi_serials', values).then((Res: Array<{}>) => {
          // self.UpdateQTYAndLots(indice, data[0]);
          self.loading.dismiss();
          if (Res['move']){
              Res['move']['indice'] = Move['indice']
              this.SelectedMove = this.Moves[this.Selected] = Res['move']
              this.stock.play('ok');
              this.CheckIfNext(this.SelectedMove);
            }
            else {
              this.stock.play('error');
              this.presentToast(Res['error'], "Error de validación:", 1500)
            }
        })
        .catch((error) => {
          self.loading.dismiss();
          self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
        });
      }
    });
    await modal.present();
  }
  
  ValidateTransfer(){

  }
  allow_touch(){
    this.AllowTouch = true
    this.TouchTimeout = setTimeout(()=>{this.AllowTouch = false; },10000);
  }
}
