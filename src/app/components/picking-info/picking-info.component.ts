import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-picking-info',
  templateUrl: './picking-info.component.html',
  styleUrls: ['./picking-info.component.scss'],
})
export class PickingInfoComponent implements OnInit {

  @Input() pick: {}
  ngSwitch: any

  constructor() { }

  ngOnInit() {}

}
