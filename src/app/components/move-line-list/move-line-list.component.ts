import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-move-line-list',
  templateUrl: './move-line-list.component.html',
  styleUrls: ['./move-line-list.component.scss'],
})
export class MoveLineListComponent implements OnInit {

  @Input() line: {}

  constructor() { }

  ngOnInit() {}

}
