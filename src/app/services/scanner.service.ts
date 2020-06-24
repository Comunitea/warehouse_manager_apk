import { Injectable, HostListener } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  public ActiveScanner: boolean;
  case: any;
  fragment: any;
  code: string;
  whichs: Array<number>;
  timeStamp: number;
  timeout: any;
  state: boolean;
  IsOrder: boolean;
  KeyCodes: {};
  MinLength: number;
  KeyTime: number;
  Shift: boolean; 
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    }
  constructor() {
    this.reset_scan();

  }
  reset_scan(){
    this.code = '';
    this.IsOrder = false;
    this.timeStamp = 0;
    this.timeout = null;
    this.case = 'regular';
    this.fragment = '';
    this.MinLength = 4;
    this.state = true;
    this.KeyTime = 150;
    this.Shift = false;
    this.whichs = [];
  }
  on(){
    this.state = true;
    this.reset_scan();
    // this.odootools.presentToast(this.code)
  }
  off(){
    this.state = false;
    this.reset_scan();
    // this.odootools.presentToast(this.code)
  }

  GetIsOrder(Which){
    const res = (Which === 16 || Which === 16|| Which >= 48 && Which < 112) || (Which >= 123 && Which < 222);
    console.log ('Get is order: ' + res + ' para which' + Which);
    return res;
  }
  key_press(event){

    if (!this.state || event.which === 0 || event.which === null){return; }
    clearTimeout(this.timeout);
    this.timeout = null;
    this.whichs.push(event.which);
    const IsOrder = !this.GetIsOrder(event.which);
    console.log('Recibo ' + event.which + '. con Wichs' + this.whichs + '. Es una order?' + IsOrder);
    this.timeout = new Promise ((resolve) => {
      setTimeout(() => {
        if (this.whichs.length > 3 || IsOrder){
          const scans = this.whichs;
          this.whichs = [];
          const resolvs = this.SanitizeWhichs(scans, IsOrder);
          if (resolvs.length > 0){resolve(resolvs); }
        }
        else {
          this.whichs = [];
        }
      }, 100);
    });
    this.timeStamp = new Date().getTime();
    if (this && this.timeout){return this.timeout; }
    // return this && this.timeout;
  }

  SanitizeWhichs(whichs, IsOrder){
    console.log('Entra en Sanitiz whichs con ' + whichs);
    let scans = [];
    let code = '';
    let Shift = false;
    if (whichs[whichs.length - 1] !== 13){
      whichs.push(13);
    }
    for (let keyCode of whichs){
      console.log('Analizo ' + keyCode + ' con Codigo actual ' + code);

      if (keyCode >= 96 && keyCode <= 105) {
        // Numpad keys
        keyCode -= 48;
        code += String.fromCharCode(keyCode);
      }

      else if (keyCode > 111 && keyCode < 121 ) {
        // this.code = FunctionKeys
        console.log('FUNCTION KEYS');
        code = '';
        scans.push('*' + keyCode + '*');
      }

      else if (keyCode === 190) {
        code += '.';
      }

      else if (keyCode === 189){
        // TECLAS _ Y -
        if (Shift){code += '_'; }
        else {code += '-'; }
      }

      else if (keyCode < 48) {
        // VARIAS
        if (keyCode === 16){
          Shift = true;
        }
        else if (keyCode >= 37 && keyCode <= 40){
          console.log('DIRECCION');
          code = '';
          scans.push('*' + keyCode + '*');

        }
        else if (keyCode  === 9){
          console.log('TABULADOR');
          code = '';
          scans.push('*' + keyCode + '*');

        }
        else if (keyCode  === 13){
          console.log('FIN CADENA');
          scans.push(code);
          code = '';
        }
      }
      else {
        if (keyCode !== 0) {
          code += String.fromCharCode(keyCode);
        }
      }
      if (keyCode !== 16){Shift = false; }
      console.log('Actualizado a ' + code);
    }
    console.log("Devuelvo " + scans);
    this.whichs = [];
    return scans;

  }
  key_press_2(event){

    if (this.timeStamp > new Date().getTime()){return; }
    console.log("Me llega " + event.which + '[' + String.fromCharCode(event.keyCode) + ']' + " y tengo " + this.code);
    if (!this.state || event.which === 0){
      // ignore returns
    }
    else{
      // este 100 es el tiempo en resetear sin pulsaciones
      if (this.timeStamp + 100 < new Date().getTime()) {
          this.code = '';
          this.IsOrder = false;
      }
      clearTimeout(this.timeout);
      let KeyTime = this.KeyTime;
      let keyCode = event.keyCode || event.which;
      if  (event.which === 13){
        KeyTime = 0;
        this.IsOrder = true;
      }
      else if (keyCode >= 96 && keyCode <= 105) {
        // Numpad keys
        keyCode -= 48;
        this.code += String.fromCharCode(keyCode);
      }
      else if (keyCode > 111 && keyCode < 121 ) {

          // this.code = FunctionKeys
          console.log('FUNCTION KEYS');
          this.code = '*' + event.which + '*';
          this.IsOrder = true;
      }
      else if (keyCode === 190) {
          this.code += '.';
      }
      else if (event.which === 189){
        // TECLAS _ Y -
        if (this.Shift){this.code += '_'; }
        else {this.code += '-'; }
      }
      else if (keyCode < 48) {
        // VARIAS
        if (event.which === 16){
          // MAYUSCULA
          console.log('Mayúscula');
          this.Shift = true;
        }
        else if (event.which >= 37 && event.which <= 40){
          console.log('DIRECCION');
          this.code = '*' + event.which + '*';
          this.IsOrder = true;
        }
        else if (event.which  === 9){
          console.log('TABULADOR');
          this.code = '*' + event.which + '*';
          this.IsOrder = true;
        }
        // this.code += '.';
      }
      // else if (false && keyCode >= 48 && keyCode < 110 || keyCode === 190) {
      //    if (keyCode >= 96 && keyCode <= 105) {
      //        // Numpad keys
      //        keyCode -= 48;
      //        this.fragment = String.fromCharCode(keyCode);
      //    } else if (keyCode === 190) {
      //        this.fragment = '.';
      //    } else {
      //        this.fragment = String.fromCharCode(keyCode);
      //    }
      //    this.IsOrder = false;
      //    this.code += this.fragment;
      // }

      else {
        this.IsOrder = false;
        if (event.which !== 0) {
          this.code += String.fromCharCode(keyCode);
        }
      }
      if (event.which !== 16){this.Shift = false; }

      if (this.code.length > 1) {
        let self = this;
        clearTimeout(self.timeout);
        // this.timeStamp = new Date().getTime() + 250;
        this.timeout = new Promise ((resolve) => {
          console.log ('seteo timeout a tiempo ' + this.timeStamp + ' con code ' +
            this.code + ' y con IsOrder ' + this.IsOrder + ' event.wich ' + event.which);

          if (event.which !== 13 ) {
            console.log('CREO TIMEOUT para' + self.code);
            setTimeout(() => {
              self.IsOrder = false;
              const scan = self.code;
              self.code = '';
              console.log('Envío por timeout' + scan + ' con el timeou' + self.timeout);
              resolve(scan);
            }, KeyTime);
          }
          else  {
            this.IsOrder = false;
            const scan = self.code;
            if (scan !== ''){
              self.code = '';
              console.log('Envío Orden ' + scan);
              resolve(scan);
            }
          }
          // este 500 es el tiempo que suma pulsaciones
        });
      }
    }
    this.timeStamp = new Date().getTime();
    return this && this.timeout;
  }
  Sanitize(Scan) {
    // Scan = Scan.replace('-', '/');
    Scan = this.code;
    this.code = '';
    return Scan;
  }
}
