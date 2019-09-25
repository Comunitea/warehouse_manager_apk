import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-product-list-info',
  templateUrl: './product-list-info.component.html',
  styleUrls: ['./product-list-info.component.scss'],
})
export class ProductListInfoComponent implements OnInit {

  @Input() product: {}

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(product_id){
    this.router.navigateByUrl('/product/'+product_id);
  }

}
