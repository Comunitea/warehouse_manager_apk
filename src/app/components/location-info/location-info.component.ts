import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-location-info',
  templateUrl: './location-info.component.html',
  styleUrls: ['./location-info.component.scss'],
})
export class LocationInfoComponent implements OnInit {

  @Input() location: {}
  ngSwitch: any

  constructor() { }

  ngOnInit() {}

}
