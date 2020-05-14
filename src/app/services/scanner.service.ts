import { Injectable, HostListener } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  public active_scanner: boolean;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    
    }
  code = ""
  timeStamp  = 0
  timeout = null
  state = false
  is_order = false
  hide_scan_form: boolean
  case: any
  fragment: any
  constructor() {
    this.reset_scan()
  }
  reset_scan(){
    this.code = ""
    this.is_order = false
    this.timeStamp = 0
    this.timeout = null
    this.case = "regular"
    this.fragment = ''
  }
  on(){
    this.state=true
    this.reset_scan()
    //this.odootools.presentToast(this.code)
  }
  off(){
    this.state=false
    this.reset_scan()
    //this.odootools.presentToast(this.code)
  }

  key_press(event){
    //console.log(event)
    //let st = ("Me llega " + event.which + '[' + event.keyCode + ' ]' + " y tengo " + this.code)
    //console.log(st)
    //this.odootools.presentToast(st)
    
    //this.odootools.presentToast(e)
    if(!this.state){ //ignore returns

    }
    else{
      //este 50 es el tiempo en resetear sin pulsaciones
      if (this.timeStamp + 350 < new Date().getTime()) {
          this.code = '';
          this.is_order = false;
      }
      this.timeStamp = new Date().getTime();
      //this.odootools.presentToast(st)

      switch (event.which) {
          case 37: {
              this.case = "left"
              break;
          }

          case 38: {
              this.case = "up"
              break;
          }

          case 39: {
              this.case = "right"
              break;
          }

          case 40: {
              this.case = "down"
              break;
          }

          default: {
              this.case = "regular"
              break;
          }
      }
      
      clearTimeout(this.timeout);

      var keyCode = event.keyCode || event.which;
      
      if (keyCode > 111 && keyCode < 121 ) {
          this.code = String.fromCharCode(keyCode)
          this.is_order = true
      }
      else if (keyCode >= 48 && keyCode < 110 || keyCode == 190) {
          if (keyCode >= 96 && keyCode <= 105) {
              // Numpad keys
              keyCode -= 48;
              this.fragment = String.fromCharCode(keyCode);
          } else if(keyCode == 190) {
              this.fragment = "."
          } else {
              this.fragment = String.fromCharCode(keyCode);
          }
          this.is_order = false
          this.code += this.fragment
      }
      
      
      this.timeout = new Promise ((resolve) => {
          setTimeout(()=>{
              if(this.case != "regular") {
                  let scan = this.case
                  this.code = ''
                  //console.log('Envío ' + scan)
                  resolve(scan);
              } else if(this.code && (this.code.length >= 4 || this.is_order)){
              this.is_order = false
              //console.log('Devuelvo ' + this.code)
              let scan = this.code.replace('-','/')
              this.code = ''
              //console.log (scan + " ----> " + this.code)
              resolve(scan);
          };
          },500);
          // este 500 es el tiempo que suma pulsaciones
      })
    }
    return this && this.timeout
  }
}