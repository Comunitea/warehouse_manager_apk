import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss'],
})
export class LocationListComponent implements OnInit {

  @Input() locations: {}
  ngSwitch: any

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(location_id){
    this.router.navigateByUrl('/stock-location/'+location_id);
  }

}
