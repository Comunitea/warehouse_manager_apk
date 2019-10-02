import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-location-info',
  templateUrl: './location-info.component.html',
  styleUrls: ['./location-info.component.scss'],
})
export class LocationInfoComponent implements OnInit {

  @Input() location: {}
  ngSwitch: any

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(type, location_id){
    if (type == 'stock') {
      this.router.navigateByUrl('/stock-quant-list/'+location_id);
    } else {
      this.router.navigateByUrl('/stock-location-product-list/'+location_id);
    } 
  }

}
