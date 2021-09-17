import { Component, OnInit, ViewChild } from '@angular/core';
import { OdooService } from '../../services/odoo.service';
import { StockFunctionsService } from '../../services/stock-functions.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-navegacion-albaranes',
  templateUrl: './navegacion-albaranes.page.html',
  styleUrls: ['./navegacion-albaranes.page.scss'],
})
export class NavegacionAlbaranesPage implements OnInit {

  Cards: Array<{}>;

  constructor(public router: Router,
              public stock: StockFunctionsService,
              public odooCon: OdooService) { }

  ngOnInit() {
    this.GetInfo();
  }
  TabNavegarA(URL){
    this.router.navigateByUrl(URL);
  }
  NavegarA(Id = false){
    console.log ('Navegar a ' + Id);
    let URL = '/listado-albaranes';
    if (Id){
      URL = URL + '/' + Id;
    }
    console.log ('Navegar a ' + URL);
    this.router.navigateByUrl(URL);
  }

  GetInfo(){
    const self = this;
    const Domain = [['app_integrated', '=', true]];
    const values = {domain: Domain, object: 'stock.picking.batch'};
    const promise = new Promise( (resolve, reject) => {
        self.odooCon.execute('stock.picking.type', 'get_apk_info', values).then((Res: Array<{}>) => {
          self.Cards = Res;
      })
      .catch((error) => {
          self.stock.Aviso(error.title, error.msg && error.msg.error_msg);
    });
    });
    return promise;

}
}
