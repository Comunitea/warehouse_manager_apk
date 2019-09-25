import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-picking-list',
  templateUrl: './picking-list.component.html',
  styleUrls: ['./picking-list.component.scss'],
})
export class PickingListComponent implements OnInit {

  @Input() pick: {}

  constructor(public router: Router) { }

  ngOnInit() {}

  open_link(pick_id){
    this.router.navigateByUrl('/stock-picking/'+pick_id);
  }

}