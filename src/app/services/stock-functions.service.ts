import { Injectable, ViewChild } from '@angular/core';
import { Storage } from '@ionic/storage';
import { OdooService } from './odoo.service';
import { AudioService } from './audio.service';
import { AlertController, ActionSheetController, ModalController , ToastController} from '@ionic/angular';


@Injectable({
  providedIn: 'root'
})
export class StockFunctionsService {

  ModelInfo: {};
  loading: any;
  // CTES PARA EL FUNCIOANMIENTO DE LA APK
  LIMIT: 200;
  Persistent: boolean = false;
  Locations: Array<{}>;
  Products: Array<{}>;
  PickingTypeIds: Array<{}>;
  ProdBarcodes: {}
  LocationIndexBarcode: {};
  ProductIndexBarcode: {};
  ImageProducts: {}
  LocBarcodes: {}
  LocNames: {}
  ProductWriteDate: string;
  
  constructor(
    public odooCon: OdooService,
    public alertCtrl: AlertController,
    public toastController: ToastController,
    public audio: AudioService,
    public storage: Storage) {
      this.LIMIT = 200;
      this.SetModelInfo('stock.picking', 'limit', this.LIMIT);
      this.SetModelInfo('stock.picking.batch', 'limit', this.LIMIT);
      this.SetModelInfo('stock.move', 'limit', this.LIMIT);
      // this.LoadPersistentData()
      
    }
  
  async Aviso(titulo, texto) {
      this.audio.play('error');
      const alert = await this.alertCtrl.create({
          header: titulo,
          subHeader: texto,
          buttons: ['Ok']
      });
      await alert.present();
    }


  GetModelInfo(model, key){
    if ((Object.keys(this.ModelInfo).indexOf(model) !== -1) && (Object.keys(this.ModelInfo[model]).indexOf(key) !== -1))  {
      return this.ModelInfo[model][key];
    }
    return false;
  }
  SetModelInfo(model, key, value){
    if (! this.ModelInfo){
      this.ModelInfo = {};
    }

    if (Object.keys(this.ModelInfo).indexOf(model) === -1) { this.ModelInfo[model] = {}; }
    if (Object.keys(this.ModelInfo[model]).indexOf(key) === -1) {this.ModelInfo[model][key] = value; }
    else {this.ModelInfo[model][key] = value; }
  }
  Limit(model = ''){
    if (model === ''){return this.LIMIT; }
    return this.GetModelInfo(model, 'limit');

  }

