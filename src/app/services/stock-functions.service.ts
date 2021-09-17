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
  Locations: {};

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
      // this.GetAppLocations();
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
    const d = new Date();
    OrderedArray.sort((a, b) =>  {
      iters += 1;
      const k = 0;
      console.log ('Movimeintos: ' + a['Id'] + ' >> ' + b['Id']);
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
    const d1 = new Date();
    // console.log ('Time: ' + (d1 - d));
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
    const dia = dt.getDate() + (timedelta['day'] || 0);
    const mes = dt.getMonth() + 1 + (timedelta['month'] || 0);
    const ano = dt.getFullYear() + (timedelta['year'] || 0);
    const hora = dt.getHours() + (timedelta['hora'] || 0);
    const minuto = dt.getHours() + (timedelta['minuto'] || 0);
    const today = ano.toString().padStart(4, '0') + '/'
      + mes.toString().padStart(2, '0') + '/'
      + dia.toString().padStart(2, '0');

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
  GetAppLocations(){
    const self = this;
    const values = {domain : []};
    const promise = new Promise( (resolve, reject) => {
      self.odooCon.execute('stock.location', 'get_apk_locations', values).then((Locations) => {
        self.Locations = Locations;
        })
        .catch((err) => {
        });
      return promise;
    });
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

}
