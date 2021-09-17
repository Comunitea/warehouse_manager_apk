
import { Component, OnInit, ViewChild, Input, HostListener} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ScannerService } from '../../services/scanner.service';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { OdooService } from '../../services/odoo.service';
//import { AudioService } from '../../services/audio.service';
import { AlertController, IonInfiniteScroll, ActionSheetController, LoadingController } from '@ionic/angular';




@Component({
  selector: 'app-listado-albaranes',
  templateUrl: './listado-albaranes.page.html',
  styleUrls: ['./listado-albaranes.page.scss'],
})
export class ListadoAlbaranesPage implements OnInit {


  @ViewChild(IonInfiniteScroll, {static: false}) infiniteScroll: IonInfiniteScroll;

  // INFINITISCROLL
  Offset: number;
  Limit: number;
  LimitReached: boolean;

  // LOADING CONTROLLER
  loading: any;

  // BUSQUEDAS
  timeout: any;
  Search: string;

  Picks: Array<{}>;
  Filters: Array<{}>;
  FiltersChecked: {};
  Id: number;

  @Input() ScannerReading: string;
  @Input() pick: {};
  ngSwitch: any;

  // DEFAULT
  StateDomain: any ;
  TypeDomain: any;

  //
  Selected: number; //A true si hay alguno seleccionado

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    console.log('TECLAS RECIBIDAS EN ListadoAlbaranes antes de comprobccion');
    if (!this.scanner.ActiveScanner && this.stock.GetModelInfo('App', 'ActivePage') === 'ListadoAlbaranes' && event.which !== 0) {
      console.log('TECLAS RECIBIDAS EN ListadoAlbaranes');
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
              public odooCon: OdooService) { }


  onReadingEmitted(val: string) {
    for (const scan of val){
      if (scan !== ''){
        this.stock.audio.play('click'),
        this.ScannerReading = scan;
        this.OpenForm(scan);
      }
    }
    return;
  }

  ngOnInit() {
    this.StateDomain = ['state', 'in', ['assigned', 'in_progress']];
    this.FiltersChecked = {state: {checked: ['assigned', 'in_progress']}};
    this.Offset = 0;
    
  }
  ionViewDidEnter(){

    this.stock.SetModelInfo('App', 'ActivePage', 'ListadoAlbaranes');
    this.Selected = 0;
    this.Search = '';
    console.log ('Entra en listado de albaranes');
    this.Id = parseInt(this.route.snapshot.paramMap.get('Id'));
    this.TypeDomain = ['picking_type_id', '=', this.Id];
    this.GetInfo();

  }

  TabNavegarA(URL){
    this.router.navigateByUrl(URL);
  }
  ToDoToday(){
    const dt: Date = new Date();
    const hoy = this.stock.odoo_date(dt, 'date', {day : 1});
    const domain =  [['scheduled_date', '<=', hoy]];
    console.log(dt + ' -->> ' + hoy + ': ->>' + domain);
    this.Offset = 0;
    this.GetInfo(domain);
  }
  GetInfo(Domain = [], loading: boolean = true){
    const self = this;
    
    if (this.Id){
      Domain.push(this.TypeDomain);
    }
    // Domain.push(this.StateDomain);
    const FilterDomain = this.GetDomainFromActiveFilter();

    if (FilterDomain){
      for (const dom of FilterDomain){
        Domain.push(dom);
      }
    }
    if (this.Offset === 0){this.LimitReached = false;  this.infiniteScroll.disabled = false; }
    const values = {domain: Domain, offset: this.Offset, limit: this.stock.Limit(), model: 'stock.picking.batch'};
    console.log('Conectando a Odoo para recuperar' + values['domain']);
    if (loading){self.presentLoading('Cargando albaranes del tipo ' + this.Id);}
    const promise = new Promise( (resolve, reject) => {
        self.odooCon.execute('stock.picking.type', 'get_apk_tree', values).then((Res: Array<{}>) => {
          this.LimitReached = Res['Picks'].length < this.stock.Limit();
          if (this.LimitReached) {
            this.infiniteScroll.disabled = true;
          }
          if (self.Offset === 0) {
            self.Picks = Res['Picks'];
            self.Filters = Res['Filter'];
          }
          else {
            for (const k of Res['Picks']) {
              console.log ('Añado ' + k['name']);
              self.Picks.push(k);
            }
          }
          self.Selected = 0;
          self.loading.dismiss();

      })
      .catch((error) => {
        self.loading.dismiss();
        self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
      });

    });

    return promise;

}
  OpenForm(Id){}

  // LOADING
 