  // FUNCITONES
  UpdateDict(Dict, values){
    
  }
  OrderByField(a, b, field, asc, k){
    const campo = field[k];
    console.log ('Comparo: ' + campo);
    const res = asc[k] === true ? -1 : 1;

    if (a[campo] > b[campo]){return res; }
    if (a[campo] < b[campo]){return res * -1; }
    if (a[campo] === b[campo]){
      if (field.length > k){
        console.log ('Comparo 2º campo');
        return this.OrderByField(a, b, field, asc, k + 1);
      }
      return 0;
    }

  }
  OrderArrayOfDict(OrderedArray, WriteIndex = true, field = [], asc = []){
    console.log ('Ordenando ' + OrderedArray.length + ' items según los campos: ' + field);
    let iters = 0;

    OrderedArray.sort((a, b) =>  {
      iters += 1;
      const k = 0;
      console.log ('Movimeintos: ' + a['id'] + ' >> ' + b['id']);
      return this.OrderByField(a, b, field, asc, k);
    } );
    console.log ('Nº iteracciones:' + iters);
    if (WriteIndex) {
      // ESCRIBO EL INDICE
      let indice = 0;
      // tslint:disable-next-line:forin
      for (const k in OrderedArray){
        OrderedArray[k]['indice'] = indice;
        indice += 1; }
    }
    
    return OrderedArray;
  }
  IsEmpty(List1){
    return Object.keys(List1).length===0;
  }
  SumList(List1, List2){
    // this.Serials = Res['Res_Serial'];
    for (const NewItem in List2){
      if (!List1.hasOwnProperty(NewItem)) {
        List1[NewItem] = List2[NewItem];
      }
    }
    return List1;
  }
  SumDict(List1, List2){
    // this.Serials = Res['Res_Serial'];

    //Si está vacío, devuelvo el diccionario 2
    console.log ("SumDict de List1: " + List1)
    console.log ("SumDict de List2: " + List2)
    if (this.IsEmpty(List1)) {
      return List2
    }
    let List2Keys = Object.keys(List2)
    let List1Keys = Object.keys(List1)

    for (const NewItem of List2Keys){
      if (!(NewItem in List1Keys)) {
        List1[NewItem] = List2[NewItem]
      }
      else {
        let List2SubKeys = Object.keys(List2[NewItem])
        let List1SubKeys = Object.keys(List1[NewItem])
        
        let ProdKeys = Object.keys(List2[NewItem])
        for (const NewProd of List2SubKeys){
          if (!(NewProd in List1SubKeys)) {
            List1[NewItem][NewProd] = List2[NewItem][NewProd]
          }
        }
      }
      
    }
    console.log ("SumDict de List1 y List2 devuelve: " + List1)
    return List1;
  }
  odoo_date(dt, format = 'datetime', timedelta = {}){
    if (timedelta){
      if ('day' in timedelta){dt.setDate(dt.getDate() + timedelta['day'])}
      if ('month' in timedelta){dt.setMonth(dt.getMonth() + timedelta['month'])}
      if ('year' in timedelta){dt.setYear(dt.getYear() + timedelta['year'])}
      if ('hour' in timedelta){dt.setHours(dt.getHours() + timedelta['hour'])}
      if ('minute' in timedelta){dt.setMinutes(dt.getMinutes() + timedelta['minute'])}
      }

    const dia = dt.getDate()
    const mes = dt.getMonth() + 1 // El mes 0 es enero
    const ano = dt.getFullYear()
    const hora = dt.getHours()
    const minuto = dt.getMinutes()
    
    const today = ano.toString().padStart(4, '0') + '/'+ mes.toString().padStart(2, '0') + '/'+ dia.toString().padStart(2, '0');
    const now = hora.toString().padStart(2, '0') + ':' + minuto.toString().padStart(2, '0') + ':00';

    if (format === 'datetime'){return today + ' ' + now; }
    if (format === 'date'){return today; }
    if (format === 'time'){return now; }
  }
  play(file){
    console.log('Play ' + file);
    return this.audio.play(file);
  }

