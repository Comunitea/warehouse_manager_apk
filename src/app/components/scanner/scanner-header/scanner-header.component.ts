import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-scanner-header',
  templateUrl: './scanner-header.component.html',
  styleUrls: ['./scanner-header.component.scss'],
})
export class ScannerHeaderComponent implements OnInit {  

  @Input() show_scan_form: boolean
  @Output() show_scan_form_changed = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {}

  change_hide_scan_form() {
    this.show_scan_form = !this.show_scan_form;
    this.show_scan_form_changed.emit(this.show_scan_form)
  }


}
