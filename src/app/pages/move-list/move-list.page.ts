
import { Component, OnInit, ViewChild, Input, HostListener} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ScannerService } from '../../services/scanner.service';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { OdooService } from '../../services/odoo.service';
import { ModalController, AlertController, IonInfiniteScroll, ActionSheetController, LoadingController } from '@ionic/angular';
import { ScannerFooterComponent } from '../../components/scanner/scanner-footer/scanner-footer.component';
import { OverlayEventDetail } from '@ionic/core';
import { BarcodeMultilinePage } from '../barcode-multiline/barcode-multiline.page';
import { timeStamp } from 'console';
import { pid } from 'process';


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
  Filters: Array<{}>;

  TypeId: {};
  FiltersChecked: {};
  Id: number;
  BatchId: number;

  ngSwitch: any;

  // DEFAULT
  StateDomain: any ;
  BatchDomain: any;

  //
  Selected: number; // -1 si no hay ninguno, si no es el indice del que está seleccionado
  SelectedMove: {};
  StateIcons: {};

  //
  NewSerial: string;

  Lots: {};
  Serials: {};
  SerialsxProduct: {};
  SerialsxProductStr: {};
  Barcodes: {};
  Locations: {};
  AvailableLotsForMove: Array<any>;
  AvailableLotsForMoveStr: string;
  SelectedLotsForMoveStr: string;
  ToDelete: boolean;
  StockLocation: {}; // Listado de todas las ubicaciones disponibles en el sistema y leibles por la pistola (internas)
  WaitingSerials: number; //=True solo lee serials/Lotes
  ChangeQty: integer; // Si es false no permite cambiar cantidades


  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.scanner.ActiveScanner && this.stock.GetModelInfo('App', 'ActivePage') === 'MoveList' && event.which !== 0) {
      console.log('ENVIANDO TECLAS A ' + this.stock.GetModelInfo('App', 'ActivePage'));
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
    public actionSheetCtrl: ActionSheetController,
    public alertController: AlertController,
    private modalController: ModalController,
    public odooCon: OdooService) { }

  onReadingEmitted(val: string) {
    const delay = 200;
    if (this.scanner.TECLAS.indexOf(val)>-1){return this.KeyOrder(val)}
    let index = 0;
    console.log("ANALIZO EN MOVELIST:" + val);
    for (const scan of val){
      if (scan !== '') {
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
    this.FiltersChecked = {state: {checked: ['assigned', 'partially_available']}};
    this.ToDelete = false
    this.scanner.ActiveScanner = false;
  }
  ionViewDidEnter(){
    this.stock.SetModelInfo('App', 'ActivePage', 'MoveList');
    this.Selected = -1;
    console.log ('Entra en listado de albaranes');
    this.BatchId = parseInt(this.route.snapshot.paramMap.get('BatchId'));
    this.BatchDomain = ['picking_id.batch_id', '=', this.BatchId];
    this.Lots = {};
    this.Barcodes = {};
    this.Locations = {};
    this.Serials = {};
    this.SerialsxProduct = {};
    this.SerialsxProductStr = '';
    this.AvailableLotsForMove = [];
    this.scanner.ActiveScanner = false;
    this.WaitingSerials = 0;
    this.GetInfo();
  }

  TabNavegarA(URL){
    this.router.navigateByUrl(URL);
  }

  // Esta función no se usa ....
  LoadReturnMoves(Res, SmlId, indice){

    const MoveId = Res[0]['move_id'];
    const ResLeng = Res.length;


    // Elimino los Barcode al Move['id']. Si devuelvo más de 1 sml_id elimino los del movimeinto
    const barcode = this.Moves[indice]['product_id']['barcode'];

    if (ResLeng === 1){
      const MoveIdIndex = this.Barcodes[barcode]['move_id'].indexOf(SmlId);
      if (MoveIdIndex >= 0){
        this.Barcodes[barcode]['move_id'].splice(MoveIdIndex, 1);
      }
    }
    else {
      for (const Move of this.Moves.filter(item => item['move_id'] === MoveId)) {
        const MoveIdIndex = this.Barcodes[barcode]['move_id'].indexOf(Move['Id']);
        if (MoveIdIndex >= 0){
          this.Barcodes[barcode]['move_id'].splice(MoveIdIndex, 1);
        }
      }
    }
    // Meto los nuevos
    for (const smlid of Res){
      this.Barcodes[barcode].push(smlid['Id']);
    }

    if (Res.length > 1){
      // Me cargo todos los move lines de el movimiento
      this.Moves = this.Moves.filter(Move => Move['move_id'] !== MoveId);
      for (const res of Res) {
        this.Moves.push(res);
      }
    }
    else {
      // Actualizo el move line
      const SmlId = this.Moves.filter(Move => Move['Id'] === Res[0]['Id']);
      for (const field in ['location_id', 'location_dest_id', 'lot_id', 'qty_done']){
        if (SmlId[field] !== Res[0][field]){
          this.Moves[SmlId['indice']][field] = Res[0][field];
        }
      }
    }
    // REGENERO LOTS ES MAS RAPIDO QUE SOLO UNA PARTE
    this.Lots = {};
    for (const Move of this.Moves) {
      if (Move['lot_id']){
        const lot = Move['lot_id']['name'];
        if (!this.Lots.hasOwnProperty(lot)){
          this.Lots[lot] = {move_id: [Move['Id']]};
        }
      }
    }



  }

  ApplyGetInfo(Res, values){
    const self = this;
    this.LimitReached = Res['Moves'].length < this.Limit;
    if (this.LimitReached) {
      this.infiniteScroll.disabled = true;
    }
    if (values['load_type'] === 'load') {
      this.Batch = Res['Moves'][0]['batch_id'];
      this.Moves = Res['Moves'];
      this.Filters = Res['Filter'];
      this.TypeId = Res['Type'];
      this.Barcodes = {};
      // tslint:disable-next-line:forin
    }
    else {
      // Tengo que insertar. Siempre debería de recibir los movimientos de un stock move line o de un scroll

      // NO SCROLL.
      if (values['delete_move']){
        const MoveId = values['delete_move'];
        const MovesFiltered = this.Moves.filter(field => (field['move_id'] === MoveId));
        for (const SmlId of MovesFiltered) {
          this.Moves.splice(SmlId['indice'], 1);
        }
      }

      for (const k of Res['Moves']) {        
        self.Moves.push(self.CheckIfWaitingSerials(k));
      }
    }
    self.Moves = self.stock.OrderArrayOfDict(self.Moves, true, ['removal_priority', 'product_id', 'picking_id'], [true, true, true]);
    this.Selected = -1;
    self.UpdateAsyncLots(self.Moves, values);
    self.loading.dismiss();
  }

  GetInfoDomain(Domain = []){
    if (this.BatchId){
      Domain.push(this.BatchDomain);
    }
    const FilterDomain = this.GetDomainFromActiveFilter();
    if (FilterDomain){
      for (const dom of FilterDomain){
        Domain.push(dom);
      }
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
    self.presentLoading('Cargando albaranes del tipo ' + this.Id);
    const promise = new Promise( (resolve, reject) => {
        self.odooCon.execute('stock.move.line', 'get_apk_tree', values).then((Res: Array<{}>) => {
          this.Locations = Res['Locs'];
          if (Res['Moves'].length > 0){
            Domain = [];
            Domain.push(self.BatchDomain);
            values = {domain: Domain, load_type: LoadType};
            self.ApplyGetInfo(Res, values);
          }
          else {
            this.LimitReached = true;
            this.infiniteScroll.disabled = true;
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
    if (this.WaitingSerials == 1){this.WaitingSerials = 2}
    else if (this.WaitingSerials == 2){this.WaitingSerials = 1}
    

  }
  ScrollToId(ElemId){
    document.getElementById(ElemId).scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
  UpdateAsyncLots(Moves, values){

    const self = this;
    setTimeout(() => {
      console.log ('ACTUALIZANDO BUSQUEDAS. Barcodes con Movimeintos');
      console.log ('Lotes con movimientos');
      self.Barcodes = {};
      self.Lots = {};

      for (const Move of Moves) {
        const barcode = Move['product_id'] && Move['product_id']['barcode'];
        if (barcode){
          if (!self.Barcodes.hasOwnProperty(barcode)){
            self.Barcodes[barcode] = {move_id: [Move['Id']]};
          }
          else {
            self.Barcodes[barcode]['move_id'].push(Move['Id']);
          }
        }
        if (Move['lot_id']){
          const lot = Move['lot_id']['name'];
          if (!self.Lots.hasOwnProperty(lot)){
            self.Lots[lot] = {move_id: [Move['Id']]};
          }
        }

      }
      self.stock.presentToast('OK', 'Búsqueda Códigos de barras por movimientos ', 27);
      // console.log(self.Lots);
      if (values) {
        self.UpdateAsyncSerials(values);
      }
    }, 50);
    this.UpdateLocations({})
  }
  UpdateLocations(values = {}){
    const self = this;
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.location', 'get_apk_location_list', values).then((Res: {}) => {
       self.StockLocation = Res
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;
  }
  UpdateAsyncSerials(values){
    const self = this;
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.move.line', 'get_apk_tracking_info', values).then((Res: {}) => {
        if (Res['Res_Serial']){self.Serials = this.stock.SumDict(self.Serials, Res['Res_Serial']);}
        if (Res['Res_Prod']){self.SerialsxProduct = this.stock.SumList(self.SerialsxProduct, Res['Res_Prod']);}
        self.stock.presentToast('OK', 'Búsqueda Serials', 27);
        console.log('Serials x Product');
        // tslint:disable-next-line:forin
        // for (const k in self.SerialsxProduct) {console.log(self.SerialsxProduct[k]); }
        console.log('Serials');
        // tslint:disable-next-line:forin
        // for (const k in self.Serials) {console.log(self.Serials[k]); }
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;
  }

  async presentLoading(Message= 'Cargando...') {
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

  Reserve(){
    if (this.Selected === -1){return; }
    const self = this;
    let msg = '';
    const Model = 'stock.move';
    const move = this.Moves[this.Selected];
    if (!(move['state'][0] in ['confirmed', 'assigned'])){
        msg += '<hr/>' + move['name'] + ': Estado incorrecto';
        msg += '<hr/>No se reserva nada';
        this.stock.play('error');
        this.stock.presentToast(msg, 'AVISO:');
      }
    else {
      console.log('Se van a reservar ' + move['move_id']);
      this.stock.play('click');
      const values = {id: [move['move_id']]};
      this.odooCon.execute(Model, 'action_assign_apk', values).then((done) => {
        console.log(done);
        self.GetInfo();
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    }
  }

  UnReserve(){
    if (this.Selected === -1){return; }
    const self = this;
    let msg = '';
    const Model = 'stock.move';
    const move = this.Moves[this.Selected];
    if (!(move['state'][0] in ['waiting', 'confirmed', 'assigned'])){
      msg += '<hr/>' + move['name'] + ': Estado incorrecto';
      msg += '<hr/>No se reserva nada';
      this.stock.play('error');
      this.stock.presentToast(msg, 'AVISO:');
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
    this.stock.ButtonValidateApk(this.BatchId);
    this.TabNavegarA('/listado-albaranes/' + this.TypeId['Id']);
  }
  // ToMove

  ToMove(Pos, Inc){
    if (Pos === 1){
      this.Selected = 0;
    }
    else if (Pos === -1){
      this.Selected = this.Moves.length - 1;
    }
    else if (Inc === 1){
      this.Selected += 1;
      if (this.Selected > this.Moves.length -1){this.Selected = 0;}
    }
    else if (Inc === -1){
      this.Selected += -1;
      if (this.Selected < 0){this.Selected = this.Moves.length -1}
    }
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
    Buttons.push({
        text: 'Validar Batch',
        icon: 'checkmark-done-circle-outline',
        handler: () => {
          this.ValidateBatch();
      }});
    Buttons.push({
      text: this.Limit === 0 ? 'Cargar todos' : 'Cargar ' + this.stock.Limit(),
      icon: '',
      handler: () => {
        this.Limit = this.Limit === 0 ? this.stock.Limit() : 0;
        this.GetInfo();
    }});
    if (this.Selected > -1){
      Buttons.push({
        text: this.ToDelete ? 'Borrar' : 'Añadir',
        icon: '',
        handler: () => {
          this.ToDelete = !this.ToDelete;
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

  // BOTONES DE FILTERS
  // primero creo un botón para cada filtro y esto abre el ratio conlos filtros para ese botón
  async CreateFilterButtons() {
    const Buttons = [];
    for (const Filter of this.Filters){
      Buttons.push ({
        text: Filter['name'],
        icon: !(Filter['field'] in this.FiltersChecked) ? 'add-circle-outline' : 'funnel-outline',
        handler: () => {
          actionSheet.dismiss().then(() => {
            this.CreateFilterRadios(Filter['field']);
          });
        }
      });
    }
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
    for (const Filter of this.Filters.filter(field => field['field'] === FilterField)){
      FilterHeader = Filter['name'];
      const ActiveFilter = self.FiltersChecked[Filter['field']];
      let FilterChecked = [];
      if (ActiveFilter) {FilterChecked = ActiveFilter['checked']; }
      else {FilterChecked = []; }

      for (const Val of Filter['values']){
        if (Val !== false){
          Radios.push ({
            name: 'Nombre_' + Val,
            type: 'checkbox',
            label: Val['name'],
            value: Val['value'],
            checked: FilterChecked.length > 0 && (FilterChecked.indexOf(Val['value']) !== -1),
          });
        }
      }
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
  //
  DeSeleccionar(){
    this.Selected = -1;
  }

  ResetearMoves(){
    let Moves = []
    let Ids = []; 
    if (this.Selected !== -1){
      Ids.push(this.Moves[this.Selected]['Id'])
      Moves.push(this.Moves[this.Selected])
    }
    else {
      let Ids = []
      for (const Move1 of this.Moves){
        Ids.push(Move1['Id']);
      }
      Moves = this.Moves
    }
    let vals = {need_location_id: this.TypeId['need_location_id'], 
                need_location_dest_id: this.TypeId['need_location_dest_id'],
                need_loc_before_qty: this.TypeId['need_loc_before_qty'],
                lot_id: false, 
                lot_ids: [[5, 0, 0]],
                qty_done: 0}
    let values = {values: vals, ids: Ids}
    for (const Move of Moves){
      Move['need_location_id'] = this.TypeId['need_location_id'];
      Move['need_location_dest_id'] = this.TypeId['need_location_dest_id'];
      Move['need_loc_before_qty'] = this.TypeId['need_loc_before_qty'];

      Move['lot_id'] = false;
      Move['qty_done'] = 0;
      Move['lot_ids'] = []
    }
    // this.stock.presentToast ('Cant: ' + 0, Move['name']);
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

  ApplyQtiesFilterx1(Move){
    if (this.FiltersChecked['filterqties']){
      const NewMoves = [];
      const value = this.FiltersChecked['filterqties'];
      const splice = this.CheckMoveVisibilityByQty(Move['indice'], value);
      if (splice){
        // Si he modificado, tengo que reordenar
        this.Moves = this.stock.OrderArrayOfDict(this.Moves, true, ['removal_priority', 'product_id', 'picking_id'], [true, true, true]);
      }
    }
    return;
  }

  ApplyQtiesFilter(){
    // Esta función aplica el filtro de cantidades sin llamar a odoo
    // Debería de llamarse siempre que se modifque la cantidad hecha
    if (this.FiltersChecked['filterqties']){
      const NewMoves = [];
      const value = this.FiltersChecked['filterqties'];
      let splice = false;
      // tslint:disable-next-line:forin
      for (const Index in this.Moves){
        splice = splice || this.CheckMoveVisibilityByQty(Index, value);
      }
      if (splice){
        // Si he modificado, tengo que reordenar
        this.Moves = this.stock.OrderArrayOfDict(this.Moves, true, ['removal_priority', 'product_id', 'picking_id'], [true, true, true]);
      }
    }
    return this.Moves;
  }

  // FILTROS DOMAIN
  GetDomainFromActiveFilter(){
    // Filtros activos
    // const F1 = this.FiltersChecked.filter(f1 => f1['field']['checked']);
    const domain = [];
    // tslint:disable-next-line:forin
    for (const F1 in this.FiltersChecked){
      const F2 = this.FiltersChecked[F1];
      const nd = [F1, 'in', F2['checked']];
      domain.push(nd);
    }
    return domain;
  }
  ApplyFilter(field, data){
    console.log('Voy a aplicar los filtros ' + data + ' al campo: ' + field);
    if (data.length > 0) {
      this.FiltersChecked[field] = {checked: data}; }
    else {
      delete this.FiltersChecked[field];
    }
    this.Offset = 0;
    this.Limit = 0;
    this.GetInfo();
  }
  // UBICACIONES
  async InputLocation(indice, field, subheader = ''){
    let Header;
    if (field === 'location_id'){
      Header = 'Unicación origen ?';

    }
    if (field === 'location_dest_id'){
      Header = 'Unicación destino ?';

    }
    if (field === 'lot_id'){
      Header = 'Lote ?';
    }
    const Move = this.Moves[indice];
    this.scanner.ActiveScanner = false;
    const alert = await this.alertController.create({
      header: Header,
      subHeader: subheader,
      inputs: [{name: 'barcode',
               type: 'text',
               id: 'LocationBarcodeId',
               placeholder: 'BARCODE'}],
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
            this.scanner.ActiveScanner = false;
            // if (eval(this.TypeId['location_barcode']).exec(data['barcode'])) {
            if (/[\.]\d{2}[\.]/.exec(data['barcode'])) {
              this.UpdateLoc(indice, field, Move['Id'], data['barcode']);
            }
            else {
              this.stock.play('error');
              this.InputLocation(indice, field, 'El código introducido no coincide con una ubicación');
            }
          }
        }],
    });
    await alert.present().then((a) => {
      const elem = document.getElementById('LocationBarcodeId');
      setTimeout(() => { elem.focus(); }, 100);
    });

  }
  // UBICACIONES
  
  async OpenGetLocation(Move, LocationField){

    this.scanner.ActiveScanner = true;
    const LocationStr = LocationField === 'location_id' ? 'Origen' : 'Destino';
    const LocationNeed = 'need_' + LocationField;
    const AllowChange = 'allow_change_' + LocationField;

    // Si no puedo cambiar y NO necesita ubicación >> NO hago nada
    if (!this.TypeId[AllowChange] && !this.TypeId[LocationNeed]){return; }
    console.log('Preguntamos por la ubicación ' + LocationStr + '. Campo ' + LocationField);

    const alert = await this.alertController.create({
      subHeader: 'para ' + Move['product_id']['name'] ,
      header: 'Confirma ' + LocationStr,
      inputs: [{name: 'barcode',
               type: 'text',
               id: 'LocationBarcodeId',
               placeholder: Move[LocationField]['barcode']}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            // Si cancelo, reseteo la marca de ubicación. Es decir lo pongo por defecto
            // TO_CHECK o no
            
            if (true) {
              let values = {}
              values[LocationNeed] = this.TypeId[LocationNeed] || Move[LocationNeed]
              this.WriteAsyn('stock.move.line', Move['Id'], values);
              Move[LocationNeed] = this.TypeId[LocationNeed]
              this.CheckIfWaitingSerials(Move)
              
            }
            console.log('Confirm Cancel');
            this.scanner.ActiveScanner = false;
          }
        }, {
          text: 'Aplicar',
          handler: (data: number) => {
            // Activo el scanner
            
            const barcode = data['barcode']
            
            // Si el que leo es el mismo que hay ... CONFIRMO y EScribo en odoo
            if (Move[LocationField]['barcode'] === barcode){
              Move[LocationNeed] = false;
              let values = {}
              values[LocationNeed] = false              
              this.WriteAsyn('stock.move.line', Move['Id'], values);
              this.stock.play('click');
              this.CheckIfWaitingSerials(Move)
              this.scanner.ActiveScanner = false;
            }
            // Si leo una ubicación permitida pero disinta
            else if (barcode in this.Locations){
              // Permito cambiar. => Cambio
              if (AllowChange){
                // Reseteo la lectura y cambio la ubicación. Necesita una 2ª lectura para modificarlo
                const values = {}
                values[LocationNeed] = this.TypeId[LocationNeed]
                values[LocationField] = this.Locations[barcode]['Id']
                this.WriteAsyn('stock.move.line', Move['Id'], values);
                Move[LocationNeed] = this.TypeId[LocationNeed]
                // Move[LocationField]= this.Locations[barcode]
                Move[LocationField] = {'Id': this.Locations[barcode]['Id'],
                                       'name': this.Locations[barcode]['name'],
                                       'barcode': barcode}
                this.CheckIfWaitingSerials(Move)
                this.stock.play('click');

                this.scanner.ActiveScanner = false;
                
              }
              // No permito cambiar. No hago nada y tiro error
              if (!AllowChange){
                this.stock.play('error');
                this.scanner.ActiveScanner = false;
              }
            }
            else {
              this.scanner.ActiveScanner = true;
              this.stock.play('error');
              Move[LocationNeed] = this.TypeId[LocationNeed];
              this.OpenGetLocation(Move, LocationField);
            }
            
          }
        }],
    });

    await alert.present().then((a) => {
      const elem = document.getElementById('LocationBarcodeId');
      setTimeout(() => { elem.focus(); }, 50);
    });
  }

  
  async OpenGetBoxId(Move, subheader = ''){
    this.scanner.ActiveScanner = true;
    const alert = await this.alertController.create({
      subHeader: 'para ' + Move['product_id']['name'] ,
      header: 'Confirma Destino',
      inputs: [{name: 'barcode',
               type: 'text',
               id: 'LocationBarcodeId',
               placeholder: Move['location_dest_id']['barcode']}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.WriteAsyn('stock.move.line', Move['Id'], {need_location_dest_id: false});
            console.log('Confirm Cancel');
            this.scanner.ActiveScanner = false;
          }
        }, {
          text: 'Aplicar',
          handler: (data: number) => {

            // if (eval(this.TypeId['location_barcode']).exec(data['barcode'])) {
            // if (/[\.]\d{2}[\.]/.exec(data['barcode'])) {
            //  this.UpdateDestLoc(Move, data['barcode']);
            if (Move['location_dest_id']['barcode'] === data['barcode']){
              Move['need_location_dest_id'] = false;
              this.WriteAsyn('stock.move.line', Move['Id'], {need_location_dest_id: false});
              this.CheckIfWaitingSerials(Move)
              this.scanner.ActiveScanner = false;
            }
            else {
              this.scanner.ActiveScanner = true;
              this.stock.play('error');
              Move['need_location_dest_id'] = false;
              this.OpenGetBoxId(Move, 'El código introducido no coincide con una ubicación');
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
  UpdateDestLoc(Move, Barcode){
    const self = this;
    const Model = 'stock.move.line';
    const values = {sml_id: Move['Id'], barcode: Barcode, domain: this.GetInfoDomain()};

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(Model, 'update_dest_loc', values).then((Res: Array<{}>) => {
        self.Moves[Move['indice']]['location_dest_id'] = Res[0]['location_dest_id'];
        // this.ApplyQtiesFilterx1(Move['indice']);
      })
    .catch((error) => {
      self.stock.play('error');
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;

  }
  // NewSerials

  // Add serials:
  AddSerials(Move, LotNames){
    if ((Move['qty_done'] + 1) > Move['product_uom_qty'] && ! this.TypeId['allow_overprocess']){
      this.stock.play('error');
      this.stock.presentToast("No puedes procesar más cantidad de la pedida")
      return;
    }
    const self = this;
    const values = {Id: Move['Id'], serial_names: LotNames};
    const promise = new Promise( (resolve, reject) => {
      this.odooCon.execute('stock.move.line', 'load_multi_serials', values).then((Res: Array<{}>) => {
        //
       self.UpdateQTYAndLots(Move['indice'], Res[0]);
        })
        .catch((error) => {
          self.stock.play('error');
          self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
          });
      });
    return promise;
  }
  // Add Lots:
  AddLot(Move, LotName){
    // Si el movimiento tiene lote y es el mismo sumo 1.
    if (Move['lot_id'] && Move['lot_id']['name'] === LotName){
      return this.UpdateQties(Move, 1, 0);
    }
    const self = this;
    const values = {Id: Move['Id'], serial_names: LotName};
    const promise = new Promise( (resolve, reject) => {
      this.odooCon.execute('stock.move.line', 'load_multi_serials', values).then((Res: Array<{}>) => {
        // Miro si tengo el id del movimiento, si no es que es uno nuevo.
        // Si es nuevo tengo
        if (Move['Id'] == Res[0]['Id']){
          // Lo igualo pq reinicio todos los datos
          Res[0]['indice'] = Move['indice'];
          self.Moves[Move['indice']] = Res[0];
        }
        else {
          // Es uno nuevo
          // Tengo que quedarme con el Id
          const Id = Res[0]['Id']
          self.Moves.push(Res[0])
          self.Moves = self.stock.OrderArrayOfDict(self.Moves, true, ['removal_priority', 'product_id', 'picking_id'], [true, true, true]);
          const SelectedMove = self.Moves.filter(x => x['Id'] === Id);
          if (SelectedMove){
            this.Selected = SelectedMove[0]['indice']
          }
          
        }
       
        self.Lots[LotName] = {move_id: [Move['Id']]};
        const product_id = Move['product_id']['Id']
        let ProdObj = {}
        let SerialObj = {}

        let SerialVals = {
            Id: Res[0]['lot_id']['Id'], 
            inherit: false, 
            product_id: Move['product_id']['Id'], 
            virtual_tracking: false}
        
        ProdObj[product_id] = SerialVals
        SerialObj[LotName]=ProdObj
        self.Serials = this.stock.SumDict(self.Serials, SerialObj);
        })
        .catch((error) => {
          self.stock.play('error');
          self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
          });
      });
    return promise;
  }
  onEnter(event, indice){
    const ReadedSerial = event.target.value;
    event.target.value = ''
    const Move = this.Moves[indice];
    return this.LotToMove(ReadedSerial, Move)
  }

  LotToMove(ReadedSerial, Move){
    if (!Move['ChangeQty']){
      this.stock.presentToast("No se que hacer con " + ReadedSerial, "Aviso !!!!", 3000)
      return}
    this.NewSerial = ReadedSerial
    const PId = Move['product_id']['Id'];
    const InList = this.SerialsxProduct[PId].indexOf(this.NewSerial) !== -1;
    if (this.NewSerial.length < 4){
      this.NewSerial = '';
      return; }
    if (!(this.TypeId['use_create_lots'] || InList)){
      return this.stock.presentToast('El Nº de serie ' + this.NewSerial + ' no se encuentra disponible');
      }

    if (Move['tracking'] === 'serial') {
      if (InList){
        let AvSerial = this.Serials[this.NewSerial];
        if (AvSerial.length > 1){
          AvSerial = AvSerial.filter(x => x['product_id'] === PId);
          if (AvSerial.length === 0){
            AvSerial = AvSerial.filter(x => x['inherit'] === PId);
          }

        }
        return this.ScannedSerial(Move, AvSerial[0], this.NewSerial);
      }

      return this.AddSerials(Move, [this.NewSerial]);
    }
    if (Move['tracking'] === 'lot') {
      if (this.NewSerial === Move['lot_id']['name']){
        let values = {need_confirm_lot_id: false}
        Move['need_confirm_lot_id'] = false
        if (this.TypeId['allow_overprocess'] || Move['qty_done'] +1 <= Move['product_uom_qty']){
          Move['qty_done'] += 1
          values['qty_done'] = Move['qty_done'] 
        }
        this.WriteAsyn('stock.move.line', Move['Id'], {values})

      }
      else {
        
        return this.AddLot(Move, this.NewSerial);
      }
    }
    return;
  }
  IonFocus(indice, action){
    this.scanner.ActiveScanner = action;
    //REVISAR
    this.scanner.ActiveScanner = false;
  }
  AddNewSerialEvent(event){
    const value = event.target.value;
    this.NewSerial = value;
  }

  // LOTES Y SERIES
  SendSerials(LotName){
    const self = this;
    const Model = 'stock.move.line';
    const values = {lot_name: LotName, domain: this.GetInfoDomain()};

    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute(Model, 'compute_lot_name', values).then((Res: Array<{}>) => {
        console.log(Res);
        console.log(Res.length);
      })
    .catch((error) => {
      self.stock.play('error');
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;

  }


  CheckIfWaitingSerials(Move){
    //Esta funcion define si permite cambiar las cantidades.
    // Si necesita chequear ubicaciones 
    let ChangeQty = true
    
    let NeedLocBeforeQty = this.TypeId['need_loc_before_qty']
    const NeedLocation = Move['need_location_id'] || Move['need_location_dest_id']
    Move['need_loc_before_qty'] = !NeedLocBeforeQty && !NeedLocation
    if (NeedLocBeforeQty && NeedLocation){ChangeQty = false}
    
    // Si necesita chequear ubicaciones 
    // Ya está antes. if (Move['need_loc_before_qty']){ChangeQty = false}
    
    // Si no permite overprocess 
    if (!(this.TypeId['allow_overprocess'] || Move['qty_done'] < Move['product_uom_qty'])){ ChangeQty = false}
    // Si no puedo cambiar la cantidad
    if (!ChangeQty) {
      this.WaitingSerials = 0}
    else {
      // Si puedo cambiar la cantidad, muestro el label (esperando lotes)
      this.WaitingSerials = 1
    }
    Move['ChangeQty'] = ChangeQty
    return Move
  }

  AlternateSelected(indice){
    this.Selected = this.Selected === indice ? -1 : indice;
    if (this.Selected === indice){
      this.FillTrackingInfo(this.Moves[indice]);
    }
    if (this.Selected > -1) {
      let Move = this.Moves[this.Selected]
      this.CheckIfWaitingSerials(Move)
    }
    else {
      this.WaitingSerials = 0
    }

  }
  UpdateSelected(indice){
    this.Selected = indice;
  }

  // Rellenar INFO LOTS AND SERIALS
  FillTrackingInfo(Move){
    if (Move['product_id'] && Move['tracking'] !== 'none'){
      // Si el movimiento tiene producto y tracking entonces.
      const PId = Move['product_id']['Id'];

      // Relleno los serials ya seleccionados
      this.SelectedLotsForMoveStr = Move['lot_ids'].map(x => x['name']).join('\n');

      // Relleno los serials/lots disponibles
      this.AvailableLotsForMove = [];

      // tslint:disable-next-line:forin
      for (const LotDict of this.SerialsxProduct[PId]){
        const lot = this.Serials[LotDict][PId];
        let product_qty = 0.00;
        if (lot['virtual_tracking']){
          product_qty = 1.00;
        }
        else {
          product_qty = lot['product_qty'];
        }
        let item = lot;
        item['name'] = LotDict;
        item['product_qty'] = product_qty;
        this.AvailableLotsForMove.push(item);
      }
    }

  }
  // CANTIDADES
  ClickQty(Move){

    const indice = Move['indice'];
    const MoveId = Move['Id'];
    this.FillTrackingInfo(Move);
    if (this.Selected !== indice){
      this.Selected = indice;
      return;
    }
    if (Move['tracking'] !== 'none'){
      this.OpenBarcodeMultiline(Move, indice);
    }
    // EL BARCODE NO VARIA CANTIDAD SI HAY LOTES
    // if (Move['tracking'] === 'lot' && Move['selected'] && Move['lot_id']){
    //   this.InputQty(indice);
    // }
  }

  async InputQty(Move, subheader = '')
  {
    if (Move['tracking'] == 'serial') {return}
    // Este if me permite llamar desde la vista independientemente del Movieminto
    if (Move['tracking'] === 'lot' && !Move['lot_id']){
      this.stock.presentToast('No hay lote asignado', 'Sin lote');
      return;
    }
    const Qty = Move['qty_done'];
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
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Aplicar',
          handler: (data: number) => {
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
    if (Move['qty_done'] >= Move['product_uom_qty'] && !Move['need_location_dest_id'] && !Move['need_location_id'] && this.TypeId['next_move_on_qty_done']){
      return this.ToMove(0,1);
    }
  }
  UpdateQties(Move, IncQty = 0, Qty = 0){

    // Compruebo cantidades.
    // Puedo recibir incrementos o cantidades fijas
    // Si puedo hacer más del o que me piden

    let write = false;
    let QtyDone = Move['qty_done'];
    if (Move['tracking']=== 'lot' && Move['need_confirm_lot_id']){
      this.stock.play('error');
      this.stock.presentToast ('Debes primero confirmar el lote', 'Aviso !!');
      return;
    }
    // si recibo incremento. Entonces
    if (IncQty !== 0) {
      QtyDone += IncQty;
      write = true;
    }
    else if (Qty !== 0) {
      QtyDone = Qty;
      write = true;
    }
    // Si la nueva cantidad es mayor que la pedida y NO oevrprocess => CANCELO Y NO HAGO NADA
    if (QtyDone > Move['product_uom_qty'] && !this.TypeId['allow_overprocess']){
      this.stock.play('no_ok');
      this.stock.presentToast ('El tipo ' + this.TypeId['name'] + ' no permite más cantidad que la reservada', 'Aviso !!');
      return;
    }
    // SI ES MENOR QUE CERO, CANCELO ....
    else if (QtyDone < 0) {
      this.stock.play('no_ok');
      this.stock.presentToast ('No puedes poner negativos', 'Aviso !!');
      return;
    }
    // Si llego aquí y he modificado la QtyDOne:
    if (write) {
      this.stock.play('ok');
      // Si llego aquí permito cambiar cantidad
      Move['qty_done'] = QtyDone;
      // Escribo asíncrono la cantidad. No necesito esperar respuesta
      // this.stock.presentToast ('Cant: ' + QtyDone, Move['name'], 27);
      this.WriteAsyn('stock.move.line', Move['Id'], {qty_done: QtyDone}) ;
      return this.CheckIfNext(Move)
    }

    return
    // Si la nueva cantidad es = a la pedida y necesito confirmar destino, entonces lo pido. SOLO SI write = product_uom_qty
    if (Move['qty_done'] >= Move['product_uom_qty'] && this.TypeId['need_location_dest_id']){

      if (this.Selected !== -1){
        this.Selected = -1;
      }
      this.OpenGetLocation(Move, 'location_dest_id');
    }
    else if (write){
      this.ApplyQtiesFilterx1(Move);
    }
  }
  // SELECCIONAR NUEVO LOTE EN UN MOVIEMINTO
  AssignLot(Move, LotId, unreserve= true){
    const self = this;
    let values = {};
    const MoveId = Move['move_id'];
    // const values = {domain: Domain, offset: this.Offset, limit: this.Limit, model: Model};
    self.presentLoading('Cambiando reserva en Odoo y recuperando movimientos...');
    values = {move_id: MoveId, lot_id: LotId, unreserve: false, offset: 0, limit: this.Moves.length + 1, domain: this.GetInfoDomain()};

    console.log('Conectando a Odoo para actualizar la reserva de un movimiento con values: ' + values);
    const promise = new Promise( (resolve, reject) => {
        self.odooCon.execute('stock.move', 'action_assign_apk', values).then((Res: Array<{}>) => {
          values = {domain: [].push(self.BatchDomain), delete_move: MoveId, load_type: 'upload'};
          // Si cambio el lote, tengo que refrescar todos los movimientos
          self.ApplyGetInfo(Res, values);
          // Cargo unos cuantos movimientos pero todos los lotes y serials
          // self.UpdateAsyncLots(Res['Moves'], values);
          // Busco el primer movimineto para este Move_id

          const SmlId = self['Moves'].filter(x => x['move_id'] === MoveId)[0];
          this.Selected = SmlId['indice'];
          self.loading.dismiss();
      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
    });
    });
    return promise;
  }

  // ESCRITURA EN SML ASYNCRONA > NO NECESITA RECARGAR
  WriteAsyn(model, ids= [], vals= {}){
    const self = this;
    const promise = new Promise((resolve, reject) => {
      self.odooCon.write(model, ids, vals).then((Res: boolean) => {
        // Todo ok
      })
    .catch((error) => {
      self.loading.dismiss();
      this.stock.play('error');
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });
    });
    return promise;
  }
  /*
  AddSerial(Move, Serial, SerialName){
    const QtyDone = Move['qty_done'];
    if (QtyDone > Move['product_uom_qty'] && !this.TypeId['allow_overprocess']){
      this.stock.play('error');
      this.stock.presentToast ('El tipo ' + this.TypeId['name'] + ' no permite más cantidad que la reservada', 'Aviso !!');
      return;
    }
    else if (QtyDone < 0) {
      this.stock.play('error');
      this.stock.presentToast ('No puedes poner negativos', 'Aviso !!');
      return;
    }
    if (Move['tracking'] === 'serial'){
      for (const Lot in Move['lot_ids']){
        if (Lot['Id'] === Serial['Id']) {
          Serial = {};
        }
      }
      if (Serial !== {}){
        Move['lot_ids'].push(Serial);
        this.SelectedLotsForMoveStr = Move['lot_ids'].map(x => x['name']).join('\n');
        Move['qty_done'] += 1;
        // this.stock.presentToast ('Cant: ' + QtyDone, Move['name'], 25);
        this.WriteAsyn('stock.move.line', Move['Id'], {qty_done: QtyDone, lot_ids: [[4, Serial['Id']]] }) ;
        this.ApplyQtiesFilterx1(Move['indice']);
      }
    }
  }
  
  ClickLot(MoveSelected, Lot){
    this.DeSeleccionar();
    this.Selected = MoveSelected['indice'];

    if (MoveSelected['tracking'] === 'serial') {
      // OJO : El serial de odoo es un tracking por lotes. Este sería virtual tracking
      return this.ScannedSerial(MoveSelected, Lot);
    }
    if (MoveSelected['tracking'] === 'lot') {
      // SI EL LOTE QUE CLICKEO ES EL MISMO DEL MOVIMIENTO. ENTONCES ABROC CANTIDADES
      if (MoveSelected['lot_id']['Id'] === Lot['Id']){
        this.InputQty(MoveSelected);

      }
      else {
        return this.ScannedLot(MoveSelected, Lot, '');
      }
    }

  }
  */

  // SCANNER FUNCITONS
  reset_scanner() {
    this.LastReading = this.ScannerReading;
    // this.ScannerFooter.ScanReader.controls.scan.setValue('');
    // this.scanner.reset_scan();
    // this.ScanReader.controls.scan.setValue =''
  }
  UpdateTrackMoveQtyDone(Move = {}, Serial = {}, val = ''){
    
    let write = false;
    const Delete = false;
    let lot_id = {}
    const QtyDone = Move['qty_done'] + 1;
    if (!this.ToDelete){
      if (QtyDone > Move['product_uom_qty'] && !this.TypeId['allow_overprocess']){
        this.stock.play('error');
        this.stock.presentToast ('El tipo ' + this.TypeId['name'] + ' no permite más cantidad que la reservada', 'Aviso !!');
        return;
      }
      else if (QtyDone < 0) {
        this.stock.play('error');
        this.stock.presentToast ('No puedes poner negativos', 'Aviso !!');
        return;
      }
    }
    else {
      if (QtyDone < 0) {
        this.stock.play('error');
        this.stock.presentToast ('No puedes poner negativos', 'Aviso !!');
        return;
      }
    }
    if (Serial === {}){return}
    // Tracking Virtual.
    // Si llego aquí escribo
    lot_id = {'Id': Serial['Id'], 'name': val}
    if (Move['tracking'] === 'serial'){
      const move_lot_id = Move['lot_ids'].filter(x => x['Id'] === lot_id['Id'])
      if (!this.ToDelete){
        //Añadir
        if (move_lot_id.length === 0) {
          this.stock.play('ok')
          Move['lot_ids'].push(move_lot_id[0]);
          Move['qty_done'] = Move['lot_ids'].length;
          const values =  {qty_done: Move['qty_done'], lot_ids: [[4, lot_id['Id']]] };
          this.WriteAsyn('stock.move.line', Move['Id'], values) ;
          return
        }
        else {
          return this.stock.presentToast('Has intentado entrar un serie ya leido en el movimiento', 'ERROR');
        }
      }
      else {
        //Eliminar
        if (move_lot_id > 0) {
          Move['lot_ids'].pop(move_lot_id[0]);
          Move['qty_done'] = Move['lot_ids'].length;
          this.stock.play('ok')
          const values =  {qty_done: Move['qty_done'], lot_ids: [[3, move_lot_id[0]['Id']]] };
          this.WriteAsyn('stock.move.line', Move['Id'], values) ;
          return
        }
        else {
          return this.stock.presentToast('Has intentado quitar un serie qu eno está en el movimiento', 'ERROR');
        }
      }
    }
    if (Move['tracking'] === 'lot'){
      // Si es un lote, primero tengo que mirar si está puesto
      let move_lot_id = Move['lot_id']
      if (!move_lot_id['Id']){
        Move['lot_id'] =lot_id
        Move['qty_done'] = 1;
        const values = {qty_done: 1, lot_id: Serial['Id']}
        this.stock.play('ok')
        this.WriteAsyn('stock.move.line', Move['Id'], values) ;
      }
      else if (move_lot_id['Id'] !== Serial['Id']){
        //Cambio el número de serie
        Move['lot_id'] = lot_id
        Move['qty_done'] = 0;
        const values = {qty_done: 0, lot_id: Serial['Id']}
        this.stock.play('ok')
        this.WriteAsyn('stock.move.line', Move['Id'], values) ;
      }
      else if (move_lot_id['Id'] === Serial['Id']){
        //Sumo uno
        Move['qty_done'] = QtyDone;
        const values = {qty_done: QtyDone}
        this.stock.play('ok')
        this.WriteAsyn('stock.move.line', Move['Id'], values) ;
      }
      return

    }

  }
  ScannedSerial(MoveSelected={}, Serials=[], val){
    const op = 122;
    let MovesSelected = []
    if (!Serials){
      Serials = this.Serials[val]
      if (!Serials) {
        return this.stock.presentToast('No se ha recibido ningún serial para el código ' + val, 'Error');
      }
    }
    // Tengo un movimiento seleccionado pero no coincide con el que me llega, solo cambio la seleccion pero NO HAGO NADA
    if (MoveSelected['indice'] && MoveSelected['indice'] !== this.Selected){
      this.stock.play('ok1')
      this.Selected = MoveSelected['indice'];
      return
    }

    // Si no me llega movimiento pero tengo uno seleccionado, lo cojo como ese
    if (!MoveSelected['Id'] && this.Selected > -1){
      MoveSelected = this.Moves[this.Selected]
    }

    if (!MoveSelected['Id']){
      const product_ids = Object.keys(this.Serials[val])
      if (product_ids.length > 1){
        return this.stock.presentToast('Varios productos para el número de serie ' + val, 'Error');
      }
      MovesSelected = this.Moves.filter(x => x['product_id']['Id'] === product_ids[0])

      if (MovesSelected.length > 1){
        this.stock.play('ok1')
        this.Selected = MovesSelected[0]['indice'];
        return ;
      }
      if (MovesSelected.length = 0){
        return ;
      }
    }
    // Ya llego con un solo movimiento
    const product_id = MoveSelected['product_id']['Id']
    let Serial = Serials[product_id]
    this.ScrollToId(MoveSelected['Id']);
    this.UpdateTrackMoveQtyDone(MoveSelected, Serial, val);
    return
    // Tengo un serial (solo uno) pero no hay movimiento seleccionado >> VISTA LISTA
    if (!MoveSelected['Id']){
      let MovesSelected = this.Moves.filter(x => x['product_id']['Id'] === Serial['product_id'])
      if (!MovesSelected){
        return this.stock.presentToast('No se ha conseguido definir un movmiento para este lote/serie ' + val, 'Error de usuario');
      }
      // Si hay varios, abro el primero pero no hago nada
      if (MovesSelected.length > 1){
        MoveSelected = MovesSelected[0];
        this.Selected = MoveSelected['indice'];
        return ;
      }
      if (MovesSelected.length === 1){
        MoveSelected = MovesSelected[0];
      }
    }
    if (MoveSelected['Id']){
      this.ScrollToId(MoveSelected['Id']);
      // NO abro el mov ...
      // this.Selected = MoveSelected['indice']
      this.UpdateTrackMoveQtyDone(MoveSelected, Serial, val);
      return
    }
  }
  /*
    // Busco el primer movimiento que tenga ese artículo
    
    
    MoveSelected = this.Moves.filter(x => x['product_id']['Id'] === Serial['product_id'])
    if (MoveSelected)
    // Hay uin movimiento seleccionado, el producto debe ser el mismo para el serie que para el movimiento
    // pero puede haber varios serials
    let Serial_Ids = []
    
    console.log(Serial_Ids)

    if (this.Selected === -1){
      //No hay nada seleccionado, miro a ver si puedo seleccionar algo.
      
      // Miro si ese serial se ha metido en un sml como lote o como virtual
      // como lote/serie de odoo
      MoveSelected = this.Moves.filter(x => (Serial_Ids.indexOf(x['lot_id']['Id']) >= 0))
      // COmo virtual
      if (!MoveSelected){

        for (let _serial in Serial_Ids){
          for (_lot_id in )
          MoveSelected = this.Moves.filter(x => (x['lot_ids']['Ids'].indexOf(x['lot_id']['Id']) >= 0))
        }
        MoveSelected = this.Moves.filter(x => (

        ))
      }
    }

    }
    if (this.Selected > -1){
      MoveSelected = this.Moves[this.Selected]
      let product_id = MoveSelected['product_id']['Id']
      // Busco entre los posible serials uno para ese producto
      Serial = Serials.filter(x => (x['product_id'] === product_id))
      if (!Serial['Id']){
        return this.stock.presentToast('El articulo del movimiento no se corresponde con el serie leido ' + val, 'Error de usuario');
      }
      

      }
      
    }

    
    if (!Move['Id']){
      // busco el primer movimiento para ese artículo
      MoveSelected = this.Moves.filter(x => (x['product_id']['Id'] === Serial['product_id']));
      if (MoveSelected){
        this.Selected = MoveSelected[0]['indice'];
        // si hay solo uno vuelvo a llamar a la función con movimiento
        if (MoveSelected.length === 1) {
          return this.ScannedSerial(MoveSelected[0], Serial, val)
        };
      }
      return;
    }
    else {
      MoveSelected = Move
    }
    

    console.log ('Has leido un serie virtual')
    if (Serial.length !== 1){

      // Hay varias opciones para el mismo lote, tengo que seleccionar el producto
      this.stock.presentToast('Hay varios lotes activos para el código ' + val);
      // Por lo tanto debo de tener un movimiento seleccionado y solo uno

      MovesFiltered = this.Moves.filter(field => (field['selected'] === true))
      if (MovesFiltered.length !== 1){
        this.stock.presentToast('Solo puedes tener uno seleccionado');
      }
      Serial = Serial['lot_ids'].filter(x => (x['product_id'] === MoveFiltered['product_id']['Id']));
      MoveFiltered = MovesFiltered[0];
    }
    else {
      Serial = Serial[0];
      MovesFiltered = this.Moves.filter(x => (x['product_id']['Id'] === Serial['product_id']));
      if (MovesFiltered.length !== 1){
        MovesFiltered = MovesFiltered.filter(field => (field['selected'] === true));
      }
      const MFL = MovesFiltered.length;
      if (MFL !== 1){
        this.stock.presentToast('Lote: ' + val + ' Se han encontrado ' + MFL + ' opciones.');
        return;
      }
      MoveFiltered = MovesFiltered[0];
    }
    // const MoveFiltered = this.stock.OrderArrayOfDict(MovesFiltered, 'qty_done')[0];
    if (MoveFiltered['tracking'] === 'serial') {
      // OJO : El serial de odoo es un tracking por lotes. Este sería virtual tracking
      return this.ScannedSerial(MoveFiltered, Serial);
    }
    if (MoveFiltered['tracking'] === 'lot') {
      return this.ScannedLot(MoveFiltered, Serial, val);
    }
    return
  
  }
  */
  ScannedLot(Move, Serial, val){
    // Compruebo si el Movimeinto puedo sumarle 1 si puedo no hago nada más
    // Para ello: El lote tiene que ser el mismo y la cantidad menor que product_uom_qty
    this.ScrollToId(Move['Id']);
    // Si hay solo un movimiento, y ese serial coincide. Si puedo sumo cantidad 1 y actualizo
    if (Move['lot_id']['Id'] === Serial['Id']){
      if ((Move['qty_done'] + 1) <= Move['product_uom_qty'] || this.TypeId['allow_overprocess']){
        this.stock.play('ok')
        const QtyDone = Move['qty_done'] + 1;
        Move['qty_done'] = QtyDone;
        // this.stock.presentToast ('Cant: ' + QtyDone, Move['name'], 27);
        this.WriteAsyn('stock.move.line', Move['Id'], {qty_done: QtyDone}) ;
        if (Move['qty_done'] === Move['product_uom_qty'] && this.TypeId['need_location_dest_id']){
          // return this.OpenGetBoxId(Move);
        }
        return;
      }
      else {
        return this.ClickQty(Move);
      }
    }
    // Si ya está seleccionado y es un lote disponible para ese movimiento, entonces lo cambio
    if (Move['indice'] === this.Selected){
      return this.AssignLot(Move, Serial['Id'], true);
    }
    this.ClickQty(Move);
  }

  // ESCANEO UN BARCODES
  ScannedBarcode(val){
    // Busco el primer movimiento para este artículo y lo ordeno por qty_done, si hay más de uno no sumo cantidades, solo lo selecciono
    
    // tslint:disable-next-line:max-line-length
    if (this.Selected >-1){
      // Ya hay uno seleccionado 
      if (this.Moves[this.Selected]['product_id']['barcode'] !== val) {
        // Pero no coincide con el leido >> ERROR
        return this.stock.presentToast('El artículo del movimiento seleccionado no corresponde con el código ' + val, 'ERROR');
      }
      // Coincide, entonces puedo sumar uno si no tiene tracking
      if (this.Moves[this.Selected]['tracking'] === 'none'){
        this.ChangeQty && this.UpdateQties(this.Moves[this.Selected], 1);
      }
      // NO hago nada: Estamos leyendo un artículko con tracking dentro de un movimeinto. RETURN
      return
    }
    // No hay nada seleccionado, entonces, miro si puedo seleccionar:
    let MovesSelected = this.Moves.filter(field => (field['product_id']['barcode'] === val));
    const num = MovesSelected.length;
    if (!num){
      // No hay ningún movimiento poara esta lectura
      return this.stock.presentToast('No se ha encuentrado un artículo para el código ' + val, 'ERROR');
    }
    const MoveSelected = MovesSelected[0];
    if (num > 1){
      // Hay más de 1 movimiento para este artículo, por lo tanto la selección debe de ser manual
      // Quito la selección y hago scroll al movmiento
      this.Selected = -1;
      this.ScrollToId(MovesSelected[0]['Id']);
      this.stock.play('ok')
      return;
    }
    
    // Selecciono al elemento ....
    this.Selected = MoveSelected['indice'];
    // Hago scroll al elemento ....
    this.ScrollToId(MoveSelected['Id']);
    // Vuelvo a llamar a la función pero con la selección hecha, y debería entrar por la promera opción
    return this.ScannedBarcode(val)
  }
  
  // Escaneo Ubicación
  ScannedLocation(Move, location = 'location_id', val){
    // Tengo que entrar con un movimiento
    if (!Move['Id']){
      let MoveSelected = this.Moves.filter(x => (x['location_id']['Id'] === Location['Id'] || x['location_dest_id']['Id'] === Location['Id']));
      if (MoveSelected){
        this.Selected = MoveSelected[0]['indice'];
        this.stock.play('ok');
        return;
      }
      //this.stock.play('ok');
      this.stock.presentToast('No se ha encontrado ningún movimiento para el código ' + val, 'Error de lectura');
      return;
    }
    if (!val){
      this.stock.play('error');
      return this.stock.presentToast('Se ha entrado en ScannedLocation sin un código leido', 'Error de código');
    }
    // y además la ubicación en las posibles
    let Location = this.Locations[val];
    if (!Location['Id']){
      this.stock.play('error');
      this.stock.presentToast('No se ha encontrado ninguna ubicación para el código ' + val, 'Error de lectura');
      return;
    }
    const LocationNeed = 'need_' + location;
    const AllowChange = 'allow_change_' + location;
    // Si no puedo cambiar y NO necesita ubicación >> NO hago nada
    if (!this.TypeId[AllowChange] && !this.TypeId[LocationNeed]){return; }
    
    // leo la ubicación del movimiento >> COnfirmo locationneed
    if (Location && Move[location]['Id'] === Location['Id'] && Move[LocationNeed]){
      Move[LocationNeed] = false;
      let values = {}
      
      this.CheckIfWaitingSerials(Move)
      values[LocationNeed] = false
      values['need_loc_before_qty'] = Move['need_loc_before_qty']
      this.WriteAsyn('stock.move.line', Move['Id'], values);
      this.stock.play('ok');
      return this.CheckIfNext(Move)
    }
    else if (AllowChange && Location){
      // Permito cambiar. => Cambio
      // Reseteo la lectura y cambio la ubicación. Necesita una 2ª lectura para modificarlo
      const values = {}
      values[LocationNeed] = this.TypeId[LocationNeed]
      values[location] = this.Locations[val]['Id']
      this.WriteAsyn('stock.move.line', Move['Id'], values);
      Move[LocationNeed] = this.TypeId[LocationNeed]
      Move[location]= this.Locations[val]
      this.stock.play('ok');
    }  
      // No permito cambiar. No hago nada y tiro error
    else if (!AllowChange){
        this.stock.play('error');
      }
    

  }

  CheckScanner(val) {

    // AQUI DETECTO LO QUE SE HA LEIDO
    // PUEDES SER 
    // BARCODE >> ARTICULO
    // LOTE >> DETECTO ARTICULO + LOTE
    // SERIAL >> DETECTO ARTICULO + LOTE
    // LOCATION >> DETECTO UBICACION Y ACTUO SI PROCEDE

    console.log('ANALIZO + ' + val);
    if (val === ''){
      this.reset_scanner();
    }
    // Primero buscon en el formulario si coincide con algo y despues decido que hacer
    let MoveFiltered = {};
    let MovesFiltered = [];
    let MoveSelected = {};
    if (this.Selected > -1) {
      MoveSelected = this.Moves[this.Selected];
    }

    let LocationName = this.StockLocation[val];
    if (LocationName){
      console.log ('Has leido una ubicación por el nombre')
      return this.CheckScanner(LocationName)
    }
    // Caso 2. Ubicación, pero solo si hay un movimiento cargado
    let Location = this.Locations[val];
    if (Location){
      console.log ('Has leido una ubicación')
    }
    // Si escaneo una ubicación, no tengo que ir al movimiento
    if (this.Selected > -1 && Location){
      // Solo puedo leer ubicación si estoy con uno seleccionado
      // Si necesita MoveLocation   
      if (MoveSelected['need_location_id'] && MoveSelected['need_location_dest_id']){
        return this.stock.presentToast('Debes indicar manualmente la ubicación que estás leyendo (origen o destino)', 'ERROR');
      }
      else if (MoveSelected['need_location_id']) {
        return this.ScannedLocation(MoveSelected, 'location_id', val);
      }
      else if (MoveSelected['need_location_dest_id']){
        return this.ScannedLocation(MoveSelected, 'location_dest_id', val);
      }
      else {
        return this.stock.presentToast('Debes indicar la ubicación que estás leyendo', 'ERROR');
      }
    }
    
    // Caso 1. EAN 13
    const Barcode = this.Barcodes[val] ;
    if (Barcode){
      console.log ('Has leido un codigo de barras')
      // Escaneo un artículo
      return this.ScannedBarcode(val);
    }
    // Caso 2. Es un lote/serie de Odoo.
    // Lots Lista de stock_move_line.lot_id con un id a el movimiento
    const Lot = this.Lots[val];
    if (Lot){
      console.log ('Has leido un lote o serie de odoo')
      // tslint:disable-next-line:max-line-length
      if (this.Selected > -1) {
        const lot = this.Serials[val][MoveSelected['product_id']['Id']]
        // Si hay un movimiento seleccionado, es del mismo artículo pero no corresponde el lote:
        if (lot && MoveSelected['lot_id']['name'] === val){
          return this.ScannedLot(MoveSelected, lot, val);
        }
        this.stock.presentToast('Lote: ' + val + ' no válido para el movimiento seleccionado');
        return;
      }
      else {
        // Si no hay uno seleccionado
        const SelectedMove = this.Moves.filter(x => x['Id'] == Lot['move_id'][0])
        if (SelectedMove.length == 1){
          this.Selected = SelectedMove[0]['indice']
          return // this.CheckScanner(val)
        }
        return this.stock.presentToast('Lote: ' + val + ' . Información insuficiente');
        MovesFiltered = this.Moves.filter(field => (field['lot_id']['name'] === val && field['product_id']['Id'] === this.Serials[val]['product_id']) );
        // Solo debería de tener 1, si hay 2 o más debería de venir con el MoveSelected a True
        if (MovesFiltered.length > 1){
          MovesFiltered = MovesFiltered.filter(field => (field['selected'] === true));
        }
        const MFL = MovesFiltered.length;
        if (MFL !== 1){
          this.stock.presentToast('Lote: ' + val + ' Se han encontrado ' + MFL + ' opciones.');
          return;
        }
        return this.ScannedLot(MovesFiltered[0], this.Serials[val], val);
      }
    }

    // Caso 3 Serial/Lote
    let Serial = this.Serials[val];
    if (Serial){
      this.ScannedSerial(MoveSelected, Serial, val);
      return;
      console.log ('Has leido un serie virtual')
      if (Serial.length !== 1){
        // Hay varias opciones para el mismo lote, tengo que seleccionar el producto
        this.stock.presentToast('Hay varios lotes activos para el código ' + val);
        // Por lo tanto debo de tener un movimiento seleccionado y solo uno

        MovesFiltered = this.Moves.filter(field => (field['selected'] === true))
        if (MovesFiltered.length !== 1){
          this.stock.presentToast('Solo puedes tener uno seleccionado');
        }
        Serial = Serial['lot_ids'].filter(x => (x['product_id'] === MoveFiltered['product_id']['Id']));
        MoveFiltered = MovesFiltered[0];
      }
      else {
        Serial = Serial[0];
        MovesFiltered = this.Moves.filter(x => (x['product_id']['Id'] === Serial['product_id']));
        if (MovesFiltered.length !== 1){
          MovesFiltered = MovesFiltered.filter(field => (field['selected'] === true));
        }
        const MFL = MovesFiltered.length;
        if (MFL !== 1){
          this.stock.presentToast('Lote: ' + val + ' Se han encontrado ' + MFL + ' opciones.');
          return;
        }
        MoveFiltered = MovesFiltered[0];
      }
      // const MoveFiltered = this.stock.OrderArrayOfDict(MovesFiltered, 'qty_done')[0];
      if (MoveFiltered['tracking'] === 'serial') {
        // OJO : El serial de odoo es un tracking por lotes. Este sería virtual tracking
        return this.ScannedSerial(MoveFiltered, Serial, val);
      }
      if (MoveFiltered['tracking'] === 'lot') {
        return this.ScannedLot(MoveFiltered, Serial, val);
      }
      return
    }

   
    // Busco
    // console.log('Process Reading: para checquear ' + val);
    // this.reset_scanner();
    //Caso 5
    // Permite crear lotes/series, hay movimiento seleccionado y es de tipo lote yo tracking
    //Entonces creo el lote y lo añado a la lista de disponibles.
    if (this.TypeId['use_create_lots'] && !MoveSelected['need_location_id'] && MoveSelected['tracking'] === 'lot') {
      return this.LotToMove(val, MoveSelected)
    }
    if (this.TypeId['use_create_lots'] && !MoveSelected['need_location_id'] && MoveSelected['tracking'] === 'serial') {
      return this.LotToMove(val, MoveSelected)
    }
   
    this.stock.play('no_ok');
  }


  KeyOrder(val){
    if (val == 'ArrowLeft'){return this.ToMove(0,-1)}
    if (val == 'ArrowRight'){return this.ToMove(0,1)}
    if (val == 'ArrowUp' || val == 'ArrowDown'){
      if (this.Selected > -1) {
        const Move = this.Moves[this.Selected];
        if (Move['tracking'] == 'none'){
          const IncQty = val == 'ArrowUp' ? 1 :-1;
          return this.UpdateQties(Move, IncQty, 0)
        }
      }
      else {
        if (val == 'ArrowUp'){
          return this.Selected = 0
        }
        if (val == 'ArrowDown'){
          return this.Selected = this.Moves.length -1
        }
      }
    }

  }

  UpdateQTYAndLots(indice, Res){
    this.Moves[indice]['qty_done'] = Res['qty_done'];
    this.Moves[indice]['lot_ids'] = Res['lot_ids'];
    // for (const Lot of Res['lot_ids']){
    //  this.Moves[indice]['lot_ids'].push(Lot);
    // }

  }
  async OpenBarcodeMultiline(Move, indice){
    this.scanner.ActiveScanner = true;
    this.stock.SetModelInfo('App', 'ActivePage', '');
    const self = this;
    const modal = await this.modalController.create({
      component: BarcodeMultilinePage,
      cssClass: 'barcode-modal-css',
      componentProps: {
                        ProductId: Move['product_id']['Id'],
                        LName: Move['product_id']['name'],
                        PName: Move['product_uom_qty'] + ' ' + Move['uom_id']['name']
                      },
    });
    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      self.stock.SetModelInfo('App', 'ActivePage', 'MoveList');
      self.scanner.ActiveScanner = false;
      if (detail['data'] && detail['data'].length > 0) {
        const values = {Index: indice,
                        Id: Move['Id'],
                        domain: self.GetInfoDomain(),
                        serial_names: detail['data']};
        this.presentLoading('Cargando números de serie ...');
        this.odooCon.execute('stock.move.line', 'load_multi_serials', values).then((data: Array<{}>) => {
          if (Move.tracking === 'serial' || data.length === 1){
            self.UpdateQTYAndLots(indice, data[0]);
          }
          else if (Move.tracking === 'lot'){
            self.Moves.splice(indice, 1);
            for (const item of data){
              self.Moves.push(item);
              // tslint:disable-next-line:max-line-length
              self.Moves = this.stock.OrderArrayOfDict(self.Moves, true, ['removal_priority', 'product_id', 'picking_id'], [true, true, true]);
            }
          }

          self.loading.dismiss();
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
  CreateNewLot(Move, LotName, AddQty=true){
    let vals = {product_id: Move['product_id']['Id'], 
                alternative_tracking: Move['tracking'] === 'serial',
                name: LotName,
                ref: LotName}
    
    
  }
  async CreateNewLotConfirm(Move, LotName, confirm=true, AddQty=true) {
    if (!Move){
      this.stock.Aviso("Error", 'No hay ningún movimiento para la creación del lote ' && LotName);
      return
    }
    if (Move['tracking'] !== 'lot'){
      this.stock.Aviso("Error", 'El movimiento no es de tipo lote');
      return
    }
    if (!confirm){
      return this.CreateNewLot(Move, LotName, AddQty)
    }
    const alert = await this.alertController.create({
      header: 'Nuevo lote',
      subHeader: Move['product_id']['name'],
      inputs: [{name: 'lotname',
               value: LotName,
               type: 'text',
               id: 'lot-id',
               placeholder: LotName}],
      buttons: [{
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Aplicar',
          handler: (data: string) => {
            return this.CreateNewLot(Move, LotName, AddQty)
          }
        }],
  });
    await alert.present();
  }
  AddNewSml(values = {}){
    this.presentLoading('Generando nuevo movimiento ...');
    const self = this;
    let Indice = this.Selected;
    const SmlId = this.Moves[Indice]['Id'];
    const MoveId = this.Moves[Indice]['MoveId'];
    values['move_id'] = MoveId;
    values['id'] = SmlId;

    this.odooCon.execute('stock.move.line', 'add_move_line', values).then((data: Array<{}>) => {
      const s1 = self.Moves.slice(0, Indice);
      const s2 = data;
      const s3 = self.Moves.slice(Indice);
      s2[0]['indice'] = Indice;
      const s0 = s1.concat(s2);
      for (const s of s3){
        Indice += 1;
        s['indice'] = Indice;
      }
      self.Moves = s0.concat(s3);
      self.loading.dismiss();
    })
    .catch((error) => {
      self.loading.dismiss();
      self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
    });

  }
}
