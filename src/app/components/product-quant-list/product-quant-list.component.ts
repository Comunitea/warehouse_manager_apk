import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-quant-list',
  templateUrl: './product-quant-list.component.html',
  styleUrls: ['./product-quant-list.component.scss'],
})
export class ProductQuantListComponent implements OnInit {

  @Input() quants: {}

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(location_id){
    this.router.navigateByUrl('/stock-location/'+location_id);
  }

}

