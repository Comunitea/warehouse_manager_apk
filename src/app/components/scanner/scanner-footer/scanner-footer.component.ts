import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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

  @Input() ScannerReading: string
  @Output() ScannerReadingChanged = new EventEmitter<any>();

  constructor(
    public scanner: ScannerService,
    private formBuilder: FormBuilder,
    private audio: AudioService
  ) {
    this.scanner.on();
    this.ScanReader = new FormGroup({
      scan: new FormControl()
   });
  }

  ngOnInit() {}

  resetScan(){
    this.ScanReader.value['scan'] = '';
    this.ScanReader.controls.scan.setValue('');
  }

  scan_read(val){
    this.audio.play('barcode_ok');
    this.ScannerReading = val;
    this.ScannerReadingChanged.emit(this.ScannerReading);
  }

  submitScan(){
    if (this.ScanReader) {
      this.audio.play('barcode_ok');
      const ScannerReading = [this.ScanReader.value['scan']];
      this.ScanReader.value['scan'] = '';
      this.ScannerReadingChanged.emit(ScannerReading);

    }
  }

}