import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';

declare let OdooApi: any;

@Injectable({
  providedIn: 'root'
})
export class OdooService {

  context
  uid
  ip
  CONEXION_local = { username: '', password: '', url: '', port: null, db: '', uid: 0, context: {}, user: {}, logged_in: false};
    

  constructor(private storage: Storage, public router: Router) {
    this.context = {'lang': 'es_ES', 'from_pda': true}
    this.uid = 0
  }

  login(user:string, password:string){
    var method = method
    var values = values
    var self = this
    var promise = new Promise( (resolve, reject) => {
        self.storage.get('CONEXION').then((con_data) => {
            var odoo = new OdooApi(con_data.url, con_data.db);
            // this.navCtrl.setRoot(HomePage, {borrar: true, login: null});
            if (con_data == null) {
                var err = {'title': 'Error!', 'msg': 'No hay datos para establecer la conexión'}
                reject(err);
            } else {                
                odoo.login(con_data.username, con_data.password).then((uid) => {
                    if (uid['error']){
                        reject(uid['error_msg'])
                    } else {
                        con_data['uid'] = uid;
                        con_data['logged_in'] = true;
                        this.storage.set('CONEXION', con_data).then(() => {
                            self.uid = uid;
                            resolve(uid);
                        })
                        .catch( (data) => {
                            reject(data);
                        });
                    }
                })
                .catch( (data) => {
                  reject(data);
                });
            }
        });
    });
    return promise;
  }

  logout() {
    var self = this
    var promise = new Promise( (resolve, reject) => {
        self.storage.set('CONEXION', this.CONEXION_local).then(()=> {
            this.router.navigateByUrl('/login');
        })
        .catch( () => {
            var err = {'title': 'Error!', 'msg': 'No se pudo borrar la sesión.'}
            reject(err);
        });
    });

    return promise;

  }

  isLoggedIn(): Promise<boolean> {
    return this.storage.get('CONEXION').then((value) => {
      return value.logged_in === true;
    });
  }

  execute(model, method, values) {
      
      var method = method
      var values = values
      var self = this
      var promise = new Promise( (resolve, reject) => {
          self.storage.get('CONEXION').then((con_data) => {
              var odoo = new OdooApi(con_data.url, con_data.db);
              odoo.context = self.context
              // this.navCtrl.setRoot(HomePage, {borrar: true, login: null});
              if (con_data == null) {
                  var err = {'title': 'Error!', 'msg': 'No hay datos para establecer la conexión'}
                  reject(err);
              } else {
                  odoo.login(con_data.username, con_data.password).then((uid) => {
                          odoo.call(model, method, values).then((res) => {
                              resolve(res);
                          })
                          .catch( () => {
                              var err = {'title': 'Error!', 'msg': 'Fallo al llamar al método ' + method + 'del modelo app.regustry'}
                              reject(err);
                          });
                  })
                  .catch( () => {
                      var err = {'title': 'Error!', 'msg': 'No se pudo conectar con Odoo'}
                      reject(err);
                  });
              }
          });
      });
      return promise
  }
  /*domain=None, fields=None, offset=0, limit=None, order=None, context=None*/
  write (model, id, data){
      
      var self = this
      var promise = new Promise( (resolve, reject) => {
          self.storage.get('CONEXION').then((con_data) => {
              var odoo = new OdooApi(con_data.url, con_data.db);
              odoo.context = self.context
              if (con_data == null) {
                  var err = {'title': 'Error!', 'msg': 'No hay datos para establecer la conexión'}
                  reject(err);
              } else {
                  odoo.login(con_data.username, con_data.password).then( (uid) => {
                      odoo.write(model, id, data).then((res) => {
                          resolve(res);
                      })
                      .catch( () => {
                          var err = {'title': 'Error!', 'msg': 'Fallo al llamar al hacer un write'}
                          reject(err);
                      });
                  })
                  .catch( () => {
                      var err = {'title': 'Error!', 'msg': 'No se pudo conectar con Odoo'}
                      reject(err);
                  });
              }
          });
      });
      return promise
  }   

  search_read(model, domain, fields, offset = 0, limit = 0, order = ''){
      var model = model;
      var domain = domain;
      var fields = fields;
      var self = this
      var promise = new Promise( (resolve, reject) => {
          self.storage.get('CONEXION').then((con_data) => {
              
              if (con_data == null) {
                  var err = {'title': 'Error!', 'msg': 'No hay datos para establecer la conexión'}
                  reject(err);
              } else {
                  var odoo = new OdooApi(con_data.url, con_data.db);
                  odoo.context = self.context
                  odoo.login(con_data.username, con_data.password).then( (uid) => {
                  
                  odoo.search_read(model, domain, fields, offset, limit, order).then((res) => {
                      resolve(res);
                  })
                  .catch( () => {
                      var err = {'title': 'Error!', 'msg': 'Fallo al llamar al hacer search_read'}
                      reject(err);
                  });
                  })
                  .catch( () => {
                      var err = {'title': 'Error!', 'msg': 'No se pudo conectar con Odoo'}
                      reject(err);
                  });
              }
          });
      });
      return promise
  }
}
