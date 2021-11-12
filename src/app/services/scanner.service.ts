import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
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
    this.reset_scan();
    console.log('Constructor de scanner')
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
    this.Shift = false;
    this.whichs = [];
    var self = this;
    this.TECLAS = ['Enter', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Tab', 'F1', 'F2', 'F3','F4', 'F5']
    this.storage.get('KeyTime').then((value) => {
      self.KeyTime = value * 1;
    }).catch(() => {self.KeyTime = 400; });

  }
  on(){
    console.log("Enciendo scanner")
    this.state = true;
    this.reset_scan();
    // this.odootools.presentToast(this.code)
  }
  off(){
    console.log("Apago scanner")
    this.state = false;
    this.reset_scan();
    // this.odootools.presentToast(this.code)
  }

  GetIsOrder(event){

    if (this.TECLAS.indexOf(event.code)>-1){return true}
    const Which = event.which
    const res = (Which === 16 || Which >= 48 && Which < 112) || (Which >= 123 && Which < 222);
    console.log ('Get is order: ' + res + ' para which' + Which);
    return !res;
  }
  key_press(event){
    console.log("Detectada tecla con wichs " + this.whichs)
    if (!this.state || event.which === 0 || event.which === null){return; }
    clearTimeout(this.timeout);
    this.timeout = null;
    this.KeyTime = 5000;
    let KeyTime = this.KeyTime;
    this.whichs.push(event.which);
    const IsOrder = this.GetIsOrder(event);
    if (IsOrder){
      KeyTime = 5
    }
    console.log('Recibo (wich)' + event.which + '(code)' + event.code + '  ' + String.fromCharCode(event.which) + '. con Wichs ' + this.whichs + '. Es una order? ' + IsOrder + '. KeyTime ' + this.KeyTime);
    this.timeout = new Promise ((resolve) => {
      setTimeout(() => {
        if (IsOrder || this.whichs.length > 4 || this.whichs.length > 3 && this.whichs[this.whichs.length - 1] === 13){
          const resolvs = this.SanitizeWhichs(this.whichs, IsOrder, event.code);
          this.whichs = [];
          if (resolvs.length > 0){
            resolve(resolvs);
          }
        }
        else {
          // this.whichs = [];
        }
      }, KeyTime);
    });
    this.timeStamp = new Date().getTime();
    if (this && this.timeout){return this.timeout; }
    // return this && this.timeout;
  }

  SanitizeWhichs(whichs, IsOrder, event_code){
    console.log('Entra en Sanitiz whichs con ' + whichs + ' y event_code' + event_code);
    
    if (this.TECLAS.indexOf(event_code)>-1){return event_code}
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
    }
    console.log("Devuelvo " + scans);
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
