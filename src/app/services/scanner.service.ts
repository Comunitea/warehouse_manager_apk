import { Injectable, HostListener } from '@angular/core';
import { Storage } from '@ionic/storage';

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
  TECLAS: Array<string>;
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    }
  constructor(public storage: Storage) {
    this.ResetScan();
    console.log('Constructor de scanner')
  }
  ResetScan(){
    this.code = '';
    this.IsOrder = false;
    this.timeStamp = 0;
    this.timeout = null;
    this.case = 'regular';
    this.fragment = '';
    this.MinLength = 4;
    this.state = true;
    this.Shift = false;
    this.whichs = [];
    var self = this;
    this.TECLAS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Tab', 'F1', 'F2', 'F3','F4', 'F5']
    this.storage.get('KeyTime').then((value) => {
      self.KeyTime = value * 1;
    }).catch(() => {self.KeyTime = 400; });

  }
  on(){
    console.log("Enciendo scanner")
    this.state = true;
    this.ResetScan();
    // this.odootools.presentToast(this.code)
  }
  off(){
    console.log("Apago scanner")
    this.state = false;
    this.ResetScan();
    // this.odootools.presentToast(this.code)
  }

  GetIsOrder(event){

    if (this.TECLAS.indexOf(event.code)>-1){
      return true
    }
    const Which = event.which
    const res = (Which === 16 || Which >= 48 && Which < 112) || (Which >= 123 && Which < 222);
    console.log ('Get is order: ' + res + ' para which' + Which);
    return !res;
  }

  key_press(event){
    console.log("PASO 2: (Key time: " + this.KeyTime+ "  Recibo teclas de la pagina: >>" + " Code:< "+ event.code + " >: Which:< " + event.which + " >. Letra: <" +  String.fromCharCode(event.which) +">")
    if (!this.state || event.which === 0 || event.which === null){return; }
    clearTimeout(this.timeout);
    this.timeout = null;
    //this.KeyTime = 5000;
    let KeyTime = this.KeyTime;
    const ahora= new Date().getTime()
    const Lapso = ahora -this.timeStamp
    if (event.which == 13){
      KeyTime = 100
    }
    let IsOrder = false
    this.whichs.push(event.which);
    if (this.TECLAS.indexOf(event.code)>-1){
      
      if (Lapso < 250){return}
      IsOrder = true
      KeyTime = 50
    }
    
  
    console.log('Recibo (wich)' + event.which + '(code)' + event.code + '  ' + String.fromCharCode(event.which) + '. con Wichs ' + this.whichs + '. KeyTime ' + this.KeyTime);
    this.timeout = new Promise ((resolve) => {
      setTimeout(() => {
        if (IsOrder){
          this.whichs = [];
          resolve([event.code])
        }
        if (event.which != 13){
          this.whichs = [];
          resolve("")
        }
        else if (this.whichs.length > 2){
          if (!IsOrder && event.which != 13){
            resolve("")
          }
          const resolvs = this.SanitizeWhichs(this.whichs, event.code);
          this.whichs = [];
          if (resolvs.length > 0){
            resolve(resolvs);
          }
        }
        else {
          this.whichs = [];
        }
      }, KeyTime);
    });
    
    console.log("Id de timeout: " + this.timeout)
    this.timeStamp = ahora
    // return this && this.timeout;
  }
  

  SanitizeWhichs(whichs, event){
    let scans = [];
    
    console.log('Entra en Sanitiz whichs con ' + whichs + ' y event_code' + event.code);
    
    // if (this.TECLAS.indexOf(event.code)>-1){return event.code}
    let code = '';
    let Shift = false;
    if (event.which!== 13){
      // whichs.push(13);
    }
    for (let keyCode of whichs){
      if (keyCode >= 96 && keyCode <= 105) {
        // Numpad keys
        keyCode -= 48;
        code += String.fromCharCode(keyCode);
      }
    
      else if (keyCode > 111 && keyCode < 121 ) {
        // this.code = FunctionKeys
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
          console.log('DIRECCION' + String.fromCharCode(keyCode));
          code = '';
          scans.push('*' + keyCode + '*');

        }
        else if (keyCode  === 9){
          console.log('TABULADOR');
          code = '';
          scans.push('*' + keyCode + '*');

        }
        else if (keyCode  === 13){
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
    }
    console.log("Sanitize y Devuelvo " + scans);
    this.whichs = [];
    return scans;

  }

  Sanitize(Scan) {
    // Scan = Scan.replace('-', '/');
    Scan = this.code;
    this.code = '';
    return Scan;
  }
}
