import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StockFunctionsService } from '../../services/stock-functions.service';
@Component({
  selector: 'app-navegacion-principal',
  templateUrl: './navegacion-principal.page.html',
  styleUrls: ['./navegacion-principal.page.scss'],
})
export class NavegacionPrincipalPage implements OnInit {

  constructor(public router: Router, public stock: StockFunctionsService) { }

  ngOnInit() {
  }

  NavegarA(Page){
    this.router.navigateByUrl(Page);
  }

  TabNavegarA(URL){
    this.router.navigateByUrl(URL);
  }
  LoadPersistentData(bool=false){
    this.stock.LoadPersistentData(bool)
  }
}
