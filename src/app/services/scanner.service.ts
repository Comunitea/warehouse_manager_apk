import { Injectable, HostListener } from '@angular/core';
import { sanitizeIdentifier } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  public ActiveScanner: boolean;
  case: any;
  fragment: any;
  code: string;
  timeStamp: number;
  timeout: any;
  state: boolean;
  IsOrder: boolean;
  KeyCodes: {};
  MinLength: number;

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

  key_press(event){
    // console.log(event)
    // let st = ("Me llega " + event.which + '[' + event.keyCode + ' ]' + " y tengo " + this.code)
    // console.log(st)
    // this.odootools.presentToast(st)

    // this.odootools.presentToast(e)
    if (!this.state){
      // ignore returns
    }
    else{
      // este 50 es el tiempo en resetear sin pulsaciones
      if (this.timeStamp + 50 < new Date().getTime()) {
          this.code = '';
          this.IsOrder = false;
      }
      this.timeStamp = new Date().getTime();
      // this.odootools.presentToast(st)
      switch (event.which) {
          case 37: {
              this.case = 'left';
              break;
          }

          case 38: {
              this.case = 'up';
              break;
          }

          case 39: {
              this.case = 'right';
              break;
          }

          case 40: {
              this.case = 'down';
              break;
          }

          default: {
              this.case = 'regular';
              break;
          }
      }

      clearTimeout(this.timeout);
      let keyCode = event.keyCode || event.which;
      if (keyCode > 111 && keyCode < 121 ) {
          this.code = String.fromCharCode(keyCode);
          this.IsOrder = true;
      }
      else if (keyCode >= 48 && keyCode < 110 || keyCode == 190) {
          if (keyCode >= 96 && keyCode <= 105) {
              // Numpad keys
              keyCode -= 48;
              this.fragment = String.fromCharCode(keyCode);
          } else if (keyCode === 190) {
              this.fragment = '.';
          } else {
              this.fragment = String.fromCharCode(keyCode);
          }
          this.IsOrder = false;
          this.code += this.fragment;
      }
      else {
        this.IsOrder = false;
        this.code += String.fromCharCode(keyCode);
      }

      this.timeout = new Promise ((resolve) => {
          setTimeout(() => {
              if (this.case !== 'regular') {
                  const scan = this.case;
                  this.code = '';
                  // console.log('Envío ' + scan)
                  resolve(this.Sanitize(this.case));
                }
              else if (this.code && (this.code.length >= this.MinLength || this.IsOrder)){
                this.IsOrder = false;
                resolve(this.Sanitize(this.case));
          }
          }, 50);
          // este 500 es el tiempo que suma pulsaciones
      });
    }
    return this && this.timeout;
  }
  Sanitize(Scan) {
    // Scan = Scan.replace('-', '/');
    this.code = '';
    return Scan;
  }
}
