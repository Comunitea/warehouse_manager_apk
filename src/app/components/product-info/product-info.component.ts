import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-product-info',
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.scss'],
})
export class ProductInfoComponent implements OnInit {

  @Input() product: {}

  constructor() { }

  ngOnInit() {}

}
