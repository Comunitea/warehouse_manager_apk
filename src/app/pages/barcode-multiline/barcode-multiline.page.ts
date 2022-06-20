import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NavController, ModalController, IonTextarea} from '@ionic/angular';
import { OdooService } from '../../services/odoo.service';
import { Keyboard } from '@ionic-native/keyboard/ngx';


@Component({
  selector: 'app-barcode-multiline',
  templateUrl: './barcode-multiline.page.html',
  styleUrls: ['./barcode-multiline.page.scss'],
})

export class BarcodeMultilinePage implements OnInit {
  @Input() InventoryId;
  @Input() LocationId;
  @Input() ProductId;
  @Input() LName;
  @Input() IName;
  @Input() PName;
  @Input() L2Name;
  @Input() ean:string;

  @ViewChild('EanList') EanList: IonTextarea;

  
  rows: number;

  constructor(public odoo: OdooService, private modalController: ModalController,private keyboard: Keyboard) {

   }

  ionViewWillEnter() {
    console.log("Valor inciial: " + this.ean + ", "+ this.ean.length)
    setTimeout(() => {
      this.CalcRows()
      if (this.ean.length>1){
        this.EanList.getInputElement().then(id => id.selectionStart = id.selectionEnd = this.ean.length)
      }
      this.EanList.setFocus();
      console.log("Valor final: " + this.ean + ", "+ this.ean.length)
      setTimeout(() => {
        this.keyboard.hide();
      }, 50);
      }, 150);
  }
  
  ngOnInit() {
    // this.EanList.setFocus();
    
  }
  deleteall(){
    this.ean = ''
  }
  goBack(cancel) {
    if (cancel){
      return this.modalController.dismiss(-1)
    }
    this.myDismiss();
  }
  async myDismiss() {
    await this.modalController.dismiss(this.ean);
  }
  CalcRows(){
    const ElId = document.getElementById('eans');
    this.rows = this.ean.split('').filter(c => c === '\n').length;
  }
}
