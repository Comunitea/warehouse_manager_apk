import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StockService } from '../../services/stock.service';

@Component({
  selector: 'app-picking-type-info',
  templateUrl: './picking-type-info.component.html',
  styleUrls: ['./picking-type-info.component.scss'],
})
export class PickingTypeInfoComponent implements OnInit {

  @Input() picking_types: {}

  constructor(public router: Router, public odoostock: StockService) { }

  ngOnInit() {}

  open_link(pick_type, filter) {
    
    const picking_domain = [['picking_type_id', '=', pick_type], this.odoostock.GetDomains('state')]
    this.odoostock.SetDomains('picking', picking_domain);
    this.router.navigateByUrl('/stock-picking-list/' + pick_type + '/' + filter);
  }

}
