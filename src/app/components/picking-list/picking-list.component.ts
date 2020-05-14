import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-picking-list',
  templateUrl: './picking-list.component.html',
  styleUrls: ['./picking-list.component.scss'],
})
export class PickingListComponent implements OnInit {

  @Input() picks: {}
  @Input() code: {}
  @Input() not_allowed_fields: {}
  ngSwitch: any

  constructor(public router: Router) { }

  ngOnInit() {

  }

  open_link(pick_id, code){
    console.log(this.picks)
    this.router.navigateByUrl('/stock-picking/'+pick_id+'/'+code);
  }

}
