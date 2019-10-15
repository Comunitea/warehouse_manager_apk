import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-picking-type-info',
  templateUrl: './picking-type-info.component.html',
  styleUrls: ['./picking-type-info.component.scss'],
})
export class PickingTypeInfoComponent implements OnInit {

  @Input() picking_types: {}

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(pick_type, view, code){
    this.router.navigateByUrl('/stock-picking-list/'+pick_type+'/'+view+'/'+code);
  }

}
