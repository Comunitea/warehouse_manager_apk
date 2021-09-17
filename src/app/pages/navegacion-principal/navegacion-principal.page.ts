import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-navegacion-principal',
  templateUrl: './navegacion-principal.page.html',
  styleUrls: ['./navegacion-principal.page.scss'],
})
export class NavegacionPrincipalPage implements OnInit {

  constructor(public router: Router) { }

  ngOnInit() {
  }

  NavegarA(Page){
    this.router.navigateByUrl(Page);
  }

  TabNavegarA(URL){
    this.router.navigateByUrl(URL);
  }
}
