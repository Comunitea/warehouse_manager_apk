import { Component, OnInit, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms'; 
import { ScannerService } from '../../../services/scanner.service';
import { AudioService } from '../../../services/audio.service';

@Component({
  selector: 'app-scanner-footer',
  templateUrl: './scanner-footer.component.html',
  styleUrls: ['./scanner-footer.component.scss'],
})

export class ScannerFooterComponent implements OnInit {

  /* ScanReader: FormGroup; */

  ScanReader = new FormGroup({
      scan: new FormControl()
  });

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.scanner.key_press(event)
    this.scanner.timeout.then((val)=>{
      this.scan_read(val)
    })
  }

  @Input() show_scan_form: boolean
  @Input() scanner_reading: string
  @Output() scanner_reading_changed = new EventEmitter<string>();

  constructor(
    public scanner: ScannerService,
    public formBuilder: FormBuilder,
    private audio: AudioService
  ) {
    this.scanner.on()

    this.ScanReader = new FormGroup({
      scan: new FormControl()
   });
  }

  ngOnInit() {}


  scan_read(val){
    this.audio.play('barcode_ok');
    this.scanner_reading = val;
    this.scanner_reading_changed.emit(this.scanner_reading);
  }

  submitScan(){
    if (this.ScanReader) {
      this.audio.play('barcode_ok');
      this.scanner_reading = this.ScanReader.value['scan'];
      this.scanner_reading_changed.emit(this.scanner_reading);
    }
  }

}