  async presentLoading(Message= 'Validando...') {
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

  // INFINITI SCROLL

  loadData(event) {
    setTimeout(() => {
      console.log('Loading more PICKS');
      event.target.complete();
      this.Offset = this.Picks.length;
      this.GetInfo();
    }, 1000);
  }

  get_search_results(ev: any){
    this.Search = ev.target.value;
    clearTimeout(this.timeout);
    this.timeout = new Promise ((resolve) => {
      setTimeout(() => {
        console.log('Buscando more PICKS');
        this.Offset = 0;
        const domain = [['name', 'ilike', this.Search]];
        this.GetInfo(domain, false);
      }, 1000);
    });
  }


  toggleInfiniteScroll() {
    this.infiniteScroll.disabled = !this.infiniteScroll.disabled;
  }
  // INFINITI SCROLL

  // CLICK ON CARDS/PICKS
  NavegarA(Id){
    console.log ('Navegar a ' + Id);
    this.stock.audio.play('click');
    let URL = '/move-list';
    if (Id){
      URL = URL + '/' + Id;
    }

    this.router.navigateByUrl(URL);
  }
  SetAsActive(Index){

    console.log ('Activar a ' + Index + ' : ' + this.Picks[Index]['name']);
    // this.stock.audio.play('click');
    this.stock.play('click');

    this.Picks[Index]['selected'] = !this.Picks[Index]['selected'];
    if (this.Picks[Index]['selected'] === true){
      this.Selected += 1;
    }
    else {this.Selected -= 1; }
  }


  // OPERACIONES CON ALBARANES
  SendToBatch(){

  }
  Validate(){
    const Ids = [];
    let msg = '';
    for (const pick of this.Picks){
      if (pick['selected'] === true){
        if (pick['state'][0] !== 'assigned'){
          msg += '<hr/>' + pick['name'] + ': Estado incorrecto';
          continue;
        }
        if (pick['quantity_done'] === 0){
          msg += '<hr/>' + pick['name'] + ': Cantidades a 0';
          continue;
        }
        Ids.push(pick['Id']);
      }
    }
    console.log('Se van a validar ' + Ids);
    if (Ids.length > 0){
      this.stock.play('click');
      this.stock.ButtonValidateApk(Ids);
      return this.GetInfo();
    }
    else {
      msg += '<hr/>No se valida nada'}
    this.stock.play('error');
    this.stock.presentToast(msg, 'AVISO:');
  }
  Reserve(){
    const Ids = [];
    const self = this;
    let msg = '';
    const Model = 'stock.picking';
    for (const pick of this.Picks){
      if (pick['selected'] === true){
        if (!(pick['state'][0] in ['confirmed', 'assigned'])){
          msg += '<hr/>' + pick['name'] + ': Estado incorrecto';
          continue;
        }
        Ids.push(pick['Id']);
      }
    }
    console.log('Se van a reservar ' + Ids);
    if (Ids.length > 0){
      this.stock.play('click');
      const values = {id: Ids};
      this.odooCon.execute(Model, 'action_assign_apk', values).then((done) => {
        console.log(done);
        this.GetInfo();
       })
       .catch((error) => {
          self.loading.dismiss();
          self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

       });
     }
    else {
      msg += '<hr/>No se reserva nada'; }
    this.stock.play('error');
    this.stock.presentToast(msg, 'AVISO:');
  }
  UnReserve(){
    const Ids = [];
    const self = this;
    let msg = '';
    const Model = 'stock.picking';
    for (const pick of this.Picks){
      if (pick['selected'] === true){
        if ((pick['state'][0] in ['waiting', 'confirmed', 'assigned'])){
          msg += '<hr/>' + pick['name'] + ': Estado incorrecto';
          continue;
        }
        Ids.push(pick['Id']);
      }
    }
    console.log('Se van a reservar ' + Ids);
    if (Ids.length > 0){
      this.stock.play('click');
      const values = {id: Ids};
      this.odooCon.execute(Model, 'do_unreserve_apk', values).then((done) => {
        console.log(done);
        this.GetInfo();
       })
       .catch((error) => {
          self.loading.dismiss();
          self.stock.Aviso(error.title, error.msg && error.msg.error_msg);

       });
     }
    else {
      msg += '<hr/>No se anula nada'; }
    this.stock.play('error');
    this.stock.presentToast(msg, 'AVISO:');

  }
  CancelBatch(){

  }

  // BOTONES DE ACCION
  async presentButtons() {
    const Buttons = [];
    if (this.Selected){
      Buttons.push({
        text: 'Crear batch',
        icon: 'color-wand-outline',
        handler: () => {
          this.SendToBatch();
      }});
    }
    Buttons.push({
      text: 'Validar',
      icon: 'thumbs-up-outline',
      handler: () => {
        this.Validate();
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
      text: 'Anular lote',
      icon: 'exit-outline',
      handler: () => {
        this.CancelBatch();
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
            checked: FilterChecked.length > 0 && (Val['value'].indexOf(FilterChecked) !== -1),
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

  // FILTROS
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
    this.GetInfo();
  }
}
