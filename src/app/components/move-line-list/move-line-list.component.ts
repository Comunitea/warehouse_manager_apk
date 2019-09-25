import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-move-line-list',
  templateUrl: './move-line-list.component.html',
  styleUrls: ['./move-line-list.component.scss'],
})
export class MoveLineListComponent implements OnInit {

  @Input() line: {}

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(pick_id){
    this.router.navigateByUrl('/product/'+pick_id);
  }

}