  // AVISOS
  async presentToast(Message = 'Mensaje', Header = 'Cabecera', Duration = 2000 ) {
    const toast = await this.toastController.create({
      header: Header,
      message: Message,
      duration: Duration,
    });
    toast.present();
  }
  ButtonValidateApk(Ids, Model='stock.picking.batch'){
    // Valida los albaranes que vengan en el ID

    const self = this;
    const values = {id: Ids}; 
    const promise = new Promise( (resolve, reject) => {
      console.log('Valiación de ' + Ids);
      self.odooCon.execute(Model, 'mark_as_pda_validate', values).then((ok) => {
        if (ok) {
          self.odooCon.execute(Model, 'button_validate_apk', values).then((done) => {
            resolve(done);
            })
          .catch((err) => {
            reject(err);
            console.log('Error al validar');
            });
          }
        })
        .catch((err) => {
          reject(err);
          console.log('Error al validar');
        });

    });
    return promise;
  }
  LoadPersistentData(refresh=false){
    this.Persistent = true
    this.presentToast("Recargando Maestros", "ESTADO")
    if (refresh){
      console.log("Reseteo 0")
      this.storage.set('Locations', false)
      this.storage.set('Products', false)
      //this.storage.set('ImageProducts', false)
      this.storage.set('PickingTypeIds',false)

    }

    this.storage.get('ImageProducts').then((value) => {
      if (value){
        this.ImageProducts = value
      } 
      else {
        console.log("RECARGANDO IMAGENES")
        // this.GetAppImageProducts()
      }
    }).catch(() => {
      //   
    });
    
    this.storage.get('Locations').then((value) => {
      if (value){
        this.Locations = value
        this.ApplyLocBusquedas()} 
      else {
        console.log("RECARGANDO UBICACIONES")
        this.GetAppLocations()}
    }).catch(() => {
      //   
    });
    
    this.storage.get('Products').then((value) => {
        if (value){
          this.Products = value
          this.ApplyProdBusquedas()} 
        else {
          console.log("RECARGANDO ARTIUCLOS")
          this.GetAppProducts()}
      }).catch(() => {
        // 
      });

    this.storage.get('PickingTypeIds').then((value) => {
      if (value){
        this.PickingTypeIds = value} 
      else {
        console.log("RECARGANDO tIPOS")
        this.GetAppPickingTypeIds()}
      }).catch(() => {
      //
    });
    
    
  }
  ApplyLocBusquedas(){
    this.presentToast("Recargando Buscadores", "ESTADO")
    this.LocBarcodes = this.GetAllBarcodesxId(this.Locations)
    this.LocationIndexBarcode = this.GetIndexBarcode(this.Locations)
    this.LocNames = this.GetAllNamesxId(this.Locations)
  }
  ApplyProdBusquedas(){
    this.presentToast("Recargando Buscadores", "ESTADO")
    this.ProdBarcodes = this.GetAllBarcodesxId(this.Products)
    this.ProductIndexBarcode = this.GetIndexBarcode(this.Products)
  }
  GetAppLocations(){
    const self = this;
    let values = {};
    values = {domain: [['barcode', '!=', false]]};
    console.log('Conectando a Odoo para recuperar las ubicaciones');
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.location', 'LocationData', values).then((Res: Array<{}>) => {
        self.Locations = Res;
        self.ApplyLocBusquedas()
        self.presentToast("Cargadas Ubicaciones", "Proceso de carga")
        self.storage.set('Locations', Res).then ((data)=>{})
        resolve(true)
      })
      .catch((error) => {
        //
    });
    });
    return promise;
  }
  GetAppImageProducts(){
    const self = this;
    let values = {};
    let domain = [['default_code', '!=', false], ['type', '=', 'product']]
    values = {domain: domain, 'Timeout': 30000};
    console.log('Conectando a Odoo para recuperar las imagenes');
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('product.product', 'ImageData', values).then((Res: {}) => {
        self.ImageProducts = Res;
        self.storage.set('ImageProducts', Res).then ((data)=>{})
        self.presentToast("Cargados Imagenes Articulos", "Proceso de carga")
        resolve(true)
      })
      .catch((error) => {
        self.Aviso('Error al cargar articulos', error)

    });
    });
    return promise;
  }
  GetAppProducts(){
    const self = this;
    let values = {};
    let domain = [['default_code', '!=', false], ['type', '=', 'product']]
    values = {domain: domain, 'Timeout': 30000};
    console.log('Conectando a Odoo para recuperar las productos');
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('product.product', 'ProductData', values).then((Res: Array<{}>) => {
        self.Products = Res;
        self.ApplyProdBusquedas()
        self.storage.set('Products', Res).then ((data)=>{})
        self.presentToast("Cargados Articulos", "Proceso de carga")
        resolve(true)
      })
      .catch((error) => {
        self.Aviso('Error al cargar articulos', error)
    });
    });
    return promise;
  }
  CheckProducts(ids, error_msg = ''){
    
    if (ids.length >0){
      const id_id =  ids.pop()
      const id = id_id['id']
      const values = {domain : [['id', '=',id]]}
      const promise = new Promise( (resolve, reject) => {
        this.odooCon.execute('product.product', 'ProductData', values).then((Res: Array<{}>) => {
          //console.log(Res[0]['id'] + ': ' + Res[0]['wh'])
          this.CheckProducts(ids, error_msg)
        }).catch((error) => {
          error_msg += ', ' + id
          console.log(id + ': Error en el nombre')
          this.CheckProducts(ids)
      });
    })
    }
    else {this.Aviso('Error en:', error_msg)}
  }
  GetAppProducts2(){
    const self = this;
    let values = {};
    let domain = [['default_code', '!=', false], ['type', '=', 'product']]
    values = {domain: domain, 'Timeout': 30000, mode:'test'};
    console.log('Conectando a Odoo para recuperar las productos');
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('product.product', 'ProductData', values).then((Res: Array<{}>) => {
        return this.CheckProducts(Res)  
        
      })
      .catch((error) => {
        self.Aviso('Error al cargar articulos', error)
    });
    });
    return promise;
  }

  GetIndexBarcode(Objects){
    let Barcodes = {}
    for (var Indice in Objects){
      Barcodes[Object['barcode']] = Indice
    }
    return Barcodes
  }
  GetAllNamesxId(Objects){
    let Barcodes = {}
    for (var Object of Objects){
      Barcodes[Object['name']] = Object['id']
    }
    return Barcodes
  }

  GetAllBarcodesxId(Objects){
    let Barcodes = {}
    for (var Object of Objects){
      Barcodes[Object['barcode']] = Object['id']
    }
    return Barcodes
  }
  GetObjectByName(Objects, name){
    // Intento devolver el id del primer varcode la lista
    const Obj = Objects.filter(x => x['name'] == name)
    try {
      return Obj[0]
    }
    catch (error) {
      return 0
    }

  }

  GetObjectById(Objects, id){
    // Intento devolver el id del primer varcode la lista
    const Obj = Objects.filter(x => x['id'] == id)
    try {
      return Obj[0]
    }
    catch (error) {
      return 0
    }

  }
  GetObjectByBarcode(Objects, barcode){
    // Intento devolver el id del primer varcode la lista
    const Obj = Objects.filter(x => x['barcode'] == barcode)
    try {
      return Obj[0]
    }
    catch (error) {
      return 0
    }

  }
  GetAppPickingTypeIds(){
    const self = this;
    let values = {};
    values = {domain: [['app_integrated', '=', 'true']]};
    console.log('Conectando a Odoo para recuperar las tipos');
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.picking.type', 'TypeData', values).then((Res: Array<{}>) => {
        self.PickingTypeIds = Res;
        self.presentToast("Cargados Tipos de Albaranes", "Proceso de carga")
        self.storage.set('PickingTypeIds', Res).then ((data)=>{})
        resolve(true)
      })
      .catch((error) => {
        //
    });
    });
    return promise;
  }
