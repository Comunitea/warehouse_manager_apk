import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-location-product-list',
  templateUrl: './location-product-list.component.html',
  styleUrls: ['./location-product-list.component.scss'],
})
export class LocationProductListComponent implements OnInit {

  @Input() products: {}

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(product_id){
    this.router.navigateByUrl('/product/'+product_id);
  }

}
