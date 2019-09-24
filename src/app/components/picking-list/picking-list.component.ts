import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-picking-list',
  templateUrl: './picking-list.component.html',
  styleUrls: ['./picking-list.component.scss'],
})
export class PickingListComponent implements OnInit {

  @Input() pick: {}

  constructor() { }

  ngOnInit() {}

}