ResetMoves(values){
  const self = this;
  const promise = new Promise( (resolve, reject) => {
    self.odooCon.execute('stock.move.line', 'reset_moves', values).then((done) => {
      resolve(done);
    })
    .catch((err) => {
      reject(false);
      console.log('Error al quitar la reserva del movimiento: ' + err.msg.error_msg);
  });
  });
  return promise;
}

ButtonValidate(PickId) {
    const self = this;
    let model;
    const values = {
      id: PickId
    };
    model = 'stock.picking.batch';
    const promise = new Promise( (resolve, reject) => {
      console.log('button validate pick');
      console.log(PickId);
      self.odooCon.execute(model, 'mark_as_pda_validate', values).then((ok) => {
        if (ok) {
          self.odooCon.execute(model, 'button_validate_apk', values).then((done) => {
            resolve(done);
            })
          .catch((err) => {
            reject(err);
            console.log('Error al validar');
            });
          }
        })
        .catch((err) => {
          reject(err);
          console.log('Error al validar');
        });

    });
    return promise;
  }
  IsFalse(val){
    // esta funcion devuielve false si está vacío
    if (val.constructor === Array){
      return val.length === 0
    }
    if (val.constructor === String){
      return val === ''
    }
    if (val.constructor === Number){
      return val === 0
    }
    if (val.constructor === Object){
      return Object.keys(val).length === 0
    }
  }
}
