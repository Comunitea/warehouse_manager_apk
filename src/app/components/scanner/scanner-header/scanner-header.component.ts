import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-scanner-header',
  templateUrl: './scanner-header.component.html',
  styleUrls: ['./scanner-header.component.scss'],
})
export class ScannerHeaderComponent implements OnInit {  

  @Input() volume: boolean
  @Input() show_scan_form: boolean
  @Input() escuchando: boolean
  @Output() show_scan_form_changed = new EventEmitter<boolean>();
  @Output() show_escuchando = new EventEmitter<boolean>();
  @Output() show_volume = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {}

  change_volume() {
    this.volume = !this.volume;
    this.show_volume.emit(this.volume);
  }

  change_escuchando() {
    this.escuchando = !this.escuchando;
    this.show_escuchando.emit(this.escuchando);
  }

  change_hide_scan_form() {
    this.show_scan_form = !this.show_scan_form;
    this.show_scan_form_changed.emit(this.show_scan_form)
  }


}
