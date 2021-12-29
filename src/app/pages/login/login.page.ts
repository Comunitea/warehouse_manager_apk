import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConnectionOptions } from '../../interfaces/connection-options';
import { OdooService } from '../../services/odoo.service';
import { AlertController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { AudioService } from '../../services/audio.service';
import { StockFunctionsService } from '../../services/stock-functions.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  CONEXION: ConnectionOptions = {username: '',
                                 password: '',
                                 url: 'https://rumartest.odootea.com',
                                 port: 8069,
                                 db: '',
                                 uid: 0,
                                 context: {},
                                 user: {},
                                 logged_in: false};
  CONEXION_local: ConnectionOptions = { username: 'cmnt_kiko',
                                        password: 'cmnt',
                                        url: 'https://rumartest.odootea.com',
                                        port: 8069,
                                        db: 'apk',
                                        uid: 0,
                                        context: {},
                                        user: {},
                                        logged_in: false};
  cargar: boolean;
  submitted: boolean;
  version: string;
  login_server: boolean;
  KeyTime: number;

  constructor(
    private audio: AudioService,
    private odoo: OdooService,
    public stock: StockFunctionsService,
    public router: Router,
    public alertCtrl: AlertController,
    private storage: Storage,
    private route: ActivatedRoute,

  ) {
    if (this.route.snapshot.paramMap.get('login')){
      this.CONEXION.username = this.route.snapshot.paramMap.get('login');
    }
    this.check_storage_conexion(this.route.snapshot.paramMap.get('borrar'));
    if (this.route.snapshot.paramMap.get('borrar')){
        this.cargar = false;
    }
    else {
        // Autologin al cargar app
        this.cargar = false;
        this.conectarApp(false);
    }
  }

  check_storage_conexion(borrar) {
    // Fijamos siempre a false el parámetro borrar para no tener que teclear usuario y contraseña siempre
    borrar = false;
    if (borrar){
        this.CONEXION = this.CONEXION_local;
        this.KeyTime = 300;
    }
    else {
        this.storage.get('KeyTime').then ((val) =>
        {this.KeyTime = val; }).catch (() => {this.KeyTime = 100; });

        this.storage.get('CONEXION').then((val) => {
            if (val && val['username']){
                this.CONEXION = val
            }
            else {
                this.CONEXION = this.CONEXION_local;
                this.storage.set('CONEXION', this.CONEXION).then(() => {
                })
            }
        })
    }
  }

  conectarApp(verificar) {
    this.cargar = true;
    this.storage.set('KeyTime', this.KeyTime).then();
    if (verificar){
        this.storage.set('CONEXION', this.CONEXION).then(() => {
          this.log_in();
        });
    }
    else {
        this.storage.get('CONEXION').then((val) => {
          var con;
          if (val == null) {
            // no existe datos
            this.cargar = false;
            con = this.CONEXION;
            if (con.username.length < 3 || con.password.length < 3) {
              if (verificar) {
                this.presentAlert('Alerta!', 'Por favor ingrese usuario y contraseña');
              }
              return;
            }
          }
          else {
                // si los trae directamente ya fueron verificados
                con = val;
                if (con.username.length < 3 || con.password.length < 3) {
                    this.cargar = false;
                    return;
                }
          }
          if (con){
            this.storage.set('CONEXION', con).then(() => {
              this.log_in();
              this.cargar = false;
              });
            }
        });
    }
  }
  NavigateNext(){
    this.LoadData()
    this.storage.set('KeyTime', this.KeyTime).then(() => {

      this.router.navigateByUrl('/navegacion-principal');
    });
  }
  log_in() {
    this.odoo.login(this.CONEXION.username, this.CONEXION.password).then((data)=> {
      
      this.NavigateNext();
    }).catch((error) => {
      this.presentAlert('Error al hacer login:', error);
    });
  }

  LoadData(){
    //
    // this.LoadLocation()
    this.stock.LoadPersistentData(true)
  }
  ngOnInit() {

    this.odoo.isLoggedIn().then((data)=>{
      if (data == true) {
        
        this.NavigateNext();
      }
    })
    .catch((error) => {
      this.presentAlert('Error al hacer login:', error);
    });
  }

  ionViewDidEnter(){
    this.stock.SetModelInfo('App', 'ActivePage', 'LoginPage');
  }
  onLogin(form: NgForm) {
    this.submitted = true;

    if (form.valid) {
      this.CONEXION = {
        username: form.form.value.username, 
        password: form.form.value.password, 
        port: form.form.value.port || this.CONEXION.port, 
        url: form.form.value.url || this.CONEXION.url, 
        db: form.form.value.db || this.CONEXION.db, 
        uid: 0,
        context: {},
        user: {},
        logged_in: false
      };
      this.storage.set('CONEXION', this.CONEXION).then(() => {
        this.log_in();
      })
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

}
