import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-quant-list',
  templateUrl: './quant-list.component.html',
  styleUrls: ['./quant-list.component.scss'],
})
export class QuantListComponent implements OnInit {

  @Input() quant: {}

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(product_id){
    this.router.navigateByUrl('/product/'+product_id);
  }

}
