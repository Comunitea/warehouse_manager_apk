import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-picking-info',
  templateUrl: './picking-info.component.html',
  styleUrls: ['./picking-info.component.scss'],
})
export class PickingInfoComponent implements OnInit {

  @Input() pick: {}
  ngSwitch: any

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(location_id){
    this.router.navigateByUrl('/stock-location/'+location_id);
  }

}
